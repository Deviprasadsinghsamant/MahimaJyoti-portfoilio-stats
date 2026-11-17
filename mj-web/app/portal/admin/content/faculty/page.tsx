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
import { Field as HelpField, InfoTip } from "@/components/portal/admin/Help";
import { ImageField } from "@/components/portal/admin/ImageField";
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
                subtitle="Teacher cards on the website's Faculty page. These are public profiles — separate from teachers' portal logins."
                actions={
                    <button
                        onClick={() => setEditing("new")}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        + Add teacher
                    </button>
                }
            />

            <div className="p-4 md:p-8">
                <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-sm text-blue-950">
                    <span className="font-semibold">
                        {members.filter((m) => m.isActive).length} teacher{members.filter((m) => m.isActive).length === 1 ? "" : "s"} on the website
                        · add every teacher you want parents to see, principal first
                    </span>
                    <InfoTip label="About faculty profiles">
                        <strong>One card per teacher:</strong> name, role, subject, experience, qualification and a photo. Cards show three
                        per row, ordered by <em>Position</em>.
                        <br />
                        <strong>Photos:</strong> landscape 4:3, 1200 × 900 px or larger, head and shoulders with space on both sides.
                        Use the same background and framing for everyone so the page looks uniform.
                        <br />
                        <strong>Permission:</strong> ask each teacher before publishing their photo and details.
                        <br />
                        <strong>When someone leaves:</strong> untick “Show on the website” instead of deleting, so you can bring the
                        card back later.
                    </InfoTip>
                </div>
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
                            No teachers added yet. Click <strong>+ Add teacher</strong> to create the first card.
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
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                        {existing ? "Edit teacher" : "Add a teacher"}
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
                <div className="max-w-xs">
                    <div className="mb-1 block text-xs font-medium text-slate-700">Photo</div>
                    <ImageField
                        slot="faculty"
                        subpath="faculty"
                        value={photoUrl}
                        onChange={setPhotoUrl}
                        fallback={
                            <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${accent} text-2xl font-bold text-white`}>
                                {initials(name || "?")}
                            </div>
                        }
                    />
                </div>

                <HelpField label="Full name" hint="As it should appear on the website, with title if used (e.g. Mrs., Dr.).">
                    <input required value={name} onChange={(e) => setName(e.target.value)} maxLength={50} className={inputCls} placeholder="Mrs. Sunita Mohanty" />
                </HelpField>
                <HelpField label="Role" hint="Their position at the school.">
                    <input required value={role} onChange={(e) => setRole(e.target.value)} maxLength={50} className={inputCls} placeholder="Senior Mathematics Teacher" />
                </HelpField>
                <div className="grid grid-cols-2 gap-3">
                    <HelpField label="Subject(s)" hint="What they teach.">
                        <input required value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={50} className={inputCls} placeholder="Mathematics" />
                    </HelpField>
                    <HelpField label="Experience" hint="Years of teaching.">
                        <input required value={experience} onChange={(e) => setExperience(e.target.value)} maxLength={20} className={inputCls} placeholder="12 years" />
                    </HelpField>
                </div>
                <HelpField label="Qualification" hint="Highest degrees, e.g. M.Sc., B.Ed.">
                    <input required value={qualification} onChange={(e) => setQualification(e.target.value)} maxLength={80} className={inputCls} placeholder="M.Sc. (Mathematics), B.Ed." />
                </HelpField>
                <div className="grid grid-cols-2 gap-3">
                    <HelpField label="Position" hint="Lower numbers appear first — e.g. principal 1, vice-principal 2.">
                        <input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value) || 0)} className={inputCls} />
                    </HelpField>
                    <HelpField label="Colour if no photo" hint="Background behind their initials until a photo is added.">
                        <select value={accent} onChange={(e) => setAccent(e.target.value)} className={inputCls}>
                            {ACCENT_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </HelpField>
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                    Show on the website (untick to hide without deleting, e.g. when someone leaves)
                </label>

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                    <button type="button" onClick={onClose} className="rounded-md px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {saving ? "Saving…" : existing ? "Save changes" : "Create"}
                    </button>
                </div>
            </form>
        </div>
    );
}

const inputCls = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500";

function initials(name: string) {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0]?.toUpperCase() ?? "")
        .join("");
}
