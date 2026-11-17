// Turns a child's flat list of results into exams (one row each), newest first.
// A school-wide exam is one card with every subject; a subject test is a card of
// its own ("Mathematics Test 3"), since each subject numbers its tests separately.

import type { ExamType, ParentResult } from "./types";

const EXAM_NAMES: Record<ExamType, string> = {
    baseline: "Baseline",
    "internal-assessment": "Internal Assessment",
    summative: "Summative Assessment",
    "subject-test": "Test",
};

// Report-card order; anything else follows alphabetically.
const SUBJECT_ORDER = [
    "Odia",
    "English",
    "Sanskrit",
    "Hindi",
    "Mathematics",
    "Science",
    "Physical Science",
    "Life Science",
    "Social Science",
    "History",
    "Geography",
    "General Knowledge",
];

export interface Exam {
    key: string;
    type: ExamType;
    title: string;
    academicYear: string;
    date: string;
    subjects: ParentResult[];
    obtained: number;
    total: number;
    percent: number;
}

export function examTitle(type: ExamType, number: number, subjectName = ""): string {
    const name = EXAM_NAMES[type] ?? type;
    if (type === "baseline") return name;
    if (type === "subject-test") return `${subjectName} ${name} ${number}`.trim();
    return `${name} ${number}`;
}

function subjectRank(name: string): number {
    const i = SUBJECT_ORDER.indexOf(name);
    return i === -1 ? SUBJECT_ORDER.length : i;
}

export function groupExams(results: ParentResult[]): Exam[] {
    const groups = new Map<string, ParentResult[]>();
    for (const r of results) {
        const subjectPart = r.examType === "subject-test" ? `|${r.subjectName}` : "";
        const key = `${r.academicYear}|${r.examType}|${r.examNumber}${subjectPart}`;
        groups.set(key, [...(groups.get(key) ?? []), r]);
    }
    return Array.from(groups.entries())
        .map(([key, rows]) => {
            const subjects = rows.sort(
                (a, b) => subjectRank(a.subjectName) - subjectRank(b.subjectName) || a.subjectName.localeCompare(b.subjectName)
            );
            const obtained = rows.reduce((n, r) => n + r.marksObtained, 0);
            const total = rows.reduce((n, r) => n + r.totalMarks, 0);
            const date = rows.map((r) => r.examDate).sort().pop() ?? "";
            return {
                key,
                type: rows[0].examType,
                title: examTitle(rows[0].examType, rows[0].examNumber, rows[0].subjectName),
                academicYear: rows[0].academicYear,
                date,
                subjects,
                obtained,
                total,
                percent: percentOf(obtained, total),
            };
        })
        .sort((a, b) => b.date.localeCompare(a.date) || b.key.localeCompare(a.key));
}

export function formatMarks(n: number): string {
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function formatDate(iso: string): string {
    const d = new Date(`${iso}T00:00:00`);
    return Number.isNaN(d.getTime())
        ? iso
        : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatUpdated(ms: number): string {
    if (!ms) return "never";
    const d = new Date(ms);
    return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export function percentOf(obtained: number, total: number): number {
    return total > 0 ? (obtained / total) * 100 : 0;
}

/** 82.456 → "82.5%", 100 → "100%". */
export function formatPercent(percent: number): string {
    const rounded = Math.round(percent * 10) / 10;
    return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}%`;
}

/** The strongest and weakest subject of an exam (by percentage), when it has two or more. */
export function bestAndWeakest(exam: Exam): { best: ParentResult; weakest: ParentResult } | null {
    if (exam.subjects.length < 2) return null;
    const ranked = [...exam.subjects].sort(
        (a, b) => percentOf(b.marksObtained, b.totalMarks) - percentOf(a.marksObtained, a.totalMarks)
    );
    const best = ranked[0];
    const weakest = ranked[ranked.length - 1];
    if (percentOf(best.marksObtained, best.totalMarks) === percentOf(weakest.marksObtained, weakest.totalMarks)) return null;
    return { best, weakest };
}
