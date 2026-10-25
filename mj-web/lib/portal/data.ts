import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    updateDoc,
    where,
    writeBatch,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { withTokenRetry } from "@/lib/auth";
import { memo, invalidate } from "./cache";
import type {
    SchoolClass,
    Student,
    Subject,
    Attendance,
    AttendanceRecord,
    Result,
    Syllabus,
    UserRole,
    PortalUser,
} from "@/domain/portal/types";

function db() {
    return getFirebaseDb();
}

// Classes ─────────────────────────────────────────
export async function listClasses(): Promise<SchoolClass[]> {
    return memo("classes:all", async () => {
        const snap = await getDocs(collection(db(), "classes"));
        return snap.docs.map((d) => d.data() as SchoolClass);
    });
}

// Grade, then section — "Class 10-A" after "Class 9-B", not before "Class 6-A".
export function sortClasses(classes: SchoolClass[]): SchoolClass[] {
    return [...classes].sort((a, b) => a.grade - b.grade || a.section.localeCompare(b.section));
}

export async function createClass(input: Omit<SchoolClass, "id">): Promise<SchoolClass> {
    return withTokenRetry(async () => {
        // Checked against the server, not the memo — one doc per grade + section.
        const dupes = await getDocs(
            query(
                collection(db(), "classes"),
                where("grade", "==", input.grade),
                where("section", "==", input.section)
            )
        );
        if (!dupes.empty) {
            throw new Error(`Grade ${input.grade} already has a section ${input.section}.`);
        }
        const ref = doc(collection(db(), "classes"));
        const cls: SchoolClass = { ...input, id: ref.id };
        await setDoc(ref, cls);
        invalidate("classes:");
        return cls;
    });
}

export async function setClassTeacher(classId: string, teacherId: string | null) {
    await withTokenRetry(async () => {
        await updateDoc(doc(db(), "classes", classId), { classTeacherId: teacherId });
        invalidate("classes:");
    });
}

export async function deleteClass(id: string) {
    await withTokenRetry(async () => {
        await deleteDoc(doc(db(), "classes", id));
        invalidate("classes:");
    });
}

// Students ────────────────────────────────────────
export async function listStudents(classId: string, opts?: { includeInactive?: boolean }): Promise<Student[]> {
    const key = `students:${classId}:${opts?.includeInactive ? "all" : "active"}`;
    return memo(key, async () => {
        const constraints = [where("classId", "==", classId)];
        if (!opts?.includeInactive) constraints.push(where("isActive", "==", true));
        const snap = await getDocs(query(collection(db(), "students"), ...constraints));
        return snap.docs.map((d) => d.data() as Student);
    });
}

export async function createStudent(input: Omit<Student, "id" | "createdAt" | "isActive"> & { isActive?: boolean }): Promise<Student> {
    return withTokenRetry(async () => {
        const ref = doc(collection(db(), "students"));
        const student: Student = {
            ...input,
            id: ref.id,
            isActive: input.isActive ?? true,
            createdAt: Date.now(),
        };
        await setDoc(ref, student);
        invalidate("students:");
        return student;
    });
}

export async function updateStudent(id: string, patch: Partial<Student>) {
    await withTokenRetry(async () => {
        await updateDoc(doc(db(), "students", id), patch);
        invalidate("students:");
    });
}

export async function setStudentActive(id: string, isActive: boolean) {
    await withTokenRetry(async () => {
        await updateDoc(doc(db(), "students", id), { isActive });
        invalidate("students:");
    });
}

// Subjects ────────────────────────────────────────
export async function listSubjects(classId?: string): Promise<Subject[]> {
    const key = `subjects:${classId ?? "all"}`;
    return memo(key, async () => {
        const q = classId
            ? query(collection(db(), "subjects"), where("classId", "==", classId))
            : query(collection(db(), "subjects"));
        const snap = await getDocs(q);
        return snap.docs.map((d) => d.data() as Subject);
    });
}

