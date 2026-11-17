// Teacher-side state: the signed-in school login, the class and student lists
// downloaded for it, and the few actions that call the server — kept to a
// minimum so the school stays within Firebase's free quota:
//   • the student list downloads at sign-in, then on its own once a week, or
//     when the teacher asks (at most once an hour);
//   • a register is sent once, when the teacher finalises it — never per tap —
//     and waits on the phone if there's no internet. After that it's locked for
//     the teacher; only the principal (an admin login) can correct it;
//   • a student's marks download when first opened and are reused for a day.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import {
    getAuth,
    getIdToken,
    getIdTokenResult,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    type User,
} from "@react-native-firebase/auth";
import { ApiError, fetchTeacherStudent, fetchTeacherSync, postAttendance } from "./api";
import { addDays, todayIso, whenLabel } from "./dates";
import {
    clearTeacherData,
    emptyState,
    loadCachedStudent,
    loadTeacherState,
    registerKey,
    saveCachedStudent,
    subscribeTeacher,
    updateTeacherState,
    type CachedStudent,
    type PendingSave,
    type TeacherState,
} from "./teacherStorage";
import type { AttendanceRecord, Register, TeacherStudent, TeacherSync } from "./types";
import { staffLoginEmail } from "./validate";

const HOUR = 60 * 60 * 1000;
// The teacher can ask for a fresh student list at most this often…
export const MANUAL_SYNC_INTERVAL_MS = HOUR;
// …and it refreshes on its own when it's older than this.
const AUTO_SYNC_AFTER_MS = 7 * 24 * HOUR;
// A student's marks are reused for this long before opening them downloads again.
const STUDENT_FRESH_MS = 24 * HOUR;
// Today's register, or a missed one up to this many days back.
// Keep in sync with TEACHER_MARK_DAYS_BACK in mj-func/src/domains/attendance/handlers.ts.
export const MARK_DAYS_BACK = 2;

const STAFF_ROLES = ["admin", "teacher", "staff"];

export type SaveOutcome =
    | { kind: "saved"; register: Register }
    // No internet: kept on the phone and sent automatically later.
    | { kind: "queued" }
    // Someone else saved this register first; `register` is theirs.
    | { kind: "conflict"; register: Register }
    // Already finalised — only the principal can change it; `register` is the final one.
    | { kind: "locked"; register: Register };

