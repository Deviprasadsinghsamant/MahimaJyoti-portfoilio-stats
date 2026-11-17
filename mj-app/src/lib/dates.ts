// Calendar dates as ISO strings (YYYY-MM-DD) in the phone's local time — India
// time on the school's phones. The server checks dates in India time too.

export function todayIso(now = new Date()): string {
    return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
    const d = new Date(`${iso}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}

/** "Today", "Yesterday", or "Sun, 1 Nov". */
export function dayLabel(iso: string, today = todayIso()): string {
    if (iso === today) return "Today";
    if (iso === addDays(today, -1)) return "Yesterday";
    return shortDate(iso);
}

/** "Sun, 1 Nov". */
export function shortDate(iso: string): string {
    const d = new Date(`${iso}T00:00:00Z`);
    return Number.isNaN(d.getTime())
        ? iso
        : d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

/** "9:41 am", or "3 Nov, 9:41 am" when not today. */
export function timeLabel(ms: number): string {
    const d = new Date(ms);
    const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
    return todayIso(d) === todayIso() ? time : `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, ${time}`;
}

/** "today at 9:41 am" / "tomorrow at 9:41 am" / "on 5 Nov at 9:41 am". */
export function whenLabel(ms: number): string {
    const d = new Date(ms);
    const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
    const day = todayIso(d);
    const today = todayIso();
    if (day === today) return `today at ${time}`;
    if (day === addDays(today, 1)) return `tomorrow at ${time}`;
    return `on ${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} at ${time}`;
}
