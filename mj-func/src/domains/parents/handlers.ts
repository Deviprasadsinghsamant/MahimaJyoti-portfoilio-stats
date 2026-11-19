// Parents Domain — Cloud Function Handlers
// ────────────────────────────────────────
// The parent app signs in with a Student ID (e.g. MJ0042) and a mobile number
// on that student's record — there are no parent accounts. The app keeps every
// child's results and attendance on the phone; changes reach it as push
// messages (triggers.ts and the attendance domain), each stamped with the
// student's change-feed version (feed.ts).
//
// parentSync is how the app talks to the server:
//   • mode "check" — sent at sign-in, when the app is opened, and when a push
//     seems to be missing. It answers from the versions: nothing new (one read
//     per child), just the changes since the phone's version, or — rarely — the
//     full record. Opening the app costs almost nothing, yet a mark whose push
//     was lost still shows up.
//   • mode "refresh" — the parent's manual refresh: the same, plus a full
//     re-download of each child at most once every 24 hours per phone.
//   • no mode — apps before 1.0.2: a full download, at most once a day.

import { createHash } from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "../../shared/firestore";
import type { Result, SchoolClass, Student, Subject } from "../../shared/types";
import { DEMO_DATA, dataSpaceOfStudent, type DataSpace, SCHOOL_DATA } from "../../shared/dataSpace";
import { attendanceFor } from "../attendance/summary";
import { changesSince, type Feed, readFeeds } from "./feed";
import type { ChildChanges, ChildSnapshot, ParentResult, ParentStudent } from "./types";

// Same region as Firestore and the staff functions. The app calls this region.
const REGION = "asia-south1";

const MAX_CHILDREN = 10;
// Wrong Student ID / mobile pairs allowed per Student ID per hour.
const MAX_FAILURES = 10;
const FAILURE_WINDOW_MS = 60 * 60 * 1000;
// A phone re-downloads a child's full record by hand at most this often.
// Changes reach it as pushes and checks in between.
export const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
// When a check finds the phone can't be brought up to date from the change log
// (e.g. the first check after updating the app), it sends the full record — at
// most this often per phone and child.
const CATCH_UP_INTERVAL_MS = 60 * 60 * 1000;

export interface ChildCredentials {
    studentCode: string;
    phone: string;
}

interface ChildInput extends ChildCredentials {
    // Known once signed in: lets a check skip re-verifying the pair for a phone
    // already registered for this student.
    studentId?: string;
    // The change-feed version the phone's copy reflects.
    version?: number;
}

type Mode = "check" | "refresh";

export interface ParentSyncInput {
    children: ChildInput[];
    // FCM registration token of the phone, to receive new marks as push messages.
    deviceToken?: string;
    mode?: Mode;
}

type SyncError = "mismatch" | "inactive" | "rate-limited" | "invalid";

export type ChildSyncResult =
    | { ok: true; studentCode: string; snapshot: ChildSnapshot }
    // Checks only: the phone is up to date, or here is what changed.
    | { ok: true; studentCode: string; current: true; version: number }
    | { ok: true; studentCode: string; changes: ChildChanges }
    | { ok: false; studentCode: string; error: SyncError }
    // Full download refused: this phone had one too recently. Try after retryAt.
    | { ok: false; studentCode: string; error: "too-soon"; retryAt: number };

export function normalizeStudentCode(raw: unknown): string | null {
    if (typeof raw !== "string") return null;
    const code = raw.trim().toUpperCase().replace(/\s+/g, "");
    return /^MJ\d{4,6}$/.test(code) ? code : null;
}

