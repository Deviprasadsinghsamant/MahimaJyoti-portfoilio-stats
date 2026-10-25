// Reads the school's result workbooks (one per exam, one sheet per class)
// into plain rows: student name as written, marks per subject, phone numbers.

import ExcelJS from "exceljs";
import * as path from "path";
import type { ExamType } from "../types";
import type { GradeLabel, SubjectCode } from "./timetable";

export type ExamKey = "baseline" | "ia1" | "ia2" | "sa1";

// "IV&V" = a sheet that mixes Class IV and V students.
export type SheetGrade = GradeLabel | "IV&V";

export interface ExamDef {
    key: ExamKey;
    label: string;
    file: string;
    examType: ExamType;
    examNumber: number;
    // Approximate — the sheets don't record dates. Editable on the Results page.
    examDate: string;
    // Sheets to read → the class they hold. Other sheets are working copies.
    sheets: Record<string, SheetGrade>;
}

export const EXAMS: ExamDef[] = [
    {
        key: "baseline", label: "Baseline", file: "BASELINE TEST.xlsx",
        examType: "baseline", examNumber: 1, examDate: "2026-04-15",
        // "VI" is an earlier copy with most Science marks missing; "Sheet1" is the complete Class VI list.
        sheets: { X: "X", IX: "IX", VIII: "VIII", VII: "VII", Sheet1: "VI", IV: "IV&V" },
    },
    {
        key: "ia1", label: "IA-1", file: "IA - I.xlsx",
        examType: "internal-assessment", examNumber: 1, examDate: "2026-07-15",
        // "X (2)" and "Sheet1" are working copies.
        sheets: { X: "X", IX: "IX", VIII: "VIII", VII: "VII", VI: "VI", "IV & V": "IV&V" },
    },
    {
        key: "ia2", label: "IA-2", file: "IA - 2.xlsx",
        examType: "internal-assessment", examNumber: 2, examDate: "2026-08-20",
        // "Sheet7" is a working copy, "Sheet8" an empty template.
        sheets: { X: "X", IX: "IX", VIII: "VIII", VII: "VII", VI: "VI", "IV & V": "IV&V" },
    },
    {
        key: "sa1", label: "SA-1", file: "SUMMATIVE ASSESEEMATE - 1.xlsx",
        examType: "summative", examNumber: 1, examDate: "2026-09-25",
        sheets: { X: "X", IX: "IX", VIII: "VIII", VII: "VII", VI: "VI", "IV & V": "IV&V" },
    },
];

export function examByLabel(label: string): ExamDef | undefined {
    return EXAMS.find((e) => e.label.toLowerCase() === label.toLowerCase());
}

// "TL" is the single third-language column (TLS/H) in VIII–X sheets; it
// becomes Sanskrit or Hindi depending on the student.
export type SheetSubject = SubjectCode | "TL";

export function isLowerGrade(grade: GradeLabel): boolean {
    return grade === "IV" || grade === "V";
}

/**
 * Full marks for one subject in one exam — the school's marking scheme:
 *   Baseline: 25 per subject.
 *   IA-1, IA-2: 25 per subject (IX–X: 50).
 *   SA-1: 50 per subject (IX–X: 100, of which each Science / Social Science
 *   paper — Physical, Life, History, Geography — is 50).
 * SA-1 for IV–V isn't in the scheme; its sheet totals 250: Sanskrit and
 * Hindi 25 each, other subjects 50.
 * Where a sheet's own percentage formula disagrees (Baseline IV–V uses /60,
 * IA-2 IV–V uses /125), the scheme wins; `check` lists those sheets.
 */
export function maxMarks(exam: ExamKey, grade: GradeLabel, subject: SubjectCode): number {
    const lower = isLowerGrade(grade);
    const senior = grade === "IX" || grade === "X";
    const thirdLanguage = subject === "TLS" || subject === "TLH";
    switch (exam) {
        case "baseline":
            return 25;
        case "ia1":
        case "ia2":
            return senior ? 50 : 25;
        case "sa1":
            if (lower) return thirdLanguage ? 25 : 50;
            if (senior) return ["SCP", "SCL", "SSH", "SSG"].includes(subject) ? 50 : 100;
            return 50;
    }
}

export interface SheetRow {
    exam: ExamKey;
    sheet: string;
    row: number;
    grade: SheetGrade;
    // Class IV or V when the sheet block or the name says so.
    gradeHint: "IV" | "V" | null;
    // Uppercase, whitespace collapsed, class marker like "(IV)" removed.
    name: string;
    // Missing key = blank cell. Several columns for one subject (OBJ + SUB) are added up.
    marks: Partial<Record<SheetSubject, number | "absent">>;
    phones: string[];
}

