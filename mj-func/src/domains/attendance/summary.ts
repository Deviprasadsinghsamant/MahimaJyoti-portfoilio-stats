// Attendance Domain — per-student summaries
// ─────────────────────────────────────────
// attendanceSummary/{studentId}_{academicYear} holds every register entry for
// one student in one year. saveAttendance keeps it current, so showing a
// child's attendance costs one read instead of one per school day.

import { db } from "../../shared/firestore";
import type { AttendanceSummary } from "../../shared/types";
import type { ParentAttendance } from "../parents/types";

export function summaryRef(studentId: string, academicYear: string) {
    return db.collection("attendanceSummary").doc(`${studentId}_${academicYear}`);
}

/** A student's attendance for the year (empty until their class's first register). */
export async function attendanceFor(studentId: string, academicYear: string | undefined): Promise<ParentAttendance> {
    if (!academicYear) return { academicYear: "", days: {} };
    const data = (await summaryRef(studentId, academicYear).get()).data() as AttendanceSummary | undefined;
    return { academicYear, days: data?.days ?? {} };
}
