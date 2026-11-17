// Parent-side state: the children saved on this phone, and the few actions that
// touch the network. Push updates and anything the background handler stored
// while the app was closed flow in through storage.
//
// Keeping marks current without load on the server:
//   • every new or corrected mark arrives as a push, straight into the phone;
//   • each push carries the student's change number, so a lost push shows up as
//     a gap — and when the app is opened (at most every few minutes) it asks the
//     server whether anything changed. Nothing new costs the server a read or two;
//     otherwise only the changed marks are sent;
//   • the manual refresh does the same check, plus a full re-download of each
//     child at most once every 24 hours (the server enforces it).

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import { getMessaging, onMessage, onTokenRefresh } from "@react-native-firebase/messaging";
import { ApiError, syncChildren, syncErrorMessage, unlinkDevice } from "./api";
import { askNotificationPermission, getDeviceToken, handleRemoteMessage } from "./push";
import {
    loadState,
    subscribe,
    updateState,
    withChanges,
    withCheckedAt,
    withCurrent,
    withRefreshProblem,
    withSnapshot,
    withoutChild,
} from "./storage";
import type { ChildSyncResult, StoredChild, StoredState, SyncMode } from "./types";
import { normalizeMobile, normalizeStudentCode } from "./validate";

// When the app is opened, ask the server about changes at most this often...
const CHECK_EVERY_MS = 10 * 60 * 1000;
// ...or this often while a push seems to be missing.
const STALE_CHECK_EVERY_MS = 60 * 1000;
// A gap noticed while the app is open: give a late push this long to arrive first.
const GAP_GRACE_MS = 15 * 1000;
// Pulling to refresh again within this time just says "up to date".
const REFRESH_REPEAT_MS = 30 * 1000;

interface Notice {
    title: string;
    body: string;
}

interface StoreValue {
    state: StoredState;
    loaded: boolean;
    refreshing: boolean;
    // A notification that arrived while the app was open (Android shows none then).
    notice: Notice | null;
    dismissNotice: () => void;
    /** Sign in a child. Returns their student id; throws an Error with a message for the parent. */
    addChild: (studentCode: string, phone: string) => Promise<string>;
    /** The manual refresh. Returns a message to show, if any. */
    refreshAll: () => Promise<Notice | null>;
    removeChild: (studentId: string) => Promise<void>;
}

const UP_TO_DATE: Notice = {
    title: "Everything is up to date",
    body: "New marks and attendance appear here on their own as soon as the school enters them — there's no need to refresh.",
};

interface Applied {
    state: StoredState;
    // Children whose data changed.
    updated: number;
    // Messages for children the server couldn't verify.
    problems: string[];
}

