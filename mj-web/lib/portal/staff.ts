// Teacher / staff accounts and their teaching assignments.
// Accounts are created and edited through admin-only Cloud Functions (they need
// the Admin SDK to create logins and set role claims). Assignments are plain
// Firestore writes: classes.classTeacherId and subjects.teacherId.

import { collection, doc, writeBatch } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { getFirebaseDb, getFirebaseFunctions } from "@/lib/firebase";
import { withTokenRetry } from "@/lib/auth";
import { invalidate } from "./cache";
import { listClasses, listSubjects } from "./data";
import type { PortalUser, SchoolClass, Subject, UserRole } from "@/domain/portal/types";

// Accounts ────────────────────────────────────────

export type StaffRole = Extract<UserRole, "teacher" | "staff">;

export interface CreateStaffInput {
    displayName: string;
    phone: string;
    role: StaffRole;
    password: string;
}

export interface UpdateStaffInput {
    uid: string;
    displayName?: string;
    phone?: string;
    role?: StaffRole;
    isActive?: boolean;
    // Empty or missing leaves the password unchanged.
    password?: string;
}

export const MIN_PASSWORD_LENGTH = 8;

// Callable errors carry the server's message for expected failures (duplicate
// phone, bad input). Anything else means the function failed or isn't deployed.
function toFriendlyError(err: unknown): Error {
    const code = (err as { code?: string })?.code ?? "";
    if (code === "functions/internal" || code === "functions/not-found" || code === "functions/unavailable") {
        return new Error(
            `The staff service didn't respond (${code.replace("functions/", "")}). ` +
            "Check that the Cloud Functions are deployed, then try again."
        );
    }
    return err instanceof Error ? err : new Error("Request failed");
}

export async function createStaffAccount(input: CreateStaffInput): Promise<PortalUser> {
    const call = httpsCallable<CreateStaffInput, PortalUser>(getFirebaseFunctions(), "createStaffAccount");
    try {
        const { data } = await call(input);
        return data;
    } catch (err) {
        throw toFriendlyError(err);
    } finally {
        invalidate("users:");
    }
}

export async function updateStaffAccount(input: UpdateStaffInput): Promise<PortalUser> {
    const call = httpsCallable<UpdateStaffInput, PortalUser>(getFirebaseFunctions(), "updateStaffAccount");
    try {
        const { data } = await call(input);
        return data;
    } catch (err) {
        throw toFriendlyError(err);
    } finally {
        invalidate("users:");
    }
}

// No look-alike characters (0/O, 1/l/I) so it can be read out or typed from a slip.
const PASSWORD_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

export function generatePassword(length = 10): string {
    const bytes = new Uint32Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => PASSWORD_ALPHABET[b % PASSWORD_ALPHABET.length]).join("");
}

// Teaching assignments ────────────────────────────

export interface SubjectAssignment {
    classId: string;
    subjectName: string;
}

export interface TeachingAssignments {
    // Classes this person is class teacher of.
    classTeacherOf: string[];
    // Subjects they teach, each in one class (grade + section).
    subjects: SubjectAssignment[];
}

export function normalizeSubjectName(name: string): string {
    return name.trim().replace(/\s+/g, " ");
}

// A subject is identified by its class and its name, case-insensitively.
export function subjectKey(classId: string, name: string): string {
    return `${classId}::${normalizeSubjectName(name).toLowerCase()}`;
}

export function assignmentsFor(uid: string, classes: SchoolClass[], subjects: Subject[]): TeachingAssignments {
    return {
        classTeacherOf: classes.filter((c) => c.classTeacherId === uid).map((c) => c.id),
        subjects: subjects
            .filter((s) => s.teacherId === uid)
            .map((s) => ({ classId: s.classId, subjectName: s.name })),
    };
}

/**
 * Make `uid`'s class-teacher roles and subject assignments match `next`, in one batch:
 * - classes in classTeacherOf get this person as class teacher; classes they
 *   were class teacher of but aren't listed lose them (no class teacher).
 * - each listed subject is assigned to them, taking it over from whoever had it.
 *   A subject that doesn't exist in that class yet is created.
 * - subjects they taught that aren't listed become unassigned. The subject
 *   itself stays, so its results and syllabus keep pointing at it.
 */
export async function saveTeachingAssignments(uid: string, next: TeachingAssignments): Promise<void> {
    await withTokenRetry(async () => {
        // Read fresh — another admin may have changed assignments since the form loaded.
        invalidate("classes:");
        invalidate("subjects:");
        const [classes, subjects] = await Promise.all([listClasses(), listSubjects()]);
        const classById = new Map(classes.map((c) => [c.id, c]));

        const database = getFirebaseDb();
        const batch = writeBatch(database);
        let writes = 0;

        const classTeacherOf = new Set(next.classTeacherOf);
        for (const id of classTeacherOf) {
            if (!classById.has(id)) throw new Error("A selected class no longer exists. Reload and try again.");
        }
        for (const c of classes) {
            const wanted = classTeacherOf.has(c.id);
            if (wanted && c.classTeacherId !== uid) {
                batch.update(doc(database, "classes", c.id), { classTeacherId: uid });
                writes++;
            } else if (!wanted && c.classTeacherId === uid) {
                batch.update(doc(database, "classes", c.id), { classTeacherId: null });
                writes++;
            }
        }

        const wanted = new Map<string, SubjectAssignment>();
        for (const a of next.subjects) {
            const subjectName = normalizeSubjectName(a.subjectName);
            if (!subjectName) throw new Error("Every subject row needs a subject name.");
            if (!classById.has(a.classId)) throw new Error("A selected class no longer exists. Reload and try again.");
            wanted.set(subjectKey(a.classId, subjectName), { classId: a.classId, subjectName });
        }

        // If a class has two docs with the same subject name, prefer the one already theirs.
        const existingByKey = new Map<string, Subject>();
        for (const s of subjects) {
            const key = subjectKey(s.classId, s.name);
            if (!existingByKey.has(key) || s.teacherId === uid) existingByKey.set(key, s);
        }

        for (const s of subjects) {
            if (s.teacherId === uid && !wanted.has(subjectKey(s.classId, s.name))) {
                batch.update(doc(database, "subjects", s.id), { teacherId: null });
                writes++;
            }
        }
        for (const [key, a] of wanted) {
            const existing = existingByKey.get(key);
            if (existing) {
                if (existing.teacherId !== uid) {
                    batch.update(doc(database, "subjects", existing.id), { teacherId: uid });
                    writes++;
                }
                continue;
            }
            const ref = doc(collection(database, "subjects"));
            const subject: Subject = {
                id: ref.id,
                name: a.subjectName,
                classId: a.classId,
                teacherId: uid,
                academicYear: classById.get(a.classId)!.academicYear,
            };
            batch.set(ref, subject);
            writes++;
        }

        if (writes > 0) await batch.commit();
        invalidate("classes:");
        invalidate("subjects:");
    });
}
