// Put students into their real sections, from the school's section list.
//
//   npm run school:sections                      dry run — show every move, write nothing
//   npm run school:sections -- --yes             back up, then move
//   npm run school:sections -- --file <xlsx>     a list other than data/sections.xlsx
//
// The list is a sheet named "NAME & SECTION" with one table per class, side by
// side: a "CLASS - VIII" title above "NAME OF STUDENT" and "SECTION" columns.
//
// Moving a student also moves their marks recorded in their current class to
// the new section's subject of the same name, so a student keeps their own
// third language. (Only if a section offered just one of Sanskrit / Hindi would
// marks switch to it.) Everything else — teachers, logins, other students — is
// left alone.

import * as admin from "firebase-admin";
import ExcelJS from "exceljs";
import * as fs from "fs";
import * as path from "path";

import { GRADES, type GradeLabel } from "./school/timetable";
import { cleanName } from "./school/workbooks";
import { nameKey, readRosterWorkbook } from "./school/roster";
import type { Result, SchoolClass, Student, Subject } from "./types";

const DATA_DIR = path.join(__dirname, "data");
const DEFAULT_FILE = path.join(DATA_DIR, "sections.xlsx");
const ROSTER_FILE = path.join(DATA_DIR, "student-sections.xlsx");
const BACKUP_DIR = path.join(DATA_DIR, "backups");
const KEY_PATH = path.join(__dirname, "service-account.json");
const LIST_SHEET = "NAME & SECTION";
const ADMIN_EMAIL = "919000000001@mahimajyoti.internal";
const THIRD_LANGUAGES = ["sanskrit", "hindi"];

const GRADE_BY_NUMBER = new Map(Object.entries(GRADES).map(([label, n]) => [n, label as GradeLabel]));

interface ListedStudent {
    group: string; // "VIII", or "IV & V" for the shared table
    name: string;
    section: string;
    row: number;
}

function cellText(v: ExcelJS.CellValue): string {
    if (v === null || v === undefined) return "";
    if (typeof v === "object" && "richText" in v) return v.richText.map((t) => t.text).join("");
    if (typeof v === "object" && "result" in v) return String(v.result ?? "");
    return String(v);
}

async function readList(file: string): Promise<ListedStudent[]> {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(file);
    const ws = wb.getWorksheet(LIST_SHEET);
    if (!ws) throw new Error(`${file}: no sheet named "${LIST_SHEET}"`);

    // The title row: "CLASS - VI", "CLASS - VII", … each starting a table.
    let titleRow = 0;
    const blocks: { col: number; group: string }[] = [];
    ws.eachRow((row, r) => {
        if (titleRow) return;
        row.eachCell((cell, c) => {
            const m = cellText(cell.value).match(/CLASS\s*-\s*(.+)$/i);
            if (m && cell.address === cell.master.address) blocks.push({ col: c, group: m[1].replace(/\s+/g, " ").trim().toUpperCase() });
        });
        if (blocks.length) titleRow = r;
    });
    if (!titleRow) throw new Error(`${LIST_SHEET}: no "CLASS - …" titles found`);

    const header = ws.getRow(titleRow + 1);
    const listed: ListedStudent[] = [];
    blocks.forEach((block, i) => {
        const end = blocks[i + 1]?.col ?? ws.columnCount + 1;
        let nameCol = 0;
        let sectionCol = 0;
        for (let c = block.col; c < end; c++) {
            const label = cellText(header.getCell(c).value).toUpperCase();
            if (label.includes("NAME")) nameCol = c;
            if (label.includes("SECTION")) sectionCol = c;
        }
        if (!nameCol || !sectionCol) throw new Error(`${LIST_SHEET}: class ${block.group} has no NAME / SECTION columns`);
        for (let r = titleRow + 2; r <= ws.rowCount; r++) {
            const row = ws.getRow(r);
            const raw = cellText(row.getCell(nameCol).value).trim();
            if (!raw) continue;
            listed.push({
                group: block.group,
                name: cleanName(raw).name,
                section: cellText(row.getCell(sectionCol).value).trim().toUpperCase(),
                row: r,
            });
        }
    });
    return listed;
}

