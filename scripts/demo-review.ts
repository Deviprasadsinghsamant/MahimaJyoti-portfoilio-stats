// Demo data for app-store reviewers. Google Play needs working logins, and they
// must never see a real child — and nobody at school should ever see the demo:
//   • the demo parent: Student ID MJ9001 with a dummy mobile number, a year of
//     marks and a month of attendance, in "Class Demo";
//   • the demo teacher: a login (phone 6000000001) whose token carries a `demo`
//     claim, class teacher of Class Demo.
//
// Everything lives in its own demo* collections (demoClasses, demoStudents, …),
// never in the school's. The website and the real app only read the school's
// collections, so the demo appears nowhere real; only the Cloud Functions that
// serve the demo logins read the demo set (mj-func/src/shared/dataSpace.ts).
// The teacher login has no profile in `users`, so it isn't in Staff & Teachers.
//
//   npm run demo:review                      dry run — show what would happen
//   npm run demo:review -- --yes             create or update it (safe to repeat)
//   npm run demo:review -- --password        set the demo teacher's password
//                                            (you type it; it isn't shown or stored)
//   npm run demo:review -- --remove --yes    delete all of it

import * as admin from "firebase-admin";
import * as path from "path";
import * as readline from "readline";
import type { SchoolClass, Student } from "./types";

const KEY_PATH = path.join(__dirname, "service-account.json");

// Keep in sync with DEMO_DATA and DEMO_ID_PREFIX in mj-func/src/shared/dataSpace.ts.
const DEMO = {
    classes: "demoClasses",
    subjects: "demoSubjects",
    students: "demoStudents",
    results: "demoResults",
    attendance: "demoAttendance",
    attendanceSummary: "demoAttendanceSummary",
};
const ID_PREFIX = "demo-review-";

// Dummy numbers outside the 90000000xx range the imported teacher logins use.
const TEACHER_PHONE = "+916000000001";
const PARENT_MOBILE = "6000000002";
const STUDENT_CODE = "MJ9001";
const PHONE_EMAIL_DOMAIN = "mahimajyoti.internal"; // as in mj-func/src/domains/staff/handlers.ts
const MIN_PASSWORD_LENGTH = 8;

const CLASS_ID = `${ID_PREFIX}class`;
const STUDENT_ID = `${ID_PREFIX}student`;
const TEACHER_UID = `${ID_PREFIX}teacher`;
const TEACHER_NAME = "Demo Teacher";
const CLASS_NAME = "Class Demo";

// Where an earlier version of this script put the demo, inside the school's collections.
const OLD_CLASS_ID = "demo-review";

const SUBJECTS: { slug: string; name: string; level: number }[] = [
    { slug: "odia", name: "Odia", level: 0.82 },
    { slug: "english", name: "English", level: 0.74 },
    { slug: "mathematics", name: "Mathematics", level: 0.91 },
    { slug: "science", name: "Science", level: 0.68 },
    { slug: "social-science", name: "Social Science", level: 0.57 },
];

// The school's exams this year (dates and totals as in the real results).
const EXAMS: { key: string; type: string; number: number; date: string; total: number; trend: number; only?: string }[] = [
    { key: "baseline-1", type: "baseline", number: 1, date: "2026-04-15", total: 25, trend: 0.9 },
    { key: "ia-1", type: "internal-assessment", number: 1, date: "2026-07-15", total: 25, trend: 0.95 },
    { key: "ia-2", type: "internal-assessment", number: 2, date: "2026-08-20", total: 50, trend: 0.98 },
    { key: "sa-1", type: "summative", number: 1, date: "2026-09-25", total: 100, trend: 1.02 },
    { key: "test-maths-1", type: "subject-test", number: 1, date: "2026-10-10", total: 20, trend: 1.0, only: "mathematics" },
    { key: "test-science-1", type: "subject-test", number: 1, date: "2026-10-17", total: 20, trend: 1.05, only: "science" },
];

