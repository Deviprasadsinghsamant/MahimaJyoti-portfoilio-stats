"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RoleGate } from "@/components/portal/RoleGate";
import { PageHeader } from "@/components/portal/PageHeader";
import { Badge } from "@/components/portal/ui/Badge";
import {
    createClass,
    deleteClass,
    listClasses,
    listStaff,
    listStudents,
    listSubjects,
    setClassTeacher,
    sortClasses,
} from "@/lib/portal/data";
import type { PortalUser, SchoolClass, Subject } from "@/domain/portal/types";

const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);

export default function ClassesAdminPage() {
    return (
        <RoleGate allow={["admin"]}>
            <ClassesAdminView />
        </RoleGate>
    );
}

interface Loaded {
    // Sorted by grade, then section.
    classes: SchoolClass[];
    staff: PortalUser[];
    subjects: Subject[];
    studentCounts: Map<string, { active: number; total: number }>;
}

function ClassesAdminView() {
    const [data, setData] = useState<Loaded | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        try {
            const [classes, staff, subjects] = await Promise.all([listClasses(), listStaff(), listSubjects()]);
            const rosters = await Promise.all(classes.map((c) => listStudents(c.id, { includeInactive: true })));
            const studentCounts = new Map(
                classes.map((c, i) => [
                    c.id,
                    { active: rosters[i].filter((s) => s.isActive).length, total: rosters[i].length },
                ])
            );
            setData({ classes: sortClasses(classes), staff, subjects, studentCounts });
        } catch (err) {
            setError(errorText(err, "Failed to load classes"));
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const gradeGroups = useMemo(() => {
        const groups = new Map<number, SchoolClass[]>();
        for (const c of data?.classes ?? []) groups.set(c.grade, [...(groups.get(c.grade) ?? []), c]);
        return Array.from(groups.entries());
    }, [data]);

    async function changeClassTeacher(cls: SchoolClass, teacherId: string | null) {
        setBusyId(cls.id);
        setError(null);
        setMessage(null);
        try {
            await setClassTeacher(cls.id, teacherId);
            await refresh();
        } catch (err) {
            setError(errorText(err, "Couldn't change the class teacher"));
        } finally {
            setBusyId(null);
        }
    }

    async function remove(cls: SchoolClass) {
        if (!confirm(`Delete ${cls.name}? This can't be undone.`)) return;
        setBusyId(cls.id);
        setError(null);
        setMessage(null);
        try {
            await deleteClass(cls.id);
            setMessage(`${cls.name} deleted.`);
            await refresh();
        } catch (err) {
            setError(errorText(err, "Couldn't delete the class"));
        } finally {
            setBusyId(null);
        }
    }

    return (
        <div>
            <PageHeader
                eyebrow="Admin"
                title="Classes & Sections"
                subtitle="Each section of a grade is its own class, with its own students, subjects, and class teacher."
                actions={
                    <button
                        onClick={() => setShowAdd(true)}
                        disabled={!data}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        + Add class / section
                    </button>
                }
            />

            <div className="space-y-6 p-4 md:p-8">
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
                )}
                {message && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</div>
                )}

                {!data ? (
                    !error && <div className="text-sm text-slate-500">Loading…</div>
                ) : data.classes.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                        No classes yet. Add the first grade and section.
                    </div>
                ) : (
                    gradeGroups.map(([grade, classes]) => (
                        <div key={grade} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-baseline justify-between border-b border-slate-100 px-4 py-3 md:px-5">
                                <h2 className="text-sm font-semibold text-slate-900">Grade {grade}</h2>
                                <span className="text-xs text-slate-500">
                                    {classes.length} section{classes.length === 1 ? "" : "s"}
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
                                        <tr>
                                            <th className="px-4 py-2.5">Section</th>
                                            <th className="px-4 py-2.5">Class teacher</th>
                                            <th className="px-4 py-2.5">Students</th>
                                            <th className="px-4 py-2.5">Subjects</th>
                                            <th className="px-4 py-2.5">Year</th>
                                            <th className="px-4 py-2.5"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {classes.map((c) => (
                                            <ClassRow
                                                key={c.id}
                                                cls={c}
                                                data={data}
                                                busy={busyId === c.id}
                                                onClassTeacher={(id) => changeClassTeacher(c, id)}
                                                onDelete={() => remove(c)}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                )}

                {data && data.classes.length > 0 && (
                    <p className="text-xs text-slate-500">
                        Subjects and the teachers who teach them are set per person on{" "}
                        <Link href="/portal/admin/staff" className="font-medium text-blue-700 hover:underline">
                            Staff & Teachers
                        </Link>
                        , or per class on{" "}
                        <Link href="/portal/subjects" className="font-medium text-blue-700 hover:underline">
                            Subjects
                        </Link>
                        .
                    </p>
                )}
            </div>

            {showAdd && data && (
                <AddClassDialog
                    data={data}
                    onClose={() => setShowAdd(false)}
                    onSaved={(cls) => {
                        setShowAdd(false);
                        setError(null);
                        setMessage(`${cls.name} added.`);
                        refresh();
                    }}
                />
            )}
        </div>
    );
}

function ClassRow({
    cls,
    data,
    busy,
    onClassTeacher,
    onDelete,
}: {
    cls: SchoolClass;
    data: Loaded;
    busy: boolean;
    onClassTeacher: (teacherId: string | null) => void;
    onDelete: () => void;
}) {
    const counts = data.studentCounts.get(cls.id) ?? { active: 0, total: 0 };
    const subjects = data.subjects
        .filter((s) => s.classId === cls.id)
        .sort((a, b) => a.name.localeCompare(b.name));
    const nameOf = (uid: string) => data.staff.find((u) => u.uid === uid)?.displayName;
    const withoutTeacher = subjects.filter((s) => !s.teacherId).length;
    const canDelete = counts.total === 0 && subjects.length === 0;

    return (
        <tr>
            <td className="px-4 py-3 align-top">
                <div className="font-medium text-slate-900">{cls.name}</div>
                <div className="text-xs text-slate-500">Section {cls.section}</div>
            </td>
            <td className="px-4 py-3 align-top">
                <ClassTeacherSelect
                    value={cls.classTeacherId}
                    staff={data.staff}
                    disabled={busy}
                    onChange={onClassTeacher}
                />
            </td>
            <td className="px-4 py-3 align-top text-slate-700 tabular-nums">
                {counts.active}
                {counts.total > counts.active && (
                    <span className="text-xs text-slate-500"> (+{counts.total - counts.active} opted-out)</span>
                )}
            </td>
            <td className="px-4 py-3 align-top text-slate-700">
                {subjects.length === 0 ? (
                    <span className="text-slate-400">None</span>
                ) : (
                    <details>
                        <summary className="cursor-pointer text-xs">
                            {subjects.length} subject{subjects.length === 1 ? "" : "s"}
                            {withoutTeacher > 0 && (
                                <Badge tone="warning" size="sm" className="ml-2">
                                    {withoutTeacher} without teacher
                                </Badge>
                            )}
                        </summary>
                        <ul className="mt-1.5 space-y-0.5 text-xs">
                            {subjects.map((s) => (
                                <li key={s.id}>
                                    <span className="text-slate-900">{s.name}</span>
                                    <span className="text-slate-500">
                                        {" — "}
                                        {s.teacherId ? nameOf(s.teacherId) ?? "unknown user" : "no teacher"}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </details>
                )}
            </td>
            <td className="px-4 py-3 align-top text-xs text-slate-500">{cls.academicYear}</td>
            <td className="px-4 py-3 text-right align-top">
                <button
                    onClick={onDelete}
                    disabled={busy || !canDelete}
                    title={canDelete ? "Delete this class" : "Only empty classes (no students, no subjects) can be deleted"}
                    className="text-xs text-red-700 hover:underline disabled:cursor-not-allowed disabled:text-slate-300 disabled:no-underline"
                >
                    Delete
                </button>
            </td>
        </tr>
    );
}

function ClassTeacherSelect({
    value,
    staff,
    disabled,
    onChange,
    className,
}: {
    value: string | null;
    staff: PortalUser[];
    disabled?: boolean;
    onChange: (teacherId: string | null) => void;
    className?: string;
}) {
    const active = staff.filter((u) => u.isActive).sort((a, b) => a.displayName.localeCompare(b.displayName));
    const teachers = active.filter((u) => u.role === "teacher");
    const others = active.filter((u) => u.role === "staff");
    // Keep showing the current class teacher even if they're deactivated or not teacher/staff.
    const current = value ? staff.find((u) => u.uid === value) : undefined;
    const currentMissing = !!value && !active.some((u) => u.uid === value);

    return (
        <select
            value={value ?? ""}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value || null)}
            className={className ?? "w-full min-w-40 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-blue-500 disabled:opacity-50"}
        >
            <option value="">— No class teacher —</option>
            {currentMissing && (
                <option value={value!}>
                    {current ? `${current.displayName} (deactivated)` : "Unknown user"}
                </option>
            )}
            {teachers.length > 0 && (
                <optgroup label="Teachers">
                    {teachers.map((u) => (
                        <option key={u.uid} value={u.uid}>{u.displayName}</option>
                    ))}
                </optgroup>
            )}
            {others.length > 0 && (
                <optgroup label="Staff">
                    {others.map((u) => (
                        <option key={u.uid} value={u.uid}>{u.displayName}</option>
                    ))}
                </optgroup>
            )}
        </select>
    );
}

function AddClassDialog({
    data,
    onClose,
    onSaved,
}: {
    data: Loaded;
    onClose: () => void;
    onSaved: (cls: SchoolClass) => void;
}) {
    const [grade, setGrade] = useState<number>(() => data.classes[0]?.grade ?? 1);
    const [section, setSection] = useState("");
    const [customName, setCustomName] = useState<string | null>(null);
    const [academicYear, setAcademicYear] = useState(() => defaultAcademicYear(data.classes));
    const [classTeacherId, setClassTeacherId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cleanSection = section.trim().toUpperCase();
    const name = customName ?? `Class ${grade}${cleanSection ? `-${cleanSection}` : ""}`;
    const existingSections = data.classes.filter((c) => c.grade === grade).map((c) => c.section);
    const duplicate = existingSections.some((s) => s.toUpperCase() === cleanSection);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!/^[A-Z0-9]{1,3}$/.test(cleanSection)) {
            setError("Section must be 1–3 letters or digits, e.g. A, B, or C2.");
            return;
        }
        if (duplicate) {
            setError(`Grade ${grade} already has a section ${cleanSection}.`);
            return;
        }
        if (!name.trim()) {
            setError("Enter a display name.");
            return;
        }
        if (!/^\d{4}-\d{4}$/.test(academicYear.trim())) {
            setError("Academic year must look like 2026-2027.");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const cls = await createClass({
                name: name.trim(),
                grade,
                section: cleanSection,
                academicYear: academicYear.trim(),
                classTeacherId,
            });
            onSaved(cls);
        } catch (err) {
            setError(errorText(err, "Couldn't add the class"));
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
            <form onSubmit={handleSubmit} className="my-8 w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl">
                <div>
                    <h2 className="text-base font-semibold text-slate-900">Add class / section</h2>
                    <p className="mt-1 text-xs text-slate-500">
                        Add one section at a time. Students, subjects, attendance, and results are kept per section.
                    </p>
                </div>

                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{error}</div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <Field label="Grade">
                        <select value={grade} onChange={(e) => setGrade(Number(e.target.value))} className={inputCls}>
                            {GRADES.map((g) => (
                                <option key={g} value={g}>Grade {g}</option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Section">
                        <input
                            required
                            value={section}
                            onChange={(e) => setSection(e.target.value.toUpperCase())}
                            maxLength={3}
                            className={inputCls}
                            placeholder="e.g. B"
                        />
                    </Field>
                </div>
                <p className={"-mt-2 text-xs " + (duplicate ? "text-red-700" : "text-slate-500")}>
                    {existingSections.length === 0
                        ? `Grade ${grade} has no sections yet.`
                        : `Grade ${grade} already has section${existingSections.length === 1 ? "" : "s"} ${existingSections.join(", ")}.`}
                </p>

                <Field label="Display name">
                    <input
                        value={name}
                        onChange={(e) => setCustomName(e.target.value)}
                        className={inputCls}
                    />
                </Field>

                <Field label="Academic year">
                    <input
                        value={academicYear}
                        onChange={(e) => setAcademicYear(e.target.value)}
                        className={inputCls}
                        placeholder="2026-2027"
                    />
                </Field>

                <Field label="Class teacher (optional)">
                    <ClassTeacherSelect
                        value={classTeacherId}
                        staff={data.staff}
                        onChange={setClassTeacherId}
                        className={inputCls}
                    />
                </Field>

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="rounded-md px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving || duplicate}
                        className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {saving ? "Adding…" : "Add class"}
                    </button>
                </div>
            </form>
        </div>
    );
}

// The year most existing classes use, so a new section matches its siblings.
// Falls back to the current April–March academic year when there are no classes.
function defaultAcademicYear(classes: SchoolClass[]): string {
    const counts = new Map<string, number>();
    for (const c of classes) counts.set(c.academicYear, (counts.get(c.academicYear) ?? 0) + 1);
    const common = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (common) return common;
    const now = new Date();
    const start = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    return `${start}-${start + 1}`;
}

const inputCls = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block text-xs font-medium text-slate-700">
            <span className="mb-1 block">{label}</span>
            {children}
        </label>
    );
}

function errorText(err: unknown, fallback: string) {
    return err instanceof Error ? err.message : fallback;
}