export interface SheetCheck {
    exam: ExamKey;
    sheet: string;
    headerRow: number;
    subjects: SheetSubject[];
    // From the first data row's percentage formula, e.g. "K7/300*100" → 300.
    sheetTotal: number | null;
}

export interface ParseResult {
    rows: SheetRow[];
    checks: SheetCheck[];
    warnings: string[];
}

const HEADER_CODES: Record<string, SheetSubject> = {
    FLO: "FLO", ODIA: "FLO",
    ENG: "SLE", ENGLISH: "SLE", SLE: "SLE",
    TLS: "TLS", SANSKRIT: "TLS",
    TLH: "TLH", HINDI: "TLH",
    "TLS/H": "TL",
    MATH: "MTH",
    SCI: "GSC", SCIENCE: "GSC", GSC: "GSC",
    SSC: "SSC",
    GK: "GK",
};

// Summative IX–X sheets split some subjects into parts: OBJ(P)/SUB(P) etc.
function partCode(parent: SheetSubject, part: string | null): SheetSubject {
    if (!part) return parent;
    if (parent === "GSC") return part === "P" ? "SCP" : part === "L" ? "SCL" : parent;
    if (parent === "SSC") return part === "H" ? "SSH" : part === "G" ? "SSG" : parent;
    return parent; // MATH (A)lgebra + (G)eometry both count towards Mathematics
}

function text(v: ExcelJS.CellValue): string | number | null {
    if (v === null || v === undefined) return null;
    if (typeof v === "number" || typeof v === "string") return v;
    if (typeof v === "boolean") return String(v);
    if (v instanceof Date) return v.toISOString();
    if (typeof v === "object") {
        if ("result" in v) return text((v as { result?: ExcelJS.CellValue }).result ?? null);
        if ("richText" in v) return v.richText.map((t) => t.text).join("");
        if ("text" in v) return String((v as { text: unknown }).text);
    }
    return null;
}

function str(v: ExcelJS.CellValue): string {
    const t = text(v);
    return t === null ? "" : String(t).replace(/\s+/g, " ").trim();
}

function formulaOf(v: ExcelJS.CellValue): string | null {
    if (v && typeof v === "object" && "formula" in v) return String((v as { formula: string }).formula);
    return null;
}

export function cleanName(raw: string): { name: string; gradeHint: "IV" | "V" | null } {
    let name = raw.replace(/\s+/g, " ").trim().toUpperCase();
    let gradeHint: "IV" | "V" | null = null;
    const marker = name.match(/\s*\((IV|V)\)$/);
    if (marker) {
        gradeHint = marker[1] as "IV" | "V";
        name = name.slice(0, marker.index).trim();
    }
    return { name, gradeHint };
}

