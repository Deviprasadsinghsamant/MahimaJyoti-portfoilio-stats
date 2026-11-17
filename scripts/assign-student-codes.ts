// Give every student a permanent Student ID (MJ0001, MJ0002, …) — what parents
// sign in to the app with. Only students without one get a new ID; existing
// IDs never change. Also sets counters/studentCode, which the portal uses to
// number students added later.
//
//   npm run school:codes            dry run — show the IDs that would be given
//   npm run school:codes -- --yes   write them

import * as admin from "firebase-admin";
import * as path from "path";
import type { SchoolClass, Student } from "./types";

const KEY_PATH = path.join(__dirname, "service-account.json");

// Keep in sync with formatStudentCode in mj-web/lib/portal/data.ts.
function formatStudentCode(n: number): string {
    return `MJ${String(n).padStart(4, "0")}`;
}

async function main() {
    const confirmed = process.argv.includes("--yes");
    admin.initializeApp({ credential: admin.credential.cert(KEY_PATH) });
    const db = admin.firestore();
    const [classSnap, studentSnap] = await Promise.all([db.collection("classes").get(), db.collection("students").get()]);
    const classes = new Map(classSnap.docs.map((d) => [d.id, d.data() as SchoolClass]));
    const students = studentSnap.docs.map((d) => d.data() as Student);

    const existing = students.filter((s) => s.studentCode);
    const seen = new Map<string, string>();
    for (const s of existing) {
        if (seen.has(s.studentCode!)) throw new Error(`${s.studentCode} is used by both ${seen.get(s.studentCode!)} and ${s.name}`);
        seen.set(s.studentCode!, s.name);
    }
    const highest = Math.max(0, ...existing.map((s) => Number(s.studentCode!.replace(/\D/g, "")) || 0));

    // Numbered by class (grade, section), then name — easy to hand out class by class.
    const order = (s: Student) => classes.get(s.classId);
    const missing = students
        .filter((s) => !s.studentCode)
        .sort(
            (a, b) =>
                (order(a)?.grade ?? 99) - (order(b)?.grade ?? 99) ||
                (order(a)?.section ?? "").localeCompare(order(b)?.section ?? "") ||
                a.name.localeCompare(b.name)
        );

    let next = highest + 1;
    const assigned = missing.map((s) => ({ student: s, code: formatStudentCode(next++) }));
    console.log(`${existing.length} students already have a Student ID; ${assigned.length} will get one.`);
    for (const { student, code } of assigned.slice(0, 5)) {
        console.log(`  ${code}  ${classes.get(student.classId)?.name ?? "?"}  ${student.name}`);
    }
    if (assigned.length > 5) console.log(`  … ${assigned[assigned.length - 1].code}`);
    console.log(`Next new student will be ${formatStudentCode(next)}.`);

    if (!confirmed) {
        console.log("\nDry run only. Re-run with --yes to write them.");
        return;
    }
    let batch = db.batch();
    let pending = 0;
    for (const { student, code } of assigned) {
        batch.update(db.collection("students").doc(student.id), { studentCode: code });
        if (++pending >= 400) {
            await batch.commit();
            batch = db.batch();
            pending = 0;
        }
    }
    batch.set(db.collection("counters").doc("studentCode"), { next });
    await batch.commit();
    console.log(`\nGave ${assigned.length} students a Student ID.`);
}

main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
});
