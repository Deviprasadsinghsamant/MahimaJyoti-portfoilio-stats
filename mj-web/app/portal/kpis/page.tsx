"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import "@/components/portal/charts/ChartRegistry";
import type { ChartOptions } from "chart.js";

import { RoleGate } from "@/components/portal/RoleGate";
import { PageHeader } from "@/components/portal/PageHeader";
import { ClassSelector } from "@/components/portal/ClassSelector";
import { Card } from "@/components/portal/ui/Card";
import { StatTile } from "@/components/portal/ui/StatTile";
import { Badge } from "@/components/portal/ui/Badge";
import { ChartCard } from "@/components/portal/charts/ChartCard";
import {
    CHART_PALETTE,
    CHART_INK,
    CHART_MUTED,
    CHART_GRID,
    scoreBucket,
} from "@/components/portal/ui/theme";
import {
    listClasses,
    listStudents,
    listSubjects,
    listAllResults,
    listStaff,
} from "@/lib/portal/data";
import { EXAM_TYPES as EXAM_TYPE_OPTIONS, examLabel } from "@/lib/portal/academic";
import type {
    Result,
    SchoolClass,
    Student,
    Subject,
    ExamType,
} from "@/domain/portal/types";

const EXAM_TYPES: ExamType[] = EXAM_TYPE_OPTIONS.map((e) => e.value);

export default function KpiPage() {
    return (
        <RoleGate allow={["admin"]}>
            <KpiView />
        </RoleGate>
    );
}

interface Loaded {
    classes: SchoolClass[];
    students: Map<string, Student>;
    subjects: Map<string, Subject>;
    results: Result[];
    // uid → name for every teacher/staff, including deactivated ones whose results remain.
    users: Map<string, string>;
    activeStaffCount: number;
}

function KpiView() {
    const [data, setData] = useState<Loaded | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [matrixClassId, setMatrixClassId] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const [classes, subjects, results, teachers] = await Promise.all([
                    listClasses(),
                    listSubjects(),
                    listAllResults(),
                    listStaff(),
                ]);
                const studentLists = await Promise.all(
                    classes.map((c) => listStudents(c.id, { includeInactive: true }))
                );
                const studentMap = new Map<string, Student>();
                studentLists.flat().forEach((s) => studentMap.set(s.id, s));
                const subjectMap = new Map(subjects.map((s) => [s.id, s]));
                const userMap = new Map(teachers.map((t) => [t.uid, t.displayName]));
                setData({
                    classes,
                    students: studentMap,
                    subjects: subjectMap,
                    results,
                    users: userMap,
                    activeStaffCount: teachers.filter((t) => t.isActive).length,
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load KPIs");
            }
        })();
    }, []);

    if (error) {
        return (
            <div className="p-8">
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
            </div>
        );
    }
    if (!data) return <SkeletonPage />;

    const activeStudents = Array.from(data.students.values()).filter((s) => s.isActive);
    const overallAvg = data.results.length
        ? data.results.reduce((n, r) => n + pct(r), 0) / data.results.length
        : 0;
    const topPct = data.results.length ? Math.max(...data.results.map(pct)) : 0;

    return (
        <div>
            <PageHeader
                eyebrow="Analytics"
                title="KPIs & Analytics"
                subtitle="Aggregated performance across the current academic year. Hover any bar or point for details; click ↗ on a chart for full screen."
            />

            <div className="space-y-8 p-4 md:p-8">
                {/* Hero stat row */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatTile tone="brand" label="Active students" value={activeStudents.length} hint={`${data.classes.length} classes`} />
                    <StatTile label="Teachers & staff" value={data.activeStaffCount} hint="active portal accounts" />
                    <StatTile
                        tone={overallAvg >= 70 ? "positive" : overallAvg >= 55 ? "default" : "warning"}
                        label="School average"
                        value={overallAvg.toFixed(1)}
                        suffix="%"
                        hint={`${data.results.length.toLocaleString()} exam records`}
                    />
                    <StatTile tone="positive" label="Top score" value={topPct.toFixed(0)} suffix="%" />
                </div>

                {/* School-wide overview */}
                <SectionTitle label="Overview" desc="School-wide performance." />
                <div className="grid gap-6 lg:grid-cols-2">
                    <PerTeacherChart data={data} />
                    <PerClassChart data={data} />
                    <SubjectByClassChart data={data} />
                </div>

                {/* Teacher × Class deep-dive */}
                <SectionTitle label="Teacher × Class" desc="Drill into one teacher's outcomes in one class." />
                <TeacherClassDeepDive data={data} />

                {/* Student trend */}
                <SectionTitle
                    label="Student trend"
                    desc="Track one student across their subjects, exams, and full exam history over time."
                />
                <div className="grid gap-6 lg:grid-cols-2">
                    <StudentTrendCard data={data} />
                    <StudentProgressCard data={data} />
                </div>

                {/* Results matrix */}
                <SectionTitle label="Results matrix" desc="Latest exam per student × subject." />
                <ChartCard
                    title="Student results (latest exam)"
                    subtitle="Subject-wise marks per student for the selected class. Roll and Student columns are frozen while you scroll."
                    filters={
                        <label className="flex items-center gap-2 text-xs text-slate-700">
                            <span className="font-semibold uppercase tracking-widest text-slate-500">Class</span>
                            <ClassSelector value={matrixClassId} onChange={setMatrixClassId} />
                        </label>
                    }
                    heightClass="max-h-96 overflow-auto"
                    fullscreenHeightClass="max-h-[80vh] overflow-auto"
                >
                    <ResultsMatrix data={data} classId={matrixClassId} />
                </ChartCard>
            </div>
        </div>
    );
}

