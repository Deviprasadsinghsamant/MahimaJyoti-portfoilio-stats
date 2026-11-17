// A student's page, for parents and teachers alike: a navy summary band (name,
// class, latest exam, this month's attendance) and Results / Attendance tabs.
import { type ReactNode, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { monthName, totals } from "../lib/attendance";
import { todayIso } from "../lib/dates";
import { type Exam, formatPercent, groupExams } from "../lib/exams";
import type { ParentAttendance, ParentResult } from "../lib/types";
import { AttendanceView } from "./AttendanceView";
import { Award, CalendarCheck, ChartColumn } from "./icons";
import { ResultsPanel } from "./Results";
import { SegmentedTabs } from "./SegmentedTabs";
import { colors } from "./theme";
import { Avatar, Hero, StatTile } from "./ui";

type TabKey = "results" | "attendance";

export function StudentOverview({
    name,
    subtitle,
    results,
    attendance,
    onOpenExam,
    heroExtra,
    before,
    after,
    refreshing,
    onRefresh,
}: {
    name: string;
    subtitle: string;
    results: ParentResult[];
    attendance: ParentAttendance | undefined;
    onOpenExam: (exam: Exam) => void;
    /** Extra lines in the navy band (e.g. the parent's phone for teachers). */
    heroExtra?: ReactNode;
    /** Shown above the tabs' content (e.g. warnings). */
    before?: ReactNode;
    /** Shown below everything (e.g. "updated" lines and actions). */
    after?: ReactNode;
    refreshing?: boolean;
    onRefresh?: () => void;
}) {
    const [tab, setTab] = useState<TabKey>("results");
    const exams = useMemo(() => groupExams(results), [results]);
    const latest = exams[0];
    const month = todayIso().slice(0, 7);
    const thisMonth = totals(attendance?.days, month);

    return (
        <ScrollView
            contentContainerStyle={styles.content}
            refreshControl={
                onRefresh ? (
                    <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} colors={[colors.brand]} progressBackgroundColor={colors.surface} />
                ) : undefined
            }
        >
            <Hero style={styles.hero}>
                <View style={styles.identity}>
                    <Avatar name={name} size={58} variant="glass" />
                    <View style={styles.flex}>
                        <Text style={styles.name} numberOfLines={2}>
                            {name}
                        </Text>
                        <Text style={styles.subtitle}>{subtitle}</Text>
                    </View>
                </View>
                {heroExtra}
                <View style={styles.stats}>
                    <StatTile
                        variant="glass"
                        icon={Award}
                        label="Latest exam"
                        value={latest ? formatPercent(latest.percent) : "—"}
                        sub={latest?.title ?? "No marks yet"}
                    />
                    <StatTile
                        variant="glass"
                        icon={CalendarCheck}
                        label="Attendance"
                        value={thisMonth.days ? `${Math.round(thisMonth.percent)}%` : "—"}
                        sub={thisMonth.days ? `${thisMonth.present}/${thisMonth.days} days · ${monthName(month).slice(0, 3)}` : `None in ${monthName(month)}`}
                    />
                </View>
            </Hero>

            <View style={styles.tabs}>
                <SegmentedTabs
                    tabs={[
                        { key: "results", label: `Results${exams.length ? ` (${exams.length})` : ""}`, icon: ChartColumn },
                        { key: "attendance", label: "Attendance", icon: CalendarCheck },
                    ]}
                    value={tab}
                    onChange={setTab}
                />
            </View>

            <View style={styles.body}>
                {before}
                {tab === "results" ? <ResultsPanel exams={exams} onOpen={onOpenExam} /> : <AttendanceView attendance={attendance} />}
                {after}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    content: { paddingBottom: 36 },
    hero: { paddingBottom: 48 },
    identity: { flexDirection: "row", alignItems: "center", gap: 14 },
    name: { fontSize: 21, fontWeight: "800", color: colors.onBrand },
    subtitle: { fontSize: 14, color: colors.onBrandMuted, marginTop: 2 },
    stats: { flexDirection: "row", gap: 10, marginTop: 18 },
    tabs: { marginTop: -26, marginHorizontal: 16 },
    body: { padding: 16, gap: 12 },
});
