// Results, shared by the parent and teacher screens:
// - ResultsPanel: one short row per exam (filtered by year and kind) — tap to open it.
// - ExamDetail: one exam, with the overall percentage on top and every subject's
//   marks out of the total and percentage below.
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { bestAndWeakest, type Exam, formatDate, formatMarks, formatPercent, percentOf } from "../lib/exams";
import type { ParentResult } from "../lib/types";
import { Award, BookOpen, CalendarDays, ChevronRight, Trophy, TrendingDown } from "./icons";
import { ScoreRing } from "./ScoreRing";
import { colors, radius, scoreTone, shadow } from "./theme";
import { EmptyState, Hero, Pill, ProgressBar, SectionTitle } from "./ui";

// ── The list ──────────────────────────────────────

type Kind = "all" | "exams" | "tests";

export function ResultsPanel({ exams, onOpen }: { exams: Exam[]; onOpen: (exam: Exam) => void }) {
    const years = useMemo(() => Array.from(new Set(exams.map((e) => e.academicYear))).sort().reverse(), [exams]);
    const [pickedYear, setYear] = useState<string | null>(null);
    const [kind, setKind] = useState<Kind>("all");
    const year = pickedYear && years.includes(pickedYear) ? pickedYear : years[0];

    const inYear = exams.filter((e) => e.academicYear === year);
    const hasTests = inYear.some((e) => e.type === "subject-test");
    const hasExams = inYear.some((e) => e.type !== "subject-test");
    const shown = inYear.filter((e) => kind === "all" || (kind === "tests") === (e.type === "subject-test"));

    if (exams.length === 0) {
        return <EmptyState icon={Award} title="No marks yet" body="Marks appear here as soon as the school enters them." />;
    }

    return (
        <View style={styles.panel}>
            {years.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                    {years.map((y) => (
                        <Chip key={y} label={`Year ${y}`} on={y === year} onPress={() => setYear(y)} />
                    ))}
                </ScrollView>
            )}
            {hasTests && hasExams && (
                <View style={styles.chips}>
                    <Chip label="All" on={kind === "all"} onPress={() => setKind("all")} />
                    <Chip label="Exams" on={kind === "exams"} onPress={() => setKind("exams")} />
                    <Chip label="Subject tests" on={kind === "tests"} onPress={() => setKind("tests")} />
                </View>
            )}
            {(shown.length ? shown : inYear).map((exam) => (
                <ExamRow key={exam.key} exam={exam} onPress={() => onOpen(exam)} />
            ))}
        </View>
    );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={onPress}
            style={[styles.chip, on && styles.chipOn]}
        >
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
        </Pressable>
    );
}

