// Import the real school data: teachers, classes and subjects from the 2026-27
// timetable, students and marks from the four result workbooks.
//
//   npm run school:prepare   build data/student-sections.xlsx to fill in sections
//   npm run school:check     dry run — validate everything, write nothing
//   npm run school:apply     back up, wipe the sample data, then seed (needs --yes)
//
// Inputs live in scripts/data/ (gitignored — student names and phone numbers):
//   data/results/*.xlsx            the four result workbooks (names in EXAMS)
//   data/student-sections.xlsx     from `prepare`, with sections filled in
// See scripts/README.md.

import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";
import { randomInt } from "crypto";

import {
    GRADES,
    SECTIONS,
    SUBJECT_NAMES,
    TEACHERS,
    findSection,
    sectionsOf,
    type GradeLabel,
    type SectionDef,
    type SubjectCode,
} from "./school/timetable";
import { EXAMS, maxMarks, readAllExams, type ExamKey, type SheetSubject } from "./school/workbooks";
import { buildRoster, matchRows, readRosterWorkbook, writeRosterWorkbook, type RosterEntry } from "./school/roster";

const DATA_DIR = path.join(__dirname, "data");
const RESULTS_DIR = path.join(DATA_DIR, "results");
const ROSTER_FILE = path.join(DATA_DIR, "student-sections.xlsx");
const BACKUP_DIR = path.join(DATA_DIR, "backups");
const LOGINS_FILE = path.join(DATA_DIR, "teacher-logins.csv");
const KEY_PATH = path.join(__dirname, "service-account.json");

const ACADEMIC_YEAR = "2026-2027";
const PHONE_EMAIL_DOMAIN = "mahimajyoti.internal";
// The admin login that stays (the one in use). Everything else is replaced.
const KEEP_ADMIN_PHONE = "+919000000001";
const KEEP_ADMIN_NAME = "Principal";
const WIPE_COLLECTIONS = ["attendance", "classes", "results", "students", "subjects", "syllabus", "users"];

// ── plan ──────────────────────────────────────────

interface PlannedStudent {
    entry: RosterEntry;
    section: SectionDef;
}

interface PlannedResult {
    student: PlannedStudent;
    subject: SubjectCode;
    exam: ExamKey;
    marks: number;
    total: number;
}

interface Plan {
    students: PlannedStudent[];
    results: PlannedResult[];
    absent: number;
    leftRows: number;
    errors: string[];
    warnings: string[];
}

function sectionLabel(s: SectionDef) {
    return s.name.replace(/^Class /, "");
}

// The third language a VIII–X student's single "TLS/H" mark belongs to: their
// own choice when the section sheet gives it, else the section's default.
function thirdLanguageOf(entry: RosterEntry, section: SectionDef): SubjectCode | null {
    const offered = (["TLS", "TLH"] as SubjectCode[]).filter((c) => c in section.subjects);
    if (entry.thirdLanguage) {
        const code: SubjectCode = entry.thirdLanguage === "Sanskrit" ? "TLS" : "TLH";
        return offered.includes(code) ? code : null;
    }
    if (section.defaultThirdLanguage) return section.defaultThirdLanguage;
    return offered.length === 1 ? offered[0] : null;
}