const subjectId = (slug: string) => `${ID_PREFIX}${slug}`;
const teacherEmail = () => `${TEACHER_PHONE.replace(/\D/g, "")}@${PHONE_EMAIL_DOMAIN}`;

function mobilesOf(contact: string | undefined): string[] {
    return (contact ?? "")
        .split(/[,/;]/)
        .map((n) => {
            let d = n.replace(/\D/g, "");
            if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
            if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
            return d;
        })
        .filter((d) => d.length === 10);
}

/** School days (Mon–Sat) from 30 to 3 days ago — leaving the days a class teacher can still mark open. */
function pastSchoolDays(): string[] {
    const days: string[] = [];
    const now = new Date();
    for (let back = 30; back >= 3; back--) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - back));
        if (d.getUTCDay() !== 0) days.push(d.toISOString().slice(0, 10));
    }
    return days;
}

/** Ask for a secret in the terminal without echoing it. */
function askHidden(question: string): Promise<string> {
    return new Promise((resolve) => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
        const out = rl as unknown as { _writeToOutput: (s: string) => void };
        let asked = false;
        out._writeToOutput = (s: string) => {
            if (!asked) {
                process.stdout.write(s);
                asked = true;
            } else if (!s.includes("\n") && !s.includes("\r")) {
                process.stdout.write("*".repeat(s.length));
            }
        };
        rl.question(question, (answer) => {
            rl.close();
            process.stdout.write("\n");
            resolve(answer);
        });
    });
}

type Db = admin.firestore.Firestore;

async function deleteAll(db: Db, refs: admin.firestore.DocumentReference[]): Promise<void> {
    for (let i = 0; i < refs.length; i += 400) {
        const batch = db.batch();
        refs.slice(i, i + 400).forEach((r) => batch.delete(r));
        await batch.commit();
    }
}

/** Anything of the demo still sitting in the school's own collections (from the first version). */
async function demoInSchoolData(db: Db): Promise<admin.firestore.DocumentReference[]> {
    const [results, registers, summaries] = await Promise.all([
        db.collection("results").where("classId", "==", OLD_CLASS_ID).get(),
        db.collection("attendance").where("classId", "==", OLD_CLASS_ID).get(),
        db.collection("attendanceSummary").where("studentId", "==", STUDENT_ID).get(),
    ]);
    const singles = [
        db.collection("classes").doc(OLD_CLASS_ID),
        db.collection("students").doc(STUDENT_ID),
        db.collection("users").doc(TEACHER_UID),
        ...SUBJECTS.map((s) => db.collection("subjects").doc(`${OLD_CLASS_ID}-${s.slug}`)),
    ];
    const existing = (await db.getAll(...singles)).filter((d) => d.exists).map((d) => d.ref);
    return [...results.docs.map((d) => d.ref), ...registers.docs.map((d) => d.ref), ...summaries.docs.map((d) => d.ref), ...existing];
}

