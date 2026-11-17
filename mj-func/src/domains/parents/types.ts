// What the app's parent side receives — from parentSync and in push messages.
// Keep in sync with mj-app/src/lib/types.ts.

import type { AttendanceMark, ExamType } from "../../shared/types";

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
    // Every result on record, previous years included.
    results: ParentResult[];
    attendance: ParentAttendance;
    syncedAt: number;
    // The student's change-feed version this snapshot includes (see feed.ts).
    version?: number;
}

// What changed for a student since the version a phone holds.
export interface ChildChanges {
    version: number;
    // Created or corrected results.
    results: ParentResult[];
    // Results deleted (or moved to another student).
    removedResultIds: string[];
    // Set when the profile or attendance changed.
    student?: ParentStudent;
    attendance?: ParentAttendance;
}

// FCM data messages. Data values must be strings, so objects travel as JSON.
// v: the student's change-feed version after this change (absent if the feed
// couldn't be updated) — lets the phone notice a message it never got.
export type PushData = { v?: string } & (
    | { kind: "result"; studentId: string; result: string /* ParentResult */ }
    | { kind: "result-deleted"; studentId: string; resultId: string }
    | { kind: "student"; studentId: string; student: string /* ParentStudent */ }
    // mark "" means the day was taken off the child's register (e.g. moved to another section).
    | { kind: "attendance"; studentId: string; academicYear: string; date: string; mark: AttendanceMark | "" }
);