async function buildPlan(rosterFile: string): Promise<Plan> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const parsed = await readAllExams(RESULTS_DIR);
    warnings.push(...parsed.warnings);

    if (!fs.existsSync(rosterFile)) {
        throw new Error(`${rosterFile} not found. Run "npm run school:prepare" first.`);
    }
    console.log(`Reading sections from ${rosterFile}`);
    const entries = await readRosterWorkbook(rosterFile);

    // Roster rows
    const ids = new Set<string>();
    const students: PlannedStudent[] = [];
    const missingSection: string[] = [];
    for (const e of entries) {
        if (ids.has(e.id)) errors.push(`Student ID ${e.id} appears twice`);
        ids.add(e.id);
        if (!(e.grade in GRADES)) {
            errors.push(`${e.id} ${e.name}: unknown class "${e.grade}"`);
            continue;
        }
        if (e.section === "LEFT") continue;
        if (!e.section) {
            missingSection.push(`${e.id} ${e.name}`);
            continue;
        }
        const section = findSection(e.grade, e.section);
        if (!section) {
            const valid = sectionsOf(e.grade).map((s) => s.section).join("/");
            errors.push(`${e.id} ${e.name}: Class ${e.grade} has no section ${e.section} (use ${valid} or LEFT)`);
            continue;
        }
        if (["VIII", "IX", "X"].includes(e.grade) && !thirdLanguageOf(e, section)) {
            errors.push(
                e.thirdLanguage
                    ? `${e.id} ${e.name}: ${sectionLabel(section)} doesn't teach ${e.thirdLanguage}`
                    : `${e.id} ${e.name}: ${sectionLabel(section)} has Sanskrit and Hindi — fill in Third language`
            );
            continue;
        }
        students.push({ entry: e, section });
    }
    if (missingSection.length > 0) {
        errors.push(
            `${missingSection.length} student(s) have no Section yet, e.g. ${missingSection.slice(0, 5).join("; ")}`
        );
    }

    // Result rows → students
    const { byRow, errors: matchErrors } = matchRows(parsed.rows, entries);
    errors.push(...matchErrors);
    const plannedById = new Map(students.map((s) => [s.entry.id, s]));

    const results = new Map<string, PlannedResult>();
    let absent = 0;
    let leftRows = 0;
    for (const [row, entry] of byRow) {
        const student = plannedById.get(entry.id);
        if (!student) {
            if (entry.section === "LEFT") leftRows++;
            continue;
        }
        for (const [rawCode, value] of Object.entries(row.marks) as [SheetSubject, number | "absent"][]) {
            const where = `${EXAMS.find((e) => e.key === row.exam)!.label} / ${row.sheet} row ${row.row} (${entry.name})`;
            if (value === "absent") {
                absent++;
                continue;
            }
            const code: SubjectCode | null = rawCode === "TL" ? thirdLanguageOf(entry, student.section) : rawCode;
            if (!code) {
                errors.push(`${where}: third-language mark but no third language for ${sectionLabel(student.section)}`);
                continue;
            }
            if (!(code in student.section.subjects)) {
                errors.push(`${where}: ${SUBJECT_NAMES[code]} isn't a subject of ${sectionLabel(student.section)}`);
                continue;
            }
            const total = maxMarks(row.exam, entry.grade, code);
            if (value < 0 || value > total) {
                errors.push(`${where}: ${SUBJECT_NAMES[code]} mark ${value} is outside 0–${total}`);
                continue;
            }
            const key = `${entry.id}|${code}|${row.exam}`;
            const prev = results.get(key);
            if (prev && prev.marks !== value) {
                errors.push(`${where}: two different ${SUBJECT_NAMES[code]} marks (${prev.marks} and ${value})`);
                continue;
            }
            results.set(key, { student, subject: code, exam: row.exam, marks: value, total });
        }
    }

    // Each sheet's own percentage denominator vs the marking scheme.
    for (const c of parsed.checks) {
        if (c.sheetTotal === null) continue;
        const grade: GradeLabel = EXAMS.find((e) => e.key === c.exam)!.sheets[c.sheet] === "IV&V"
            ? "V"
            : (EXAMS.find((e) => e.key === c.exam)!.sheets[c.sheet] as GradeLabel);
        const expected = c.subjects.reduce((n, s) => n + maxMarks(c.exam, grade, s === "TL" ? "TLS" : s), 0);
        if (expected !== c.sheetTotal) {
            const label = EXAMS.find((e) => e.key === c.exam)!.label;
            warnings.push(
                `${label} / ${c.sheet} (row ${c.headerRow}): sheet divides by ${c.sheetTotal}, marking scheme gives ${expected} — using the scheme`
            );
        }
    }

    return { students, results: Array.from(results.values()), absent, leftRows, errors, warnings };
}

function printPlan(plan: Plan) {
    console.log("\nStudents per section:");
    for (const s of SECTIONS) {
        const n = plan.students.filter((p) => p.section === s).length;
        console.log(`  ${s.name.padEnd(14)} ${String(n).padStart(4)}`);
    }
    console.log(`  ${"Total".padEnd(14)} ${String(plan.students.length).padStart(4)}`);
    console.log("\nResults per exam:");
    for (const e of EXAMS) {
        console.log(`  ${e.label.padEnd(10)} ${String(plan.results.filter((r) => r.exam === e.key).length).padStart(5)}`);
    }
    console.log(`  Absent marks skipped: ${plan.absent}. Rows of students marked LEFT skipped: ${plan.leftRows}.`);
    console.log(`\nTeachers: ${TEACHERS.length}. Classes: ${SECTIONS.length}. Subjects: ${SECTIONS.reduce((n, s) => n + Object.keys(s.subjects).length, 0)}.`);
    if (plan.warnings.length) {
        console.log(`\nWarnings (${plan.warnings.length}):`);
        plan.warnings.forEach((w) => console.log(`  - ${w}`));
    }
    if (plan.errors.length) {
        console.log(`\nErrors (${plan.errors.length}) — fix these before applying:`);
        plan.errors.forEach((e) => console.log(`  ✗ ${e}`));
    } else {
        console.log("\nNo errors.");
    }
}