// Last 10 digits of an Indian mobile number, accepting +91 / 91 / 0 prefixes.
export function normalizeMobile(raw: unknown): string | null {
    if (typeof raw !== "string") return null;
    let digits = raw.replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
    if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
    return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

// Every mobile number on a student's record ("+919937804220, +918144900856").
export function mobilesOf(student: Pick<Student, "contactNumber">): string[] {
    return (student.contactNumber ?? "")
        .split(/[,/;]/)
        .map((n) => normalizeMobile(n))
        .filter((n): n is string => n !== null);
}

export function deviceDocId(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}

export function toParentStudent(student: Student, cls: SchoolClass | undefined): ParentStudent {
    return {
        id: student.id,
        code: student.studentCode ?? "",
        name: student.name,
        className: cls?.name ?? "",
        isActive: student.isActive,
    };
}

export function toParentResult(r: Result, subject: Subject | undefined): ParentResult {
    return {
        id: r.id,
        examType: r.examType,
        examNumber: r.examNumber,
        examDate: r.examDate,
        academicYear: r.academicYear,
        subjectName: subject?.name ?? "Subject",
        marksObtained: r.marksObtained,
        totalMarks: r.totalMarks,
    };
}

interface Attempts {
    failures: number;
    windowStart: number;
}

// Wrong attempts for this Student ID in the current window, if any.
async function readAttempts(code: string): Promise<Attempts | null> {
    const snap = await db.collection("parentLoginAttempts").doc(code).get();
    const data = snap.data() as Attempts | undefined;
    return data && Date.now() - data.windowStart <= FAILURE_WINDOW_MS ? data : null;
}

async function recordFailure(code: string): Promise<void> {
    const ref = db.collection("parentLoginAttempts").doc(code);
    await db.runTransaction(async (tx) => {
        const data = (await tx.get(ref)).data() as Attempts | undefined;
        const now = Date.now();
        if (!data || now - data.windowStart > FAILURE_WINDOW_MS) {
            tx.set(ref, { failures: 1, windowStart: now });
        } else {
            tx.update(ref, { failures: data.failures + 1 });
        }
    });
}

async function subjectsFor(results: Result[], data: DataSpace): Promise<Map<string, Subject>> {
    const ids = Array.from(new Set(results.map((r) => r.subjectId)));
    if (ids.length === 0) return new Map();
    const docs = await db.getAll(...ids.map((id) => db.collection(data.subjects).doc(id)));
    return new Map(docs.filter((d) => d.exists).map((d) => [d.id, d.data() as Subject]));
}

/**
 * Everything the app shows for one student: profile, every result, this year's
 * attendance. Pass the feed version read *before* this call, so a change made
 * meanwhile is fetched again rather than lost. The demo student's records come
 * from the demo set (shared/dataSpace.ts).
 */
export async function snapshotFor(student: Student, version?: number): Promise<ChildSnapshot> {
    const data = dataSpaceOfStudent(student.id);
    const [resultSnap, classDoc] = await Promise.all([
        db.collection(data.results).where("studentId", "==", student.id).get(),
        db.collection(data.classes).doc(student.classId).get(),
    ]);
    const cls = classDoc.exists ? (classDoc.data() as SchoolClass) : undefined;
    const results = resultSnap.docs.map((d) => d.data() as Result);
    const [subjects, attendance] = await Promise.all([subjectsFor(results, data), attendanceFor(student.id, cls?.academicYear)]);
    return {
        student: toParentStudent(student, cls),
        results: results.map((r) => toParentResult(r, subjects.get(r.subjectId))),
        attendance,
        syncedAt: Date.now(),
        ...(version !== undefined ? { version } : {}),
    };
}

/** What changed for a student since the phone's version, read from the changed documents themselves. */
async function changesFor(studentId: string, feed: Feed, entries: { kind: string; id: string }[], known: Student | null): Promise<ChildChanges> {
    const data = dataSpaceOfStudent(studentId);
    const resultIds = Array.from(new Set(entries.filter((e) => e.kind === "result").map((e) => e.id)));
    const profileChanged = entries.some((e) => e.kind !== "result");
    const [resultDocs, studentDoc] = await Promise.all([
        resultIds.length ? db.getAll(...resultIds.map((id) => db.collection(data.results).doc(id))) : Promise.resolve([]),
        profileChanged && !known ? db.collection(data.students).doc(studentId).get() : Promise.resolve(null),
    ]);
    // Deleted, or moved to another student: either way, gone from this child.
    const kept = resultDocs.filter((d) => d.exists && (d.data() as Result).studentId === studentId).map((d) => d.data() as Result);
    const removedResultIds = resultIds.filter((id) => !kept.some((r) => r.id === id));
    const subjects = await subjectsFor(kept, data);
    const changes: ChildChanges = {
        version: feed.version,
        results: kept.map((r) => toParentResult(r, subjects.get(r.subjectId))),
        removedResultIds,
    };
    const student = known ?? (studentDoc?.exists ? (studentDoc.data() as Student) : null);
    if (profileChanged && student) {
        const cls = (await db.collection(data.classes).doc(student.classId).get()).data() as SchoolClass | undefined;
        changes.student = toParentStudent(student, cls);
        changes.attendance = await attendanceFor(studentId, cls?.academicYear);
    }
    return changes;
}

type Verified = { student: Student } | { error: SyncError };

/** A student by Student ID: the school's records first, then the demo set (app-store review). */
async function studentByCode(code: string): Promise<Student | null> {
    for (const data of [SCHOOL_DATA, DEMO_DATA]) {
        const found = await db.collection(data.students).where("studentCode", "==", code).limit(1).get();
        if (!found.empty) return found.docs[0].data() as Student;
    }
    return null;
}

/** Check a Student ID / mobile pair, with the wrong-attempt limit. */
async function verifyPair(code: string, mobile: string): Promise<Verified> {
    const attempts = await readAttempts(code);
    if (attempts && attempts.failures >= MAX_FAILURES) return { error: "rate-limited" };
    const student = await studentByCode(code);
    // Same answer for an unknown Student ID and a wrong number, so IDs can't be probed.
    if (!student || !mobilesOf(student).includes(mobile)) {
        await recordFailure(code);
        return { error: "mismatch" };
    }
    if (!student.isActive) return { error: "inactive" };
    if (attempts) await db.collection("parentLoginAttempts").doc(code).delete();
    return { student };
}

interface Device {
    studentIds: string[];
    // Last full download per student.
    syncedAt: Record<string, number>;
}

interface ChildOutcome {
    result: ChildSyncResult;
    // Set when the pair was verified or the phone is registered for the student.
    studentId?: string;
    // A full record was sent: note the time on the phone's device record.
    fullDownload?: boolean;
}

/** Apps before 1.0.2: the full record, at most once a day per phone. */
async function legacySync(child: ChildInput, device: Device, now: number): Promise<ChildOutcome> {
    const code = normalizeStudentCode(child?.studentCode);
    const mobile = normalizeMobile(child?.phone);
    if (!code || !mobile) return { result: { ok: false, studentCode: code ?? String(child?.studentCode ?? ""), error: "invalid" } };
    const verified = await verifyPair(code, mobile);
    if ("error" in verified) return { result: { ok: false, studentCode: code, error: verified.error } };
    const student = verified.student;
    // Checked after the pair is verified, and before the expensive part (every result).
    const last = device.syncedAt[student.id];
    if (last && now - last < REFRESH_INTERVAL_MS) {
        return { result: { ok: false, studentCode: code, error: "too-soon", retryAt: last + REFRESH_INTERVAL_MS } };
    }
    const version = (await readFeeds([student.id])).get(student.id)?.version ?? 0;
    return {
        result: { ok: true, studentCode: code, snapshot: await snapshotFor(student, version) },
        studentId: student.id,
        fullDownload: true,
    };
}

/** A check or manual refresh for one child: nothing new, the changes, or the full record. */
async function updateChild(child: ChildInput, mode: Mode, device: Device, now: number): Promise<ChildOutcome> {
    const code = normalizeStudentCode(child?.studentCode);
    const mobile = normalizeMobile(child?.phone);
    if (!code || !mobile) return { result: { ok: false, studentCode: code ?? String(child?.studentCode ?? ""), error: "invalid" } };

    // A check from a phone already registered for this student is trusted, like the
    // pushes it receives. Sign-in and the manual refresh always re-check the pair.
    const claimed = typeof child.studentId === "string" ? child.studentId : "";
    let student: Student | null = null;
    if (!(mode === "check" && claimed && device.studentIds.includes(claimed))) {
        const verified = await verifyPair(code, mobile);
        if ("error" in verified) return { result: { ok: false, studentCode: code, error: verified.error } };
        student = verified.student;
    }
    const studentId = student?.id ?? claimed;

    // Read the feed before any data, so nothing changed meanwhile is skipped.
    const feed = (await readFeeds([studentId])).get(studentId)!;
    const have = typeof child.version === "number" && Number.isInteger(child.version) && child.version >= 0 ? child.version : null;
    const last = device.syncedAt[studentId] ?? 0;
    const dailyRefresh = mode === "refresh" && now - last >= REFRESH_INTERVAL_MS;

    if (have !== null && !dailyRefresh && have <= feed.version) {
        const entries = changesSince(feed, have);
        if (entries && entries.length === 0) {
            return { result: { ok: true, studentCode: code, current: true, version: feed.version }, studentId };
        }
        if (entries) {
            return { result: { ok: true, studentCode: code, changes: await changesFor(studentId, feed, entries, student) }, studentId };
        }
    }

    // The full record: sign-in, the daily manual refresh, the first check after
    // updating the app, or a phone too far behind for the change log.
    if (!dailyRefresh && now - last < CATCH_UP_INTERVAL_MS) {
        return { result: { ok: false, studentCode: code, error: "too-soon", retryAt: last + CATCH_UP_INTERVAL_MS }, studentId };
    }
    if (!student) {
        const doc = await db.collection(dataSpaceOfStudent(studentId).students).doc(studentId).get();
        if (!doc.exists) return { result: { ok: false, studentCode: code, error: "inactive" } };
        student = doc.data() as Student;
    }
    return {
        result: { ok: true, studentCode: code, snapshot: await snapshotFor(student, feed.version) },
        studentId,
        fullDownload: true,
    };
}

/**
 * Sign in a child, check for changes, or refresh by hand (see the top of this
 * file), and register the phone for push updates.
 */
export const parentSync = onCall<ParentSyncInput>({ region: REGION }, async (request) => {
    const children = Array.isArray(request.data?.children) ? request.data.children : [];
    if (children.length === 0 || children.length > MAX_CHILDREN) {
        throw new HttpsError("invalid-argument", `Send between 1 and ${MAX_CHILDREN} children.`);
    }
    const mode = request.data?.mode === "check" || request.data?.mode === "refresh" ? request.data.mode : null;

    const token = typeof request.data?.deviceToken === "string" ? request.data.deviceToken : "";
    const deviceRef = token ? db.collection("parentDevices").doc(deviceDocId(token)) : null;
    const deviceData = deviceRef ? (await deviceRef.get()).data() : undefined;
    const device: Device = {
        studentIds: Array.isArray(deviceData?.studentIds) ? deviceData.studentIds : [],
        syncedAt: (deviceData?.syncedAt ?? {}) as Record<string, number>,
    };
    const now = Date.now();

    const outcomes = await Promise.all(children.map((c) => (mode ? updateChild(c, mode, device, now) : legacySync(c, device, now))));

    // Register the phone for every child it may hold; write only when something is new.
    const studentIds = outcomes.map((o) => o.studentId).filter((id): id is string => !!id);
    const unregistered = studentIds.filter((id) => !device.studentIds.includes(id));
    const downloaded = outcomes.filter((o) => o.fullDownload && o.studentId).map((o) => o.studentId!);
    if (deviceRef && (unregistered.length > 0 || downloaded.length > 0)) {
        await deviceRef.set(
            {
                token,
                studentIds: FieldValue.arrayUnion(...studentIds),
                ...(downloaded.length ? { syncedAt: Object.fromEntries(downloaded.map((id) => [id, now])) } : {}),
                updatedAt: now,
            },
            { merge: true }
        );
    }
    return { children: outcomes.map((o) => o.result), checkedAt: now };
});

export interface ParentUnlinkInput {
    deviceToken: string;
    // Omit to stop all push updates to this phone (sign out of every child).
    studentId?: string;
}

/** Stop sending a child's marks (or all marks) to this phone. */
export const parentUnlink = onCall<ParentUnlinkInput>({ region: REGION }, async (request) => {
    const token = typeof request.data?.deviceToken === "string" ? request.data.deviceToken : "";
    if (!token) throw new HttpsError("invalid-argument", "deviceToken is required.");
    const ref = db.collection("parentDevices").doc(deviceDocId(token));
    const studentId = typeof request.data?.studentId === "string" ? request.data.studentId : "";
    if (studentId) {
        await ref.set(
            {
                studentIds: FieldValue.arrayRemove(studentId),
                // Adding the child back later is a fresh sign-in, not a refresh.
                syncedAt: { [studentId]: FieldValue.delete() },
                updatedAt: Date.now(),
            },
            { merge: true }
        );
    } else {
        await ref.delete();
    }
    return { ok: true };
});
