"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RoleGate } from "@/components/portal/RoleGate";
import { PageHeader } from "@/components/portal/PageHeader";
import { ClassSelector } from "@/components/portal/ClassSelector";
import { ExportButton } from "@/components/portal/ExportButton";
import { useAuth } from "@/components/portal/AuthContext";
import {
    listStudents,
    createStudent,
    updateStudent,
    formatContactNumbers,
    setStudentActive,
    listClasses,
    listSubjects,
    listResults,
    moveStudent,
    sortClasses,
} from "@/lib/portal/data";
import { currentAcademicYear } from "@/lib/portal/academic";
import { exportWorkbook, fileSlug } from "@/lib/portal/exportExcel";
import type { Gender, SchoolClass, Student, Subject } from "@/domain/portal/types";

export default function StudentsPage() {
    return (
        <RoleGate allow={["admin", "teacher", "staff"]}>
            <StudentsView />
        </RoleGate>
    );
}

function StudentsView() {
    const { role } = useAuth();
    const isAdmin = role === "admin";

    const [classId, setClassId] = useState<string | null>(null);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const onClassesLoaded = useCallback((list: SchoolClass[]) => setClasses(list), []);
    const [showInactive, setShowInactive] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    // Admin: students ticked for moving, and the ones the move dialog is open for.
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [moving, setMoving] = useState<Student[] | null>(null);
    const [editing, setEditing] = useState<Student | null>(null);

    const refresh = useCallback(async () => {
        if (!classId) return;
        setLoading(true);
        setError(null);
        setSelected(new Set());
        try {
            const list = await listStudents(classId, { includeInactive: showInactive });
            list.sort((a, b) => (a.rollNo ?? "").localeCompare(b.rollNo ?? "") || a.name.localeCompare(b.name));
            setStudents(list);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load students");
        } finally {
            setLoading(false);
        }
    }, [classId, showInactive]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const allSelected = students.length > 0 && students.every((s) => selected.has(s.id));

    // The class list as shown (including deactivated students when they're shown).
    async function handleExport() {
        const className = classes.find((c) => c.id === classId)?.name ?? "Class";
        await exportWorkbook(`${fileSlug(className)}_students`, [
            {
                name: className,
                header: ["Roll", "Student", "Student ID", "Gender", "Parent", "Mobile numbers", "Admission year", "Status"],
                rows: students.map((s) => [
                    s.rollNo ?? "",
                    s.name,
                    s.studentCode ?? "",
                    s.gender ? s.gender[0].toUpperCase() + s.gender.slice(1) : "",
                    s.parentName,
                    s.contactNumber,
                    s.admissionYear,
                    s.isActive ? "Active" : "Inactive",
                ]),
            },
        ]);
    }

    function toggleSelected(id: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    return (
        <div>
            <PageHeader
                title="Students"
                subtitle={isAdmin ? "Add, edit, or opt-out students." : "View students in each class."}
                actions={
                    classId ? (
                        <>
                            <ExportButton onExport={handleExport} disabled={loading || students.length === 0} />
                            {isAdmin && (
                                <button
                                    onClick={() => setShowAdd(true)}
                                    className="rounded bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800"
                                >
                                    + Add student
                                </button>
                            )}
                        </>
                    ) : null
                }
            />

            <div className="flex items-center gap-4 border-b border-neutral-200 bg-white px-8 py-3">
                <label className="flex items-center gap-2 text-sm text-neutral-700">
                    Class
                    <ClassSelector value={classId} onChange={setClassId} onLoad={onClassesLoaded} />
                </label>
                <label className="ml-auto flex items-center gap-2 text-xs text-neutral-600">
                    <input
                        type="checkbox"
                        checked={showInactive}
                        onChange={(e) => setShowInactive(e.target.checked)}
                    />
                    Show opted-out
                </label>
            </div>

            <div className="p-8">
                {error && (
                    <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                        {error}
                    </div>
                )}
                {message && (
                    <div className="mb-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                        {message}
                    </div>
                )}

                {isAdmin && selected.size > 0 && (
                    <div className="mb-3 flex flex-wrap items-center gap-3 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
                        <span>{selected.size} selected</span>
                        <button
                            onClick={() => setMoving(students.filter((s) => selected.has(s.id)))}
                            className="rounded bg-neutral-900 px-3 py-1 text-xs font-medium text-white hover:bg-neutral-800"
                        >
                            Move to section…
                        </button>
                        <button onClick={() => setSelected(new Set())} className="text-xs underline">
                            Clear
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="text-sm text-neutral-500">Loading…</div>
                ) : students.length === 0 ? (
                    <div className="rounded border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
                        No students in this class yet.
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded border border-neutral-200 bg-white">
                        <table className="min-w-full text-sm">
                            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
                                <tr>
                                    {isAdmin && (
                                        <th className="w-8 px-4 py-3">
                                            <input
                                                type="checkbox"
                                                aria-label="Select all students"
                                                checked={allSelected}
                                                onChange={() =>
                                                    setSelected(allSelected ? new Set() : new Set(students.map((s) => s.id)))
                                                }
                                            />
                                        </th>
                                    )}
                                    <th className="px-4 py-3">Roll</th>
                                    <th className="px-4 py-3">Student ID</th>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Parent</th>
                                    <th className="px-4 py-3">Gender</th>
                                    <th className="px-4 py-3">Mobile</th>
                                    <th className="px-4 py-3">Status</th>
                                    {isAdmin && <th className="px-4 py-3"></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((s) => (
                                    <tr key={s.id} className="border-t border-neutral-100">
                                        {isAdmin && (
                                            <td className="px-4 py-2">
                                                <input
                                                    type="checkbox"
                                                    aria-label={`Select ${s.name}`}
                                                    checked={selected.has(s.id)}
                                                    onChange={() => toggleSelected(s.id)}
                                                />
                                            </td>
                                        )}
                                        <td className="px-4 py-2 text-neutral-700">{s.rollNo ?? "—"}</td>
                                        <td className="px-4 py-2 font-mono text-xs text-neutral-900">{s.studentCode ?? "—"}</td>
                                        <td className="px-4 py-2 font-medium text-neutral-900">{s.name}</td>
                                        <td className="px-4 py-2 text-neutral-700">{s.parentName || "—"}</td>
                                        <td className="px-4 py-2 text-neutral-700 capitalize">{s.gender ?? "—"}</td>
                                        <td className="px-4 py-2 text-neutral-700">
                                            {s.contactNumber ? (
                                                s.contactNumber.split(",").map((n) => (
                                                    <div key={n} className="whitespace-nowrap tabular-nums">{n.trim()}</div>
                                                ))
                                            ) : (
                                                <span className="text-xs text-amber-700" title="Parents need a mobile number on record to use the app">
                                                    None — no app access
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2">
                                            {s.isActive ? (
                                                <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800">Active</span>
                                            ) : (
                                                <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">Opted-out</span>
                                            )}
                                        </td>
                                        {isAdmin && (
                                            <td className="whitespace-nowrap px-4 py-2 text-right">
                                                <button
                                                    onClick={() => setEditing(s)}
                                                    className="text-xs text-neutral-700 underline hover:text-neutral-900"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => setMoving([s])}
                                                    className="ml-3 text-xs text-neutral-700 underline hover:text-neutral-900"
                                                >
                                                    Move
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        await setStudentActive(s.id, !s.isActive);
                                                        refresh();
                                                    }}
                                                    className="ml-3 text-xs text-neutral-700 underline hover:text-neutral-900"
                                                >
                                                    {s.isActive ? "Opt-out" : "Re-enroll"}
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showAdd && classId && (
                <AddStudentDialog
                    classId={classId}
                    onClose={() => setShowAdd(false)}
                    onSaved={(student) => {
                        setShowAdd(false);
                        setMessage(`Added ${student.name} — Student ID ${student.studentCode}.`);
                        refresh();
                    }}
                />
            )}

            {editing && (
                <EditStudentDialog
                    student={editing}
                    onClose={() => setEditing(null)}
                    onSaved={(name) => {
                        setEditing(null);
                        setMessage(`Saved ${name}.`);
                        refresh();
                    }}
                />
            )}

            {moving && classId && (
                <MoveStudentsDialog
                    students={moving}
                    fromClassId={classId}
                    onClose={() => {
                        setMoving(null);
                        refresh();
                    }}
                    onMoved={(text) => {
                        setMoving(null);
                        setMessage(text);
                        refresh();
                    }}
                />
            )}
        </div>
    );
}

/**
 * Move students to another section, or keep the section and switch a subject
 * (e.g. Sanskrit → Hindi). Their marks in the current class go with them: each
 * subject they have marks in is mapped to a subject of the target class.
 */
function MoveStudentsDialog({
    students,
    fromClassId,
    onClose,
    onMoved,
}: {
    students: Student[];
    fromClassId: string;
    onClose: () => void;
    onMoved: (message: string) => void;
}) {
    const { firebaseUser } = useAuth();
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [fromSubjects, setFromSubjects] = useState<Subject[]>([]);
    // Subjects (in the current class) the chosen students have marks in, with how many marks.
    const [markCounts, setMarkCounts] = useState<Map<string, number>>(new Map());
    const [toClassId, setToClassId] = useState("");
    const [toSubjects, setToSubjects] = useState<Subject[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [progress, setProgress] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const [all, subjects, results] = await Promise.all([
                    listClasses(),
                    listSubjects(fromClassId),
                    listResults({ classId: fromClassId }),
                ]);
                const ids = new Set(students.map((s) => s.id));
                const counts = new Map<string, number>();
                for (const r of results) {
                    if (ids.has(r.studentId)) counts.set(r.subjectId, (counts.get(r.subjectId) ?? 0) + 1);
                }
                const sorted = sortClasses(all);
                const from = sorted.find((c) => c.id === fromClassId);
                // Default to the next section of the same grade, if there is one.
                const sameGrade = sorted.filter((c) => c.grade === from?.grade);
                const next = sameGrade[sameGrade.findIndex((c) => c.id === fromClassId) + 1] ?? sameGrade[0] ?? from;
                setClasses(sorted);
                setFromSubjects(subjects);
                setMarkCounts(counts);
                setToClassId(next?.id ?? fromClassId);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load");
            } finally {
                setLoading(false);
            }
        })();
    }, [fromClassId, students]);

    // When the target changes, pre-pick the same-named subject for each subject with marks.
    useEffect(() => {
        if (!toClassId) return;
        let cancelled = false;
        listSubjects(toClassId).then((subjects) => {
            if (cancelled) return;
            const sorted = [...subjects].sort((a, b) => a.name.localeCompare(b.name));
            setToSubjects(sorted);
            const next: Record<string, string> = {};
            for (const s of fromSubjects) {
                const same = sorted.find((t) => t.name.trim().toLowerCase() === s.name.trim().toLowerCase());
                if (same) next[s.id] = same.id;
            }
            setMapping(next);
        });
        return () => {
            cancelled = true;
        };
    }, [toClassId, fromSubjects]);

    const withMarks = useMemo(
        () => fromSubjects.filter((s) => markCounts.has(s.id)).sort((a, b) => a.name.localeCompare(b.name)),
        [fromSubjects, markCounts]
    );
    const unmapped = withMarks.filter((s) => !mapping[s.id]);
    const sameClass = toClassId === fromClassId;
    const changesSomething = !sameClass || withMarks.some((s) => mapping[s.id] !== s.id);
    const fromName = classes.find((c) => c.id === fromClassId)?.name ?? "";
    const toName = classes.find((c) => c.id === toClassId)?.name ?? "";

    async function handleMove() {
        if (!firebaseUser || unmapped.length > 0) return;
        // Every subject with a target, not only those listed — marks added since
        // the dialog opened still have somewhere to go.
        const subjectMap: Record<string, Subject> = {};
        for (const s of fromSubjects) {
            const target = toSubjects.find((t) => t.id === mapping[s.id]);
            if (target) subjectMap[s.id] = target;
        }
        setSaving(true);
        setError(null);
        let moved = 0;
        let marks = 0;
        try {
            // One batch per student, so a failure part-way leaves every student whole.
            for (const s of students) {
                setProgress(`Moving ${moved + 1} of ${students.length}…`);
                marks += await moveStudent(s, toClassId, subjectMap, firebaseUser.uid);
                moved++;
            }
            const who = students.length === 1 ? students[0].name : `${students.length} students`;
            onMoved(
                sameClass
                    ? `Updated subjects for ${who} (${marks} marks).`
                    : `Moved ${who} to ${toName}, with ${marks} marks.`
            );
        } catch (err) {
            setError(
                `${moved} of ${students.length} moved before an error: ` +
                    (err instanceof Error ? err.message : "Move failed")
            );
            setSaving(false);
            setProgress(null);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
            <div className="my-8 w-full max-w-lg space-y-4 rounded-lg bg-white p-6 shadow-xl">
                <div>
                    <h2 className="text-base font-semibold text-neutral-900">
                        Move {students.length === 1 ? students[0].name : `${students.length} students`}
                    </h2>
                    <p className="mt-1 text-xs text-neutral-500">
                        Their marks in {fromName || "this class"} move with them. Past attendance stays with the old section.
                    </p>
                </div>

                {error && (
                    <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{error}</div>
                )}

                {loading ? (
                    <div className="text-sm text-neutral-500">Loading…</div>
                ) : (
                    <>
                        <label className="block text-sm">
                            <span className="mb-1 block text-neutral-700">Move to</span>
                            <select
                                value={toClassId}
                                onChange={(e) => setToClassId(e.target.value)}
                                disabled={saving}
                                className={inputCls}
                            >
                                {classes.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                        {c.id === fromClassId ? " (current — change subjects only)" : ""}
                                    </option>
                                ))}
                            </select>
                        </label>

                        {withMarks.length === 0 ? (
                            <p className="text-xs text-neutral-500">No marks recorded in {fromName} yet — only the section changes.</p>
                        ) : (
                            <div>
                                <div className="mb-1 text-sm text-neutral-700">Their marks go to</div>
                                <p className="mb-2 text-xs text-neutral-500">
                                    {sameClass
                                        ? "Same section: pick a different subject to switch marks, e.g. Sanskrit → Hindi."
                                        : `Matched by name. Pick a subject where ${toName} doesn't have the same one, e.g. Sanskrit → Hindi.`}
                                </p>
                                <div className="divide-y divide-neutral-100 rounded border border-neutral-200">
                                    {withMarks.map((s) => (
                                        <div key={s.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                                            <span className="text-neutral-900">
                                                {s.name}{" "}
                                                <span className="text-xs text-neutral-500">({markCounts.get(s.id)} marks)</span>
                                            </span>
                                            <select
                                                value={mapping[s.id] ?? ""}
                                                onChange={(e) => setMapping((m) => ({ ...m, [s.id]: e.target.value }))}
                                                disabled={saving}
                                                className={
                                                    "w-44 rounded border px-2 py-1 text-sm outline-none focus:border-neutral-900 " +
                                                    (mapping[s.id] ? "border-neutral-300" : "border-amber-400 bg-amber-50")
                                                }
                                            >
                                                <option value="">Choose subject…</option>
                                                {toSubjects.map((t) => (
                                                    <option key={t.id} value={t.id}>{t.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                    {progress && <span className="mr-auto text-xs text-neutral-500">{progress}</span>}
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="rounded px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleMove}
                        disabled={loading || saving || unmapped.length > 0 || !changesSomething}
                        className="rounded bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                    >
                        {saving ? "Moving…" : sameClass ? "Update subjects" : "Move"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function AddStudentDialog({
    classId,
    onClose,
    onSaved,
}: {
    classId: string;
    onClose: () => void;
    onSaved: (student: Student) => void;
}) {
    const [name, setName] = useState("");
    const [parentName, setParentName] = useState("");
    const [gender, setGender] = useState<Gender>("male");
    const [rollNo, setRollNo] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const student = await createStudent({
                name,
                parentName,
                gender,
                rollNo: rollNo.trim() ? rollNo.trim() : null,
                contactNumber: formatContactNumbers(contactNumber),
                classId,
                admissionYear: currentAcademicYear(),
            });
            onSaved(student);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save");
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md space-y-4 rounded-lg bg-white p-6 shadow-xl"
            >
                <div>
                    <h2 className="text-base font-semibold text-neutral-900">Add student</h2>
                    <p className="mt-1 text-xs text-neutral-500">
                        Roll number is optional. A Student ID is given automatically.
                    </p>
                </div>

                {error && (
                    <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                        {error}
                    </div>
                )}

                <Field label="Full name">
                    <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Parent name">
                    <input required value={parentName} onChange={(e) => setParentName(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Gender">
                    <select value={gender} onChange={(e) => setGender(e.target.value as Gender)} className={inputCls}>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                </Field>
                <Field label="Roll no (optional)">
                    <input value={rollNo} onChange={(e) => setRollNo(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Parents' mobile numbers (one per line)">
                    <textarea
                        required
                        rows={2}
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        className={inputCls}
                        placeholder="9876543210"
                    />
                </Field>

                <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={onClose} className="rounded px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                    >
                        {saving ? "Saving…" : "Save"}
                    </button>
                </div>
            </form>
        </div>
    );
}

/** Edit a student's details. Their mobile numbers are what parents sign in to the app with. */
function EditStudentDialog({
    student,
    onClose,
    onSaved,
}: {
    student: Student;
    onClose: () => void;
    onSaved: (name: string) => void;
}) {
    const [name, setName] = useState(student.name);
    const [parentName, setParentName] = useState(student.parentName);
    const [gender, setGender] = useState<Gender | "">(student.gender ?? "");
    const [rollNo, setRollNo] = useState(student.rollNo ?? "");
    const [mobiles, setMobiles] = useState(
        student.contactNumber
            .split(",")
            .map((n) => n.trim())
            .filter(Boolean)
            .join("\n")
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const trimmed = name.trim().replace(/\s+/g, " ");
            if (!trimmed) throw new Error("Enter the student's name.");
            await updateStudent(student.id, {
                name: trimmed,
                parentName: parentName.trim(),
                gender: gender || null,
                rollNo: rollNo.trim() || null,
                contactNumber: formatContactNumbers(mobiles),
            });
            onSaved(trimmed);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save");
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-lg bg-white p-6 shadow-xl">
                <div>
                    <h2 className="text-base font-semibold text-neutral-900">Edit {student.name}</h2>
                    <p className="mt-1 text-xs text-neutral-500">
                        Student ID <span className="font-mono font-medium text-neutral-800">{student.studentCode ?? "—"}</span>.
                        Parents sign in to the app with this ID and any mobile number below.
                    </p>
                </div>

                {error && (
                    <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{error}</div>
                )}

                <Field label="Full name">
                    <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Parent name">
                    <input value={parentName} onChange={(e) => setParentName(e.target.value)} className={inputCls} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Gender">
                        <select value={gender} onChange={(e) => setGender(e.target.value as Gender | "")} className={inputCls}>
                            <option value="">Not recorded</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </Field>
                    <Field label="Roll no">
                        <input value={rollNo} onChange={(e) => setRollNo(e.target.value)} className={inputCls} />
                    </Field>
                </div>
                <Field label="Parents' mobile numbers (one per line)">
                    <textarea
                        rows={3}
                        value={mobiles}
                        onChange={(e) => setMobiles(e.target.value)}
                        className={inputCls}
                        placeholder="9876543210"
                    />
                </Field>

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="rounded px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                    >
                        {saving ? "Saving…" : "Save"}
                    </button>
                </div>
            </form>
        </div>
    );
}

const inputCls = "w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block text-sm">
            <span className="mb-1 block text-neutral-700">{label}</span>
            {children}
        </label>
    );
}
