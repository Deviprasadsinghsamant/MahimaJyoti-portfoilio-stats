// What the backend sends. Keep in sync with mj-func/src/domains/parents/types.ts,
// mj-func/src/domains/teachers/handlers.ts and mj-func/src/shared/types.ts.

// subject-test: a test in one subject (class / unit test), numbered per subject —
// Mathematics Test 1, 2, … — with its own total marks.
export type ExamType = "baseline" | "internal-assessment" | "summative" | "subject-test";
export type AttendanceMark = "P" | "A";

// ── parents ───────────────────────────────────────

export interface ParentStudent {
    id: string;
    // The Student ID parents sign in with, e.g. "MJ0042".
    code: string;
    name: string;
    className: string;
    isActive: boolean;
}

export interface ParentResult {
    id: string;
    examType: ExamType;
    examNumber: number;
    examDate: string;
    academicYear: string;
    subjectName: string;
    marksObtained: number;
    totalMarks: number;
}

// The current academic year's register entries for one student.
export interface ParentAttendance {
    academicYear: string;
    // ISO date → present / absent, for every day the class register was taken.
    days: Record<string, AttendanceMark>;
}

export interface ChildSnapshot {
    student: ParentStudent;
    results: ParentResult[];
    attendance: ParentAttendance;
    syncedAt: number;
    // The student's change-feed version this snapshot includes.
    version?: number;
}

// What changed since the version the phone holds.
export interface ChildChanges {
    version: number;
    results: ParentResult[];
    removedResultIds: string[];
    student?: ParentStudent;
    attendance?: ParentAttendance;
}

export interface ChildCredentials {
    studentCode: string;
    phone: string;
}

// What the phone sends for each child it holds.
export interface ChildRequest extends ChildCredentials {
    studentId?: string;
    version?: number;
}

export type SyncMode = "check" | "refresh";

export type ChildSyncResult =
    | { ok: true; studentCode: string; snapshot: ChildSnapshot }
    // Nothing new since the phone's version.
    | { ok: true; studentCode: string; current: true; version: number }
    | { ok: true; studentCode: string; changes: ChildChanges }
    | { ok: false; studentCode: string; error: "mismatch" | "inactive" | "rate-limited" | "invalid" }
    // A full download was refused because this phone had one too recently.
    | { ok: false; studentCode: string; error: "too-soon"; retryAt: number };

// FCM data payloads (all values are strings; objects travel as JSON). v is the
// student's change-feed version after this change, so a missed message shows up
// as a gap.
export type PushData = { v?: string } & (
    | { kind: "result"; studentId: string; result: string }
    | { kind: "result-deleted"; studentId: string; resultId: string }
    | { kind: "student"; studentId: string; student: string }
    // mark "" means the day was taken off the child's register.
    | { kind: "attendance"; studentId: string; academicYear: string; date: string; mark: AttendanceMark | "" }
);

// One child as kept on the phone.
export interface StoredChild extends ChildCredentials {
    student: ParentStudent;
    results: Record<string, ParentResult>;
    attendance?: ParentAttendance;
    // Last full download (sign-in or Refresh).
    syncedAt: number;
    // Last change of any kind, including push updates.
    updatedAt: number;
    // Set when the last Refresh couldn't verify this child (e.g. number removed by the school).
    refreshProblem?: string;
    // The change-feed version this copy reflects (unset before the first check after updating the app).
    version?: number;
    // Versions of pushes that arrived ahead of `version` (one in between is missing or late).
    ahead?: number[];
    // Per item ("r:<resultId>", "student", "a:<date>"), the version last applied, so a late
    // push never overwrites a newer one.
    itemVersions?: Record<string, number>;
    // A push seems to be missing: check with the server soon.
    stale?: boolean;
}

export interface StoredState {
    children: StoredChild[];
    // Last time the server was asked whether anything changed.
    checkedAt?: number;
}

// ── teachers ──────────────────────────────────────

export type UserRole = "admin" | "teacher" | "staff";
export type AttendanceStatus = "present" | "absent";

export interface AttendanceRecord {
    studentId: string;
    status: AttendanceStatus;
}

// One class's register for one day.
export interface Register {
    id: string;
    classId: string;
    date: string;
    academicYear: string;
    records: AttendanceRecord[];
    markedBy: string;
    markedByName: string;
    markedByRole: UserRole;
    createdAt: number;
    updatedAt: number;
}

export interface TeacherClass {
    id: string;
    name: string;
    grade: number;
    section: string;
    academicYear: string;
    classTeacherId: string | null;
}

export interface TeacherStudent {
    id: string;
    code: string;
    name: string;
    classId: string;
    rollNo: string | null;
}

export interface TeacherSync {
    me: { uid: string; name: string; role: UserRole };
    classes: TeacherClass[];
    students: TeacherStudent[];
    // Classes this person takes attendance for.
    markClassIds: string[];
    // Their registers for the days that can still be corrected.
    registers: Register[];
    today: string;
    syncedAt: number;
}

export interface TeacherStudentDetail extends ChildSnapshot {
    parentName: string;
    phones: string[];
}

export type SaveAttendanceResult =
    | { status: "saved"; register: Register }
    // Nothing was written for these; `register` is the one on record.
    // Someone else saved the register first:
    | { status: "conflict"; register: Register }
    // It's already finalised, and only the principal (admin) can change it:
    | { status: "locked"; register: Register };
