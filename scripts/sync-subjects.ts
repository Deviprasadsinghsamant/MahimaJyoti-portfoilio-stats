// Add any subject from the timetable (school/timetable.ts) that a class in
// Firestore doesn't have yet, with its timetable teacher. Never removes or
// changes existing subjects, so marks and teacher changes made in the portal
// are left alone.
//
//   npm run school:subjects             dry run — list what would be added
//   npm run school:subjects -- --yes    add them

import * as admin from "firebase-admin";
import * as path from "path";

import { GRADES, SECTIONS, SUBJECT_NAMES, TEACHERS, type SubjectCode } from "./school/timetable";
import type { SchoolClass, Subject } from "./types";

const KEY_PATH = path.join(__dirname, "service-account.json");

async function main() {
    const confirmed = process.argv.includes("--yes");
    admin.initializeApp({ credential: admin.credential.cert(KEY_PATH) });
    const db = admin.firestore();
    const [classSnap, subjectSnap, userSnap] = await Promise.all([
        db.collection("classes").get(),
        db.collection("subjects").get(),
        db.collection("users").get(),
    ]);
    const classes = classSnap.docs.map((d) => d.data() as SchoolClass);
    const subjects = subjectSnap.docs.map((d) => d.data() as Subject);
    const uidByName = new Map(userSnap.docs.map((d) => [String(d.data().displayName), d.id]));

    const toAdd: Subject[] = [];
    const errors: string[] = [];
    for (const def of SECTIONS) {
        const cls = classes.find((c) => c.grade === GRADES[def.grade] && c.section === def.section);
        if (!cls) {
            errors.push(`${def.name}: class not in Firestore`);
            continue;
        }
        for (const [code, teacherKey] of Object.entries(def.subjects) as [SubjectCode, string | null][]) {
            const name = SUBJECT_NAMES[code];
            if (subjects.some((s) => s.classId === cls.id && s.name.trim().toLowerCase() === name.toLowerCase())) continue;
            let teacherId: string | null = null;
            if (teacherKey) {
                const teacherName = TEACHERS.find((t) => t.key === teacherKey)!.name;
                teacherId = uidByName.get(teacherName) ?? null;
                if (!teacherId) errors.push(`${def.name} ${name}: no portal login named "${teacherName}"`);
            }
            const ref = db.collection("subjects").doc();
            toAdd.push({ id: ref.id, name, classId: cls.id, teacherId, academicYear: cls.academicYear });
        }
    }

    const nameOf = new Map([...uidByName].map(([n, uid]) => [uid, n]));
    console.log(toAdd.length ? "Subjects to add:" : "Every timetable subject already exists.");
    for (const s of toAdd) {
        const cls = classes.find((c) => c.id === s.classId)!;
        console.log(`  ${cls.name.padEnd(14)} ${s.name.padEnd(18)} ${s.teacherId ? nameOf.get(s.teacherId) : "(no teacher)"}`);
    }
    if (errors.length) {
        errors.forEach((e) => console.log(`  ✗ ${e}`));
        process.exitCode = 1;
        return;
    }
    if (!confirmed || toAdd.length === 0) {
        if (toAdd.length) console.log("\nDry run only. Re-run with --yes to add them.");
        return;
    }
    const batch = db.batch();
    toAdd.forEach((s) => batch.set(db.collection("subjects").doc(s.id), s));
    await batch.commit();
    console.log(`\nAdded ${toAdd.length} subjects.`);
}

main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
});
