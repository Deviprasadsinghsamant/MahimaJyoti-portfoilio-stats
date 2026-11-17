// Summaries of a student's register entries, for parents and teachers.

import type { AttendanceMark } from "./types";

export interface AttendanceTotals {
    present: number;
    // Days the register was taken.
    days: number;
    // Newest first.
    absentDates: string[];
    percent: number;
}

/** Totals for the days whose ISO date starts with `prefix` ("2026-11" for a month, "" for all). */
export function totals(days: Record<string, AttendanceMark> | undefined, prefix = ""): AttendanceTotals {
    const entries = Object.entries(days ?? {}).filter(([date]) => date.startsWith(prefix));
    const present = entries.filter(([, mark]) => mark === "P").length;
    const absentDates = entries
        .filter(([, mark]) => mark === "A")
        .map(([date]) => date)
        .sort()
        .reverse();
    return { present, days: entries.length, absentDates, percent: entries.length ? (present / entries.length) * 100 : 0 };
}

/** "2026-11" → "November". */
export function monthName(prefix: string): string {
    const d = new Date(`${prefix}-01T00:00:00Z`);
    return Number.isNaN(d.getTime()) ? prefix : d.toLocaleDateString("en-IN", { month: "long", timeZone: "UTC" });
}
