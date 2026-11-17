// A student's attendance: a month calendar (present / absent days, with the
// months before it one tap away) and the year so far.
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { monthName, totals } from "../lib/attendance";
import { shortDate, todayIso } from "../lib/dates";
import type { ParentAttendance } from "../lib/types";
import { CalendarCheck, ChevronLeft, ChevronRight, CircleCheck, CircleX } from "./icons";
import { ScoreRing } from "./ScoreRing";
import { attendanceTone, colors, radius, shadow } from "./theme";
import { EmptyState, Pill, ProgressBar } from "./ui";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

/** "2026-11" → "2026-10". */
function shiftMonth(prefix: string, by: number): string {
    const [y, m] = prefix.split("-").map(Number);
    const d = new Date(Date.UTC(y, m - 1 + by, 1));
    return d.toISOString().slice(0, 7);
}

export function AttendanceView({ attendance }: { attendance: ParentAttendance | undefined }) {
    const today = todayIso();
    const thisMonth = today.slice(0, 7);
    const days = attendance?.days;
    const firstMonth = useMemo(() => Object.keys(days ?? {}).sort()[0]?.slice(0, 7) ?? thisMonth, [days, thisMonth]);
    const [month, setMonth] = useState(thisMonth);

    const year = totals(days);
    const shown = totals(days, month);

    if (year.days === 0) {
        return (
            <EmptyState
                icon={CalendarCheck}
                title="No attendance yet"
                body="Shows here once the class teacher starts taking the register."
            />
        );
    }

    const canBack = month > firstMonth;
    const canForward = month < thisMonth;
    const tone = attendanceTone(shown.percent);
    const yearTone = attendanceTone(year.percent);
    const todayMark = days?.[today];

    return (
        <View style={styles.wrap}>
            {todayMark && (
                <View style={[styles.today, todayMark === "A" ? styles.todayAbsent : styles.todayPresent]}>
                    {todayMark === "A" ? (
                        <CircleX size={20} color={colors.danger} strokeWidth={2.3} />
                    ) : (
                        <CircleCheck size={20} color={colors.success} strokeWidth={2.3} />
                    )}
                    <Text style={[styles.todayText, { color: todayMark === "A" ? colors.danger : colors.success }]}>
                        {todayMark === "A" ? "Marked absent today" : "Present today"}
                    </Text>
                </View>
            )}

            <View style={styles.card}>
                <View style={styles.monthBar}>
                    <MonthArrow dir="back" enabled={canBack} onPress={() => setMonth(shiftMonth(month, -1))} />
                    <Text style={styles.monthTitle}>
                        {monthName(month)} {month.slice(0, 4)}
                    </Text>
                    <MonthArrow dir="forward" enabled={canForward} onPress={() => setMonth(shiftMonth(month, 1))} />
                </View>

                {shown.days > 0 ? (
                    <View style={styles.monthSummary}>
                        <ScoreRing percent={shown.percent} size={64} stroke={7} color={tone.fg} track={tone.bg}>
                            <Text style={[styles.ringText, { color: tone.fg }]}>{Math.round(shown.percent)}%</Text>
                        </ScoreRing>
                        <View style={styles.flex}>
                            <Text style={styles.big}>
                                {shown.present} <Text style={styles.of}>of {shown.days} days present</Text>
                            </Text>
                            <Text style={styles.muted}>
                                {shown.absentDates.length === 0
                                    ? "No absences this month"
                                    : `${shown.absentDates.length} day${shown.absentDates.length === 1 ? "" : "s"} absent`}
                            </Text>
                        </View>
                    </View>
                ) : (
                    <Text style={styles.muted}>No register taken in {monthName(month)}.</Text>
                )}

                <Calendar month={month} days={days ?? {}} today={today} />

                <View style={styles.legend}>
                    <Legend color={colors.success} bg={colors.successSoft} label="Present" />
                    <Legend color={colors.onBrand} bg={colors.danger} label="Absent" />
                    <Legend color={colors.muted} bg={colors.surfaceAlt} label="No register" />
                </View>

                {shown.absentDates.length > 0 && (
                    <View style={styles.absences}>
                        <Text style={styles.absencesTitle}>Absent on</Text>
                        <View style={styles.absenceList}>
                            {[...shown.absentDates].reverse().map((d) => (
                                <Pill key={d} label={shortDate(d)} fg={colors.danger} bg={colors.dangerSoft} />
                            ))}
                        </View>
                    </View>
                )}
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>This academic year</Text>
                <View style={styles.yearRow}>
                    <Text style={[styles.yearPercent, { color: yearTone.fg }]}>{year.percent.toFixed(1)}%</Text>
                    <Text style={styles.muted}>
                        {year.present} of {year.days} days
                    </Text>
                </View>
                <ProgressBar percent={year.percent} color={yearTone.fg} height={10} />
                <View style={styles.yearStats}>
                    <MiniStat value={year.present} label="Present" color={colors.success} />
                    <MiniStat value={year.days - year.present} label="Absent" color={colors.danger} />
                    <MiniStat value={year.days} label="School days" color={colors.ink} />
                </View>
            </View>
        </View>
    );
}