function parseMark(v: ExcelJS.CellValue, where: string): number | "absent" | null {
    const t = text(v);
    if (t === null) return null;
    if (typeof t === "number") return t;
    const s = t.replace(/[`'\s]/g, "");
    if (s === "") return null;
    if (/^(ABS|ABSENT|ASENT|AB)$/i.test(s)) return "absent";
    const n = Number(s);
    if (Number.isNaN(n)) throw new Error(`${where}: can't read mark "${t}"`);
    return n;
}

export async function readExam(dataDir: string, exam: ExamDef): Promise<ParseResult> {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(path.join(dataDir, exam.file));
    const rows: SheetRow[] = [];
    const checks: SheetCheck[] = [];
    const warnings: string[] = [];

    for (const [sheetName, grade] of Object.entries(exam.sheets)) {
        const ws = wb.getWorksheet(sheetName);
        if (!ws) throw new Error(`${exam.file}: sheet "${sheetName}" not found`);
        const where = (r: number) => `${exam.label} / ${sheetName} row ${r}`;

        const headerRows: number[] = [];
        ws.eachRow({ includeEmpty: false }, (row, r) => {
            for (let c = 1; c <= ws.columnCount; c++) {
                const cell = row.getCell(c);
                // A "NAME OF STUDENT" merged down two rows shows up in both; only its top cell counts.
                if (cell.isMerged && cell.master.address !== cell.address) continue;
                if (/NAME OF/i.test(str(cell.value))) {
                    headerRows.push(r);
                    break;
                }
            }
        });
        if (headerRows.length === 0) throw new Error(`${exam.file} / ${sheetName}: no header row`);

        headerRows.forEach((hr, i) => {
            const header = ws.getRow(hr);
            const sub = ws.getRow(hr + 1);
            const labels: Record<number, string> = {};
            for (let c = 1; c <= ws.columnCount; c++) labels[c] = str(header.getCell(c).value).toUpperCase();

            const nameCol = Number(Object.keys(labels).find((c) => labels[+c].includes("NAME OF")));
            const totalCol = Number(
                Object.keys(labels).find((c) => +c > nameCol && /^(TOTAL|GRAND TOTAL)/.test(labels[+c])) ?? 0
            );
            const pctCol = Number(Object.keys(labels).find((c) => /^(PERCENTAGE|PECENTAGE|%)$/.test(labels[+c])) ?? 0);
            const mobileCol = Number(Object.keys(labels).find((c) => labels[+c].includes("MOBILE")) ?? 0);
            if (!totalCol) throw new Error(`${where(hr)}: no TOTAL column`);

            const subLabel = (c: number) => str(sub.getCell(c).value).toUpperCase();
            const twoRow = Object.keys(labels).some((c) => /^(OBJ|SUB)(\([A-Z]\))?$/.test(subLabel(+c)));

            // Map each mark column to a subject. Merged two-row headers repeat the
            // parent label across their OBJ/SUB columns; carry it forward in case they don't.
            const columns: { col: number; code: SheetSubject }[] = [];
            let parent: SheetSubject | null = null;
            for (let c = nameCol + 1; c < totalCol; c++) {
                const label = labels[c].replace(/\s+/g, "");
                if (label) {
                    const code = HEADER_CODES[label];
                    if (!code) throw new Error(`${where(hr)}: unknown subject column "${labels[c]}"`);
                    parent = code;
                }
                if (!parent) continue;
                if (!label && !twoRow) continue;
                const part = twoRow ? (subLabel(c).match(/\(([A-Z])\)$/)?.[1] ?? null) : null;
                columns.push({ col: c, code: partCode(parent, part) });
            }

            // Which class this block holds, from its title (IV & V sheets have IV and V blocks).
            let gradeHint: "IV" | "V" | null = null;
            for (let r = Math.max(1, hr - 6); r < hr; r++) {
                const title = ws.getRow(r).values as ExcelJS.CellValue[];
                const t = (Array.isArray(title) ? title : []).map((v) => str(v)).join(" ").toUpperCase();
                const m = t.match(/CLASS\s*-\s*(IV\s*&\s*V|IV|V)\b/);
                if (m) gradeHint = /&/.test(m[1]) ? null : (m[1] as "IV" | "V");
            }

            const end = headerRows[i + 1] ?? ws.rowCount + 1;
            const firstData = hr + (twoRow ? 2 : 1);
            let sheetTotal: number | null = null;

            for (let r = firstData; r < end; r++) {
                const row = ws.getRow(r);
                const rawName = str(row.getCell(nameCol).value);
                if (!rawName || /NAME OF|MAHIMA/i.test(rawName)) continue;
                if (/(.)\1{5,}/.test(rawName) || !/[A-Z]{2}/i.test(rawName)) {
                    warnings.push(`${where(r)}: skipped unreadable name "${rawName.slice(0, 20)}…"`);
                    continue;
                }
                const { name, gradeHint: nameHint } = cleanName(rawName);
                const marks: SheetRow["marks"] = {};
                for (const { col, code } of columns) {
                    const m = parseMark(row.getCell(col).value, `${where(r)} ${name}`);
                    if (m === null) continue;
                    const prev = marks[code];
                    if (m === "absent") {
                        if (prev === undefined) marks[code] = "absent";
                    } else {
                        marks[code] = (typeof prev === "number" ? prev : 0) + m;
                    }
                }
                const phones = mobileCol
                    ? Array.from(new Set((String(text(row.getCell(mobileCol).value) ?? "").match(/\d{10}/g) ?? [])))
                    : [];
                if (sheetTotal === null && pctCol) {
                    const f = formulaOf(row.getCell(pctCol).value);
                    const d = f?.match(/\/\s*(\d+(?:\.\d+)?)\s*\)?\s*\*\s*100/);
                    if (d) sheetTotal = Number(d[1]);
                }
                rows.push({
                    exam: exam.key, sheet: sheetName, row: r,
                    grade, gradeHint: nameHint ?? gradeHint, name, marks, phones,
                });
            }

            checks.push({
                exam: exam.key, sheet: sheetName, headerRow: hr,
                subjects: Array.from(new Set(columns.map((c) => c.code))),
                sheetTotal,
            });
        });
    }
    return { rows, checks, warnings };
}

export async function readAllExams(dataDir: string): Promise<ParseResult> {
    const all: ParseResult = { rows: [], checks: [], warnings: [] };
    for (const exam of EXAMS) {
        const r = await readExam(dataDir, exam);
        all.rows.push(...r.rows);
        all.checks.push(...r.checks);
        all.warnings.push(...r.warnings);
    }
    return all;
}