function gradesOf(group: string): GradeLabel[] {
    return group
        .split(/\s*&\s*/)
        .map((g) => g.trim() as GradeLabel)
        .filter((g) => g in GRADES);
}

async function main() {
    const flags = process.argv.slice(2);
    const fileAt = flags.indexOf("--file");
    const file = fileAt >= 0 && flags[fileAt + 1] ? path.resolve(flags[fileAt + 1]) : DEFAULT_FILE;
    const confirmed = flags.includes("--yes");

    const listed = await readList(file);
    console.log(`Read ${listed.length} students from ${file} ("${LIST_SHEET}")`);

    admin.initializeApp({ credential: admin.credential.cert(KEY_PATH) });
    const db = admin.firestore();
    const [classSnap, studentSnap, subjectSnap, resultSnap] = await Promise.all([
        db.collection("classes").get(),
        db.collection("students").get(),
        db.collection("subjects").get(),
        db.collection("results").get(),
    ]);
    const classes = classSnap.docs.map((d) => d.data() as SchoolClass);
    const students = studentSnap.docs.map((d) => d.data() as Student);
    const subjects = subjectSnap.docs.map((d) => d.data() as Subject);
    const results = resultSnap.docs.map((d) => d.data() as Result);
    const classById = new Map(classes.map((c) => [c.id, c]));
    const gradeOf = (s: Student) => GRADE_BY_NUMBER.get(classById.get(s.classId)?.grade ?? -1);

    // Every spelling a student went by in the result sheets, from the import roster.
    const spellings = new Map<string, Set<string>>();
    if (fs.existsSync(ROSTER_FILE)) {
        for (const e of await readRosterWorkbook(ROSTER_FILE)) {
            const set = spellings.get(`${e.grade}|${nameKey(e.name)}`) ?? new Set<string>();
            e.spellings.forEach((s) => set.add(nameKey(s.replace(/\s*\[.*\]$/, ""))));
            spellings.set(`${e.grade}|${nameKey(e.name)}`, set);
        }
    }
    const keysOf = (s: Student) => {
        const keys = new Set([nameKey(s.name)]);
        spellings.get(`${gradeOf(s)}|${nameKey(s.name)}`)?.forEach((k) => keys.add(k));
        return keys;
    };

    const errors: string[] = [];
    const notes: string[] = [];
    const target = new Map<Student, SchoolClass>();
    const listedBy = new Map<Student, ListedStudent>();

    for (const item of listed) {
        const grades = gradesOf(item.group);
        if (grades.length === 0) {
            errors.push(`Row ${item.row}: unknown class "${item.group}"`);
            continue;
        }
        const hits = students.filter((s) => grades.includes(gradeOf(s)!) && keysOf(s).has(nameKey(item.name)));
        const where = `Class ${item.group}, row ${item.row} "${item.name}"`;
        if (hits.length !== 1) {
            errors.push(hits.length === 0 ? `${where}: no such student in the portal` : `${where}: matches ${hits.map((h) => h.name).join(" / ")}`);
            continue;
        }
        const student = hits[0];
        if (listedBy.has(student)) {
            errors.push(`${where}: ${student.name} is already listed in row ${listedBy.get(student)!.row}`);
            continue;
        }
        listedBy.set(student, item);
        if (!item.section) {
            notes.push(`${where}: no section given — stays in ${classById.get(student.classId)?.name}`);
            continue;
        }
        const grade = GRADES[gradeOf(student)!];
        const cls = classes.find((c) => c.grade === grade && c.section === item.section);
        if (!cls) {
            errors.push(`${where}: Class ${gradeOf(student)} has no section ${item.section}`);
            continue;
        }
        target.set(student, cls);
    }

    const unlisted = students.filter((s) => !listedBy.has(s));

    // Plan the result moves.
    const subjectsOf = (classId: string) => subjects.filter((s) => s.classId === classId);
    const resultMoves: { id: string; patch: Partial<Result>; studentName: string }[] = [];
    let thirdLanguageSwitches = 0;
    const adminUid = (await admin.auth().getUserByEmail(ADMIN_EMAIL)).uid;
    const moves = [...target].filter(([s, cls]) => s.classId !== cls.id);

    for (const [student, cls] of moves) {
        const fromSubjects = new Map(subjectsOf(student.classId).map((s) => [s.id, s]));
        const toSubjects = subjectsOf(cls.id);
        for (const r of results.filter((x) => x.studentId === student.id && x.classId === student.classId)) {
            const from = fromSubjects.get(r.subjectId);
            const name = from?.name.trim().toLowerCase() ?? "";
            let to = toSubjects.find((t) => t.name.trim().toLowerCase() === name);
            if (!to && THIRD_LANGUAGES.includes(name)) {
                to = toSubjects.find((t) => THIRD_LANGUAGES.includes(t.name.trim().toLowerCase()));
                if (to) thirdLanguageSwitches++;
            }
            if (!to) {
                errors.push(`${student.name}: ${cls.name} has no subject for their ${from?.name ?? "unknown subject"} marks`);
                continue;
            }
            const patch: Partial<Result> = { classId: cls.id, subjectId: to.id, teacherId: to.teacherId ?? "" };
            // Marks owned by the old subject teacher become the new subject teacher's to edit.
            if (r.uploadedBy === r.teacherId) patch.uploadedBy = to.teacherId ?? adminUid;
            resultMoves.push({ id: r.id, patch, studentName: student.name });
        }
    }

    // Report
    const sorted = [...classes].sort((a, b) => a.grade - b.grade || a.section.localeCompare(b.section));
    console.log("\nStudents per section after the move:");
    for (const c of sorted) {
        const after = students.filter((s) => (target.get(s)?.id ?? s.classId) === c.id).length;
        const before = students.filter((s) => s.classId === c.id).length;
        console.log(`  ${c.name.padEnd(14)} ${String(before).padStart(4)} → ${String(after).padStart(4)}`);
    }
    console.log(`\n${moves.length} students change section; ${resultMoves.length} marks move with them.`);
    console.log(`${thirdLanguageSwitches} Sanskrit marks become Hindi (sections that only teach Hindi).`);
    if (unlisted.length) {
        console.log(`\nIn the portal but not in the list (${unlisted.length}) — they stay where they are:`);
        unlisted
            .sort((a, b) => (classById.get(a.classId)?.name ?? "").localeCompare(classById.get(b.classId)?.name ?? "") || a.name.localeCompare(b.name))
            .forEach((s) => console.log(`  - ${classById.get(s.classId)?.name}: ${s.name}`));
    }
    if (notes.length) {
        console.log(`\nNotes (${notes.length}):`);
        notes.forEach((n) => console.log(`  - ${n}`));
    }
    if (errors.length) {
        console.log(`\nErrors (${errors.length}) — nothing will be written until these are fixed:`);
        errors.forEach((e) => console.log(`  ✗ ${e}`));
        process.exitCode = 1;
        return;
    }
    if (!confirmed) {
        console.log("\nDry run only. Re-run with --yes to back up and apply.");
        return;
    }

    // Back up the students and results being changed, then write.
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const movedIds = new Set(moves.map(([s]) => s.id));
    const backupFile = path.join(BACKUP_DIR, `before-sections-${Date.now()}.json`);
    fs.writeFileSync(
        backupFile,
        JSON.stringify(
            {
                takenAt: new Date().toISOString(),
                students: students.filter((s) => movedIds.has(s.id)),
                results: results.filter((r) => resultMoves.some((m) => m.id === r.id)),
            },
            null,
            1
        )
    );
    console.log(`\nBacked up ${movedIds.size} students and ${resultMoves.length} results to ${backupFile}`);

    let batch = db.batch();
    let pending = 0;
    const flush = async () => {
        if (pending === 0) return;
        await batch.commit();
        batch = db.batch();
        pending = 0;
    };
    for (const [student, cls] of moves) {
        batch.update(db.collection("students").doc(student.id), { classId: cls.id });
        if (++pending >= 400) await flush();
    }
    for (const m of resultMoves) {
        batch.update(db.collection("results").doc(m.id), m.patch);
        if (++pending >= 400) await flush();
    }
    await flush();
    console.log(`Moved ${moves.length} students and ${resultMoves.length} marks.`);
}

main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
});
