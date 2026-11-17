"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RoleGate } from "@/components/portal/RoleGate";
import { ClassSelector } from "@/components/portal/ClassSelector";
import { ExportButton } from "@/components/portal/ExportButton";
import { useAuth } from "@/components/portal/AuthContext";
import {
    listStudents,
    listSubjects,
    listResults,
    listExamResults,
    upsertResult,
} from "@/lib/portal/data";
import { EXAM_TYPES, currentAcademicYear, examLabel } from "@/lib/portal/academic";
import { examSheet, exportWorkbook, fileSlug, sittingName, type ExportSheet } from "@/lib/portal/exportExcel";
import type {
    ExamType,
    Result,
    SchoolClass,
    Student,
    Subject,
} from "@/domain/portal/types";

// Max marks offered when a sitting has no results yet. Classes IX–X use 50
// for Internal Assessments and 100 for Summatives; change "Total" there.
// Subject tests vary — set "Total" to whatever the test was out of.
const DEFAULT_TOTALS: Record<ExamType, number> = {
    baseline: 25,
    "internal-assessment": 25,
    summative: 50,
    "subject-test": 20,
};

export default function ResultsPage() {
    return (
        <RoleGate allow={["admin", "teacher", "staff"]}>
            <ResultsView />
        </RoleGate>
    );
}

