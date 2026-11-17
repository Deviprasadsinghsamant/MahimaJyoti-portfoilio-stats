// Everything the parent side shows lives here, on the phone. Sign-in writes a
// full snapshot; push messages patch single results and attendance days —
// including while the app is closed, from the background message handler — and
// checks fill in anything a lost push never delivered.

import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
    ChildChanges,
    ChildCredentials,
    ChildSnapshot,
    ParentResult,
    ParentStudent,
    PushData,
    StoredChild,
    StoredState,
} from "./types";

const KEY = "mj:parent:v1";
const EMPTY: StoredState = { children: [] };

export async function loadState(): Promise<StoredState> {
    try {
        const raw = await AsyncStorage.getItem(KEY);
        if (!raw) return EMPTY;
        const parsed = JSON.parse(raw) as StoredState;
        return Array.isArray(parsed.children) ? parsed : EMPTY;
    } catch {
        return EMPTY;
    }
}

type Listener = (state: StoredState) => void;
const listeners = new Set<Listener>();

export function subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

// Read-modify-write one at a time, so a push arriving during a Refresh isn't lost.
let queue: Promise<unknown> = Promise.resolve();

export function updateState(change: (state: StoredState) => StoredState): Promise<StoredState> {
    const run = queue.then(async () => {
        const next = change(await loadState());
        await AsyncStorage.setItem(KEY, JSON.stringify(next));
        listeners.forEach((l) => l(next));
        return next;
    });
    queue = run.catch(() => undefined);
    return run;
}

// ── pure state changes ────────────────────────────
//
// Versions: the server numbers every change to a student (its "feed"), and each
// push carries the number. `version` is how far this copy is complete; pushes
// that arrive early wait in `ahead`. A number that never turns up means a push
// was lost, and the child is marked `stale` so the app asks the server for just
// the missing changes.

function byId(results: ParentResult[]): Record<string, ParentResult> {
    return Object.fromEntries(results.map((r) => [r.id, r]));
}

/** Advance `version` through consecutive early arrivals. */
function settle(child: StoredChild, version: number, ahead: number[]): StoredChild {
    let v = version;
    const rest = new Set(ahead.filter((x) => x > v));
    while (rest.has(v + 1)) rest.delete(++v);
    const itemVersions = Object.fromEntries(Object.entries(child.itemVersions ?? {}).filter(([, x]) => x > v));
    const pending = Array.from(rest).sort((a, b) => a - b);
    return { ...child, version: v, ahead: pending, itemVersions, stale: pending.length > 0 };
}

/** Add a child or replace their data wholesale with a fresh download. */
export function withSnapshot(state: StoredState, credentials: ChildCredentials, snapshot: ChildSnapshot): StoredState {
    const child: StoredChild = {
        ...credentials,
        studentCode: snapshot.student.code || credentials.studentCode,
        student: snapshot.student,
        results: byId(snapshot.results),
        attendance: snapshot.attendance,
        syncedAt: snapshot.syncedAt,
        updatedAt: Date.now(),
        // Pushes that arrived meanwhile are re-fetched by the next check rather than trusted here.
        version: snapshot.version,
        ahead: [],
        itemVersions: {},
        stale: false,
    };
    const exists = state.children.some((c) => c.student.id === child.student.id);
    return {
        ...state,
        children: exists
            ? state.children.map((c) => (c.student.id === child.student.id ? child : c))
            : [...state.children, child],
    };
}

/** Apply what changed since this copy's version (from a check). */
export function withChanges(state: StoredState, studentId: string, changes: ChildChanges): StoredState {
    return {
        ...state,
        children: state.children.map((c) => {
            if (c.student.id !== studentId) return c;
            // A push newer than this answer may already have updated an item: keep it.
            const newer = (key: string) => (c.itemVersions?.[key] ?? 0) > changes.version;
            const results = { ...c.results };
            changes.results.forEach((r) => {
                if (!newer(`r:${r.id}`)) results[r.id] = r;
            });
            changes.removedResultIds.forEach((id) => {
                if (!newer(`r:${id}`)) delete results[id];
            });
            const student = changes.student && !newer("student") ? changes.student : c.student;
            const next: StoredChild = {
                ...c,
                results,
                student,
                studentCode: student.code || c.studentCode,
                attendance: changes.attendance ?? c.attendance,
                updatedAt: Date.now(),
            };
            return settle(next, Math.max(changes.version, c.version ?? 0), c.ahead ?? []);
        }),
    };
}

/** The server says this copy is complete up to `version`. */
export function withCurrent(state: StoredState, studentId: string, version: number): StoredState {
    return {
        ...state,
        children: state.children.map((c) => (c.student.id === studentId ? settle(c, version, []) : c)),
    };
}

/** Note (or clear) that the last Refresh couldn't verify a child; their saved marks stay. */
export function withRefreshProblem(state: StoredState, studentCode: string, problem: string | undefined): StoredState {
    return {
        ...state,
        children: state.children.map((c) => (c.studentCode === studentCode ? { ...c, refreshProblem: problem } : c)),
    };
}

export function withoutChild(state: StoredState, studentId: string): StoredState {
    return { ...state, children: state.children.filter((c) => c.student.id !== studentId) };
}

export function withCheckedAt(state: StoredState, checkedAt: number): StoredState {
    return { ...state, checkedAt };
}

function itemKey(data: PushData): string {
    switch (data.kind) {
        case "result":
            return `r:${(JSON.parse(data.result) as ParentResult).id}`;
        case "result-deleted":
            return `r:${data.resultId}`;
        case "student":
            return "student";
        case "attendance":
            return `a:${data.date}`;
    }
}

/** The data of one push applied to a child (no version bookkeeping). */
function applied(c: StoredChild, data: PushData): StoredChild {
    switch (data.kind) {
        case "result": {
            const result = JSON.parse(data.result) as ParentResult;
            return { ...c, results: { ...c.results, [result.id]: result } };
        }
        case "result-deleted": {
            const results = { ...c.results };
            delete results[data.resultId];
            return { ...c, results };
        }
        case "student": {
            const student = JSON.parse(data.student) as ParentStudent;
            return { ...c, student, studentCode: student.code || c.studentCode };
        }
        case "attendance": {
            const held = c.attendance;
            // A correction to last year's register doesn't replace this year's days.
            if (held?.academicYear && held.academicYear > data.academicYear) return c;
            const days = held?.academicYear === data.academicYear ? { ...held.days } : {};
            if (data.mark) days[data.date] = data.mark;
            else delete days[data.date];
            return { ...c, attendance: { academicYear: data.academicYear, days } };
        }
        default:
            return c;
    }
}

/** Apply one push message from the school's server. Unknown messages are ignored. */
export function withPush(state: StoredState, data: PushData): StoredState {
    const v = Number(data.v);
    const versioned = Number.isInteger(v) && v > 0;
    return {
        ...state,
        children: state.children.map((c) => {
            if (c.student.id !== data.studentId) return c;
            if (!versioned) return { ...applied(c, data), updatedAt: Date.now() };
            // Already in this copy (a repeat, or older than the last download).
            if (c.version !== undefined && v <= c.version) return c;
            const key = itemKey(data);
            // A late push must not undo a newer change to the same item.
            const isNewer = (c.itemVersions?.[key] ?? 0) < v;
            const next: StoredChild = isNewer
                ? { ...applied(c, data), itemVersions: { ...c.itemVersions, [key]: v }, updatedAt: Date.now() }
                : c;
            // Without a version yet (just updated the app), the next check sets one.
            if (c.version === undefined) return next;
            return settle(next, c.version, [...(c.ahead ?? []), v]);
        }),
    };
}