// ── layout helpers ─────────────────────────────────

function SectionTitle({ label, desc }: { label: string; desc: string }) {
    return (
        <div className="flex items-baseline justify-between gap-3 border-b border-slate-200 pb-2">
            <div>
                <h2 className="text-base font-semibold text-slate-900">{label}</h2>
                <p className="text-xs text-slate-500">{desc}</p>
            </div>
        </div>
    );
}

function SkeletonPage() {
    return (
        <div className="p-8">
            <div className="animate-pulse space-y-4">
                <div className="h-16 rounded-xl bg-slate-100" />
                <div className="grid gap-4 md:grid-cols-4">
                    {[0, 1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-slate-100" />)}
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    {[0, 1, 2, 3].map((i) => <div key={i} className="h-72 rounded-xl bg-slate-100" />)}
                </div>
            </div>
        </div>
    );
}

// ── numeric helpers ────────────────────────────────

function pct(r: Result) {
    return r.totalMarks > 0 ? (r.marksObtained / r.totalMarks) * 100 : 0;
}

function averageBy<K>(results: Result[], keyFn: (r: Result) => K): Map<K, number> {
    const sum = new Map<K, { total: number; count: number }>();
    for (const r of results) {
        const k = keyFn(r);
        const prev = sum.get(k) ?? { total: 0, count: 0 };
        prev.total += pct(r);
        prev.count += 1;
        sum.set(k, prev);
    }
    return new Map(Array.from(sum.entries()).map(([k, v]) => [k, v.count > 0 ? v.total / v.count : 0]));
}

// ── chart option builders ──────────────────────────

// Axis builders — every chart labels both axes explicitly.
function yPercentAxis(title = "Percentage (%)") {
    return {
        beginAtZero: true,
        max: 100,
        ticks: { color: CHART_MUTED, font: { size: 11 }, callback: (v: number | string) => `${v}%` },
        grid: { color: CHART_GRID },
        border: { display: false },
        title: {
            display: true,
            text: title,
            color: CHART_INK,
            font: { size: 11, weight: 600 },
            padding: { bottom: 4 },
        },
    };
}

function xAxis(title: string) {
    return {
        ticks: { color: CHART_INK, font: { size: 11 } },
        grid: { display: false },
        border: { color: CHART_GRID },
        title: {
            display: true,
            text: title,
            color: CHART_INK,
            font: { size: 11, weight: 600 },
            padding: { top: 8 },
        },
    };
}

function makeBarOpts(xTitle: string, yTitle = "Percentage (%)"): ChartOptions<"bar"> {
    return {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 20 } },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: "#0f172a",
                padding: 10,
                titleFont: { size: 12, weight: "bold" },
                bodyFont: { size: 12 },
                displayColors: false,
                callbacks: { label: (ctx) => `${ctx.formattedValue}%` },
            },
        },
        scales: { y: yPercentAxis(yTitle), x: xAxis(xTitle) },
        animation: { duration: 400 },
    };
}

