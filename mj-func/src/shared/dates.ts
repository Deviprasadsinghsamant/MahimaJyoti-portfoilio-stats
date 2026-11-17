// Calendar dates as the school sees them: ISO strings (YYYY-MM-DD) in India time,
// whatever timezone the function runs in.

const IST_OFFSET_MS = 330 * 60 * 1000;

/** Today's date in India. */
export function istToday(now = Date.now()): string {
    return new Date(now + IST_OFFSET_MS).toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
    const d = new Date(`${iso}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}

/** True for a real calendar date written as YYYY-MM-DD. */
export function isIsoDate(value: unknown): value is string {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const d = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** "today", "yesterday", or "on Sun, 1 Nov". */
export function dayPhrase(iso: string, today = istToday()): string {
    if (iso === today) return "today";
    if (iso === addDays(today, -1)) return "yesterday";
    const label = new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone: "UTC",
    });
    return `on ${label}`;
}