interface TeacherValue {
    // Sign-in state and stored data are known.
    ready: boolean;
    signedIn: boolean;
    state: TeacherState | null;
    syncing: boolean;
    /** Throws an Error with a message for the teacher. */
    signIn: (phone: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    /** Download the class and student lists again. Returns a message to show, if any. */
    sync: () => Promise<string | null>;
    /** Send a finished register. Throws an Error (with the server's message) if it's refused. */
    saveRegister: (classId: string, date: string, records: AttendanceRecord[], baseUpdatedAt: number | null) => Promise<SaveOutcome>;
    /** Try to send registers that were waiting for internet. */
    sendPending: () => Promise<void>;
    /** A student's details: from the phone if fresh, otherwise (or when forced) from the server. */
    loadStudent: (studentId: string, force?: boolean) => Promise<CachedStudent>;
    dismissNotices: () => void;
}

const TeacherContext = createContext<TeacherValue | null>(null);

function authMessage(err: unknown): string {
    const code = (err as { code?: string })?.code ?? "";
    switch (code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
        case "auth/invalid-email":
            return "Wrong phone number or password.";
        case "auth/user-disabled":
            return "This login has been turned off. Please contact the school office.";
        case "auth/too-many-requests":
            return "Too many attempts. Please wait a few minutes and try again.";
        case "auth/network-request-failed":
            return "Couldn't reach the server. Check your internet connection and try again.";
        default:
            return "Sign-in failed. Please try again.";
    }
}

/** Registers from a fresh download, keeping any newer ones this phone saved meanwhile. */
function mergeRegisters(held: Record<string, Register>, sync: TeacherSync): Record<string, Register> {
    const oldest = addDays(todayIso(), -MARK_DAYS_BACK);
    const merged: Record<string, Register> = {};
    for (const [key, r] of Object.entries(held)) if (r.date >= oldest) merged[key] = r;
    for (const r of sync.registers) {
        const key = registerKey(r.classId, r.date);
        if (!merged[key] || merged[key].updatedAt < r.updatedAt) merged[key] = r;
    }
    return merged;
}

function withRegister(state: TeacherState | null, register: Register): TeacherState | null {
    if (!state) return state;
    const key = registerKey(register.classId, register.date);
    const pending = { ...state.pending };
    delete pending[key];
    return { ...state, registers: { ...state.registers, [key]: register }, pending };
}

export function TeacherProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [authKnown, setAuthKnown] = useState(false);
    const [state, setState] = useState<TeacherState | null>(null);
    const [stateLoaded, setStateLoaded] = useState(false);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        const auth = getAuth();
        const offAuth = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setAuthKnown(true);
        });
        loadTeacherState().then((s) => {
            setState(s);
            setStateLoaded(true);
        });
        const offState = subscribeTeacher(setState);
        return () => {
            offAuth();
            offState();
        };
    }, []);

    const signedIn = !!user && !!state && state.uid === user.uid;

    const token = useCallback(async () => {
        const current = getAuth().currentUser;
        if (!current) throw new ApiError("You've been signed out. Please sign in again.", "server");
        try {
            return await getIdToken(current);
        } catch {
            // Refreshing an expired token needs the internet.
            throw new ApiError("Couldn't reach the server. Check your internet connection and try again.", "network");
        }
    }, []);

    const runSync = useCallback(async () => {
        setSyncing(true);
        try {
            const sync = await fetchTeacherSync(await token());
            await updateTeacherState((s) =>
                s && s.uid === sync.me.uid ? { ...s, sync, registers: mergeRegisters(s.registers, sync) } : s
            );
        } finally {
            setSyncing(false);
        }
    }, [token]);

    const sync = useCallback(async () => {
        const last = state?.sync?.syncedAt ?? 0;
        if (Date.now() - last < MANUAL_SYNC_INTERVAL_MS) {
            return `The student list is up to date. You can update it again ${whenLabel(last + MANUAL_SYNC_INTERVAL_MS)}.`;
        }
        try {
            await runSync();
            return null;
        } catch (err) {
            return err instanceof ApiError ? err.message : "Couldn't update the student list. Please try again.";
        }
    }, [state?.sync?.syncedAt, runSync]);

    const signIn = useCallback(
        async (phone: string, password: string) => {
            const email = staffLoginEmail(phone);
            if (!email) throw new Error("Enter the mobile number you use on the school website.");
            if (!password) throw new Error("Enter your password.");
            const auth = getAuth();
            let signed: User;
            try {
                signed = (await signInWithEmailAndPassword(auth, email, password)).user;
            } catch (err) {
                throw new Error(authMessage(err));
            }
            const { claims } = await getIdTokenResult(signed);
            if (!STAFF_ROLES.includes(String(claims.role ?? ""))) {
                await firebaseSignOut(auth);
                throw new Error("This login doesn't have access to the school's records. Please contact the school office.");
            }
            const previous = await loadTeacherState();
            if (previous?.uid !== signed.uid) {
                await clearTeacherData();
                await updateTeacherState(() => emptyState(signed.uid));
            }
            // A failed download leaves them signed in; the home screen offers to try again.
            await runSync().catch(() => undefined);
        },
        [runSync]
    );

    const signOut = useCallback(async () => {
        await clearTeacherData();
        await firebaseSignOut(getAuth()).catch(() => undefined);
    }, []);

    const post = useCallback(
        async (save: Omit<PendingSave, "queuedAt">) => postAttendance(await token(), save),
        [token]
    );

    const saveRegister = useCallback(
        async (classId: string, date: string, records: AttendanceRecord[], baseUpdatedAt: number | null): Promise<SaveOutcome> => {
            const save = { classId, date, records, baseUpdatedAt };
            try {
                const result = await post(save);
                await updateTeacherState((s) => withRegister(s, result.register));
                return { kind: result.status, register: result.register };
            } catch (err) {
                if (err instanceof ApiError && err.kind === "network") {
                    const key = registerKey(classId, date);
                    await updateTeacherState((s) =>
                        s ? { ...s, pending: { ...s.pending, [key]: { ...save, queuedAt: Date.now() } } } : s
                    );
                    return { kind: "queued" };
                }
                throw err instanceof Error ? err : new Error("Couldn't save the register. Please try again.");
            }
        },
        [post]
    );

    const sendPending = useCallback(async () => {
        const held = await loadTeacherState();
        for (const [key, save] of Object.entries(held?.pending ?? {})) {
            try {
                const result = await post(save);
                await updateTeacherState((s) => {
                    const next = withRegister(s, result.register);
                    if (!next || result.status === "saved") return next;
                    const by = result.register.markedByName || "Someone else";
                    const notice =
                        result.status === "locked"
                            ? `${by} saved a register before yours could be sent, so it's final and your marks weren't used. Ask the principal if it needs correcting.`
                            : `${by} saved a register you were sending first. Open it to check the marks.`;
                    return { ...next, notices: [...next.notices, notice] };
                });
            } catch (err) {
                if (err instanceof ApiError && err.kind === "network") return; // still offline
                await updateTeacherState((s) => {
                    if (!s) return s;
                    const pending = { ...s.pending };
                    delete pending[key];
                    const message = err instanceof Error ? err.message : "A saved register couldn't be sent.";
                    return { ...s, pending, notices: [...s.notices, message] };
                });
            }
        }
    }, [post]);

    const loadStudent = useCallback(
        async (studentId: string, force = false) => {
            const cached = await loadCachedStudent(studentId);
            if (cached && !force && Date.now() - cached.fetchedAt < STUDENT_FRESH_MS) return cached;
            try {
                const fresh = { detail: await fetchTeacherStudent(await token(), studentId), fetchedAt: Date.now() };
                await saveCachedStudent(studentId, fresh);
                return fresh;
            } catch (err) {
                // Offline: an older copy beats nothing.
                if (cached && err instanceof ApiError && err.kind === "network") return cached;
                throw err;
            }
        },
        [token]
    );

    const dismissNotices = useCallback(() => {
        updateTeacherState((s) => (s ? { ...s, notices: [] } : s));
    }, []);

    // Weekly refresh of the student list, and sending waiting registers whenever the app opens.
    useEffect(() => {
        if (!signedIn) return;
        if (Date.now() - (state?.sync?.syncedAt ?? 0) > AUTO_SYNC_AFTER_MS) runSync().catch(() => undefined);
        sendPending();
        const sub = AppState.addEventListener("change", (s) => {
            if (s === "active") sendPending();
        });
        return () => sub.remove();
        // Only on sign-in / app start; syncedAt changes would re-trigger it otherwise.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [signedIn]);

    const value = useMemo<TeacherValue>(
        () => ({
            ready: authKnown && stateLoaded,
            signedIn,
            state: signedIn ? state : null,
            syncing,
            signIn,
            signOut,
            sync,
            saveRegister,
            sendPending,
            loadStudent,
            dismissNotices,
        }),
        [authKnown, stateLoaded, signedIn, state, syncing, signIn, signOut, sync, saveRegister, sendPending, loadStudent, dismissNotices]
    );

    return <TeacherContext.Provider value={value}>{children}</TeacherContext.Provider>;
}

export function useTeacher(): TeacherValue {
    const value = useContext(TeacherContext);
    if (!value) throw new Error("useTeacher must be used inside <TeacherProvider>");
    return value;
}

/** Students of a class in register order: roll number, then name. */
export function studentsOf(sync: TeacherSync | null | undefined, classId: string): TeacherStudent[] {
    return (sync?.students ?? [])
        .filter((s) => s.classId === classId)
        .sort(
            (a, b) =>
                (a.rollNo ?? "￿").localeCompare(b.rollNo ?? "￿", undefined, { numeric: true }) ||
                a.name.localeCompare(b.name)
        );
}
