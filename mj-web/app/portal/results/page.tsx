"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RoleGate } from "@/components/portal/RoleGate";
import { ClassSelector } from "@/components/portal/ClassSelector";
import { useAuth } from "@/components/portal/AuthContext";
import {
    listStudents,
    listSubjects,
    listResults,
    upsertResult,
} from "@/lib/portal/data";
import { EXAM_TYPES, currentAcademicYear } from "@/lib/portal/academic";
import type {
    ExamType,
    Result,
    Student,
    Subject,
} from "@/domain/portal/types";

// Max marks offered when a sitting has no results yet. Classes IX–X use 50
// for Internal Assessments and 100 for Summatives; change "Total" there.
const DEFAULT_TOTALS: Record<ExamType, number> = {
    baseline: 25,
    "internal-assessment": 25,
    summative: 50,
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
    const [subjectId, setSubjectId] = useState<string | null>(null);
    const [examType, setExamType] = useState<ExamType>("internal-assessment");
    const [examNumber, setExamNumber] = useState<number>(1);
    const [examDate, setExamDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [marks, setMarks] = useState<Record<string, string>>({});
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
                        <p className="text-xs text-neutral-500">Enter marks per student for the selected exam.</p>
                    </div>
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
                <div className="flex flex-wrap gap-3 border-t border-neutral-100 px-4 py-2 text-sm md:px-8">
                    <label className="flex items-center gap-2 text-neutral-700">
                        <span className="text-xs uppercase text-neutral-500">Class</span>
                        <ClassSelector value={classId} onChange={setClassId} />
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
                            {students.map((s) => (
                                <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className="w-8 shrink-0 text-xs text-neutral-500">{s.rollNo ?? "—"}</span>
                                        <span className="truncate text-sm text-neutral-900">{s.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            min={0}
                                            max={totalMarks}
                                            value={marks[s.id] ?? ""}
                                            onChange={(e) => setMarks((m) => ({ ...m, [s.id]: e.target.value }))}
                                            disabled={!canEdit}
                                            className="w-20 rounded border border-neutral-300 px-2 py-1.5 text-right text-sm outline-none focus:border-neutral-900"
                                            placeholder="—"
                                        />
                                        <span className="text-xs text-neutral-500">/{totalMarks}</span>
                                    </div>
                                </li>
                            ))}
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