async function setPassword(auth: admin.auth.Auth): Promise<void> {
    const user = await auth.getUser(TEACHER_UID).catch(() => null);
    if (!user) throw new Error("The demo teacher login doesn't exist yet — run with --yes first.");
    if (!process.stdin.isTTY) throw new Error("Run this in a terminal so the password can be typed in privately.");
    const first = await askHidden(`New password for ${TEACHER_NAME} (phone ${TEACHER_PHONE.slice(3)}): `);
    if (first.length < MIN_PASSWORD_LENGTH) throw new Error(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
    const again = await askHidden("Type it again: ");
    if (again !== first) throw new Error("The two didn't match — nothing changed.");
    await auth.updateUser(TEACHER_UID, { password: first });
    await auth.revokeRefreshTokens(TEACHER_UID);
    console.log("Password set. Enter it in Play Console → App content → App access.");
}

async function main() {
    const write = process.argv.includes("--yes");
    const remove = process.argv.includes("--remove");
    admin.initializeApp({ credential: admin.credential.cert(KEY_PATH) });
    const db = admin.firestore();
    const auth = admin.auth();

    if (process.argv.includes("--password")) return setPassword(auth);

    // ── clashes with the school's data ───────────────
    const [classSnap, studentSnap, userSnap] = await Promise.all([
        db.collection("classes").get(),
        db.collection("students").get(),
        db.collection("users").get(),
    ]);
    const problems: string[] = [];
    studentSnap.docs
        .map((d) => d.data() as Student)
        .filter((s) => s.id !== STUDENT_ID)
        .forEach((s) => {
            if (s.studentCode === STUDENT_CODE) problems.push(`Student ID ${STUDENT_CODE} already belongs to ${s.name}.`);
            if (mobilesOf(s.contactNumber).includes(PARENT_MOBILE)) problems.push(`${PARENT_MOBILE} is on ${s.name}'s record.`);
            if (s.id.startsWith(ID_PREFIX)) problems.push(`Student ${s.name} has an id starting "${ID_PREFIX}".`);
        });
    classSnap.docs
        .filter((d) => d.id !== OLD_CLASS_ID && d.id.startsWith(ID_PREFIX))
        .forEach((d) => problems.push(`Class ${d.data().name} has an id starting "${ID_PREFIX}".`));
    userSnap.docs
        .filter((d) => d.id !== TEACHER_UID && d.data().phone === TEACHER_PHONE)
        .forEach((d) => problems.push(`${TEACHER_PHONE} is already the login of ${d.data().displayName}.`));
    const byEmail = await auth.getUserByEmail(teacherEmail()).catch(() => null);
    if (byEmail && byEmail.uid !== TEACHER_UID) problems.push(`${TEACHER_PHONE} already has a login (uid ${byEmail.uid}).`);
    if (problems.length) {
        console.error("Stopped — these would clash with the school's data:\n  " + problems.join("\n  "));
        process.exit(1);
    }

    const realClasses = classSnap.docs.map((d) => d.data() as SchoolClass).filter((c) => c.id !== OLD_CLASS_ID);
    const academicYear = realClasses.map((c) => c.academicYear).sort().pop() ?? "2026-2027";
    const leftovers = await demoInSchoolData(db);

    if (remove) {
        const demoDocs = (
            await Promise.all(Object.values(DEMO).map((name) => db.collection(name).listDocuments()))
        ).flat();
        const all = [...leftovers, ...demoDocs, db.collection("parentFeeds").doc(STUDENT_ID)];
        console.log(`Would delete ${all.length} documents and the ${TEACHER_NAME} login.`);
        if (!write) return console.log("Dry run — add --yes to delete.");
        await deleteAll(db, all);
        await auth.deleteUser(TEACHER_UID).catch(() => undefined);
        return console.log("Demo data removed.");
    }

    // ── what to write (demo collections only) ─────────
    const now = Date.now();
    const cls: SchoolClass = {
        id: CLASS_ID,
        name: CLASS_NAME,
        grade: 9,
        section: "DEMO",
        academicYear,
        classTeacherId: TEACHER_UID,
    };
    const subjects = SUBJECTS.map((s) => ({
        id: subjectId(s.slug),
        name: s.name,
        classId: CLASS_ID,
        teacherId: TEACHER_UID,
        academicYear,
    }));
    const student: Student = {
        id: STUDENT_ID,
        studentCode: STUDENT_CODE,
        name: "Demo Student",
        parentName: "Demo Parent",
        gender: null,
        rollNo: "1",
        contactNumber: `+91${PARENT_MOBILE}`,
        classId: CLASS_ID,
        admissionYear: academicYear.slice(0, 4),
        isActive: true,
        createdAt: now,
    };
    const results = EXAMS.flatMap((exam) =>
        SUBJECTS.filter((s) => !exam.only || exam.only === s.slug).map((s) => ({
            id: `${ID_PREFIX}${exam.key}-${s.slug}`,
            studentId: STUDENT_ID,
            subjectId: subjectId(s.slug),
            classId: CLASS_ID,
            examType: exam.type,
            examNumber: exam.number,
            examDate: exam.date,
            marksObtained: Math.min(exam.total, Math.round(exam.total * s.level * exam.trend)),
            totalMarks: exam.total,
            academicYear,
            teacherId: TEACHER_UID,
            uploadedBy: TEACHER_UID,
            createdAt: now,
        }))
    );
    const days = pastSchoolDays();
    const absentDay = days[Math.floor(days.length / 2)];
    const registers = days.map((date) => ({
        id: `${CLASS_ID}_${date}`,
        classId: CLASS_ID,
        date,
        academicYear,
        records: [{ studentId: STUDENT_ID, status: date === absentDay ? "absent" : "present" }],
        markedBy: TEACHER_UID,
        markedByName: TEACHER_NAME,
        markedByRole: "teacher",
        createdAt: now,
        updatedAt: now,
    }));
    const summary = {
        studentId: STUDENT_ID,
        academicYear,
        days: Object.fromEntries(days.map((d) => [d, d === absentDay ? "A" : "P"])),
        updatedAt: now,
    };

    console.log(`Class:    ${cls.name} (${academicYear}), subjects: ${subjects.map((s) => s.name).join(", ")}`);
    console.log(`Student:  ${student.name}, Student ID ${STUDENT_CODE}, parent mobile ${PARENT_MOBILE}`);
    console.log(`Marks:    ${results.length} results over ${EXAMS.length} exams`);
    console.log(`Register: ${days.length} past school days (${days[0]} → ${days[days.length - 1]}), absent on ${absentDay}`);
    console.log(`Teacher:  ${TEACHER_NAME}, login phone ${TEACHER_PHONE.slice(3)} (password: set with --password)`);
    console.log(`Stored in: ${Object.values(DEMO).join(", ")} — none of the school's collections.`);
    if (leftovers.length) console.log(`Cleanup:  ${leftovers.length} demo documents to remove from the school's collections.`);
    if (!write) return console.log("\nDry run — add --yes to write.");

    // ── teacher login: Auth only, no staff profile ────
    const existing = await auth.getUser(TEACHER_UID).catch(() => null);
    if (!existing) {
        await auth.createUser({ uid: TEACHER_UID, email: teacherEmail(), displayName: TEACHER_NAME });
    } else if (existing.email !== teacherEmail() || existing.displayName !== TEACHER_NAME) {
        await auth.updateUser(TEACHER_UID, { email: teacherEmail(), displayName: TEACHER_NAME });
    }
    await auth.setCustomUserClaims(TEACHER_UID, { role: "teacher", demo: true });

    // ── the demo set ──────────────────────────────────
    const batch = db.batch();
    batch.set(db.collection(DEMO.classes).doc(CLASS_ID), cls);
    subjects.forEach((s) => batch.set(db.collection(DEMO.subjects).doc(s.id), s));
    batch.set(db.collection(DEMO.students).doc(STUDENT_ID), student);
    results.forEach((r) => batch.set(db.collection(DEMO.results).doc(r.id), r));
    registers.forEach((r) => batch.set(db.collection(DEMO.attendance).doc(r.id), r));
    batch.set(db.collection(DEMO.attendanceSummary).doc(`${STUDENT_ID}_${academicYear}`), summary);
    await batch.commit();

    // ── out of the school's collections ───────────────
    if (leftovers.length) {
        await deleteAll(db, leftovers);
        console.log(`Removed ${leftovers.length} demo documents from the school's collections.`);
    }
    console.log("\nDone. Next: npm run demo:review -- --password   (type the demo teacher's password)");
}

main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
});