export async function createSubject(input: Omit<Subject, "id">): Promise<Subject> {
    return withTokenRetry(async () => {
        const ref = doc(collection(db(), "subjects"));
        const subject: Subject = { ...input, id: ref.id };
        await setDoc(ref, subject);
        invalidate("subjects:");
        return subject;
    });
}

export async function setSubjectTeacher(id: string, teacherId: string | null) {
    await withTokenRetry(async () => {
        await updateDoc(doc(db(), "subjects", id), { teacherId });
        invalidate("subjects:");
    });
}

export async function deleteSubject(id: string) {
    await withTokenRetry(async () => {
        await deleteDoc(doc(db(), "subjects", id));
        invalidate("subjects:");
    });
}

// Attendance ──────────────────────────────────────
export async function getAttendance(classId: string, date: string): Promise<Attendance | null> {
    return memo(`attendance:${classId}:${date}`, async () => {
        const snap = await getDocs(
            query(
                collection(db(), "attendance"),
                where("classId", "==", classId),
                where("date", "==", date)
            )
        );
        if (snap.empty) return null;
        return snap.docs[0].data() as Attendance;
    });
}

export async function upsertAttendance(
    classId: string,
    date: string,
    records: AttendanceRecord[],
    markedBy: string,
    markedByRole: UserRole
): Promise<Attendance> {
    return withTokenRetry(async () => {
        const existing = await getAttendance(classId, date);
        if (existing) {
            await updateDoc(doc(db(), "attendance", existing.id), { records, markedBy, markedByRole });
            invalidate("attendance:");
            return { ...existing, records, markedBy, markedByRole };
        }
        const ref = doc(collection(db(), "attendance"));
        const attendance: Attendance = {
            id: ref.id,
            classId,
            date,
            records,
            markedBy,
            markedByRole,
            createdAt: Date.now(),
        };
        await setDoc(ref, attendance);
        invalidate("attendance:");
        return attendance;
    });
}

// Users lookup ────────────────────────────────────
// Every teacher and staff profile, including deactivated ones (for name lookups).
export async function listStaff(): Promise<PortalUser[]> {
    return memo("users:staff", async () => {
        const snap = await getDocs(collection(db(), "users"));
        return snap.docs
            .map((d) => d.data() as PortalUser)
            .filter((u) => u.role === "teacher" || u.role === "staff");
    });
}

export async function listTeachersAndStaff(): Promise<{ uid: string; displayName: string; role: UserRole }[]> {
    const staff = await listStaff();
    return staff
        .filter((u) => u.isActive)
        .map(({ uid, displayName, role }) => ({ uid, displayName, role }));
}

// Results ────────────────────────────────────────
export async function listResults(filter: { classId?: string; subjectId?: string; studentId?: string }): Promise<Result[]> {
    const key = `results:${filter.classId ?? "*"}:${filter.subjectId ?? "*"}:${filter.studentId ?? "*"}`;
    return memo(key, async () => {
        const constraints = [];
        if (filter.classId) constraints.push(where("classId", "==", filter.classId));
        if (filter.subjectId) constraints.push(where("subjectId", "==", filter.subjectId));
        if (filter.studentId) constraints.push(where("studentId", "==", filter.studentId));
        const snap = await getDocs(query(collection(db(), "results"), ...constraints));
        return snap.docs.map((d) => d.data() as Result);
    });
}

export async function upsertResult(input: Omit<Result, "id" | "createdAt">): Promise<Result> {
    return withTokenRetry(async () => {
        // one doc per (student, subject, examType, examNumber, academicYear)
        const snap = await getDocs(
            query(
                collection(db(), "results"),
                where("studentId", "==", input.studentId),
                where("subjectId", "==", input.subjectId),
                where("examType", "==", input.examType),
                where("examNumber", "==", input.examNumber),
                where("academicYear", "==", input.academicYear)
            )
        );
        if (!snap.empty) {
            const existing = snap.docs[0].data() as Result;
            await updateDoc(doc(db(), "results", existing.id), {
                marksObtained: input.marksObtained,
                totalMarks: input.totalMarks,
                examDate: input.examDate,
                uploadedBy: input.uploadedBy,
                teacherId: input.teacherId,
            });
            invalidate("results:");
            return { ...existing, ...input };
        }
        const ref = doc(collection(db(), "results"));
        const result: Result = { ...input, id: ref.id, createdAt: Date.now() };
        await setDoc(ref, result);
        invalidate("results:");
        return result;
    });
}