function makeGroupedBarOpts(xTitle: string, yTitle = "Percentage (%)"): ChartOptions<"bar"> {
    const opts = makeBarOpts(xTitle, yTitle);
    return {
        ...opts,
        plugins: {
            ...opts.plugins,
            legend: {
                display: true,
                position: "bottom",
                labels: { boxWidth: 10, boxHeight: 10, padding: 12, font: { size: 11 }, color: CHART_INK },
            },
            tooltip: {
                ...opts.plugins?.tooltip,
                displayColors: true,
                callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.formattedValue}%` },
            },
        },
    };
}

function makeLineOpts(xTitle: string, yTitle = "Percentage (%)"): ChartOptions<"line"> {
    return {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 20 } },
        plugins: {
            legend: {
                position: "bottom",
                labels: { boxWidth: 10, boxHeight: 10, padding: 12, font: { size: 11 }, color: CHART_INK },
            },
            tooltip: {
                backgroundColor: "#0f172a",
                padding: 10,
                callbacks: { label: (c) => `${c.dataset.label}: ${c.formattedValue}%` },
            },
        },
        scales: { y: yPercentAxis(yTitle), x: xAxis(xTitle) },
    };
}

const doughnutOpts: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: 8 },
    cutout: "62%",
    plugins: {
        legend: {
            position: "right",
            labels: { boxWidth: 10, boxHeight: 10, padding: 10, font: { size: 11 }, color: CHART_INK },
        },
        tooltip: {
            backgroundColor: "#0f172a",
            padding: 10,
            callbacks: {
                label: (c) => `${c.label}: ${c.parsed} student${c.parsed === 1 ? "" : "s"}`,
            },
        },
    },
};

function barDataset(values: number[], color: string, label = "Avg %") {
    return {
        label,
        data: values,
        backgroundColor: color,
        hoverBackgroundColor: color,
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 44,
    };
}

// ── school-wide charts ─────────────────────────────

function PerTeacherChart({ data }: { data: Loaded }) {
    const entries = useMemo(() => {
        const buckets = averageBy(data.results, (r) => r.teacherId);
        return Array.from(buckets.entries())
            .map(([uid, avg]) => ({ label: data.users.get(uid) ?? (uid ? uid.slice(0, 6) : "Unassigned"), avg }))
            .sort((a, b) => b.avg - a.avg);
    }, [data]);

    if (entries.length === 0) return <EmptyChart title="Avg by teacher" />;
    const best = entries[0];

    return (
        <ChartCard
            title="Average performance by teacher"
            subtitle="Percent across all subjects and exams they own."
            action={<Badge tone="positive">Top · {best.avg.toFixed(1)}%</Badge>}
        >
            <Bar
                data={{
                    labels: entries.map((e) => e.label),
                    datasets: [barDataset(entries.map((e) => Number(e.avg.toFixed(1))), CHART_PALETTE[0])],
                }}
                options={makeBarOpts("Teacher")}
            />
        </ChartCard>
    );
}

function PerClassChart({ data }: { data: Loaded }) {
    const entries = useMemo(() => {
        const buckets = averageBy(data.results, (r) => r.classId);
        return Array.from(buckets.entries())
            .map(([id, avg]) => ({
                label: data.classes.find((c) => c.id === id)?.name ?? id.slice(0, 6),
                avg,
            }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [data]);

    if (entries.length === 0) return <EmptyChart title="Avg by class" />;

    return (
        <ChartCard
            title="Average performance by class"
            subtitle="Aggregate percent per class across all subjects."
        >
            <Bar
                data={{
                    labels: entries.map((e) => e.label),
                    datasets: [barDataset(entries.map((e) => Number(e.avg.toFixed(1))), CHART_PALETTE[2])],
                }}
                options={makeBarOpts("Class")}
            />
        </ChartCard>
    );
}

function SubjectByClassChart({ data }: { data: Loaded }) {
    const { subjectNames, classDatasets } = useMemo(() => {
        const subjects = new Set<string>();
        for (const s of data.subjects.values()) subjects.add(s.name);
        const subjectNames = Array.from(subjects).sort();
        const classDatasets = data.classes
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((cls, i) => {
                const values = subjectNames.map((subName) => {
                    const relevant = data.results.filter((r) => {
                        const sub = data.subjects.get(r.subjectId);
                        return sub?.name === subName && r.classId === cls.id;
                    });
                    if (relevant.length === 0) return null;
                    return Number((relevant.reduce((n, r) => n + pct(r), 0) / relevant.length).toFixed(1));
                });
                return {
                    label: cls.name,
                    data: values,
                    backgroundColor: CHART_PALETTE[i % CHART_PALETTE.length],
                    hoverBackgroundColor: CHART_PALETTE[i % CHART_PALETTE.length],
                    borderRadius: 6,
                    borderSkipped: false,
                    maxBarThickness: 32,
                };
            });
        return { subjectNames, classDatasets };
    }, [data]);

    if (subjectNames.length === 0) return null;

    return (
        <ChartCard
            title="Average performance by subject × class"
            subtitle="Grouped bars — one class per color. Read left-to-right per subject."
            className="lg:col-span-2"
            heightClass="h-80"
        >
            <Bar
                data={{ labels: subjectNames, datasets: classDatasets }}
                options={makeGroupedBarOpts("Subject")}
            />
        </ChartCard>
    );
}

// ── Teacher × Class deep-dive ──────────────────────

/**
 * Small reusable filter block. Each deep-dive card owns its own state so
 * users can compare different (teacher, class) combos side by side, and
 * the filter is present inside the fullscreen modal.
 */
function useTeacherClassFilters(data: Loaded) {
    const teacherIds = useMemo(() => Array.from(data.users.keys()), [data]);
    const [teacherId, setTeacherId] = useState(teacherIds[0] ?? "");
    const [classId, setClassId] = useState(data.classes[0]?.id ?? "");

    const filters = (
        <>
            <label className="flex items-center gap-2 text-xs text-slate-700">
                <span className="font-semibold uppercase tracking-widest text-slate-500">Teacher</span>
                <select
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-blue-500"
                >
                    {teacherIds.map((uid) => (
                        <option key={uid} value={uid}>{data.users.get(uid)}</option>
                    ))}
                </select>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700">
                <span className="font-semibold uppercase tracking-widest text-slate-500">Class</span>
                <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-blue-500"
                >
                    {data.classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </label>
        </>
    );

    return { teacherId, classId, filters };
}

function scopeLabel(data: Loaded, teacherId: string, classId: string) {
    const teacher = data.users.get(teacherId) ?? "?";
    const cls = data.classes.find((c) => c.id === classId)?.name ?? "?";
    return `${teacher} · ${cls}`;
}

function TeacherClassDeepDive({ data }: { data: Loaded }) {
    return (
        <div className="grid gap-6 lg:grid-cols-3">
            <ScoreDistributionCard data={data} />
            <SubjectAverageCard data={data} />
            <ExamTrendCard data={data} />
        </div>
    );
}

function ScoreDistributionCard({ data }: { data: Loaded }) {
    const { teacherId, classId, filters } = useTeacherClassFilters(data);
    const scoped = useMemo(
        () => data.results.filter((r) => r.teacherId === teacherId && r.classId === classId),
        [data, teacherId, classId]
    );
    // For each student, take their AVERAGE percent (across all their exams under this teacher/class)
    // then bucket that average. This answers "how many students are performing at each level".
    const perStudent = useMemo(() => {
        const map = new Map<string, { total: number; count: number }>();
        for (const r of scoped) {
            const prev = map.get(r.studentId) ?? { total: 0, count: 0 };
            prev.total += pct(r);
            prev.count += 1;
            map.set(r.studentId, prev);
        }
        return Array.from(map.entries()).map(([sid, v]) => ({ sid, avg: v.total / v.count }));
    }, [scoped]);

    const buckets = useMemo(() => {
        const b = {
            gt80: 0,
            gt70: 0,
            gt60: 0,
            gt50: 0,
            gt40: 0,
            below: 0,
        };
        for (const p of perStudent) {
            if (p.avg > 80) b.gt80++;
            else if (p.avg > 70) b.gt70++;
            else if (p.avg > 60) b.gt60++;
            else if (p.avg > 50) b.gt50++;
            else if (p.avg > 40) b.gt40++;
            else b.below++;
        }
        return b;
    }, [perStudent]);

    const totalStudents = perStudent.length;
    const bucketColors = ["#059669", "#0284c7", "#eda100", "#eb6834", "#a16207", "#dc2626"];
    const chartData = {
        labels: [">80%", ">70%", ">60%", ">50%", ">40%", "≤40%"],
        datasets: [
            {
                data: [buckets.gt80, buckets.gt70, buckets.gt60, buckets.gt50, buckets.gt40, buckets.below],
                backgroundColor: bucketColors,
                borderColor: "#fff",
                borderWidth: 2,
            },
        ],
    };

    return (
        <ChartCard
            title="Score distribution"
            subtitle={`Student averages bucketed. ${scopeLabel(data, teacherId, classId)}.`}
            filters={filters}
            heightClass="h-64"
        >
            {totalStudents === 0 ? (
                <EmptyBody>No results for this teacher × class combination.</EmptyBody>
            ) : (
                <div className="relative h-full">
                    <Doughnut data={chartData} options={doughnutOpts} />
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center" style={{ paddingRight: 90 }}>
                        <div className="text-2xl font-semibold text-slate-900">{totalStudents}</div>
                        <div className="text-[10px] uppercase tracking-widest text-slate-500">students</div>
                    </div>
                </div>
            )}
        </ChartCard>
    );
}

function SubjectAverageCard({ data }: { data: Loaded }) {
    const { teacherId, classId, filters } = useTeacherClassFilters(data);
    const scoped = useMemo(
        () => data.results.filter((r) => r.teacherId === teacherId && r.classId === classId),
        [data, teacherId, classId]
    );
    const entries = useMemo(() => {
        const buckets = averageBy(scoped, (r) => r.subjectId);
        return Array.from(buckets.entries())
            .map(([sid, avg]) => ({ label: data.subjects.get(sid)?.name ?? sid.slice(0, 6), avg }))
            .sort((a, b) => b.avg - a.avg);
    }, [scoped, data]);

    return (
        <ChartCard
            title="Subject averages"
            subtitle={`Per-subject percent. ${scopeLabel(data, teacherId, classId)}.`}
            filters={filters}
            heightClass="h-64"
        >
            {entries.length === 0 ? (
                <EmptyBody>No results here yet.</EmptyBody>
            ) : (
                <Bar
                    data={{
                        labels: entries.map((e) => e.label),
                        datasets: [barDataset(entries.map((e) => Number(e.avg.toFixed(1))), CHART_PALETTE[3])],
                    }}
                    options={makeBarOpts("Subject")}
                />
            )}
        </ChartCard>
    );
}

type ExamTypeFilter = ExamType | "all";

function ExamTrendCard({ data }: { data: Loaded }) {
    const { teacherId, classId, filters: tcFilters } = useTeacherClassFilters(data);
    const [examTypeFilter, setExamTypeFilter] = useState<ExamTypeFilter>("all");

    const filters = (
        <>
            {tcFilters}
            <label className="flex items-center gap-2 text-xs text-slate-700">
                <span className="font-semibold uppercase tracking-widest text-slate-500">Show</span>
                <select
                    value={examTypeFilter}
                    onChange={(e) => setExamTypeFilter(e.target.value as ExamTypeFilter)}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-blue-500"
                >
                    <option value="all">All exam types</option>
                    {EXAM_TYPES.map((et) => (
                        <option key={et} value={et}>Only {labelForExam(et)}s</option>
                    ))}
                </select>
            </label>
        </>
    );

    const scoped = useMemo(
        () => data.results.filter((r) => r.teacherId === teacherId && r.classId === classId && r.examDate),
        [data, teacherId, classId]
    );

    // When "all" — one point per exam type (mean of all sittings of that type).
    // When one type — chronological line across every sitting of that type.
    const chart = useMemo(() => {
        if (examTypeFilter === "all") {
            const values = EXAM_TYPES.map((et) => {
                const rs = scoped.filter((r) => r.examType === et);
                if (rs.length === 0) return null;
                return Number((rs.reduce((n, r) => n + pct(r), 0) / rs.length).toFixed(1));
            });
            return {
                labels: EXAM_TYPES.map(labelForExam),
                values,
                xTitle: "Exam type",
                seriesLabel: "Average across sittings",
                hasData: values.some((v) => v !== null),
            };
        }
        // single exam type — chronological sittings
        const rs = scoped.filter((r) => r.examType === examTypeFilter).sort((a, b) => a.examDate.localeCompare(b.examDate));
        const sittings = Array.from(
            new Map(
                rs.map((r) => [`${r.examDate}#${r.examNumber}`, { date: r.examDate, num: r.examNumber }])
            ).values()
        ).sort((a, b) => a.date.localeCompare(b.date));
        const values = sittings.map((sit) => {
            const rows = rs.filter((r) => r.examDate === sit.date && r.examNumber === sit.num);
            if (rows.length === 0) return null;
            return Number((rows.reduce((n, r) => n + pct(r), 0) / rows.length).toFixed(1));
        });
        const labels = sittings.map((s) => {
            const d = new Date(s.date);
            return `#${s.num} · ${d.toLocaleString("en-IN", { month: "short" })} ${d.getFullYear() % 100}`;
        });
        return {
            labels,
            values,
            xTitle: `${labelForExam(examTypeFilter)} number · date`,
            seriesLabel: `${labelForExam(examTypeFilter)} average`,
            hasData: sittings.length > 0,
        };
    }, [scoped, examTypeFilter]);

    const subtitle =
        examTypeFilter === "all"
            ? `All 3 exam types averaged. ${scopeLabel(data, teacherId, classId)}.`
            : `Every ${labelForExam(examTypeFilter)} sitting, chronological. ${scopeLabel(data, teacherId, classId)}.`;

    return (
        <ChartCard
            title="Class average trend"
            subtitle={subtitle}
            filters={filters}
            heightClass="h-64"
        >
            {!chart.hasData ? (
                <EmptyBody>No results here yet.</EmptyBody>
            ) : (
                <Line
                    data={{
                        labels: chart.labels,
                        datasets: [
                            {
                                label: chart.seriesLabel,
                                data: chart.values,
                                borderColor: CHART_PALETTE[6],
                                backgroundColor: "rgba(74, 58, 167, 0.12)",
                                pointBackgroundColor: CHART_PALETTE[6],
                                pointBorderColor: "#fff",
                                pointBorderWidth: 2,
                                pointRadius: 5,
                                pointHoverRadius: 7,
                                borderWidth: 2,
                                tension: 0.3,
                                fill: true,
                                spanGaps: true,
                            },
                        ],
                    }}
                    options={makeLineOpts(chart.xTitle)}
                />
            )}
        </ChartCard>
    );
}

