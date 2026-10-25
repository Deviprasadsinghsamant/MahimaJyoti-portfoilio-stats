import type { AttendanceStatus } from "@/domain/portal/types";

// localStorage-backed draft of in-progress attendance marks.
// Keyed per (uid, classId, date) so multiple markers on different classes
// don't collide, and drafts survive page reload/tab close.

const KEY_PREFIX = "mj:attendance-draft:v1";

interface DraftShape {
    marks: Record<string, AttendanceStatus>;
    updatedAt: number;
}

function key(uid: string, classId: string, date: string) {
    return `${KEY_PREFIX}:${uid}:${classId}:${date}`;
}

export function loadAttendanceDraft(
    uid: string,
    classId: string,
    date: string
): DraftShape | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.localStorage.getItem(key(uid, classId, date));
        if (!raw) return null;
        return JSON.parse(raw) as DraftShape;
    } catch {
        return null;
    }
}

export function saveAttendanceDraft(
    uid: string,
    classId: string,
    date: string,
    marks: Record<string, AttendanceStatus>
) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(
            key(uid, classId, date),
            JSON.stringify({ marks, updatedAt: Date.now() } as DraftShape)
        );
    } catch {
        /* quota — ignore, next save will retry */
    }
}

export function clearAttendanceDraft(uid: string, classId: string, date: string) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.removeItem(key(uid, classId, date));
    } catch {
        /* ignore */
    }
}
