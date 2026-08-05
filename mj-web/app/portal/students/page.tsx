"use client";

import { useCallback, useEffect, useState } from "react";
import { RoleGate } from "@/components/portal/RoleGate";
import { PageHeader } from "@/components/portal/PageHeader";
import { ClassSelector } from "@/components/portal/ClassSelector";
import { useAuth } from "@/components/portal/AuthContext";
import {
    listStudents,
    createStudent,
    setStudentActive,
} from "@/lib/portal/data";
import type { Gender, Student } from "@/domain/portal/types";

const ACADEMIC_YEAR = "2025-2026";

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
    const [showInactive, setShowInactive] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAdd, setShowAdd] = useState(false);

    const refresh = useCallback(async () => {
        if (!classId) return;
        setLoading(true);
        setError(null);
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

    return (
        <div>
            <PageHeader
                title="Students"
                subtitle={isAdmin ? "Add, edit, or opt-out students." : "View students in each class."}
                actions={
                    isAdmin && classId ? (
                        <button
                            onClick={() => setShowAdd(true)}
                            className="rounded bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800"
                        >
                            + Add student
                        </button>
                    ) : null
                }
            />

            <div className="flex items-center gap-4 border-b border-neutral-200 bg-white px-8 py-3">
                <label className="flex items-center gap-2 text-sm text-neutral-700">
                    Class
                    <ClassSelector value={classId} onChange={setClassId} />
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
                                    <th className="px-4 py-3">Roll</th>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Parent</th>
                                    <th className="px-4 py-3">Gender</th>
                                    <th className="px-4 py-3">Contact</th>
                                    <th className="px-4 py-3">Status</th>
                                    {isAdmin && <th className="px-4 py-3"></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((s) => (
                                    <tr key={s.id} className="border-t border-neutral-100">
                                        <td className="px-4 py-2 text-neutral-700">{s.rollNo ?? "—"}</td>
                                        <td className="px-4 py-2 font-medium text-neutral-900">{s.name}</td>
                                        <td className="px-4 py-2 text-neutral-700">{s.parentName}</td>
                                        <td className="px-4 py-2 text-neutral-700 capitalize">{s.gender}</td>
                                        <td className="px-4 py-2 text-neutral-700">{s.contactNumber}</td>
                                        <td className="px-4 py-2">
                                            {s.isActive ? (
                                                <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800">Active</span>
                                            ) : (
                                                <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">Opted-out</span>
                                            )}
                                        </td>
                                        {isAdmin && (
                                            <td className="px-4 py-2 text-right">
                                                <button
                                                    onClick={async () => {
                                                        await setStudentActive(s.id, !s.isActive);
                                                        refresh();
                                                    }}
                                                    className="text-xs text-neutral-700 underline hover:text-neutral-900"
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
                    onSaved={() => {
                        setShowAdd(false);
                        refresh();
                    }}
                />
            )}
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
    onSaved: () => void;
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
            await createStudent({
                name,
                parentName,
                gender,
                rollNo: rollNo.trim() ? rollNo.trim() : null,
                contactNumber,
                classId,
                admissionYear: ACADEMIC_YEAR,
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
                <div>
                    <h2 className="text-base font-semibold text-neutral-900">Add student</h2>
                    <p className="mt-1 text-xs text-neutral-500">Roll number is optional.</p>
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
                <Field label="Contact number">
                    <input required value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} className={inputCls} placeholder="+919..." />
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

const inputCls = "w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block text-sm">
            <span className="mb-1 block text-neutral-700">{label}</span>
            {children}
        </label>
    );
}
