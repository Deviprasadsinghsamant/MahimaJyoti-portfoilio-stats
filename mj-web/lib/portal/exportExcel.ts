// "Export to Excel" for portal pages: builds an .xlsx file in the browser from
// data the page already has, and saves it. The spreadsheet library is loaded
// only when someone exports, so pages stay light.

import { examLabel } from "./academic";
import type { Result, Student, Subject } from "@/domain/portal/types";

export type CellValue = string | number | null;

export interface ExportSheet {
    name: string;
    header: string[];
    rows: CellValue[][];
    // Column widths in characters; worked out from the content when left out.
    widths?: number[];
    // Columns (by index) holding 0–1 fractions, shown as percentages.
    percentColumns?: number[];
}

// Excel's sheet-name rules: at most 31 characters, none of []:*?/\
function sheetName(name: string, taken: Set<string>): string {
    const base = name.replace(/[[\]:*?/\\]/g, "-").slice(0, 31) || "Sheet";
    let unique = base;
    for (let i = 2; taken.has(unique.toLowerCase()); i++) unique = `${base.slice(0, 28)} ${i}`;
    taken.add(unique.toLowerCase());
    return unique;
}

function autoWidths(sheet: ExportSheet): number[] {
    return sheet.header.map((h, i) => {
        const longest = Math.max(h.length, ...sheet.rows.map((r) => String(r[i] ?? "").length));
        return Math.min(Math.max(longest + 2, 8), 60);
    });
}

/** Save `sheets` as one .xlsx file (the browser's usual download). */
export async function exportWorkbook(fileName: string, sheets: ExportSheet[]): Promise<void> {
    const { default: writeExcelFile } = await import("write-excel-file/browser");
    const taken = new Set<string>();
    const data = sheets.map((sheet) => {
        const percent = new Set(sheet.percentColumns ?? []);
        return {
            sheet: sheetName(sheet.name, taken),
            columns: (sheet.widths ?? autoWidths(sheet)).map((width) => ({ width })),
            stickyRowsCount: 1,
            data: [
                sheet.header.map((value) => ({ value, fontWeight: "bold" as const, backgroundColor: "#E2E8F0" })),
                ...sheet.rows.map((row) =>
                    row.map((value, i) => {
                        if (value === null || value === "") return null;
                        if (typeof value === "number") return percent.has(i) ? { value, format: "0.0%" } : { value };
                        // "@" keeps text as text — Excel won't turn roll numbers or phone numbers into numbers.
                        return { value, format: "@" };
                    })
                ),
            ],
        };
    });
    await writeExcelFile(data).toFile(fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`);
}

/** "Class IX-A" → "Class-IX-A", safe in a file name. */
export function fileSlug(text: string): string {
    return text.trim().replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function byRoll(a: Student, b: Student): number {
    return (a.rollNo ?? "").localeCompare(b.rollNo ?? "", undefined, { numeric: true }) || a.name.localeCompare(b.name);
}

/**
 * One exam sitting as a mark sheet: a row per student, a column per subject,
 * then total, maximum and percentage. Totals count only the subjects with marks.
 */
export function examSheet(name: string, students: Student[], subjects: Subject[], results: Result[]): ExportSheet {
    const columns = [...subjects].sort((a, b) => a.name.localeCompare(b.name));
    const marks = new Map(results.map((r) => [`${r.studentId}|${r.subjectId}`, r]));
    const rows = [...students].sort(byRoll).map((s) => {
        const cells = columns.map((sub) => marks.get(`${s.id}|${sub.id}`) ?? null);
        const got = cells.reduce((n, r) => n + (r?.marksObtained ?? 0), 0);
        const max = cells.reduce((n, r) => n + (r?.totalMarks ?? 0), 0);
        return [
            s.rollNo ?? "",
            s.name,
            s.studentCode ?? "",
            ...cells.map((r) => r?.marksObtained ?? null),
            max ? got : null,
            max || null,
            max ? got / max : null,
        ];
    });
    // Each subject's maximum in its header, e.g. "Mathematics (50)", when all its marks share one.
    const subjectHeaders = columns.map((sub) => {
        const totals = new Set(results.filter((r) => r.subjectId === sub.id).map((r) => r.totalMarks));
        return totals.size === 1 ? `${sub.name} (${[...totals][0]})` : sub.name;
    });
    const header = ["Roll", "Student", "Student ID", ...subjectHeaders, "Total", "Out of", "%"];
    return { name, header, rows, percentColumns: [header.length - 1] };
}

/** Every subject test of the year in one sheet: a column per subject and test number. */
export function subjectTestSheet(students: Student[], subjects: Subject[], results: Result[]): ExportSheet {
    const names = new Map(subjects.map((s) => [s.id, s.name]));
    const tests = Array.from(new Set(results.map((r) => `${r.subjectId}|${r.examNumber}`)))
        .map((key) => {
            const [subjectId, n] = key.split("|");
            return { key, subjectId, number: Number(n), name: names.get(subjectId) ?? "Subject" };
        })
        .sort((a, b) => a.name.localeCompare(b.name) || a.number - b.number);
    const marks = new Map(results.map((r) => [`${r.studentId}|${r.subjectId}|${r.examNumber}`, r]));
    const header = [
        "Roll",
        "Student",
        "Student ID",
        ...tests.map((t) => {
            const out = results.find((r) => r.subjectId === t.subjectId && r.examNumber === t.number)?.totalMarks;
            return `${t.name} ${examLabel("subject-test")} ${t.number}${out ? ` (${out})` : ""}`;
        }),
    ];
    const rows = [...students].sort(byRoll).map((s) => [
        s.rollNo ?? "",
        s.name,
        s.studentCode ?? "",
        ...tests.map((t) => marks.get(`${s.id}|${t.subjectId}|${t.number}`)?.marksObtained ?? null),
    ]);
    return { name: "Subject tests", header, rows };
}

/** Short sheet name for a school-wide exam sitting: "Baseline", "IA 2", "SA 1". */
export function sittingName(examType: Result["examType"], examNumber: number): string {
    if (examType === "baseline") return "Baseline";
    if (examType === "internal-assessment") return `IA ${examNumber}`;
    if (examType === "summative") return `SA ${examNumber}`;
    return `${examLabel(examType)} ${examNumber}`;
}

/**
 * A class's whole year as a workbook: a mark sheet per school-wide exam sitting
 * (in the order they were held), then one sheet for all subject tests.
 */
export function classResultBook(students: Student[], subjects: Subject[], results: Result[]): ExportSheet[] {
    const sittings = new Map<string, Result[]>();
    const tests: Result[] = [];
    for (const r of results) {
        if (r.examType === "subject-test") {
            tests.push(r);
            continue;
        }
        const key = `${r.examType}|${r.examNumber}`;
        sittings.set(key, [...(sittings.get(key) ?? []), r]);
    }
    const firstDate = (rs: Result[]) => rs.map((r) => r.examDate).sort()[0] ?? "";
    const sheets = Array.from(sittings.values())
        .sort((a, b) => firstDate(a).localeCompare(firstDate(b)))
        .map((rs) => examSheet(sittingName(rs[0].examType, rs[0].examNumber), students, subjects, rs));
    if (tests.length) sheets.push(subjectTestSheet(students, subjects, tests));
    return sheets;
}
