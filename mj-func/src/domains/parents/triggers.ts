// Parents Domain — Firestore triggers
// ──────────────────────────────────
// The "webhook" side of the parent app: whenever a result is written, the
// changed result is pushed to every phone signed in to that student, which
// stores it locally. New or changed marks also show a notification. The app
// never polls. Every change is first recorded in the student's change feed
// (feed.ts), whose version travels with the push, so a phone that missed a
// push catches up the next time the app is opened.

import { logger } from "firebase-functions/v2";
import { onDocumentUpdated, onDocumentWritten } from "firebase-functions/v2/firestore";
import { db } from "../../shared/firestore";
import type { ExamType, Result, SchoolClass, Student, Subject } from "../../shared/types";
import { bumpFeed, type FeedKind } from "./feed";
import { toParentResult, toParentStudent } from "./handlers";
import { devicesFor, sendToDevices } from "./push";
import type { PushData } from "./types";

const REGION = "asia-south1";

const EXAM_LABELS: Record<ExamType, string> = {
    baseline: "Baseline",
    "internal-assessment": "Internal Assessment",
    summative: "Summative Assessment",
    "subject-test": "Test",
};

function examLabel(r: Pick<Result, "examType" | "examNumber">): string {
    const label = EXAM_LABELS[r.examType] ?? r.examType;
    return r.examType === "baseline" ? label : `${label} ${r.examNumber}`;
}

function formatMarks(n: number): string {
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/**
 * Record the change in the student's feed — even with no phone signed in now, as
 * a phone whose token changed still holds the child — and return the version
 * for the push. If the feed can't be written the push still goes, unversioned.
 */
async function recordChange(studentId: string, kind: FeedKind, id: string): Promise<{ v?: string }> {
    try {
        return { v: String(await bumpFeed(studentId, kind, id)) };
    } catch (err) {
        logger.error("parent feed update failed", { studentId, kind, id, err });
        return {};
    }
}

/** Push every created, corrected, moved or deleted result to the student's parents. */
export const pushResultToParents = onDocumentWritten({ document: "results/{resultId}", region: REGION }, async (event) => {
    const before = event.data?.before.exists ? (event.data.before.data() as Result) : undefined;
    const after = event.data?.after.exists ? (event.data.after.data() as Result) : undefined;
    const studentId = after?.studentId ?? before?.studentId;
    if (!studentId) return;
    const resultId = event.params.resultId;

    // Re-filed under another student: gone from the old one's phones.
    if (before && after && before.studentId !== after.studentId) {
        const moved = await recordChange(before.studentId, "result", resultId);
        const oldDevices = await devicesFor(before.studentId);
        if (oldDevices.length) await sendToDevices(oldDevices, { ...moved, kind: "result-deleted", studentId: before.studentId, resultId });
    }

    const version = await recordChange(studentId, "result", resultId);
    const devices = await devicesFor(studentId);
    if (devices.length === 0) return;

    if (!after) {
        await sendToDevices(devices, { ...version, kind: "result-deleted", studentId, resultId });
        return;
    }

    const subject = (await db.collection("subjects").doc(after.subjectId).get()).data() as Subject | undefined;
    const result = toParentResult(after, subject);
    const data: PushData = { ...version, kind: "result", studentId, result: JSON.stringify(result) };

    // A section move re-files marks under another subject without changing them: update quietly.
    const marksChanged =
        !before ||
        before.studentId !== after.studentId ||
        before.marksObtained !== after.marksObtained ||
        before.totalMarks !== after.totalMarks;
    if (!marksChanged) {
        await sendToDevices(devices, data);
        return;
    }
    const student = (await db.collection("students").doc(studentId).get()).data() as Student | undefined;
    const firstName = student?.name.split(" ")[0] ?? "your child";
    // "Mathematics · Internal Assessment 2 — 41/50", or for a subject test "Mathematics Test 3 — 18/20".
    const exam =
        after.examType === "subject-test"
            ? `${result.subjectName} ${examLabel(after)}`
            : `${result.subjectName} · ${examLabel(after)}`;
    await sendToDevices(devices, data, {
        title: `New marks for ${firstName}`,
        body: `${exam} — ${formatMarks(after.marksObtained)}/${formatMarks(after.totalMarks)}`,
    });
});

/** Keep the app's student profile current: name, Student ID, class (e.g. after a section move). */
export const pushStudentToParents = onDocumentUpdated({ document: "students/{studentId}", region: REGION }, async (event) => {
    const before = event.data?.before.data() as Student | undefined;
    const after = event.data?.after.data() as Student | undefined;
    if (!before || !after) return;
    const changed =
        before.name !== after.name ||
        before.classId !== after.classId ||
        before.studentCode !== after.studentCode ||
        before.isActive !== after.isActive;
    if (!changed) return;

    const version = await recordChange(after.id, "student", "");
    const devices = await devicesFor(after.id);
    if (devices.length === 0) return;
    const cls = (await db.collection("classes").doc(after.classId).get()).data() as SchoolClass | undefined;
    await sendToDevices(devices, {
        ...version,
        kind: "student",
        studentId: after.id,
        student: JSON.stringify(toParentStudent(after, cls)),
    });
});
