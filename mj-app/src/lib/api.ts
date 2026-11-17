// Calls to the school's callable Cloud Functions. The app calls only when it
// must: parents at sign-in, for a cheap "anything new?" check when the app is
// opened, and for a manual refresh; teachers to download the student list, open
// a student, or save a finished register. Everything else arrives as push
// messages or is read from the phone.

import { FUNCTIONS_BASE_URL } from "./config";
import type {
    AttendanceRecord,
    ChildRequest,
    ChildSyncResult,
    SaveAttendanceResult,
    SyncMode,
    TeacherStudentDetail,
    TeacherSync,
} from "./types";

export class ApiError extends Error {
    constructor(
        message: string,
        // "network": the request never reached the server — safe to try again later.
        readonly kind: "network" | "server"
    ) {
        super(message);
    }
}

async function callFunction<T>(name: string, data: unknown, idToken?: string): Promise<T> {
    let response: Response;
    try {
        response = await fetch(`${FUNCTIONS_BASE_URL}/${name}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
            },
            body: JSON.stringify({ data }),
        });
    } catch {
        throw new ApiError("Couldn't reach the school's server. Check your internet connection and try again.", "network");
    }
    const body = (await response.json().catch(() => null)) as { result?: T; error?: { message?: string } } | null;
    if (!response.ok || !body || body.error || body.result === undefined) {
        throw new ApiError(body?.error?.message ?? "The school's server had a problem. Please try again.", "server");
    }
    return body.result;
}

// ── parents ───────────────────────────────────────

/**
 * Sign in, check for changes ("check": nothing new, only what changed, or the full
 * record when needed), or refresh by hand ("refresh": also a full re-download at
 * most once a day). Registers this phone for push updates.
 */
export async function syncChildren(children: ChildRequest[], deviceToken: string | null, mode: SyncMode): Promise<ChildSyncResult[]> {
    const result = await callFunction<{ children: ChildSyncResult[] }>("parentSync", {
        children,
        deviceToken: deviceToken ?? undefined,
        mode,
    });
    return result.children;
}

/** Stop sending a child's marks (or, with no studentId, all marks) to this phone. */
export async function unlinkDevice(deviceToken: string, studentId?: string): Promise<void> {
    await callFunction("parentUnlink", { deviceToken, studentId });
}

export function syncErrorMessage(error: Extract<ChildSyncResult, { ok: false }>["error"]): string {
    switch (error) {
        case "mismatch":
            return "This Student ID and mobile number don't match the school's records.";
        case "inactive":
            return "This student is no longer active at the school. Please contact the school office.";
        case "rate-limited":
            return "Too many wrong attempts for this Student ID. Please try again in an hour.";
        case "invalid":
            return "Check the Student ID and mobile number.";
        case "too-soon":
            return "This child was downloaded on this phone a moment ago. Please try again in an hour.";
    }
}

// ── teachers (signed in) ──────────────────────────

/** Classes, students and recent registers — what the teacher side works from. */
export function fetchTeacherSync(idToken: string): Promise<TeacherSync> {
    return callFunction<TeacherSync>("teacherSync", {}, idToken);
}

/** One student's profile, every result and this year's attendance. */
export function fetchTeacherStudent(idToken: string, studentId: string): Promise<TeacherStudentDetail> {
    return callFunction<TeacherStudentDetail>("teacherStudent", { studentId }, idToken);
}

/** Save a whole register in one call. baseUpdatedAt: updatedAt of the register being corrected, or null. */
export function postAttendance(
    idToken: string,
    input: { classId: string; date: string; records: AttendanceRecord[]; baseUpdatedAt: number | null }
): Promise<SaveAttendanceResult> {
    return callFunction<SaveAttendanceResult>("saveAttendance", input, idToken);
}