// ── Student trend ──────────────────────────────────

function StudentTrendCard({ data }: { data: Loaded }) {
    const activeStudents = useMemo(
        () => Array.from(data.students.values()).filter((s) => s.isActive).sort((a, b) => a.name.localeCompare(b.name)),
        [data]
    );
    const [classFilterId, setClassFilterId] = useState<string>(data.classes[0]?.id ?? "");
    const studentsInClass = useMemo(
        () => activeStudents.filter((s) => s.classId === classFilterId),
        [activeStudents, classFilterId]
    );
    const [studentId, setStudentId] = useState(studentsInClass[0]?.id ?? "");

    useEffect(() => {
        if (studentsInClass.length === 0) {
            if (studentId) setStudentId("");
            return;
        }
        if (!studentsInClass.some((s) => s.id === studentId)) {
            setStudentId(studentsInClass[0].id);
        }
    }, [studentsInClass, studentId]);

    const student = data.students.get(studentId);

    // For each subject × exam-type bucket, average all sittings this student
    // has in that bucket. (Unit Test can appear 6 times per subject — before
    // this fix we were picking whichever result was returned first.)
    const chart = useMemo(() => {
        if (!studentId) return null;
        const rs = data.results.filter((r) => r.studentId === studentId);
        const subjectIds = Array.from(new Set(rs.map((r) => r.subjectId)));

        // Track sitting counts per (exam type) for the axis label / subtitle.
        const sittingCounts: Record<ExamType, number> = { baseline: 0, "internal-assessment": 0, summative: 0 };
        for (const et of EXAM_TYPES) {
            sittingCounts[et] = new Set(
                rs.filter((r) => r.examType === et).map((r) => `${r.examDate}#${r.examNumber}`)
            ).size;
        }

        const datasets = subjectIds.map((sid, i) => {
            const subject = data.subjects.get(sid);
            const values = EXAM_TYPES.map((et) => {
                const rows = rs.filter((r) => r.subjectId === sid && r.examType === et);
                if (rows.length === 0) return null;
                const mean = rows.reduce((n, r) => n + pct(r), 0) / rows.length;
                return Number(mean.toFixed(1));
            });
            const color = CHART_PALETTE[i % CHART_PALETTE.length];
            return {
                label: subject?.name ?? sid.slice(0, 6),
                data: values,
                borderColor: color,
                backgroundColor: color,
                pointBackgroundColor: color,
                pointBorderColor: "#fff",
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 7,
                borderWidth: 2,
                tension: 0.25,
                spanGaps: true,
            };
        });

        const labels = EXAM_TYPES.map((et) => {
            const n = sittingCounts[et];
            return n > 1 ? `${labelForExam(et)} (avg of ${n})` : labelForExam(et);
        });

        return {
            labels,
            datasets,
            hasData: datasets.length > 0,
            sittingCounts,
        };
    }, [data, studentId]);

    const cls = student ? data.classes.find((c) => c.id === student.classId) : null;

    const filters = (
        <>
            <label className="flex items-center gap-2 text-xs text-slate-700">
                <span className="font-semibold uppercase tracking-widest text-slate-500">Class</span>
                <select
                    value={classFilterId}
                    onChange={(e) => setClassFilterId(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-blue-500"
                >
                    {data.classes
                        .slice()
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                </select>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700">
                <span className="font-semibold uppercase tracking-widest text-slate-500">Student</span>
                <select
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    disabled={studentsInClass.length === 0}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-blue-500 disabled:opacity-60"
                >
                    {studentsInClass.length === 0 ? (
                        <option value="">No students in this class</option>
                    ) : (
                        studentsInClass.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))
                    )}
                </select>
            </label>
        </>
    );

    const subtitle = student
        ? `${student.name} · ${cls?.name ?? ""} — one point per exam type, averaged across all sittings.`
        : "Pick a student";

    return (
        <ChartCard
            title="Per-student trend by exam type"
            subtitle={subtitle}
            filters={filters}
            heightClass="h-80"
        >
            {!chart || !chart.hasData ? (
                <EmptyBody>No results yet for this student.</EmptyBody>
            ) : (
                <Line data={chart} options={makeLineOpts("Exam type (mean of sittings)")} />
            )}
        </ChartCard>
    );
}

// ── Student progress over time (filter by exam type) ────

function StudentProgressCard({ data }: { data: Loaded }) {
    const activeStudents = useMemo(
        () => Array.from(data.students.values()).filter((s) => s.isActive).sort((a, b) => a.name.localeCompare(b.name)),
        [data]
    );
    const [classFilterId, setClassFilterId] = useState<string>(data.classes[0]?.id ?? "");
    const studentsInClass = useMemo(
        () => activeStudents.filter((s) => s.classId === classFilterId),
        [activeStudents, classFilterId]
    );
    const [studentId, setStudentId] = useState(studentsInClass[0]?.id ?? "");
    const [examType, setExamType] = useState<ExamType>("internal-assessment");

    // Reset selected student when class changes and the current pick isn't in it.
    useEffect(() => {
        if (studentsInClass.length === 0) {
            if (studentId) setStudentId("");
            return;
        }
        if (!studentsInClass.some((s) => s.id === studentId)) {
            setStudentId(studentsInClass[0].id);
        }
    }, [studentsInClass, studentId]);

    const student = data.students.get(studentId);
    const cls = student ? data.classes.find((c) => c.id === student.classId) : null;

    // Filter this student's results to the selected exam type, sort by date,
    // and pivot into one series per subject.
    const chart = useMemo(() => {
        if (!studentId) return null;
        const rs = data.results
            .filter((r) => r.studentId === studentId && r.examType === examType && r.examDate)
            .sort((a, b) => a.examDate.localeCompare(b.examDate));

        // Build a sorted list of unique exam sittings (date + number label).
        const sittings = Array.from(
            new Map(
                rs.map((r) => [`${r.examDate}#${r.examNumber}`, { date: r.examDate, num: r.examNumber }])
            ).values()
        ).sort((a, b) => a.date.localeCompare(b.date));

        const subjectIds = Array.from(new Set(rs.map((r) => r.subjectId)));
        const datasets = subjectIds.map((sid, i) => {
            const subject = data.subjects.get(sid);
            const color = CHART_PALETTE[i % CHART_PALETTE.length];
            const values = sittings.map((sit) => {
                const rec = rs.find(
                    (r) => r.subjectId === sid && r.examDate === sit.date && r.examNumber === sit.num
                );
                return rec ? Number(pct(rec).toFixed(1)) : null;
            });
            return {
                label: subject?.name ?? sid.slice(0, 6),
                data: values,
                borderColor: color,
                backgroundColor: color,
                pointBackgroundColor: color,
                pointBorderColor: "#fff",
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                borderWidth: 2,
                tension: 0.25,
                spanGaps: true,
            };
        });

        const labels = sittings.map((s) => {
            const d = new Date(s.date);
            const monthShort = d.toLocaleString("en-IN", { month: "short" });
            return `#${s.num} · ${monthShort} ${d.getFullYear() % 100}`;
        });

        // Overall = average across every subject at each sitting.
        // Presented as a bold slate line so it doesn't compete with the categorical hues.
        const overallValues = sittings.map((sit) => {
            const rows = rs.filter((r) => r.examDate === sit.date && r.examNumber === sit.num);
            if (rows.length === 0) return null;
            return Number((rows.reduce((n, r) => n + pct(r), 0) / rows.length).toFixed(1));
        });
        const overallDataset = {
            label: "Total (all subjects avg)",
            data: overallValues,
            borderColor: "#0f172a",
            backgroundColor: "rgba(15, 23, 42, 0.08)",
            pointBackgroundColor: "#0f172a",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
            borderWidth: 3,
            borderDash: [6, 4],
            tension: 0.25,
            spanGaps: true,
            fill: true,
            order: 0,
        };
        // Push subject datasets behind the Total line so Total reads on top.
        const datasetsWithOverall = [
            overallDataset,
            ...datasets.map((d) => ({ ...d, order: 1 })),
        ];

        return {
            labels,
            datasets: datasetsWithOverall,
            hasData: datasets.length > 0 && sittings.length > 0,
            sittingCount: sittings.length,
        };
    }, [data, studentId, examType]);

    const filters = (
        <>
            <label className="flex items-center gap-2 text-xs text-slate-700">
                <span className="font-semibold uppercase tracking-widest text-slate-500">Class</span>
                <select
                    value={classFilterId}
                    onChange={(e) => setClassFilterId(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-blue-500"
                >
                    {data.classes
                        .slice()
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                </select>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700">
                <span className="font-semibold uppercase tracking-widest text-slate-500">Student</span>
                <select
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    disabled={studentsInClass.length === 0}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-blue-500 disabled:opacity-60"
                >
                    {studentsInClass.length === 0 ? (
                        <option value="">No students in this class</option>
                    ) : (
                        studentsInClass.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))
                    )}
                </select>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700">
                <span className="font-semibold uppercase tracking-widest text-slate-500">Exam type</span>
                <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value as ExamType)}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-blue-500"
                >
                    {EXAM_TYPES.map((et) => (
                        <option key={et} value={et}>{labelForExam(et)}</option>
                    ))}
                </select>
            </label>
        </>
    );

    return (
        <ChartCard
            title="Student progress over time"
            subtitle={
                student
                    ? `${student.name} · ${cls?.name ?? ""} · ${labelForExam(examType)}s${chart?.sittingCount ? ` · ${chart.sittingCount} sittings` : ""}`
                    : "Pick a student"
            }
            filters={filters}
            heightClass="h-80"
            className="lg:col-span-2"
        >
            {!chart || !chart.hasData ? (
                <EmptyBody>No {labelForExam(examType).toLowerCase()} history for this student.</EmptyBody>
            ) : (
                <Line data={chart} options={makeLineOpts(`${labelForExam(examType)} number · date`)} />
            )}
        </ChartCard>
    );
}