/** Apply the server's answer for each child sent (same order). */
function applyResults(state: StoredState, sent: StoredChild[], results: ChildSyncResult[]): Applied {
    let next = state;
    let updated = 0;
    const problems: string[] = [];
    results.forEach((r, i) => {
        const child = sent[i];
        if (!child) return;
        const credentials = { studentCode: child.studentCode, phone: child.phone };
        if (r.ok) {
            if ("snapshot" in r) {
                next = withSnapshot(next, credentials, r.snapshot);
                updated++;
            } else if ("changes" in r) {
                next = withChanges(next, child.student.id, r.changes);
                updated++;
            } else {
                next = withCurrent(next, child.student.id, r.version);
            }
            next = withRefreshProblem(next, child.studentCode, undefined);
        } else if (r.error !== "too-soon") {
            const message = syncErrorMessage(r.error);
            problems.push(`${child.student.name}: ${message}`);
            next = withRefreshProblem(next, child.studentCode, message);
        }
    });
    return { state: next, updated, problems };
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<StoredState>({ children: [] });
    const [loaded, setLoaded] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [notice, setNotice] = useState<Notice | null>(null);
    const checking = useRef<Promise<Applied | null> | null>(null);

    /** Ask the server what changed for every child and apply it. One call at a time. */
    const check = useCallback((mode: SyncMode): Promise<Applied | null> => {
        if (checking.current) return checking.current;
        const run = (async () => {
            const { children: sent } = await loadState();
            if (sent.length === 0) return null;
            const token = await getDeviceToken();
            const results = await syncChildren(
                sent.map((c) => ({
                    studentCode: c.studentCode,
                    phone: c.phone,
                    studentId: c.student.id,
                    ...(c.version !== undefined ? { version: c.version } : {}),
                })),
                token,
                mode
            );
            let applied: Applied | null = null;
            await updateState((s) => {
                applied = applyResults(s, sent, results);
                return withCheckedAt(applied.state, Date.now());
            });
            return applied;
        })();
        checking.current = run;
        run.finally(() => {
            checking.current = null;
        }).catch(() => undefined);
        return run;
    }, []);

    /** The automatic check: when the app opens, and soon after a missing push is noticed. */
    const checkIfDue = useCallback(async () => {
        const s = await loadState();
        if (s.children.length === 0) return;
        const since = Date.now() - (s.checkedAt ?? 0);
        const needsVersion = s.children.some((c) => c.stale || c.version === undefined);
        if (since >= CHECK_EVERY_MS || (needsVersion && since >= STALE_CHECK_EVERY_MS)) {
            // Quiet: the next opening tries again.
            await check("check").catch(() => undefined);
        }
    }, [check]);

    // Initial load, live updates, and a reload whenever the app comes back to the
    // foreground (the background handler may have stored new marks meanwhile).
    useEffect(() => {
        let alive = true;
        const reload = () =>
            loadState().then((s) => {
                if (!alive) return;
                setState(s);
                setLoaded(true);
            });
        reload().then(checkIfDue);
        const unsubscribe = subscribe(setState);
        const appState = AppState.addEventListener("change", (s) => {
            if (s === "active") reload().then(checkIfDue);
        });
        return () => {
            alive = false;
            unsubscribe();
            appState.remove();
        };
    }, [checkIfDue]);

    // Messages while the app is open: store them and show a banner for new marks.
    useEffect(() => {
        const messaging = getMessaging();
        let gapTimer: ReturnType<typeof setTimeout> | null = null;
        const offMessage = onMessage(messaging, async (message) => {
            await handleRemoteMessage(message);
            if (message.notification?.title) {
                setNotice({ title: message.notification.title, body: message.notification.body ?? "" });
            }
            const s = await loadState();
            if (s.children.some((c) => c.stale) && !gapTimer) {
                gapTimer = setTimeout(() => {
                    gapTimer = null;
                    checkIfDue();
                }, GAP_GRACE_MS);
            }
        });
        // A new token must be registered with the server, or pushes stop arriving.
        // The check does that (re-verifying each child for the new token).
        const offToken = onTokenRefresh(messaging, () => {
            check("check").catch(() => undefined);
        });
        return () => {
            if (gapTimer) clearTimeout(gapTimer);
            offMessage();
            offToken();
        };
    }, [check, checkIfDue]);

    const addChild = useCallback(async (rawCode: string, rawPhone: string) => {
        const studentCode = normalizeStudentCode(rawCode);
        const phone = normalizeMobile(rawPhone);
        if (!studentCode) throw new Error("Enter the Student ID from the school, e.g. MJ0042.");
        if (!phone) throw new Error("Enter a 10-digit mobile number.");

        await askNotificationPermission();
        const token = await getDeviceToken();
        const [result] = await syncChildren([{ studentCode, phone }], token, "check");
        if (!result?.ok) throw new Error(result ? syncErrorMessage(result.error) : "Sign-in failed. Please try again.");
        if (!("snapshot" in result)) throw new Error("Sign-in failed. Please try again.");
        await updateState((s) => withSnapshot(s, { studentCode, phone }, result.snapshot));
        return result.snapshot.student.id;
    }, []);

    const refreshAll = useCallback(async (): Promise<Notice | null> => {
        const s = await loadState();
        if (s.children.length === 0) return null;
        if (Date.now() - (s.checkedAt ?? 0) < REFRESH_REPEAT_MS && !s.children.some((c) => c.stale)) return UP_TO_DATE;
        setRefreshing(true);
        try {
            const applied = await check("refresh");
            if (applied?.problems.length) return { title: "Couldn't refresh everything", body: applied.problems.join("\n") };
            return applied && applied.updated > 0 ? null : UP_TO_DATE;
        } catch (err) {
            return {
                title: "Couldn't refresh",
                body: err instanceof ApiError ? err.message : "Refresh failed. Please try again.",
            };
        } finally {
            setRefreshing(false);
        }
    }, [check]);

    const removeChild = useCallback(async (studentId: string) => {
        const token = await getDeviceToken();
        // Best effort: if this fails, the server drops the phone when a push bounces.
        if (token) await unlinkDevice(token, studentId).catch(() => undefined);
        await updateState((s) => withoutChild(s, studentId));
    }, []);

    const value = useMemo<StoreValue>(
        () => ({
            state,
            loaded,
            refreshing,
            notice,
            dismissNotice: () => setNotice(null),
            addChild,
            refreshAll,
            removeChild,
        }),
        [state, loaded, refreshing, notice, addChild, refreshAll, removeChild]
    );

    return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
    const value = useContext(StoreContext);
    if (!value) throw new Error("useStore must be used inside <StoreProvider>");
    return value;
}
