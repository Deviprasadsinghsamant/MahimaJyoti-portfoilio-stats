"use client";

import { useCallback, useEffect, useState } from "react";
import { RoleGate } from "@/components/portal/RoleGate";
import { ClassSelector } from "@/components/portal/ClassSelector";
import { useAuth } from "@/components/portal/AuthContext";
import {
    listSubjects,
    listSyllabus,
    createSyllabus,
    deleteSyllabus,
} from "@/lib/portal/data";
import type { Subject, Syllabus } from "@/domain/portal/types";

export default function SyllabusPage() {
    return (
        <RoleGate allow={["admin", "teacher"]}>
            <SyllabusView />
        </RoleGate>
    );
}

function SyllabusView() {
    const { firebaseUser, role } = useAuth();
    const canAdd = role === "teacher" || role === "admin";

    const [classId, setClassId] = useState<string | null>(null);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [entries, setEntries] = useState<Syllabus[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAdd, setShowAdd] = useState(false);

    useEffect(() => {
        if (!classId) return;
        listSubjects(classId).then(setSubjects);
    }, [classId]);

    const refresh = useCallback(async () => {
        if (!classId) return;
        setLoading(true);
        setError(null);
        try {
            const list = await listSyllabus({ classId });
            list.sort((a, b) => b.createdAt - a.createdAt);
            setEntries(list);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load syllabus");
        } finally {
            setLoading(false);
        }
    }, [classId]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const subjectLookup = new Map(subjects.map((s) => [s.id, s.name]));

    return (
        <div>
            <div className="sticky top-14 z-20 border-b border-neutral-200 bg-white md:top-0">
                <div className="flex items-center justify-between px-4 py-3 md:px-8">
                    <div>
                        <h1 className="text-base font-semibold text-neutral-900 md:text-lg">Syllabus</h1>
                        <p className="text-xs text-neutral-500">Course structure and lesson plans per subject.</p>
                    </div>
                    {canAdd && classId && subjects.length > 0 && (
                        <button
                            onClick={() => setShowAdd(true)}
                            className="rounded bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800"
                        >
                            + Add
                        </button>
                    )}
                </div>
                <div className="border-t border-neutral-100 px-4 py-2 md:px-8">
                    <label className="flex items-center gap-2 text-sm text-neutral-700">
                        <span className="text-xs uppercase text-neutral-500">Class</span>
                        <ClassSelector value={classId} onChange={setClassId} />
                    </label>
                </div>
            </div>

            <div className="p-4 md:p-8">
                {error && (
                    <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                        {error}
                    </div>
                )}
                {loading ? (
                    <div className="text-sm text-neutral-500">Loading…</div>
                ) : entries.length === 0 ? (
                    <div className="rounded border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
                        No syllabus entries yet.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {entries.map((s) => {
                            const canDelete = role === "admin" || s.uploadedBy === firebaseUser?.uid;
                            return (
                                <div key={s.id} className="rounded border border-neutral-200 bg-white p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-sm font-semibold text-neutral-900">{s.title}</h3>
                                            <div className="mt-1 text-xs text-neutral-500">
                                                {subjectLookup.get(s.subjectId) ?? "—"} · uploaded {new Date(s.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        {canDelete && (
                                            <button
                                                onClick={async () => {
                                                    if (!confirm(`Delete syllabus "${s.title}"?`)) return;
                                                    try {
                                                        await deleteSyllabus(s.id);
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
                                    </div>
                                    <pre className="mt-3 whitespace-pre-wrap font-body text-sm text-neutral-700">{s.content}</pre>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {showAdd && classId && (
                <AddSyllabusDialog
                    classId={classId}
                    subjects={subjects}
                    uploaderId={firebaseUser?.uid ?? ""}
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

function AddSyllabusDialog({
    classId,
    subjects,
    uploaderId,
    onClose,
    onSaved,
}: {
    classId: string;
    subjects: Subject[];
    uploaderId: string;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            await createSyllabus({
                classId,
                subjectId,
                title,
                content,
                uploadedBy: uploaderId,
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
                className="w-full max-w-lg space-y-4 rounded-lg bg-white p-6 shadow-xl"
            >
                <h2 className="text-base font-semibold text-neutral-900">Add syllabus</h2>
                {error && (
                    <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                        {error}
                    </div>
                )}
                <label className="block text-sm">
                    <span className="mb-1 block text-neutral-700">Subject</span>
                    <select
                        value={subjectId}
                        onChange={(e) => setSubjectId(e.target.value)}
                        required
                        className="w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
                    >
                        {subjects.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </label>
                <label className="block text-sm">
                    <span className="mb-1 block text-neutral-700">Title</span>
                    <input
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Mathematics — Term 1 Syllabus"
                        className="w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
                    />
                </label>
                <label className="block text-sm">
                    <span className="mb-1 block text-neutral-700">Content (course structure, timeline)</span>
                    <textarea
                        required
                        rows={8}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Week 1–4: Chapters 1–2..."
                        className="w-full rounded border border-neutral-300 px-3 py-2 font-mono text-sm outline-none focus:border-neutral-900"
                    />
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
