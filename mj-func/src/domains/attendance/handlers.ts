// Attendance Domain — Cloud Function Handlers
// ───────────────────────────────────────────
// Every attendance register is saved here, from the website and the app, so the
// rules live in one place:
//   • only a class's class teacher (or an admin — the principal) marks it;
//   • a class teacher takes each day's register once — today's, or one of the
//     two days before if it was missed — and once finalised it's locked: only
//     the principal can correct it;
//   • the whole register arrives in one call, after the teacher has marked
//     everyone — never one write per student.
// The same call keeps each student's attendance summary current and pushes the
// day's mark to their parents' phones (with a notification when absent), so
// neither parents nor teachers ever read registers one by one.

import { FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { requirePortalUser } from "../../shared/callableAuth";
import { dataSpace, dataSpaceOfStudent } from "../../shared/dataSpace";
import { addDays, dayPhrase, isIsoDate, istToday } from "../../shared/dates";
import { db } from "../../shared/firestore";
import type { Attendance, AttendanceMark, AttendanceRecord, SchoolClass, Student } from "../../shared/types";
import { asFeed, feedRef, nextFeed } from "../parents/feed";
import { devicesForAny, send, studentIdsOf, type Push } from "../parents/push";
import type { PushData } from "../parents/types";
import { summaryRef } from "./summary";

const REGION = "asia-south1";

// A class teacher can take today's register, or a missed one up to this many days back.
export const TEACHER_MARK_DAYS_BACK = 2;
const MAX_RECORDS = 200;

export interface SaveAttendanceInput {
    classId: string;
    date: string;
    // Every student on the register, present or absent.
    records: AttendanceRecord[];
    // updatedAt of the register the marker started from, or null for a new one.
    baseUpdatedAt: number | null;
}

export type SaveAttendanceResult =
    | { status: "saved"; register: Attendance }
    // Someone else saved this register after the marker opened it. Nothing was
    // written; the marker gets the newer register to check and save again.
    | { status: "conflict"; register: Attendance }
    // A teacher tried to change a finalised register. Nothing was written; only
    // the principal can correct it. `register` is the finalised one.
    | { status: "locked"; register: Attendance };

interface Change {
    studentId: string;
    // "" when the student is no longer on the register (moved to another section).
    mark: AttendanceMark | "";
    was: AttendanceMark | undefined;
}

export function registerId(classId: string, date: string): string {
    return `${classId}_${date}`;
}

function toMark(status: AttendanceRecord["status"]): AttendanceMark {
    return status === "absent" ? "A" : "P";
}

function parseRecords(raw: unknown): AttendanceRecord[] {
    if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_RECORDS) {
        throw new HttpsError("invalid-argument", `Send between 1 and ${MAX_RECORDS} students.`);
    }
    const seen = new Set<string>();
    return raw.map((r) => {
        const studentId = typeof r?.studentId === "string" ? r.studentId : "";
        const status = r?.status;
        if (!studentId || seen.has(studentId) || (status !== "present" && status !== "absent")) {
            throw new HttpsError("invalid-argument", "Each student must appear once, as present or absent.");
        }
        seen.add(studentId);
        return { studentId, status };
    });
}

function diff(previous: AttendanceRecord[], next: AttendanceRecord[]): Change[] {
    const before = new Map(previous.map((r) => [r.studentId, toMark(r.status)]));
    const changes: Change[] = [];
    for (const r of next) {
        const mark = toMark(r.status);
        const was = before.get(r.studentId);
        if (mark !== was) changes.push({ studentId: r.studentId, mark, was });
        before.delete(r.studentId);
    }
    for (const [studentId, was] of before) changes.push({ studentId, mark: "", was });
    return changes;
}

async function firstNames(studentIds: string[]): Promise<Map<string, string>> {
    if (studentIds.length === 0) return new Map();
    const docs = await db.getAll(...studentIds.map((id) => db.collection(dataSpaceOfStudent(id).students).doc(id)));
    return new Map(
        docs.filter((d) => d.exists).map((d) => [d.id, (d.data() as Student).name.split(" ")[0]])
    );
}