// ── shared bits ────────────────────────────────────

function EmptyChart({ title }: { title: string }) {
    return (
        <Card>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            <div className="mt-4 flex h-52 items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-500">
                No data yet.
            </div>
        </Card>
    );
}

function EmptyBody({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-full items-center justify-center text-sm text-slate-500">
            {children}
        </div>
    );
}

function labelForExam(e: ExamType) {
    return examLabel(e);
}

// ── results matrix ─────────────────────────────────

function ResultsMatrix({ data, classId }: { data: Loaded; classId: string | null }) {
    const filtered = useMemo(() => {
        if (!classId) return null;
        const subjects = Array.from(data.subjects.values())
            .filter((s) => s.classId === classId)
            .sort((a, b) => a.name.localeCompare(b.name));
        const studentIds = Array.from(data.students.values())
            .filter((s) => s.classId === classId && s.isActive)
            .sort((a, b) => (a.rollNo ?? "").localeCompare(b.rollNo ?? "") || a.name.localeCompare(b.name));
        const cellFor = (studentId: string, subjectId: string) => {
            const rs = data.results.filter((r) => r.studentId === studentId && r.subjectId === subjectId);
            if (rs.length === 0) return null;
            const latest = rs.sort((a, b) => b.createdAt - a.createdAt)[0];
            return {
                marks: latest.marksObtained,
                total: latest.totalMarks,
                examType: latest.examType,
                p: latest.totalMarks > 0 ? (latest.marksObtained / latest.totalMarks) * 100 : 0,
            };
        };
        return { subjects, students: studentIds, cellFor };
    }, [data, classId]);

    if (!classId) return <div className="p-6 text-sm text-slate-500">Pick a class to see the results table.</div>;
    if (!filtered || filtered.students.length === 0)
        return <div className="p-6 text-sm text-slate-500">No active students in this class.</div>;

    return (
        <table className="min-w-full text-sm">
            <thead>
                <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-widest text-slate-500">
                    <th className="sticky top-0 left-0 z-30 bg-slate-50 px-5 py-3 font-semibold">Roll</th>
                    <th className="sticky top-0 left-14 z-30 bg-slate-50 px-4 py-3 font-semibold">Student</th>
                    {filtered.subjects.map((s) => (
                        <th key={s.id} className="sticky top-0 z-20 whitespace-nowrap bg-slate-50 px-4 py-3 font-semibold">{s.name}</th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {filtered.students.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/60">
                        <td className="sticky left-0 z-10 bg-white px-5 py-3 text-xs text-slate-500 hover:bg-slate-50/60">
                            {s.rollNo ?? "—"}
                        </td>
                        <td className="sticky left-14 z-10 bg-white px-4 py-3 font-medium text-slate-900 hover:bg-slate-50/60">
                            {s.name}
                        </td>
                        {filtered.subjects.map((sub) => {
                            const cell = filtered.cellFor(s.id, sub.id);
                            if (!cell) return <td key={sub.id} className="px-4 py-3 text-slate-300">—</td>;
                            const bucket = scoreBucket(cell.p);
                            return (
                                <td key={sub.id} className="px-4 py-3">
                                    <span
                                        title={`${labelForExam(cell.examType)} · ${cell.p.toFixed(0)}%`}
                                        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium tabular-nums ${bucket.bg} ${bucket.fg}`}
                                    >
                                        {cell.marks}<span className="text-[10px] opacity-70">/{cell.total}</span>
                                    </span>
                                </td>
                            );
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
