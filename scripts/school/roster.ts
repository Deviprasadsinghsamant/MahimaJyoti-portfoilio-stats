// One entry per real student, built by matching the different spellings of
// their name across the four result workbooks. `prepare` writes the roster to
// an Excel sheet where the school fills in each student's section; `check`
// and `apply` read it back and use its spellings to match result rows exactly.

import ExcelJS from "exceljs";
import { EXAMS, examByLabel, type ExamKey, type SheetRow } from "./workbooks";
import { sectionsOf, type GradeLabel } from "./timetable";

// Classes IV and V share sheets, so their students are matched together.
export type GradeGroup = Exclude<GradeLabel, "IV" | "V"> | "IV/V";

export function groupOf(grade: SheetRow["grade"] | GradeLabel): GradeGroup {
    return grade === "IV" || grade === "V" || grade === "IV&V" ? "IV/V" : grade;
}

export interface RosterEntry {
    id: string;
    grade: GradeLabel;
    name: string;
    // Section letter, "LEFT" to leave the student out, or "" if not filled in yet.
    section: string;
    thirdLanguage: "" | "Sanskrit" | "Hindi";
    rollNo: string;
    phones: string[];
    // Names exactly as written in the sheets. "NAME [IA-1 r44]" pins one row
    // when two students share a name in the same sheet.
    spellings: string[];
    exams: string;
    note: string;
}

export function nameKey(name: string): string {
    return name.toUpperCase().replace(/[^A-Z() ]/g, "").replace(/\s+/g, " ").trim();
}

// Spelling-insensitive form used only to suggest matches.
function squash(name: string): string {
    let s = nameKey(name).replace(/[() ]/g, "");
    for (const [a, b] of [
        ["SAHOO", "SAHU"], ["DEHURI", "DEHURY"], ["SHEKHAR", "SEKHAR"], ["ABHISHEK", "ABHISEK"],
        ["OMM", "OM"], ["TH", "T"], ["SH", "S"], ["AA", "A"], ["EE", "I"], ["Y", "I"], ["W", "V"],
    ]) s = s.split(a).join(b);
    return s;
}

// Ratcliff/Obershelp similarity (what Python's difflib uses), 0–1.
function similarity(a: string, b: string): number {
    const matches = (x: string, y: string): number => {
        if (!x || !y) return 0;
        let best = 0, bi = 0, bj = 0;
        for (let i = 0; i < x.length; i++) {
            for (let j = 0; j < y.length; j++) {
                let k = 0;
                while (i + k < x.length && j + k < y.length && x[i + k] === y[j + k]) k++;
                if (k > best) { best = k; bi = i; bj = j; }
            }
        }
        if (best === 0) return 0;
        return best + matches(x.slice(0, bi), y.slice(0, bj)) + matches(x.slice(bi + best), y.slice(bj + best));
    };
    return (2 * matches(a, b)) / (a.length + b.length);
}

const FUZZY_THRESHOLD = 0.86;

function sameMarks(a: SheetRow, b: SheetRow): boolean {
    return JSON.stringify(a.marks) === JSON.stringify(b.marks);
}

function rowLabel(row: SheetRow): string {
    return `${EXAMS.find((e) => e.key === row.exam)!.label} r${row.row}`;
}