/** Push each changed mark to the student's parents; absences (and corrections of them) also notify. */
async function notifyParents(cls: SchoolClass, date: string, changes: Change[], versions: Map<string, number>): Promise<void> {
    if (changes.length === 0) return;
    const devices = await devicesForAny(changes.map((c) => c.studentId));
    if (devices.length === 0) return;

    const byStudent = new Map(changes.map((c) => [c.studentId, c]));
    const signedIn = new Set(devices.flatMap(studentIdsOf));
    const notifies = (c: Change) => c.mark === "A" || (c.mark === "P" && c.was === "A");
    // Names only for the children whose parents get a notification.
    const names = await firstNames(changes.filter((c) => notifies(c) && signedIn.has(c.studentId)).map((c) => c.studentId));
    const when = dayPhrase(date);

    const pushes: Push[] = [];
    for (const device of devices) {
        for (const studentId of studentIdsOf(device)) {
            const change = byStudent.get(studentId);
            if (!change) continue;
            const v = versions.get(studentId);
            const data: PushData = {
                ...(v !== undefined ? { v: String(v) } : {}),
                kind: "attendance",
                studentId,
                academicYear: cls.academicYear,
                date,
                mark: change.mark,
            };
            if (!notifies(change)) {
                pushes.push({ device, data });
                continue;
            }
            const name = names.get(studentId) ?? "Your child";
            pushes.push({
                device,
                data,
                // A correction replaces the absence notification instead of adding another.
                tag: `attendance-${studentId}-${date}`,
                notification:
                    change.mark === "A"
                        ? { title: `${name} was absent ${when}`, body: `Marked absent in the ${cls.name} register.` }
                        : { title: `Correction: ${name} was present ${when}`, body: `The ${cls.name} register was corrected.` },
            });
        }
    }
    await send(pushes);
}

/** Save a class's whole register for one day. */
export const saveAttendance = onCall<SaveAttendanceInput>({ region: REGION }, async (request): Promise<SaveAttendanceResult> => {
    const me = requirePortalUser(request);
    const classId = typeof request.data?.classId === "string" ? request.data.classId : "";
    const date = request.data?.date;
    if (!classId || !isIsoDate(date)) {
        throw new HttpsError("invalid-argument", "Pick a class and a date.");
    }
    const records = parseRecords(request.data?.records);
    const baseUpdatedAt = typeof request.data?.baseUpdatedAt === "number" ? request.data.baseUpdatedAt : null;

    const today = istToday();
    if (date > today) {
        throw new HttpsError("invalid-argument", "Attendance can't be marked for a future date.");
    }
    if (me.role !== "admin" && date < addDays(today, -TEACHER_MARK_DAYS_BACK)) {
        throw new HttpsError(
            "permission-denied",
            `Class teachers can take the register for today and the ${TEACHER_MARK_DAYS_BACK} days before. Ask the principal for older days.`
        );
    }

    // The demo login (app-store review) keeps its registers in the demo set (shared/dataSpace.ts).
    const data = dataSpace(me.demo);
    const classDoc = await db.collection(data.classes).doc(classId).get();
    if (!classDoc.exists) {
        throw new HttpsError("not-found", "That class no longer exists.");
    }
    const cls = classDoc.data() as SchoolClass;
    if (me.role !== "admin" && cls.classTeacherId !== me.uid) {
        throw new HttpsError("permission-denied", `Only the class teacher of ${cls.name} can mark its attendance.`);
    }

    const ref = db.collection(data.attendance).doc(registerId(classId, date));
    type Outcome =
        | { register: Attendance; changes: Change[]; versions: Map<string, number> }
        | { refused: "conflict" | "locked"; register: Attendance };
    const outcome = await db.runTransaction(async (tx): Promise<Outcome> => {
        const snap = await tx.get(ref);
        const previous = snap.exists ? ({ updatedAt: 0, ...snap.data() } as Attendance) : null;
        const changes = diff(previous?.records ?? [], records);
        // A resend after a lost connection, or a save with nothing changed: nothing to write.
        if (previous && changes.length === 0) return { register: previous, changes, versions: new Map() };
        // Finalised registers are corrected by the principal only.
        if (previous && me.role !== "admin") return { refused: "locked", register: previous };
        if (previous && previous.updatedAt !== baseUpdatedAt) return { refused: "conflict", register: previous };
        // Each changed student's parent feed (feed.ts), read before any write.
        const feeds = changes.length ? await tx.getAll(...changes.map((c) => feedRef(c.studentId))) : [];

        const now = Date.now();
        const register: Attendance = {
            id: ref.id,
            classId,
            date,
            academicYear: cls.academicYear,
            records,
            markedBy: me.uid,
            markedByName: me.name,
            markedByRole: me.role,
            createdAt: previous?.createdAt ?? now,
            updatedAt: now,
        };
        tx.set(ref, register);
        const versions = new Map<string, number>();
        changes.forEach((c, i) => {
            tx.set(
                summaryRef(c.studentId, cls.academicYear),
                {
                    studentId: c.studentId,
                    academicYear: cls.academicYear,
                    days: { [date]: c.mark || FieldValue.delete() },
                    updatedAt: now,
                },
                { merge: true }
            );
            const feed = nextFeed(asFeed(feeds[i].data()), [{ kind: "attendance", id: date }], now);
            tx.set(feeds[i].ref, feed);
            versions.set(c.studentId, feed.version);
        });
        return { register, changes, versions };
    });

    if ("refused" in outcome) return { status: outcome.refused, register: outcome.register };
    // The register is saved either way; a missed push is caught up the next time the parent opens the app.
    await notifyParents(cls, date, outcome.changes, outcome.versions).catch((err) => logger.error("attendance push failed", err));
    return { status: "saved", register: outcome.register };
});