function MonthArrow({ dir, enabled, onPress }: { dir: "back" | "forward"; enabled: boolean; onPress: () => void }) {
    const IconCmp = dir === "back" ? ChevronLeft : ChevronRight;
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={dir === "back" ? "Previous month" : "Next month"}
            accessibilityState={{ disabled: !enabled }}
            disabled={!enabled}
            onPress={onPress}
            hitSlop={8}
            style={[styles.arrow, !enabled && styles.arrowOff]}
        >
            <IconCmp size={18} color={colors.brand} strokeWidth={2.5} />
        </Pressable>
    );
}

function Calendar({ month, days, today }: { month: string; days: Record<string, "P" | "A">; today: string }) {
    const [y, m] = month.split("-").map(Number);
    const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // Monday first
    const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const cells: (string | null)[] = [
        ...Array.from({ length: lead }, () => null),
        ...Array.from({ length: count }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`),
    ];
    while (cells.length % 7) cells.push(null);

    return (
        <View>
            <View style={styles.week}>
                {WEEKDAYS.map((d, i) => (
                    <Text key={i} style={styles.weekday}>
                        {d}
                    </Text>
                ))}
            </View>
            <View style={styles.grid}>
                {cells.map((iso, i) => {
                    if (!iso) return <View key={i} style={styles.cell} />;
                    const mark = days[iso];
                    const isToday = iso === today;
                    return (
                        <View key={i} style={styles.cell}>
                            <View
                                style={[
                                    styles.day,
                                    mark === "P" && styles.dayPresent,
                                    mark === "A" && styles.dayAbsent,
                                    isToday && styles.dayToday,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.dayText,
                                        mark === "P" && { color: colors.success },
                                        mark === "A" && { color: colors.onBrand },
                                        iso > today && styles.dayFuture,
                                    ]}
                                >
                                    {Number(iso.slice(8))}
                                </Text>
                            </View>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

function Legend({ color, bg, label }: { color: string; bg: string; label: string }) {
    return (
        <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: bg, borderColor: color === colors.muted ? colors.border : bg }]} />
            <Text style={styles.legendText}>{label}</Text>
        </View>
    );
}

function MiniStat({ value, label, color }: { value: number; label: string; color: string }) {
    return (
        <View style={styles.mini}>
            <Text style={[styles.miniValue, { color }]}>{value}</Text>
            <Text style={styles.miniLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { gap: 12 },
    flex: { flex: 1 },
    today: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: radius.md, padding: 12 },
    todayPresent: { backgroundColor: colors.successSoft },
    todayAbsent: { backgroundColor: colors.dangerSoft },
    todayText: { fontSize: 15, fontWeight: "700" },

    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        gap: 14,
        boxShadow: shadow.card,
    },
    cardTitle: { fontSize: 16, fontWeight: "800", color: colors.ink },
    monthBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    monthTitle: { fontSize: 17, fontWeight: "800", color: colors.ink },
    arrow: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
    arrowOff: { opacity: 0.3 },
    monthSummary: { flexDirection: "row", alignItems: "center", gap: 14 },
    ringText: { fontSize: 15, fontWeight: "800" },
    big: { fontSize: 20, fontWeight: "800", color: colors.ink },
    of: { fontSize: 14, fontWeight: "500", color: colors.muted },
    muted: { fontSize: 13, color: colors.muted },

    week: { flexDirection: "row" },
    weekday: { width: `${100 / 7}%`, textAlign: "center", fontSize: 12, fontWeight: "700", color: colors.muted, paddingBottom: 6 },
    grid: { flexDirection: "row", flexWrap: "wrap" },
    cell: { width: `${100 / 7}%`, alignItems: "center", paddingVertical: 3 },
    day: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
    dayPresent: { backgroundColor: colors.successSoft },
    dayAbsent: { backgroundColor: colors.danger },
    dayToday: { borderWidth: 2, borderColor: colors.accent },
    dayText: { fontSize: 14, fontWeight: "600", color: colors.text },
    dayFuture: { color: "#C3C8D6" },

    legend: { flexDirection: "row", justifyContent: "center", gap: 16 },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    legendDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1 },
    legendText: { fontSize: 12, color: colors.muted, fontWeight: "600" },

    absences: { gap: 8 },
    absencesTitle: { fontSize: 13, fontWeight: "700", color: colors.text },
    absenceList: { flexDirection: "row", flexWrap: "wrap", gap: 6 },

    yearRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
    yearPercent: { fontSize: 28, fontWeight: "800" },
    yearStats: { flexDirection: "row", gap: 10 },
    mini: { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, paddingVertical: 10, alignItems: "center" },
    miniValue: { fontSize: 20, fontWeight: "800" },
    miniLabel: { fontSize: 12, color: colors.muted, fontWeight: "600" },
});
