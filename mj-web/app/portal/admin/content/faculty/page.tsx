"use client";

import { useCallback, useEffect, useState } from "react";
import { RoleGate } from "@/components/portal/RoleGate";
import { PageHeader } from "@/components/portal/PageHeader";
import { Card } from "@/components/portal/ui/Card";
import { Badge } from "@/components/portal/ui/Badge";
import {
    listFacultyAdmin,
    createFacultyMember,
    updateFacultyMember,
    deleteFacultyMember,
} from "@/lib/portal/content";
import { uploadSiteImage } from "@/lib/portal/upload";
import type { FacultyMember } from "@/domain/portal/content-types";

const ACCENT_OPTIONS = [
    { value: "from-navy-700 to-navy-900", label: "Navy" },
    { value: "from-gold-500 to-gold-700", label: "Gold" },
    { value: "from-blue-500 to-blue-700", label: "Blue" },
    { value: "from-emerald-500 to-emerald-700", label: "Emerald" },
    { value: "from-purple-500 to-purple-700", label: "Purple" },
    { value: "from-teal-500 to-teal-700", label: "Teal" },
    { value: "from-indigo-500 to-indigo-700", label: "Indigo" },
    { value: "from-rose-500 to-rose-700", label: "Rose" },
    { value: "from-amber-500 to-amber-700", label: "Amber" },
];

export default function FacultyAdminPage() {
    return (
        <RoleGate allow={["admin"]}>
            <FacultyAdminView />
        </RoleGate>
    );
}

function FacultyAdminView() {
    const [members, setMembers] = useState<FacultyMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<FacultyMember | "new" | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setMembers(await listFacultyAdmin());
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load faculty");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return (
        <div>
            <PageHeader
                eyebrow="Portfolio content"
                title="Faculty profiles"
                subtitle="These members show on the public /faculty page. Only active members are visible to visitors."
                actions={
                    <button
                        onClick={() => setEditing("new")}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        + Add member
                    </button>
                }
            />

            <div className="p-4 md:p-8">
                {error && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-sm text-slate-500">Loading…</div>
                ) : members.length === 0 ? (
                    <Card>
                        <div className="text-center text-sm text-slate-500">
                            No faculty members yet. Click <strong>+ Add member</strong> to create the first.
                        </div>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {members.map((m) => (
                            <FacultyCard key={m.id} member={m} onEdit={() => setEditing(m)} onChanged={refresh} />
                        ))}
                    </div>
                )}
            </div>

            {editing && (
                <EditDialog
                    existing={editing === "new" ? null : editing}
                    nextOrder={members.length}
                    onClose={() => setEditing(null)}
                    onSaved={() => {
                        setEditing(null);
                        refresh();
                    }}
                />
            )}
        </div>
    );
}

