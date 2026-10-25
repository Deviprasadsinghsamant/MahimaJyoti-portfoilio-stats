"use client";

import { useCallback, useEffect, useState } from "react";
import { RoleGate } from "@/components/portal/RoleGate";
import { PageHeader } from "@/components/portal/PageHeader";
import { ClassSelector } from "@/components/portal/ClassSelector";
import { useAuth } from "@/components/portal/AuthContext";
import {
    listSubjects,
    createSubject,
    deleteSubject,
    setSubjectTeacher,
    listStaff,
} from "@/lib/portal/data";
import { currentAcademicYear } from "@/lib/portal/academic";
import type { PortalUser, Subject, UserRole } from "@/domain/portal/types";


export default function SubjectsPage() {
    return (
        <RoleGate allow={["admin", "teacher", "staff"]}>
            <SubjectsView />
        </RoleGate>
    );
}

function SubjectsView() {
    const { role, firebaseUser } = useAuth();
    const canAdd = role === "admin" || role === "teacher" || role === "staff";

    const [classId, setClassId] = useState<string | null>(null);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    // Every teacher/staff profile, including deactivated ones, for name lookups.
    const [staff, setStaff] = useState<PortalUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [reassigningId, setReassigningId] = useState<string | null>(null);
    const isAdmin = role === "admin";

    const refresh = useCallback(async () => {
        if (!classId) return;
        setLoading(true);
        setError(null);
        try {
            const list = await listSubjects(classId);
            list.sort((a, b) => a.name.localeCompare(b.name));
            setSubjects(list);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load subjects");
        } finally {
            setLoading(false);
        }
    }, [classId]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    useEffect(() => {
        listStaff().then(setStaff).catch(() => {
            /* teachers list is best-effort */
        });
    }, []);

    const teachers = staff
        .filter((u) => u.isActive)
        .map(({ uid, displayName, role }) => ({ uid, displayName, role }));
    const teacherLookup = new Map(staff.map((t) => [t.uid, t.isActive ? t.displayName : `${t.displayName} (deactivated)`]));

    async function reassign(subject: Subject, teacherId: string | null) {
        setReassigningId(subject.id);
        setError(null);
        try {
            await setSubjectTeacher(subject.id, teacherId);
            await refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't change the teacher");
        } finally {
            setReassigningId(null);
        }
    }

    return (
        <div>
            <PageHeader
                title="Subjects"
                subtitle="Subjects offered per class."
                actions={
                    canAdd && classId ? (
                        <button
                            onClick={() => setShowAdd(true)}
                            className="rounded bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800"
                        >
                            + Add subject
                        </button>
                    ) : null
                }
            />

            <div className="border-b border-neutral-200 bg-white px-8 py-3">
                <label className="flex items-center gap-2 text-sm text-neutral-700">
                    Class
                    <ClassSelector value={classId} onChange={setClassId} />
                </label>
            </div>

            <div className="p-8">
                {error && (
                    <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                        {error}
                    </div>
                )}
                {loading ? (
                    <div className="text-sm text-neutral-500">Loading…</div>
                ) : subjects.length === 0 ? (
                    <div className="rounded border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
                        No subjects yet.
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded border border-neutral-200 bg-white">
                        <table className="min-w-full text-sm">
                            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
                                <tr>
                                    <th className="px-4 py-3">Subject</th>
                                    <th className="px-4 py-3">Assigned to</th>
                                    <th className="px-4 py-3">Year</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {subjects.map((s) => {
                                    const canDelete = role === "admin" || s.teacherId === firebaseUser?.uid;
                                    return (
                                        <tr key={s.id} className="border-t border-neutral-100">
                                            <td className="px-4 py-2 font-medium text-neutral-900">{s.name}</td>
                                            <td className="px-4 py-2 text-neutral-700">
                                                {isAdmin ? (
                                                    <select
                                                        value={s.teacherId ?? ""}
                                                        disabled={reassigningId === s.id}
                                                        onChange={(e) => reassign(s, e.target.value || null)}
                                                        className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm outline-none focus:border-neutral-900 disabled:opacity-50"
                                                    >
                                                        <option value="">— Unassigned —</option>
                                                        {s.teacherId && !teachers.some((t) => t.uid === s.teacherId) && (
                                                            <option value={s.teacherId}>
                                                                {teacherLookup.get(s.teacherId) ?? "Unknown user"}
                                                            </option>
                                                        )}
                                                        {teachers.map((t) => (
                                                            <option key={t.uid} value={t.uid}>
                                                                {t.displayName} ({t.role})
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : s.teacherId ? (
                                                    teacherLookup.get(s.teacherId) ?? s.teacherId.slice(0, 8)
                                                ) : (
                                                    <span className="text-amber-700">Unassigned</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2 text-neutral-700">{s.academicYear}</td>
                                            <td className="px-4 py-2 text-right">
                                                {canDelete && (
                                                    <button
                                                        onClick={async () => {
                                                            if (!confirm(`Delete subject "${s.name}"?`)) return;
                                                            try {
                                                                await deleteSubject(s.id);
                                                                refresh();
                                                            } catch (err) {
                                                                setError(err instanceof Error ? err.message : "Delete failed");
                                                            }
                                                        }}
                                                        className="text-xs text-red-700 underline hover:text-red-900"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showAdd && classId && (
                <AddSubjectDialog
                    classId={classId}
                    teachers={teachers}
                    // Teachers and staff default to themselves. Admins aren't in the
                    // list, so they start on "no teacher" instead of assigning themselves.
                    defaultTeacherId={isAdmin ? "" : firebaseUser?.uid ?? ""}
                    onClose={() => setShowAdd(false)}
                    onSaved={() => {
                        setShowAdd(false);
                        refresh();
                    }}
                />
            )}
        </div>
    );
}

function AddSubjectDialog({
    classId,
    teachers,
    defaultTeacherId,
    onClose,
    onSaved,
}: {
    classId: string;
    teachers: { uid: string; displayName: string; role: UserRole }[];
    defaultTeacherId: string;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [name, setName] = useState("");
    const [teacherId, setTeacherId] = useState(defaultTeacherId);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            await createSubject({
                name,
                classId,
                teacherId: teacherId || null,
                academicYear: currentAcademicYear(),
            });
            onSaved();
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
                <h2 className="text-base font-semibold text-neutral-900">Add subject</h2>

                {error && (
                    <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                        {error}
                    </div>
                )}

                <label className="block text-sm">
                    <span className="mb-1 block text-neutral-700">Subject name</span>
                    <input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
                    />
                </label>

                <label className="block text-sm">
                    <span className="mb-1 block text-neutral-700">Assign to teacher</span>
                    <select
                        value={teacherId}
                        onChange={(e) => setTeacherId(e.target.value)}
                        className="w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
                    >
                        <option value="">— No teacher yet —</option>
                        {teachers.map((t) => (
                            <option key={t.uid} value={t.uid}>
                                {t.displayName} ({t.role})
                            </option>
                        ))}
                    </select>
                </label>

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