export function ExamRow({ exam, onPress }: { exam: Exam; onPress: () => void }) {
    const tone = scoreTone(exam.percent);
    const subjects = exam.subjects.length;
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${exam.title}, ${formatPercent(exam.percent)}. Open subject-wise marks.`}
            onPress={onPress}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        >
            <ScoreRing percent={exam.percent} size={58} stroke={6} color={tone.fg} track={tone.bg}>
                <Text style={[styles.rowPercent, { color: tone.fg }]}>{Math.round(exam.percent)}%</Text>
            </ScoreRing>
            <View style={styles.rowText}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                    {exam.title}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                    {formatDate(exam.date)}
                    {subjects > 1 ? ` · ${subjects} subjects` : ""}
                </Text>
                <Text style={styles.rowMarks}>
                    {formatMarks(exam.obtained)}
                    <Text style={styles.rowOutOf}> / {formatMarks(exam.total)} marks</Text>
                </Text>
            </View>
            <View style={styles.rowGo}>
                <ChevronRight size={18} color={colors.brand} strokeWidth={2.5} />
            </View>
        </Pressable>
    );
}

// ── One exam ──────────────────────────────────────

/** Bright tones that read on the navy band. */
function ringOnNavy(percent: number): string {
    if (percent >= 75) return "#4ADE80";
    if (percent >= 50) return "#8FB0FF";
    if (percent >= 33) return "#FBBF24";
    return "#F87171";
}

export function ExamDetail({ exam, studentName }: { exam: Exam; studentName?: string }) {
    const highlights = bestAndWeakest(exam);
    return (
        <ScrollView contentContainerStyle={styles.detail}>
            <Hero>
                {!!studentName && <Text style={styles.heroEyebrow}>{studentName}</Text>}
                <Text style={styles.heroTitle}>{exam.title}</Text>
                <View style={styles.heroDate}>
                    <CalendarDays size={14} color={colors.onBrandMuted} />
                    <Text style={styles.heroMuted}>{formatDate(exam.date)}</Text>
                </View>
                <View style={styles.heroBody}>
                    <ScoreRing percent={exam.percent} size={118} stroke={11} color={ringOnNavy(exam.percent)} track="rgba(255,255,255,0.14)">
                        <Text style={styles.ringValue}>{formatPercent(exam.percent)}</Text>
                        <Text style={styles.ringLabel}>overall</Text>
                    </ScoreRing>
                    <View style={styles.heroFacts}>
                        <Fact label="Total marks" value={`${formatMarks(exam.obtained)} / ${formatMarks(exam.total)}`} />
                        <Fact label={exam.subjects.length === 1 ? "Subject" : "Subjects"} value={exam.subjects.length === 1 ? exam.subjects[0].subjectName : String(exam.subjects.length)} />
                    </View>
                </View>
            </Hero>

            <View style={styles.detailBody}>
                {highlights && (
                    <View style={styles.highlights}>
                        <Highlight icon="best" result={highlights.best} />
                        <Highlight icon="weak" result={highlights.weakest} />
                    </View>
                )}

                <SectionTitle title="Subject-wise marks" />
                <View style={styles.subjects}>
                    {exam.subjects.map((r, i) => (
                        <SubjectRow key={r.id} result={r} last={i === exam.subjects.length - 1} />
                    ))}
                </View>
                <Text style={styles.footnote}>
                    Percentage = marks obtained ÷ total marks × 100. The overall figure adds up every subject&apos;s marks.
                </Text>
            </View>
        </ScrollView>
    );
}

function Fact({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.fact}>
            <Text style={styles.factLabel}>{label}</Text>
            <Text style={styles.factValue} numberOfLines={1}>
                {value}
            </Text>
        </View>
    );
}

function Highlight({ icon, result }: { icon: "best" | "weak"; result: ParentResult }) {
    const percent = percentOf(result.marksObtained, result.totalMarks);
    const best = icon === "best";
    const IconCmp = best ? Trophy : TrendingDown;
    const fg = best ? colors.success : colors.accentDeep;
    const bg = best ? colors.successSoft : colors.accentSoft;
    return (
        <View style={styles.highlight}>
            <View style={[styles.highlightIcon, { backgroundColor: bg }]}>
                <IconCmp size={17} color={fg} strokeWidth={2.3} />
            </View>
            <Text style={styles.highlightLabel}>{best ? "Best subject" : "Needs focus"}</Text>
            <Text style={styles.highlightSubject} numberOfLines={1}>
                {result.subjectName}
            </Text>
            <Text style={[styles.highlightValue, { color: fg }]}>
                {formatPercent(percent)} · {formatMarks(result.marksObtained)}/{formatMarks(result.totalMarks)}
            </Text>
        </View>
    );
}

function SubjectRow({ result, last }: { result: ParentResult; last: boolean }) {
    const percent = percentOf(result.marksObtained, result.totalMarks);
    const tone = scoreTone(percent);
    return (
        <View
            style={[styles.subject, !last && styles.subjectDivider]}
            accessible
            accessibilityLabel={`${result.subjectName}: ${formatMarks(result.marksObtained)} out of ${formatMarks(result.totalMarks)}, ${formatPercent(percent)}`}
        >
            <View style={styles.subjectTop}>
                <View style={[styles.subjectIcon, { backgroundColor: tone.bg }]}>
                    <BookOpen size={17} color={tone.fg} strokeWidth={2.2} />
                </View>
                <View style={styles.subjectText}>
                    <Text style={styles.subjectName} numberOfLines={1}>
                        {result.subjectName}
                    </Text>
                    <Text style={styles.subjectMarks}>
                        <Text style={[styles.subjectObtained, { color: tone.fg }]}>{formatMarks(result.marksObtained)}</Text>
                        <Text style={styles.subjectTotal}> / {formatMarks(result.totalMarks)} marks</Text>
                    </Text>
                </View>
                <Pill label={formatPercent(percent)} fg={tone.fg} bg={tone.bg} />
            </View>
            <ProgressBar percent={percent} color={tone.fg} height={7} />
        </View>
    );
}

const styles = StyleSheet.create({
    panel: { gap: 12 },
    chips: { flexDirection: "row", gap: 8 },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: radius.pill,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    chipOn: { backgroundColor: colors.brandSoft, borderColor: colors.brand },
    chipText: { fontSize: 13, fontWeight: "700", color: colors.muted },
    chipTextOn: { color: colors.brand },

    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14,
        boxShadow: shadow.card,
    },
    rowPressed: { transform: [{ scale: 0.985 }], opacity: 0.94 },
    rowPercent: { fontSize: 14, fontWeight: "800" },
    rowText: { flex: 1, gap: 2 },
    rowTitle: { fontSize: 16, fontWeight: "800", color: colors.ink },
    rowMeta: { fontSize: 13, color: colors.muted },
    rowMarks: { fontSize: 14, fontWeight: "800", color: colors.ink, marginTop: 2 },
    rowOutOf: { fontWeight: "500", color: colors.muted },
    rowGo: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.brandSoft,
        alignItems: "center",
        justifyContent: "center",
    },

    detail: { paddingBottom: 32 },
    heroEyebrow: { fontSize: 13, fontWeight: "700", color: colors.accent, textTransform: "uppercase", letterSpacing: 0.6 },
    heroTitle: { fontSize: 24, fontWeight: "800", color: colors.onBrand, marginTop: 2 },
    heroDate: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
    heroMuted: { fontSize: 14, color: colors.onBrandMuted },
    heroBody: { flexDirection: "row", alignItems: "center", gap: 18, marginTop: 18 },
    ringValue: { fontSize: 22, fontWeight: "800", color: colors.onBrand },
    ringLabel: { fontSize: 12, color: colors.onBrandMuted, marginTop: -2 },
    heroFacts: { flex: 1, gap: 10 },
    fact: {
        backgroundColor: colors.glass,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        borderRadius: radius.md,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    factLabel: { fontSize: 12, color: colors.onBrandMuted, fontWeight: "600" },
    factValue: { fontSize: 18, color: colors.onBrand, fontWeight: "800", marginTop: 1 },

    detailBody: { padding: 16, gap: 12 },
    highlights: { flexDirection: "row", gap: 12, marginTop: -34 },
    highlight: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14,
        gap: 2,
        boxShadow: shadow.raised,
    },
    highlightIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 6 },
    highlightLabel: { fontSize: 12, fontWeight: "600", color: colors.muted },
    highlightSubject: { fontSize: 16, fontWeight: "800", color: colors.ink },
    highlightValue: { fontSize: 13, fontWeight: "700" },

    subjects: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        boxShadow: shadow.card,
        overflow: "hidden",
    },
    subject: { paddingHorizontal: 14, paddingVertical: 14, gap: 10 },
    subjectDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    subjectTop: { flexDirection: "row", alignItems: "center", gap: 12 },
    subjectIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    subjectText: { flex: 1 },
    subjectName: { fontSize: 15, fontWeight: "700", color: colors.ink },
    subjectMarks: { marginTop: 1 },
    subjectObtained: { fontSize: 17, fontWeight: "800" },
    subjectTotal: { fontSize: 13, color: colors.muted, fontWeight: "600" },
    footnote: { fontSize: 12, color: colors.muted, textAlign: "center", lineHeight: 17, paddingHorizontal: 8 },
});
