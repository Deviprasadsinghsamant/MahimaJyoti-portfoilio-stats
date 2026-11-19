// Teachers Domain — Cloud Function Handlers
// ─────────────────────────────────────────
// What the app's teacher side downloads. One call gets everything needed to
// find students and take attendance, and the app keeps it on the phone; a
// student's marks are fetched only when a teacher opens that student. Marks
// stay read-only here — they're entered on the website.
//
// The demo login for app-store reviewers (Caller.demo) is served from the demo
// set of collections and everyone else from the school's (shared/dataSpace.ts),
// so reviewers never see a real child and nobody at school sees demo data.

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { requirePortalUser } from "../../shared/callableAuth";
import { dataSpace } from "../../shared/dataSpace";
import { addDays, istToday } from "../../shared/dates";
import { db } from "../../shared/firestore";
import type { Attendance, SchoolClass, Student, UserRole } from "../../shared/types";
import { registerId, TEACHER_MARK_DAYS_BACK } from "../attendance/handlers";
import { mobilesOf, snapshotFor } from "../parents/handlers";
import type { ChildSnapshot } from "../parents/types";

const REGION = "asia-south1";

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

export interface TeacherSyncResult {
    me: { uid: string; name: string; role: UserRole };
    classes: TeacherClass[];
    // Active students only.
    students: TeacherStudent[];
    // Classes this person marks attendance for: their own as class teacher, every class for an admin.
    markClassIds: string[];
    // Those classes' registers for the days a class teacher can still take.
    registers: Attendance[];
    // Today in India, from the server — the phone's clock may be wrong.
    today: string;
    syncedAt: number;
}

export interface TeacherStudentDetail extends ChildSnapshot {
    parentName: string;
    // 10-digit mobile numbers on the student's record.
    phones: string[];
}

/** Classes, students and recent registers — everything the teacher side works from offline. */
export const teacherSync = onCall({ region: REGION }, async (request): Promise<TeacherSyncResult> => {
    const me = requirePortalUser(request);
    const data = dataSpace(me.demo);
    const [classSnap, studentSnap] = await Promise.all([
        db.collection(data.classes).get(),
        db.collection(data.students).where("isActive", "==", true).get(),
    ]);
    const classes = classSnap.docs
        .map((d) => d.data() as SchoolClass)
        .map(({ id, name, grade, section, academicYear, classTeacherId }) => ({
            id,
            name,
            grade,
            section,
            academicYear,
            classTeacherId: classTeacherId ?? null,
        }))
        .sort((a, b) => a.grade - b.grade || a.section.localeCompare(b.section));
    const students = studentSnap.docs.map((d) => {
        const s = d.data() as Student;
        return { id: s.id, code: s.studentCode ?? "", name: s.name, classId: s.classId, rollNo: s.rollNo ?? null };
    });

    const markClassIds = classes.filter((c) => me.role === "admin" || c.classTeacherId === me.uid).map((c) => c.id);
    const today = istToday();
    const days = Array.from({ length: TEACHER_MARK_DAYS_BACK + 1 }, (_, i) => addDays(today, -i));
    const registerRefs = markClassIds.flatMap((classId) =>
        days.map((date) => db.collection(data.attendance).doc(registerId(classId, date)))
    );
    const registerDocs = registerRefs.length ? await db.getAll(...registerRefs) : [];
    const registers = registerDocs
        .filter((d) => d.exists)
        .map((d) => ({ updatedAt: 0, ...d.data() }) as Attendance);

    return {
        me: { uid: me.uid, name: me.name, role: me.role },
        classes,
        students,
        markClassIds,
        registers,
        today,
        syncedAt: Date.now(),
    };
});

/** One student's profile, every result and this year's attendance, for a teacher to look at. */
export const teacherStudent = onCall<{ studentId: string }>({ region: REGION }, async (request): Promise<TeacherStudentDetail> => {
    const me = requirePortalUser(request);
    const studentId = typeof request.data?.studentId === "string" ? request.data.studentId : "";
    if (!studentId) throw new HttpsError("invalid-argument", "studentId is required.");
    // Each login looks in its own set only: a demo login can't open a real student, nor anyone a demo one.
    const doc = await db.collection(dataSpace(me.demo).students).doc(studentId).get();
    if (!doc.exists) throw new HttpsError("not-found", "This student is no longer on the school's records.");
    const student = doc.data() as Student;
    return {
        ...(await snapshotFor(student)),
        parentName: student.parentName ?? "",
        phones: mobilesOf(student),
    };
});