// Fetch all results in one shot for KPI dashboards.
export async function listAllResults(): Promise<Result[]> {
    return memo("results:all", async () => {
        const snap = await getDocs(collection(db(), "results"));
        return snap.docs.map((d) => d.data() as Result);
    });
}

// Syllabus ───────────────────────────────────────
export async function listSyllabus(filter?: { classId?: string; subjectId?: string }): Promise<Syllabus[]> {
    const key = `syllabus:${filter?.classId ?? "*"}:${filter?.subjectId ?? "*"}`;
    return memo(key, async () => {
        const constraints = [];
        if (filter?.classId) constraints.push(where("classId", "==", filter.classId));
        if (filter?.subjectId) constraints.push(where("subjectId", "==", filter.subjectId));
        const snap = await getDocs(query(collection(db(), "syllabus"), ...constraints));
        return snap.docs.map((d) => d.data() as Syllabus);
    });
}

export async function createSyllabus(input: Omit<Syllabus, "id" | "createdAt">): Promise<Syllabus> {
    return withTokenRetry(async () => {
        const ref = doc(collection(db(), "syllabus"));
        const syllabus: Syllabus = { ...input, id: ref.id, createdAt: Date.now() };
        await setDoc(ref, syllabus);
        invalidate("syllabus:");
        return syllabus;
    });
}

export async function deleteSyllabus(id: string) {
    await withTokenRetry(async () => {
        await deleteDoc(doc(db(), "syllabus", id));
        invalidate("syllabus:");
    });
}

// Promotion — advance every active student in each source class to the next
// grade's class atomically. Students already in the highest grade get an
// explicit graduate flag if opts.graduateTop is true.

export interface PromotionPlan {
    moves: {
        fromClassId: string;
        fromClassName: string;
        toClassId: string | null;
        toClassName: string | null;
        studentCount: number;
    }[];
}

export async function planPromotion(): Promise<PromotionPlan> {
    const classes = await listClasses();
    const byGrade = new Map<number, SchoolClass>();
    classes.forEach((c) => {
        // pick lowest section per grade if duplicates
        if (!byGrade.has(c.grade)) byGrade.set(c.grade, c);
        else if (c.section < byGrade.get(c.grade)!.section) byGrade.set(c.grade, c);
    });
    const moves: PromotionPlan["moves"] = [];
    for (const cls of classes) {
        const students = await listStudents(cls.id);
        const next = byGrade.get(cls.grade + 1) ?? null;
        moves.push({
            fromClassId: cls.id,
            fromClassName: cls.name,
            toClassId: next?.id ?? null,
            toClassName: next?.name ?? null,
            studentCount: students.length,
        });
    }
    return { moves };
}

export async function runPromotion(plan: PromotionPlan, graduateTop: boolean): Promise<{ promoted: number; graduated: number }> {
    return withTokenRetry(async () => {
        const database = db();
        const batch = writeBatch(database);
        let promoted = 0;
        let graduated = 0;
        for (const move of plan.moves) {
            const students = await listStudents(move.fromClassId);
            if (move.toClassId) {
                for (const s of students) {
                    batch.update(doc(database, "students", s.id), { classId: move.toClassId });
                    promoted++;
                }
            } else if (graduateTop) {
                for (const s of students) {
                    batch.update(doc(database, "students", s.id), { isActive: false });
                    graduated++;
                }
            }
        }
        await batch.commit();
        return { promoted, graduated };
    });
}

// Single doc lookups ─────────────────────────────
export async function getStudent(id: string): Promise<Student | null> {
    const snap = await getDoc(doc(db(), "students", id));
    return snap.exists() ? (snap.data() as Student) : null;
}

export async function getSubject(id: string): Promise<Subject | null> {
    const snap = await getDoc(doc(db(), "subjects", id));
    return snap.exists() ? (snap.data() as Subject) : null;
}