function ResultsView() {
    const { firebaseUser, role } = useAuth();
    const canEdit = role === "admin" || role === "teacher" || role === "staff";

    const [classId, setClassId] = useState<string | null>(null);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const onClassesLoaded = useCallback((list: SchoolClass[]) => setClasses(list), []);
    const [subjectId, setSubjectId] = useState<string | null>(null);
    const [examType, setExamType] = useState<ExamType>("internal-assessment");
    const [examNumber, setExamNumber] = useState<number>(1);
    const [examDate, setExamDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [marks, setMarks] = useState<Record<string, string>>({});
    // Mark boxes in roll order, so Enter can move to the next student.
    const markInputs = useRef<(HTMLInputElement | null)[]>([]);
    const [totalMarks, setTotalMarks] = useState<number>(25);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    // subjects when class changes
    useEffect(() => {
        if (!classId) return;
        listSubjects(classId).then((list) => {
            list.sort((a, b) => a.name.localeCompare(b.name));
            setSubjects(list);
            if (list.length > 0) setSubjectId(list[0].id);
            else setSubjectId(null);
        });
    }, [classId]);

    // students + existing results
    const load = useCallback(async () => {
        if (!classId || !subjectId) return;
        setLoading(true);
        setError(null);
        setMessage(null);
        try {
            const [studentList, existingResults] = await Promise.all([
                listStudents(classId),
                listResults({ classId, subjectId }),
            ]);
            studentList.sort(
                (a, b) =>
                    (a.rollNo ?? "").localeCompare(b.rollNo ?? "") ||
                    a.name.localeCompare(b.name)
            );
            setStudents(studentList);
            const filtered = existingResults.filter(
                (r) =>
                    r.examType === examType &&
                    r.examNumber === examNumber &&
                    r.academicYear === currentAcademicYear()
            );
            const marksMap: Record<string, string> = {};
            filtered.forEach((r) => (marksMap[r.studentId] = String(r.marksObtained)));
            setMarks(marksMap);
            if (filtered[0]) {
                setTotalMarks(filtered[0].totalMarks);
                if (filtered[0].examDate) setExamDate(filtered[0].examDate);
            } else {
                setTotalMarks(DEFAULT_TOTALS[examType]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load results");
        } finally {
            setLoading(false);
        }
    }, [classId, subjectId, examType, examNumber]);

    useEffect(() => {
        load();
    }, [load]);

    const currentSubject = useMemo(
        () => subjects.find((s) => s.id === subjectId) ?? null,
        [subjects, subjectId]
    );

    // Enter moves to the next student's mark (Shift+Enter to the previous one) with
    // its value selected, so a whole class can be typed without the mouse.
    function handleMarkKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
        if (e.key !== "Enter") return;
        e.preventDefault();
        const target = markInputs.current[index + (e.shiftKey ? -1 : 1)];
        if (!target) {
            e.currentTarget.blur(); // last student: done
            return;
        }
        target.focus({ preventScroll: true });
        target.select();
        // Centred, so neither the sticky header nor the mobile save bar covers it.
        target.scrollIntoView({ block: "center", behavior: "smooth" });
    }

    // This subject's marks as shown, plus — for a school-wide exam — the class's
    // mark sheet for the same sitting with every subject.
    async function handleExport() {
        if (!classId || !currentSubject) return;
        const className = classes.find((c) => c.id === classId)?.name ?? "Class";
        const sitting =
            examType === "subject-test"
                ? `${currentSubject.name} ${examLabel(examType)} ${examNumber}`
                : `${examLabel(examType)}${examType === "baseline" ? "" : ` ${examNumber}`}`;
        const subjectSheet: ExportSheet = {
            name: currentSubject.name,
            header: ["Roll", "Student", "Student ID", `Marks (out of ${totalMarks})`, "%"],
            rows: students.map((s) => {
                const raw = marks[s.id];
                const n = raw === undefined || raw === "" ? null : Number(raw);
                return [s.rollNo ?? "", s.name, s.studentCode ?? "", n, n === null || !totalMarks ? null : n / totalMarks];
            }),
            percentColumns: [4],
        };
        const sheets = [subjectSheet];
        if (examType !== "subject-test") {
            const all = await listExamResults(classId, examType, examNumber, currentAcademicYear());
            sheets.push(examSheet(`${sittingName(examType, examNumber)} all subjects`, students, subjects, all));
        }
        await exportWorkbook(`${fileSlug(className)}_${fileSlug(sitting)}`, sheets);
    }

    async function handleSave() {
        if (!classId || !subjectId || !firebaseUser || !currentSubject) return;
        setSaving(true);
        setError(null);
        setMessage(null);
        try {
            const toSave: Omit<Result, "id" | "createdAt">[] = [];
            for (const s of students) {
                const raw = marks[s.id];
                if (raw === undefined || raw === "") continue;
                const n = Number(raw);
                if (Number.isNaN(n) || n < 0 || n > totalMarks) {
                    throw new Error(`${s.name}: mark must be 0–${totalMarks}`);
                }
                toSave.push({
                    studentId: s.id,
                    subjectId,
                    classId,
                    examType,
                    examNumber,
                    examDate,
                    marksObtained: n,
                    totalMarks,
                    academicYear: currentAcademicYear(),
                    // "" when the subject has no teacher; KPIs show these as "Unassigned".
                    teacherId: currentSubject.teacherId ?? "",
                    uploadedBy: firebaseUser.uid,
                });
            }
            await Promise.all(toSave.map((r) => upsertResult(r)));
            setMessage(`Saved ${toSave.length} result${toSave.length === 1 ? "" : "s"}.`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="pb-24 md:pb-0">
            <div className="sticky top-14 z-20 border-b border-neutral-200 bg-white md:top-0">
                <div className="flex items-center justify-between px-4 py-3 md:px-8">
                    <div>
                        <h1 className="text-base font-semibold text-neutral-900 md:text-lg">Results</h1>
                        <p className="text-xs text-neutral-500">
                            {examType === "subject-test"
                                ? `Subject tests are numbered per subject: ${currentSubject?.name ?? "Mathematics"} Test 1, 2, …`
                                : "Enter marks per student for the selected exam."}{" "}
                            Press Enter to move to the next student.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {classId && subjectId && (
                            <ExportButton onExport={handleExport} disabled={loading || students.length === 0} />
                        )}
                        {canEdit && classId && subjectId && (
                            <button
                                onClick={handleSave}
                                disabled={saving || loading}
                                className="hidden rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 md:inline-block"
                            >
                                {saving ? "Saving…" : "Save all"}
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap gap-3 border-t border-neutral-100 px-4 py-2 text-sm md:px-8">
                    <label className="flex items-center gap-2 text-neutral-700">
                        <span className="text-xs uppercase text-neutral-500">Class</span>
                        <ClassSelector value={classId} onChange={setClassId} onLoad={onClassesLoaded} />
                    </label>
                    <label className="flex items-center gap-2 text-neutral-700">
                        <span className="text-xs uppercase text-neutral-500">Subject</span>
                        <select
                            value={subjectId ?? ""}
                            onChange={(e) => setSubjectId(e.target.value)}
                            disabled={subjects.length === 0}
                            className="rounded border border-neutral-300 px-2 py-1.5 text-sm outline-none focus:border-neutral-900"
                        >
                            {subjects.length === 0 && <option value="">No subjects</option>}
                            {subjects.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </label>
                    <label className="flex items-center gap-2 text-neutral-700">
                        <span className="text-xs uppercase text-neutral-500">Exam</span>
                        <select
                            value={examType}
                            onChange={(e) => setExamType(e.target.value as ExamType)}
                            className="rounded border border-neutral-300 px-2 py-1.5 text-sm outline-none focus:border-neutral-900"
                        >
                            {EXAM_TYPES.map((e) => (
                                <option key={e.value} value={e.value}>{e.label}</option>
                            ))}
                        </select>
                    </label>
                    <label className="flex items-center gap-2 text-neutral-700">
                        <span className="text-xs uppercase text-neutral-500">#</span>
                        <input
                            type="number"
                            min={1}
                            value={examNumber}
                            onChange={(e) => setExamNumber(Math.max(1, Number(e.target.value) || 1))}
                            className="w-16 rounded border border-neutral-300 px-2 py-1.5 text-sm outline-none focus:border-neutral-900"
                        />
                    </label>
                    <label className="flex items-center gap-2 text-neutral-700">
                        <span className="text-xs uppercase text-neutral-500">Date</span>
                        <input
                            type="date"
                            value={examDate}
                            onChange={(e) => setExamDate(e.target.value)}
                            className="rounded border border-neutral-300 px-2 py-1.5 text-sm outline-none focus:border-neutral-900"
                        />
                    </label>
                    <label className="flex items-center gap-2 text-neutral-700">
                        <span className="text-xs uppercase text-neutral-500">Total</span>
                        <input
                            type="number"
                            min={1}
                            value={totalMarks}
                            onChange={(e) => setTotalMarks(Math.max(1, Number(e.target.value) || 0))}
                            className="w-20 rounded border border-neutral-300 px-2 py-1.5 text-sm outline-none focus:border-neutral-900"
                        />
                    </label>
                </div>
            </div>

            <div className="p-4 md:p-8">
                {error && (
                    <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                        {error}
                    </div>
                )}
                {message && (
                    <div className="mb-3 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                        {message}
                    </div>
                )}

                {loading ? (
                    <div className="text-sm text-neutral-500">Loading…</div>
                ) : !classId || !subjectId ? (
                    <div className="rounded border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
                        Select a class and subject.
                    </div>
                ) : students.length === 0 ? (
                    <div className="rounded border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
                        No students in this class.
                    </div>
                ) : (
                    <div className="overflow-hidden rounded border border-neutral-200 bg-white">
                        <ul className="divide-y divide-neutral-100">
                            {students.map((s, i) => {
                                const value = marks[s.id] ?? "";
                                const n = Number(value);
                                // Out of range shows at once, not only when saving.
                                const invalid = value !== "" && (Number.isNaN(n) || n < 0 || n > totalMarks);
                                return (
                                    <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <span className="w-8 shrink-0 text-xs text-neutral-500">{s.rollNo ?? "—"}</span>
                                            <span className="truncate text-sm text-neutral-900">{s.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                ref={(el) => {
                                                    markInputs.current[i] = el;
                                                }}
                                                type="number"
                                                inputMode="numeric"
                                                enterKeyHint={i === students.length - 1 ? "done" : "next"}
                                                min={0}
                                                max={totalMarks}
                                                value={value}
                                                onChange={(e) => setMarks((m) => ({ ...m, [s.id]: e.target.value }))}
                                                onKeyDown={(e) => handleMarkKeyDown(e, i)}
                                                disabled={!canEdit}
                                                aria-label={`${s.name} marks out of ${totalMarks}`}
                                                aria-invalid={invalid}
                                                className={
                                                    "w-20 rounded border px-2 py-1.5 text-right text-sm outline-none " +
                                                    (invalid
                                                        ? "border-red-500 bg-red-50 focus:border-red-600"
                                                        : "border-neutral-300 focus:border-neutral-900")
                                                }
                                                placeholder="—"
                                            />
                                            <span className="text-xs text-neutral-500">/{totalMarks}</span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>

            {canEdit && classId && subjectId && (
                <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white p-3 shadow-lg md:hidden">
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="w-full rounded bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
                    >
                        {saving ? "Saving…" : "Save all"}
                    </button>
                </div>
            )}
        </div>
    );
}
