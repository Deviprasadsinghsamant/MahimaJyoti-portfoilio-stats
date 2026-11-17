import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    getDocsFromCache,
    getDocsFromServer,
    query,
    runTransaction,
    setDoc,
    updateDoc,
    where,
    writeBatch,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { getFirebaseDb, getFirebaseFunctions } from "@/lib/firebase";
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

// Keep in sync with formatStudentCode in scripts/assign-student-codes.ts.
export function formatStudentCode(n: number): string {
    return `MJ${String(n).padStart(4, "0")}`;
}

// Last 10 digits of an Indian mobile number (accepts +91 / 91 / 0 prefixes), or
// null if it isn't one. The parent app accepts any number normalised this way.
export function normalizeMobile(raw: string): string | null {
    let digits = raw.replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
    if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
    return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

/**
 * Parse mobile numbers typed one per line or comma-separated into the stored
 * form ("+919937804220, +918144900856"). Throws on anything that isn't a mobile.
 */
export function formatContactNumbers(raw: string): string {
    const parts = raw.split(/[\n,;/]/).map((p) => p.trim()).filter(Boolean);
    const numbers: string[] = [];
    for (const p of parts) {
        const n = normalizeMobile(p);
        if (!n) throw new Error(`"${p}" isn't a 10-digit mobile number.`);
        if (!numbers.includes(n)) numbers.push(n);
    }
    return numbers.map((n) => `+91${n}`).join(", ");
}

/** Create a student with the next Student ID (counters/studentCode), atomically. */
export async function createStudent(
    input: Omit<Student, "id" | "createdAt" | "isActive" | "studentCode"> & { isActive?: boolean }
): Promise<Student> {
    return withTokenRetry(async () => {
        const database = db();
        const ref = doc(collection(database, "students"));
        const counterRef = doc(database, "counters", "studentCode");
        const student = await runTransaction(database, async (tx) => {
            const counter = await tx.get(counterRef);
            const next = (counter.exists() ? Number(counter.data().next) : 0) || 1;
            const created: Student = {
                ...input,
                id: ref.id,
                studentCode: formatStudentCode(next),
                isActive: input.isActive ?? true,
                createdAt: Date.now(),
            };
            tx.set(ref, created);
            tx.set(counterRef, { next: next + 1 });
            return created;
        });
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

/**
 * Move a student to another section (or keep the section and change subjects),
 * taking their marks along. Every result recorded in the student's current
 * class is re-pointed at `subjectMap[result.subjectId]` in `toClassId` — e.g.
 * IX-A Odia → IX-C Odia, or IX-A Sanskrit → IX-C Hindi. Results from earlier
 * classes (previous years) stay where they are, as does past attendance.
 * Returns how many results moved.
 */
export async function moveStudent(
    student: Student,
    toClassId: string,
    subjectMap: Record<string, Subject>,
    actingUid: string
): Promise<number> {
    return withTokenRetry(async () => {
        const database = db();
        const snap = await getDocs(
            query(
                collection(database, "results"),
                where("studentId", "==", student.id),
                where("classId", "==", student.classId)
            )
        );
        const batch = writeBatch(database);
        if (toClassId !== student.classId) {
            batch.update(doc(database, "students", student.id), { classId: toClassId });
        }
        let moved = 0;
        for (const d of snap.docs) {
            const r = d.data() as Result;
            const target = subjectMap[r.subjectId];
            if (!target) throw new Error(`${student.name}: no subject chosen for some of their marks.`);
            if (target.id === r.subjectId && toClassId === r.classId) continue;
            const patch: Partial<Result> = {
                classId: toClassId,
                subjectId: target.id,
                teacherId: target.teacherId ?? "",
            };
            // Marks the old subject teacher owned become the new subject teacher's to edit.
            if (r.uploadedBy === r.teacherId) patch.uploadedBy = target.teacherId ?? actingUid;
            batch.update(d.ref, patch);
            moved++;
        }
        await batch.commit();
        invalidate("students:");
        invalidate("results:");
        return moved;
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
// Registers are read straight from Firestore (one document per class per day)
// and saved through the saveAttendance function, which checks that the saver is
// the class teacher (or an admin — the principal) and tells the parents. A
// class teacher's register is final once saved; only an admin can correct it.

// Class teachers can take today's register, or a missed one up to this many days back.
// Keep in sync with TEACHER_MARK_DAYS_BACK in mj-func/src/domains/attendance/handlers.ts.
export const TEACHER_MARK_DAYS_BACK = 2;

export async function getAttendance(classId: string, date: string): Promise<Attendance | null> {
    return memo(`attendance:${classId}:${date}`, async () => {
        const snap = await getDoc(doc(db(), "attendance", `${classId}_${date}`));
        return snap.exists() ? ({ updatedAt: 0, ...snap.data() } as Attendance) : null;
    });
}

export interface SaveAttendanceResult {
    // Nothing was written for these; `register` is the one on record.
    // "conflict": someone else saved this register meanwhile.
    // "locked": a teacher tried to change a finalised register (admins only).
    status: "saved" | "conflict" | "locked";
    register: Attendance;
}

/** Save the whole register in one call. baseUpdatedAt: updatedAt of the register being edited, or null if new. */
export async function saveAttendance(
    classId: string,
    date: string,
    records: AttendanceRecord[],
    baseUpdatedAt: number | null
): Promise<SaveAttendanceResult> {
    const call = httpsCallable<
        { classId: string; date: string; records: AttendanceRecord[]; baseUpdatedAt: number | null },
        SaveAttendanceResult
    >(getFirebaseFunctions(), "saveAttendance");
    try {
        const { data } = await call({ classId, date, records, baseUpdatedAt });
        return data;
    } finally {
        invalidate(`attendance:${classId}:${date}`);
    }
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

// One exam sitting's results for a class (every subject) — e.g. for a class mark
// sheet. Reads only that sitting, not every result the class has.
export async function listExamResults(
    classId: string,
    examType: Result["examType"],
    examNumber: number,
    academicYear: string
): Promise<Result[]> {
    return memo(`results:${classId}:exam:${examType}:${examNumber}:${academicYear}`, async () => {
        const snap = await getDocs(
            query(
                collection(db(), "results"),
                where("classId", "==", classId),
                where("examType", "==", examType),
                where("examNumber", "==", examNumber),
                where("academicYear", "==", academicYear)
            )
        );
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

// Every result, for the KPI dashboard. That's thousands of documents — and as
// many billable reads each time they come from the server — so they're served
// from Firestore's local cache and downloaded again at most once a day, or when
// the admin presses Refresh.
const RESULTS_FETCHED_KEY = "mj:kpi:resultsFetchedAt";
const RESULTS_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function readFetchedAt(): number {
    try {
        return Number(window.localStorage.getItem(RESULTS_FETCHED_KEY)) || 0;
    } catch {
        return 0;
    }
}

export async function listAllResults(opts: { fresh?: boolean } = {}): Promise<{ results: Result[]; fetchedAt: number }> {
    const fetchedAt = readFetchedAt();
    if (!opts.fresh && fetchedAt && Date.now() - fetchedAt < RESULTS_MAX_AGE_MS) {
        try {
            const cached = await getDocsFromCache(collection(db(), "results"));
            if (!cached.empty) return { results: cached.docs.map((d) => d.data() as Result), fetchedAt };
        } catch {
            // No local cache (private window, storage cleared): download below.
        }
    }
    const snap = await getDocsFromServer(collection(db(), "results"));
    const now = Date.now();
    try {
        window.localStorage.setItem(RESULTS_FETCHED_KEY, String(now));
    } catch {
        // Without storage the next visit downloads again.
    }
    return { results: snap.docs.map((d) => d.data() as Result), fetchedAt: now };
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