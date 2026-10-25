import type { ExamType } from "@/domain/portal/types";

// The academic year runs April–March, e.g. "2026-2027" from 1 April 2026.
// New students, subjects and results are recorded against the current one.
export function currentAcademicYear(now = new Date()): string {
    const start = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    return `${start}-${start + 1}`;
}

// In the order they're held during the year. Each type can have several
// sittings (Internal Assessment 1, 2, …), stored as the result's examNumber.
export const EXAM_TYPES: { value: ExamType; label: string }[] = [
    { value: "baseline", label: "Baseline" },
    { value: "internal-assessment", label: "Internal Assessment" },
    { value: "summative", label: "Summative Assessment" },
];

export function examLabel(type: ExamType): string {
    return EXAM_TYPES.find((e) => e.value === type)?.label ?? type;
}