// Pairs the sheets can't settle by spelling. Each inner list is one student.
// Names here are as written in the sheets; "[IA-1 r44]" pins a single row.
const MANUAL_LINKS: { group: GradeGroup; names: string[]; note: string }[] = [
    {
        group: "VII", names: ["MANISHA PRADHAN", "KUMARI MANISHA PRADHAN"],
        note: "Assumed 'Manisha Pradhan' (Baseline) and 'Kumari Manisha Pradhan' (later exams) are the same student.",
    },
    {
        group: "VII", names: ["OMM PRAKASH SAHU (A)", "OMM PRAKASH SAHU"],
        note: "Baseline lists Omm Prakash Sahu (A) and (B); assumed (A) is the later 'Omm Prakash Sahu' (similar marks).",
    },
    {
        group: "VII", names: ["OMM PRAKASH SAHU (B)", "OM PRAKASH SAHU"],
        note: "Baseline lists Omm Prakash Sahu (A) and (B); assumed (B) is the later 'Om Prakash Sahu'.",
    },
    {
        group: "VIII", names: ["PAYAL SAHOO (OLD)", "PAYAL SAHOO"],
        note: "Assumed Baseline 'Payal Sahoo (OLD)' is the later 'Payal Sahoo' (both score high).",
    },
    {
        group: "VIII", names: ["PAYAL SAHOO (NEW)", "PAYAL SAHU"],
        note: "Assumed Baseline 'Payal Sahoo (NEW)' is the later 'Payal Sahu'.",
    },
    {
        group: "IX", names: ["SONAM SAHU", "SONAM SAHU (A)"],
        note: "Unsure: Baseline has 'Sonam Sahu' and 'Sonam Sahu (NEW)'; assumed the first is (A). Swap the spellings with (B)'s row if wrong.",
    },
    {
        group: "IX", names: ["SONAM SAHU (NEW)", "SONAM SAHU (B)"],
        note: "Unsure: assumed Baseline 'Sonam Sahu (NEW)' is (B). Swap the spellings with (A)'s row if wrong.",
    },
    {
        group: "IX", names: ["AYUSH PRADHAN (A)", "AYUSH PRADHAN [IA-1 r89]"],
        note: "IA-1 lists two 'Ayush Pradhan' without (A)/(B); row 89 assigned to (A) from their English and Science marks.",
    },
    {
        group: "IX", names: ["AYUSH PRADHAN (B)", "AYUSH PRADHAN [IA-1 r44]"],
        note: "IA-1 lists two 'Ayush Pradhan' without (A)/(B); row 44 assigned to (B) from their English and Science marks.",
    },
];

function parseSpelling(s: string): { key: string; exam: ExamKey | null; row: number | null } {
    const m = s.match(/^(.*?)\s*\[(.+?)\s+r(\d+)\]$/);
    if (!m) return { key: nameKey(s), exam: null, row: null };
    const exam = examByLabel(m[2]);
    if (!exam) throw new Error(`Unknown exam "${m[2]}" in spelling "${s}"`);
    return { key: nameKey(m[1]), exam: exam.key, row: Number(m[3]) };
}

function spellingMatches(spelling: string, row: SheetRow): boolean {
    const p = parseSpelling(spelling);
    if (p.key !== nameKey(row.name)) return false;
    return p.exam === null || (p.exam === row.exam && p.row === row.row);
}