function FacultyCard({
    member,
    onEdit,
    onChanged,
}: {
    member: FacultyMember;
    onEdit: () => void;
    onChanged: () => void;
}) {
    const [busy, setBusy] = useState(false);

    async function toggleActive() {
        setBusy(true);
        try {
            await updateFacultyMember(member.id, { isActive: !member.isActive });
            onChanged();
        } finally {
            setBusy(false);
        }
    }

    async function remove() {
        if (!confirm(`Delete "${member.name}" from the public faculty page? This cannot be undone.`)) return;
        setBusy(true);
        try {
            await deleteFacultyMember(member.id);
            onChanged();
        } finally {
            setBusy(false);
        }
    }

    return (
        <Card padding={false} className="overflow-hidden">
            <div className="relative aspect-[4/3] w-full">
                {member.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={member.photoUrl} alt={member.name} className="h-full w-full object-cover" />
                ) : (
                    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${member.accent} text-4xl font-bold text-white`}>
                        {initials(member.name)}
                    </div>
                )}
                {!member.isActive && (
                    <div className="absolute right-2 top-2">
                        <Badge tone="neutral">Hidden</Badge>
                    </div>
                )}
            </div>
            <div className="p-4">
                <div className="text-sm font-semibold text-slate-900">{member.name}</div>
                <div className="mt-0.5 text-xs text-slate-600">{member.role}</div>
                <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-slate-500">
                    <Badge tone="brand" size="sm">{member.subject}</Badge>
                    <Badge tone="neutral" size="sm">{member.experience}</Badge>
                </div>
                <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
                    <button
                        onClick={onEdit}
                        disabled={busy}
                        className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
                    >
                        Edit
                    </button>
                    <button
                        onClick={toggleActive}
                        disabled={busy}
                        className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
                    >
                        {member.isActive ? "Hide" : "Show"}
                    </button>
                    <button
                        onClick={remove}
                        disabled={busy}
                        className="ml-auto text-xs text-red-700 hover:underline"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </Card>
    );
}

function EditDialog({
    existing,
    nextOrder,
    onClose,
    onSaved,
}: {
    existing: FacultyMember | null;
    nextOrder: number;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [name, setName] = useState(existing?.name ?? "");
    const [role, setRole] = useState(existing?.role ?? "");
    const [subject, setSubject] = useState(existing?.subject ?? "");
    const [qualification, setQualification] = useState(existing?.qualification ?? "");
    const [experience, setExperience] = useState(existing?.experience ?? "");
    const [accent, setAccent] = useState(existing?.accent ?? ACCENT_OPTIONS[0].value);
    const [order, setOrder] = useState<number>(existing?.order ?? nextOrder);
    const [isActive, setIsActive] = useState<boolean>(existing?.isActive ?? true);
    const [photoUrl, setPhotoUrl] = useState<string | null>(existing?.photoUrl ?? null);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (file.size > 8 * 1024 * 1024) {
            setError("Image must be under 8 MB.");
            return;
        }
        setUploading(true);
        setError(null);
        try {
            const { url } = await uploadSiteImage("faculty", file);
            setPhotoUrl(url);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Upload failed";
            setError(
                msg.includes("storage/unauthorized")
                    ? "Upload denied. Check that Firebase Storage is enabled and the storage rules are deployed."
                    : msg
            );
        } finally {
            setUploading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            if (existing) {
                await updateFacultyMember(existing.id, {
                    name, role, subject, qualification, experience, accent, order, isActive, photoUrl,
                });
            } else {
                await createFacultyMember({
                    name, role, subject, qualification, experience, accent, order, isActive, photoUrl,
                });
            }
            onSaved();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save");
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
            <form
                onSubmit={handleSubmit}
                className="my-8 w-full max-w-lg space-y-4 rounded-xl bg-white p-6 shadow-xl"
            >
                <div>
                    <h2 className="text-base font-semibold text-slate-900">
                        {existing ? "Edit faculty member" : "New faculty member"}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                        Changes go live on <code>/faculty</code> immediately.
                    </p>
                </div>

                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                        {error}
                    </div>
                )}

                {/* Photo */}
                <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">Photo</label>
                    <div className="flex items-center gap-3">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                            {photoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={photoUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                                <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${accent} text-lg font-bold text-white`}>
                                    {initials(name || "?")}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 space-y-2">
                            <label className="inline-block cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100">
                                {uploading ? "Uploading…" : photoUrl ? "Replace photo" : "Upload photo"}
                                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFile} className="hidden" disabled={uploading} />
                            </label>
                            {photoUrl && (
                                <button
                                    type="button"
                                    onClick={() => setPhotoUrl(null)}
                                    className="ml-2 text-xs text-red-700 hover:underline"
                                >
                                    Remove photo
                                </button>
                            )}
                            <div className="text-[10px] text-slate-500">
                                JPG / PNG / WEBP, up to 8&nbsp;MB. Aspect roughly 4:3 works best.
                            </div>
                        </div>
                    </div>
                </div>

                <Field label="Name">
                    <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Role / title">
                    <input required value={role} onChange={(e) => setRole(e.target.value)} className={inputCls} placeholder="e.g. Head of Science Department" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Subject">
                        <input required value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Experience">
                        <input required value={experience} onChange={(e) => setExperience(e.target.value)} className={inputCls} placeholder="e.g. 12 years" />
                    </Field>
                </div>
                <Field label="Qualification">
                    <input required value={qualification} onChange={(e) => setQualification(e.target.value)} className={inputCls} placeholder="Ph.D. in Chemistry, IIT Kharagpur" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Accent (used when no photo)">
                        <select value={accent} onChange={(e) => setAccent(e.target.value)} className={inputCls}>
                            {ACCENT_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Sort order">
                        <input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value) || 0)} className={inputCls} />
                    </Field>
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                    Show on public /faculty page
                </label>

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                    <button type="button" onClick={onClose} className="rounded-md px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving || uploading}
                        className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {saving ? "Saving…" : existing ? "Save changes" : "Create"}
                    </button>
                </div>
            </form>
        </div>
    );
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

function initials(name: string) {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0]?.toUpperCase() ?? "")
        .join("");
}