// ── commands ──────────────────────────────────────

async function prepare(force: boolean) {
    if (fs.existsSync(ROSTER_FILE) && !force) {
        throw new Error(`${ROSTER_FILE} already exists (it may have sections filled in). Use --force to overwrite.`);
    }
    const parsed = await readAllExams(RESULTS_DIR);
    const entries = buildRoster(parsed.rows);
    await writeRosterWorkbook(ROSTER_FILE, entries);
    const flagged = entries.filter((e) => e.note).length;
    console.log(`Wrote ${ROSTER_FILE}`);
    console.log(`${entries.length} students, ${flagged} with a note to check.`);
    parsed.warnings.forEach((w) => console.log(`  - ${w}`));
}

async function check(rosterFile: string) {
    printPlan(await buildPlan(rosterFile));
}

function generatePassword(length = 10): string {
    const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    return Array.from({ length }, () => alphabet[randomInt(alphabet.length)]).join("");
}

function phoneToEmail(phone: string) {
    return `${phone.replace(/\D/g, "")}@${PHONE_EMAIL_DOMAIN}`;
}

class BatchWriter {
    private batch: admin.firestore.WriteBatch;
    private count = 0;
    total = 0;
    constructor(private db: admin.firestore.Firestore) {
        this.batch = db.batch();
    }
    async set(ref: admin.firestore.DocumentReference, data: object) {
        this.batch.set(ref, data);
        await this.bump();
    }
    async delete(ref: admin.firestore.DocumentReference) {
        this.batch.delete(ref);
        await this.bump();
    }
    private async bump() {
        this.count++;
        this.total++;
        if (this.count >= 400) await this.flush();
    }
    async flush() {
        if (this.count === 0) return;
        await this.batch.commit();
        this.batch = this.db.batch();
        this.count = 0;
    }
}