function titleCase(name: string): string {
    return name
        .toLowerCase()
        .replace(/(^|[\s.(])([a-z])/g, (_, pre, ch) => pre + ch.toUpperCase())
        .replace(/\((a|b|c|new|old)\)/gi, (m) => m.toUpperCase());
}

/** Group sheet rows into students. Used by `prepare` only; later steps trust the sheet. */
export function buildRoster(rows: SheetRow[]): RosterEntry[] {
    const entries: RosterEntry[] = [];
    const groups = new Map<GradeGroup, SheetRow[]>();
    for (const r of rows) groups.set(groupOf(r.grade), [...(groups.get(groupOf(r.grade)) ?? []), r]);

    for (const [group, groupRows] of groups) {
        // A cluster = one student: the rows that belong to them, at most one per exam
        // (a repeated identical row in the same exam is kept as a duplicate).
        type Cluster = { rows: SheetRow[]; fuzzy: boolean; note: string };
        const clusters: Cluster[] = [];
        const placed = new Set<SheetRow>();

        // Names repeated within one exam need row-pinned spellings.
        const repeated = new Set<string>();
        const seen = new Map<string, SheetRow>();
        for (const r of groupRows) {
            const k = `${r.exam}|${nameKey(r.name)}`;
            const prev = seen.get(k);
            if (prev && !sameMarks(prev, r)) repeated.add(k);
            seen.set(k, r);
        }

        for (const link of MANUAL_LINKS.filter((l) => l.group === group)) {
            const cluster: Cluster = { rows: [], fuzzy: false, note: link.note };
            for (const spelling of link.names) {
                for (const r of groupRows) {
                    if (!placed.has(r) && spellingMatches(spelling, r)) {
                        cluster.rows.push(r);
                        placed.add(r);
                    }
                }
            }
            clusters.push(cluster);
        }

        for (const exam of EXAMS) {
            for (const r of groupRows.filter((x) => x.exam === exam.key && !placed.has(x))) {
                // A cluster can't take a second row from this exam — unless it's an identical repeat.
                const takenThisExam = (c: Cluster) =>
                    c.rows.some((x) => x.exam === exam.key && !(nameKey(x.name) === nameKey(r.name) && sameMarks(x, r)));
                let target = clusters.find(
                    (c) => c.rows.some((x) => nameKey(x.name) === nameKey(r.name)) && !takenThisExam(c)
                );
                if (!target) {
                    let best: Cluster | null = null;
                    let score = 0;
                    for (const c of clusters) {
                        if (c.rows.some((x) => x.exam === exam.key)) continue;
                        for (const x of c.rows) {
                            const s = similarity(squash(r.name), squash(x.name));
                            if (s > score) { score = s; best = c; }
                        }
                    }
                    if (best && score >= FUZZY_THRESHOLD) {
                        target = best;
                        target.fuzzy = true;
                    }
                }
                if (!target) {
                    target = { rows: [], fuzzy: false, note: "" };
                    clusters.push(target);
                }
                target.rows.push(r);
                placed.add(r);
            }
        }

        for (const c of clusters) {
            if (c.rows.length === 0) continue;
            // Display name from the latest exam that lists the student.
            const latest = [...EXAMS].reverse().map((e) => c.rows.find((r) => r.exam === e.key)).find(Boolean)!;
            const spellings = Array.from(
                new Set(
                    c.rows.map((r) =>
                        repeated.has(`${r.exam}|${nameKey(r.name)}`) ? `${r.name} [${rowLabel(r)}]` : r.name
                    )
                )
            );
            const examsFound = EXAMS.filter((e) => c.rows.some((r) => r.exam === e.key)).map((e) => e.label);
            const hints = new Set(c.rows.map((r) => r.gradeHint).filter(Boolean));
            const grade: GradeLabel =
                group === "IV/V" ? ((hints.size === 1 ? [...hints][0] : "IV") as GradeLabel) : group;
            const notes = [c.note];
            if (group === "IV/V" && hints.size !== 1) notes.push("Class not stated in the sheets — set Class to IV or V.");
            if (c.fuzzy) notes.push("Name is spelled differently across sheets — check these are the same student.");
            const latestExam = EXAMS[EXAMS.length - 1].label;
            if (!examsFound.includes(latestExam)) {
                notes.push(`Not in ${latestExam} (the latest exam). If they've left, write LEFT in Section.`);
            }
            const single = sectionsOf(grade).length === 1;
            entries.push({
                id: "",
                grade,
                name: titleCase(latest.name),
                section: single ? sectionsOf(grade)[0].section : "",
                thirdLanguage: "",
                rollNo: "",
                phones: Array.from(new Set(c.rows.flatMap((r) => r.phones))),
                spellings,
                exams: examsFound.join(", "),
                note: notes.filter(Boolean).join(" "),
            });
        }
    }

    // Stable ids: class, then name.
    const order: GradeLabel[] = ["X", "IX", "VIII", "VII", "VI", "V", "IV"];
    entries.sort((a, b) => order.indexOf(a.grade) - order.indexOf(b.grade) || a.name.localeCompare(b.name));
    const counters = new Map<GradeLabel, number>();
    for (const e of entries) {
        const n = (counters.get(e.grade) ?? 0) + 1;
        counters.set(e.grade, n);
        e.id = `${e.grade}-${String(n).padStart(3, "0")}`;
    }
    return entries;
}

// ── section sheet (Excel) ─────────────────────────

const COLUMNS = [
    { key: "id", header: "Student ID", width: 11 },
    { key: "name", header: "Name", width: 30 },
    { key: "grade", header: "Class", width: 7 },
    { key: "section", header: "Section", width: 9 },
    { key: "thirdLanguage", header: "Third language", width: 15 },
    { key: "rollNo", header: "Roll no", width: 9 },
    { key: "phones", header: "Phone", width: 26 },
    { key: "exams", header: "Exams found", width: 26 },
    { key: "spellings", header: "Spellings in result sheets", width: 48 },
    { key: "note", header: "Note", width: 70 },
] as const;

const SHEET_ORDER: GradeLabel[] = ["X", "IX", "VIII", "VII", "VI", "V", "IV"];

export async function writeRosterWorkbook(file: string, entries: RosterEntry[]): Promise<void> {
    const wb = new ExcelJS.Workbook();
    const help = wb.addWorksheet("Instructions");
    help.getColumn(1).width = 110;
    [
        "Fill in the Section column for every student (one sheet per class), then save this file.",
        "",
        "Section: pick from the dropdown. Write LEFT for a student who is no longer in the school — they and their marks are left out.",
        "Third language: only needed in Class IX-A (it has both Sanskrit and Hindi). Every other section follows its timetable:",
        "   VIII-A, IX-B, X-A, X-B → Sanskrit;  VIII-B, IX-C → Hindi. Fill it in anyway if a student differs.",
        "Roll no: optional.",
        "Name: you can correct the spelling; this is the name the portal shows.",
        "Class: only change it for Class IV / V students if it's wrong.",
        "",
        "Don't edit 'Spellings in result sheets' unless two different students were merged (or one student split in two):",
        "those spellings are how each row of the result sheets is matched to the student.",
        "Read the Note column — it flags names that were matched by similar spelling or by assumption.",
    ].forEach((line, i) => {
        help.getCell(i + 1, 1).value = line;
    });
    help.getCell(1, 1).font = { bold: true };

    for (const grade of SHEET_ORDER) {
        const rows = entries.filter((e) => e.grade === grade);
        if (rows.length === 0) continue;
        const ws = wb.addWorksheet(grade);
        ws.columns = COLUMNS.map((c) => ({ key: c.key, header: c.header, width: c.width }));
        ws.getRow(1).font = { bold: true };
        ws.views = [{ state: "frozen", xSplit: 2, ySplit: 1 }];
        const sections = [...sectionsOf(grade).map((s) => s.section), "LEFT"].join(",");
        for (const e of rows) {
            const row = ws.addRow({
                ...e,
                phones: e.phones.join(", "),
                spellings: e.spellings.join(" | "),
            });
            row.getCell("section").dataValidation = { type: "list", allowBlank: true, formulae: [`"${sections}"`] };
            row.getCell("thirdLanguage").dataValidation = { type: "list", allowBlank: true, formulae: ['"Sanskrit,Hindi"'] };
            row.getCell("note").alignment = { wrapText: true, vertical: "top" };
            row.getCell("spellings").alignment = { wrapText: true, vertical: "top" };
            if (!e.section) row.getCell("section").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF2CC" } };
        }
    }
    await wb.xlsx.writeFile(file);
}

export async function readRosterWorkbook(file: string): Promise<RosterEntry[]> {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(file);
    const entries: RosterEntry[] = [];
    wb.eachSheet((ws) => {
        if (ws.name === "Instructions") return;
        const headers: Record<string, number> = {};
        ws.getRow(1).eachCell((cell, col) => {
            headers[String(cell.value).trim()] = col;
        });
        const get = (row: ExcelJS.Row, header: string): string => {
            const col = headers[header];
            if (!col) throw new Error(`Sheet "${ws.name}" has no "${header}" column`);
            const v = row.getCell(col).value;
            if (v === null || v === undefined) return "";
            if (typeof v === "object" && "richText" in v) return v.richText.map((t) => t.text).join("").trim();
            if (typeof v === "object" && "result" in v) return String(v.result ?? "").trim();
            return String(v).trim();
        };
        ws.eachRow((row, r) => {
            if (r === 1) return;
            const id = get(row, "Student ID");
            if (!id) return;
            const third = get(row, "Third language");
            entries.push({
                id,
                name: get(row, "Name").replace(/\s+/g, " "),
                grade: get(row, "Class").toUpperCase() as GradeLabel,
                section: get(row, "Section").toUpperCase(),
                thirdLanguage: /^s/i.test(third) ? "Sanskrit" : /^h/i.test(third) ? "Hindi" : "",
                rollNo: get(row, "Roll no"),
                phones: get(row, "Phone").match(/\d{10}/g) ?? [],
                spellings: get(row, "Spellings in result sheets").split("|").map((s) => s.trim()).filter(Boolean),
                exams: get(row, "Exams found"),
                note: get(row, "Note"),
            });
        });
    });
    return entries;
}

/** The roster entry each sheet row belongs to, or an error per unmatched / ambiguous row. */
export function matchRows(rows: SheetRow[], entries: RosterEntry[]): { byRow: Map<SheetRow, RosterEntry>; errors: string[] } {
    const byRow = new Map<SheetRow, RosterEntry>();
    const errors: string[] = [];
    for (const r of rows) {
        const candidates = entries.filter((e) => groupOf(e.grade) === groupOf(r.grade));
        const pinned = candidates.filter((e) => e.spellings.some((s) => s.includes("[") && spellingMatches(s, r)));
        const plain = candidates.filter((e) => e.spellings.some((s) => !s.includes("[") && spellingMatches(s, r)));
        const hits = pinned.length > 0 ? pinned : plain;
        if (hits.length === 1) byRow.set(r, hits[0]);
        else if (hits.length === 0) errors.push(`${rowLabel(r)} (${r.sheet}): "${r.name}" matches no student`);
        else errors.push(`${rowLabel(r)} (${r.sheet}): "${r.name}" matches ${hits.map((h) => h.id).join(", ")}`);
    }
    return { byRow, errors };
}
