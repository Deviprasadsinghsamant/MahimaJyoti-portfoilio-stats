"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RoleGate } from "@/components/portal/RoleGate";
import { ClassSelector } from "@/components/portal/ClassSelector";
import { useAuth } from "@/components/portal/AuthContext";
import {
    listStudents,
    getAttendance,
    upsertAttendance,
} from "@/lib/portal/data";
import {
    loadAttendanceDraft,
    saveAttendanceDraft,
    clearAttendanceDraft,
} from "@/lib/portal/attendanceDraft";
import type {
    AttendanceStatus,
    Student,
    UserRole,
} from "@/domain/portal/types";

function todayIso() {
    return new Date().toISOString().slice(0, 10);
}

export default function AttendancePage() {
    return (
        <RoleGate allow={["admin", "teacher", "staff"]}>
            <AttendanceView />
        </RoleGate>
    );
}

function AttendanceView() {
    const { firebaseUser, role } = useAuth();
    const canEdit = role === "admin" || role === "teacher" || role === "staff";

    const [classId, setClassId] = useState<string | null>(null);
    const [date, setDate] = useState(todayIso());
    const [students, setStudents] = useState<Student[]>([]);
    const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [existingId, setExistingId] = useState<string | null>(null);
    const [draftRestored, setDraftRestored] = useState(false);
    const [dirty, setDirty] = useState(false);

    const uid = firebaseUser?.uid ?? null;

    const load = useCallback(async () => {
        if (!classId || !uid) return;
        setLoading(true);
        setError(null);
        setMessage(null);
        setDraftRestored(false);
        setDirty(false);
        try {
            const [studentList, existing] = await Promise.all([
                listStudents(classId),
                getAttendance(classId, date),
            ]);
            studentList.sort(
                (a, b) =>
                    (a.rollNo ?? "").localeCompare(b.rollNo ?? "") ||
                    a.name.localeCompare(b.name)
            );
            setStudents(studentList);

            const base: Record<string, AttendanceStatus> = {};
            if (existing) {
                setExistingId(existing.id);
                existing.records.forEach((r) => (base[r.studentId] = r.status));
            } else {
                setExistingId(null);
            }
            studentList.forEach((s) => {
                if (!(s.id in base)) base[s.id] = "present";
            });

            // Draft overrides remote if it exists and is newer / unsaved
            const draft = loadAttendanceDraft(uid, classId, date);
            if (draft) {
                setMarks({ ...base, ...draft.marks });
                setDraftRestored(true);
                setDirty(true);
            } else {
                setMarks(base);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load attendance");
        } finally {
            setLoading(false);
        }
    }, [classId, date, uid]);

    useEffect(() => {
        load();
    }, [load]);

    const presentCount = useMemo(
        () => students.filter((s) => marks[s.id] === "present").length,
        [students, marks]
    );

    function persistDraft(nextMarks: Record<string, AttendanceStatus>) {
        if (!uid || !classId) return;
        saveAttendanceDraft(uid, classId, date, nextMarks);
        setDirty(true);
    }

    async function handleSave() {
        if (!classId || !firebaseUser || !uid) return;
        setSaving(true);
        setError(null);
        setMessage(null);
        try {
            const records = students.map((s) => ({
                studentId: s.id,
                status: marks[s.id] ?? "present",
            }));
            await upsertAttendance(classId, date, records, firebaseUser.uid, role as UserRole);
            clearAttendanceDraft(uid, classId, date);
            setMessage("Saved.");
            setDirty(false);
            setDraftRestored(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save");
        } finally {
            setSaving(false);
        }
    }

    function toggle(studentId: string) {
        if (!canEdit) return;
        setMarks((m) => {
            const next = { ...m, [studentId]: m[studentId] === "present" ? "absent" : "present" as AttendanceStatus };
            persistDraft(next);
            return next;
        });
    }

    function markAll(status: AttendanceStatus) {
        if (!canEdit) return;
        setMarks(() => {
            const next = Object.fromEntries(students.map((s) => [s.id, status])) as Record<string, AttendanceStatus>;
            persistDraft(next);
            return next;
        });
    }

    function discardDraft() {
        if (!uid || !classId) return;
        clearAttendanceDraft(uid, classId, date);
        load();
    }

    return (
        <div className="pb-24 md:pb-0">
            {/* Sticky control bar — always visible while scrolling the roster */}
            <div className="sticky top-14 z-20 border-b border-neutral-200 bg-white shadow-sm md:top-0">
                <div className="flex items-center justify-between px-4 py-3 md:px-8">
                    <div>
                        <h1 className="text-base font-semibold text-neutral-900 md:text-lg">
                            Attendance
                        </h1>
                        <p className="text-xs text-neutral-500 md:text-sm">
                            {existingId ? "Editing existing record." : "New record for this day."}
                        </p>
                    </div>
                    {canEdit && classId && (
                        <button
                            onClick={handleSave}
                            disabled={saving || loading}
                            className="hidden rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 md:inline-block"
                        >
                            {saving ? "Saving…" : existingId ? "Update" : "Save"}
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-neutral-100 px-4 py-2 text-sm md:px-8">
                    <label className="flex items-center gap-2 text-neutral-700">
                        <span className="text-xs uppercase text-neutral-500 md:text-sm md:normal-case md:text-neutral-700">Class</span>
                        <ClassSelector value={classId} onChange={setClassId} />
                    </label>
                    <label className="flex items-center gap-2 text-neutral-700">
                        <span className="text-xs uppercase text-neutral-500 md:text-sm md:normal-case md:text-neutral-700">Date</span>
                        <input
                            type="date"
                            value={date}
                            max={todayIso()}
                            onChange={(e) => setDate(e.target.value)}
                            className="rounded border border-neutral-300 px-2 py-1.5 text-sm outline-none focus:border-neutral-900"
                        />
                    </label>
                    <div className="ml-auto flex items-center gap-4 text-xs text-neutral-600">
                        <span className="font-medium text-emerald-700">{presentCount} P</span>
                        <span className="font-medium text-red-700">{students.length - presentCount} A</span>
                        <span>/ {students.length}</span>
                    </div>
                </div>

                <div className="flex gap-2 border-t border-neutral-100 px-4 py-2 md:px-8">
                    <button
                        onClick={() => markAll("present")}
                        className="flex-1 rounded border border-neutral-300 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100 md:flex-initial md:px-3"
                    >
                        All present
                    </button>
                    <button
                        onClick={() => markAll("absent")}
                        className="flex-1 rounded border border-neutral-300 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100 md:flex-initial md:px-3"
                    >
                        All absent
                    </button>
                </div>
            </div>

            <div className="p-4 md:p-8">
                {(error || message || draftRestored) && (
                    <div className="mb-3 space-y-2">
                        {error && (
                            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                                {error}
                            </div>
                        )}
                        {message && (
                            <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                                {message}
                            </div>
                        )}
                        {draftRestored && (
                            <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                                <span>Unsaved changes from a previous session were restored.</span>
                                <button
                                    onClick={discardDraft}
                                    className="rounded border border-amber-300 bg-white px-2 py-1 text-amber-900 hover:bg-amber-100"
                                >
                                    Discard draft
                                </button>
                            </div>
                        )}
                    </div>
                )}
                {loading ? (
                    <div className="text-sm text-neutral-500">Loading…</div>
                ) : students.length === 0 ? (
                    <div className="rounded border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
                        No students in this class.
                    </div>
                ) : (
                    <div className="overflow-hidden rounded border border-neutral-200 bg-white">
                        <ul className="divide-y divide-neutral-100">
                            {students.map((s) => {
                                const status = marks[s.id] ?? "present";
                                const isPresent = status === "present";
                                return (
                                    <li key={s.id}>
                                        <button
                                            onClick={() => toggle(s.id)}
                                            disabled={!canEdit}
                                            className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left hover:bg-neutral-50 active:bg-neutral-100 disabled:opacity-60 md:py-3"
                                        >
                                            <div className="flex min-w-0 items-center gap-3">
                                                <span className="w-8 shrink-0 text-xs text-neutral-500">
                                                    {s.rollNo ?? "—"}
                                                </span>
                                                <span className="truncate text-sm font-medium text-neutral-900 md:text-base">
                                                    {s.name}
                                                </span>
                                            </div>
                                            <span
                                                className={
                                                    "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold " +
                                                    (isPresent
                                                        ? "bg-emerald-100 text-emerald-800"
                                                        : "bg-red-100 text-red-800")
                                                }
                                            >
                                                {isPresent ? "Present" : "Absent"}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>

            {/* Fixed mobile save bar */}
            {canEdit && classId && (
                <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white p-3 shadow-lg md:hidden">
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="w-full rounded bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
                    >
                        {saving ? "Saving…" : existingId ? "Update attendance" : "Save attendance"}
                        {dirty && !saving && <span className="ml-2 text-xs opacity-75">· unsaved</span>}
                    </button>
                </div>
            )}
        </div>
    );
}