async function apply(rosterFile: string, confirmed: boolean) {
    const plan = await buildPlan(rosterFile);
    printPlan(plan);
    if (plan.errors.length) throw new Error("Not applying: fix the errors above first.");
    if (!confirmed) {
        console.log("\nDry run only. Re-run with --yes to back up, wipe the existing data, and seed.");
        return;
    }
    if (!fs.existsSync(KEY_PATH)) throw new Error(`Missing service account key at ${KEY_PATH}`);
    admin.initializeApp({ credential: admin.credential.cert(KEY_PATH) });
    const db = admin.firestore();
    const auth = admin.auth();

    // The admin login that stays.
    const keep = await auth.getUserByEmail(phoneToEmail(KEEP_ADMIN_PHONE));
    if (keep.customClaims?.role !== "admin") throw new Error(`${KEEP_ADMIN_PHONE} is not an admin login`);

    // 1. Back up everything we're about to delete.
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const backup: Record<string, unknown> = { takenAt: new Date().toISOString() };
    for (const col of WIPE_COLLECTIONS) {
        const snap = await db.collection(col).get();
        backup[col] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
    const authUsers = await auth.listUsers(1000);
    backup.authUsers = authUsers.users.map((u) => ({
        uid: u.uid, email: u.email, displayName: u.displayName, claims: u.customClaims, disabled: u.disabled,
    }));
    const backupFile = path.join(BACKUP_DIR, `before-school-import-${Date.now()}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 1));
    console.log(`\nBacked up current data to ${backupFile}`);

    // 2. Wipe Firestore (keeping the admin's profile) and every other login.
    const writer = new BatchWriter(db);
    for (const col of WIPE_COLLECTIONS) {
        const snap = await db.collection(col).get();
        for (const d of snap.docs) {
            if (col === "users" && d.id === keep.uid) continue;
            await writer.delete(d.ref);
        }
    }
    await writer.flush();
    const otherUids = authUsers.users.map((u) => u.uid).filter((uid) => uid !== keep.uid);
    if (otherUids.length) await auth.deleteUsers(otherUids);
    console.log(`Deleted ${writer.total} documents and ${otherUids.length} logins.`);

    // 3. Admin display name.
    await auth.updateUser(keep.uid, { displayName: KEEP_ADMIN_NAME });
    await db.collection("users").doc(keep.uid).set(
        { uid: keep.uid, phone: KEEP_ADMIN_PHONE, displayName: KEEP_ADMIN_NAME, role: "admin", isActive: true },
        { merge: true }
    );

    // 4. Teacher logins — placeholder phones, one temporary password.
    const password = generatePassword();
    const teacherUid = new Map<string, string>();
    const now = Date.now();
    for (const t of TEACHERS) {
        const rec = await auth.createUser({ email: phoneToEmail(t.phone), password, displayName: t.name });
        await auth.setCustomUserClaims(rec.uid, { role: "teacher" });
        await db.collection("users").doc(rec.uid).set({
            uid: rec.uid, phone: t.phone, displayName: t.name, role: "teacher", isActive: true, createdAt: now,
        });
        teacherUid.set(t.key, rec.uid);
    }
    fs.writeFileSync(
        LOGINS_FILE,
        ["Name,Phone (placeholder),Temporary password", ...TEACHERS.map((t) => `${t.name},${t.phone},${password}`)].join("\n")
    );
    console.log(`Created ${TEACHERS.length} teacher logins (details in ${LOGINS_FILE}).`);

    // 5. Classes, subjects, students, results.
    const classId = new Map<SectionDef, string>();
    const subjectRef = new Map<string, { id: string; teacherId: string | null }>();
    for (const s of SECTIONS) {
        const ref = db.collection("classes").doc();
        classId.set(s, ref.id);
        await writer.set(ref, {
            id: ref.id, name: s.name, grade: GRADES[s.grade], section: s.section,
            academicYear: ACADEMIC_YEAR, classTeacherId: null,
        });
        for (const [code, teacher] of Object.entries(s.subjects) as [SubjectCode, string | null][]) {
            const sref = db.collection("subjects").doc();
            const teacherId = teacher ? teacherUid.get(teacher)! : null;
            subjectRef.set(`${ref.id}|${code}`, { id: sref.id, teacherId });
            await writer.set(sref, {
                id: sref.id, name: SUBJECT_NAMES[code], classId: ref.id, teacherId, academicYear: ACADEMIC_YEAR,
            });
        }
    }

    const studentId = new Map<string, string>();
    for (const p of plan.students) {
        const ref = db.collection("students").doc();
        studentId.set(p.entry.id, ref.id);
        await writer.set(ref, {
            id: ref.id,
            name: p.entry.name,
            parentName: "",
            gender: null,
            rollNo: p.entry.rollNo || null,
            contactNumber: p.entry.phones.map((n) => `+91${n}`).join(", "),
            classId: classId.get(p.section)!,
            admissionYear: "",
            isActive: true,
            createdAt: now,
        });
    }

    for (const r of plan.results) {
        const exam = EXAMS.find((e) => e.key === r.exam)!;
        const cid = classId.get(r.student.section)!;
        const subject = subjectRef.get(`${cid}|${r.subject}`)!;
        const ref = db.collection("results").doc();
        await writer.set(ref, {
            id: ref.id,
            studentId: studentId.get(r.student.entry.id)!,
            subjectId: subject.id,
            classId: cid,
            examType: exam.examType,
            examNumber: exam.examNumber,
            examDate: exam.examDate,
            marksObtained: r.marks,
            totalMarks: r.total,
            academicYear: ACADEMIC_YEAR,
            // "" when the subject has no teacher; the KPIs show these as "Unassigned".
            teacherId: subject.teacherId ?? "",
            // The subject teacher can correct their own marks; otherwise only admins can.
            uploadedBy: subject.teacherId ?? keep.uid,
            createdAt: now,
        });
    }
    await writer.flush();

    console.log(
        `Seeded ${SECTIONS.length} classes, ${subjectRef.size} subjects, ${plan.students.length} students, ${plan.results.length} results.`
    );
    console.log(`\nTeachers sign in with their placeholder phone and the temporary password: ${password}`);
}

async function main() {
    const [command, ...flags] = process.argv.slice(2);
    // --roster <file>: a filled-in section sheet somewhere other than data/student-sections.xlsx.
    const rosterAt = flags.indexOf("--roster");
    const rosterFile = rosterAt >= 0 && flags[rosterAt + 1] ? path.resolve(flags[rosterAt + 1]) : ROSTER_FILE;
    switch (command) {
        case "prepare":
            return prepare(flags.includes("--force"));
        case "check":
            return check(rosterFile);
        case "apply":
            return apply(rosterFile, flags.includes("--yes"));
        default:
            console.log("Usage: ts-node seed-school.ts prepare [--force] | check [--roster <file>] | apply [--roster <file>] [--yes]");
            process.exitCode = 1;
    }
}

main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
});
