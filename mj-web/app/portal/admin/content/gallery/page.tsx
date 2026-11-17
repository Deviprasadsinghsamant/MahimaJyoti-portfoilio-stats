"use client";

import { useCallback, useEffect, useState } from "react";
import { RoleGate } from "@/components/portal/RoleGate";
import { PageHeader } from "@/components/portal/PageHeader";
import { Card } from "@/components/portal/ui/Card";
import { Badge } from "@/components/portal/ui/Badge";
import { Field as HelpField, InfoTip } from "@/components/portal/admin/Help";
import { ImageField } from "@/components/portal/admin/ImageField";
import {
    listGalleryAdmin,
    createGalleryItem,
    updateGalleryItem,
    deleteGalleryItem,
} from "@/lib/portal/content";
import type { GalleryCategory, GalleryItem } from "@/domain/portal/content-types";

// Visitors filter the gallery by these. aim: how many shown photos make the category look full.
const CATEGORIES: { value: GalleryCategory; label: string; aim: [number, number]; what: string }[] = [
    { value: "campus", label: "Campus", aim: [6, 10], what: "Buildings, classrooms, hostel, dining hall, grounds — the place itself." },
    { value: "events", label: "Events", aim: [6, 12], what: "Annual day, Independence & Republic Day, prize distribution, visits." },
    { value: "academics", label: "Academics", aim: [4, 8], what: "Classes in progress, labs, library, projects, exhibitions." },
    { value: "sports", label: "Sports", aim: [4, 8], what: "Sports day, matches, practice, yoga, games period." },
    { value: "achievements", label: "Achievements", aim: [3, 6], what: "Prize winners, trophies, certificates, board toppers (with permission)." },
    { value: "cultural", label: "Cultural", aim: [4, 8], what: "Dance, music, drama, festivals, art and craft." },
];

const ACCENT_OPTIONS = [
    { value: "from-navy-200 to-navy-400", label: "Navy" },
    { value: "from-gold-200 to-gold-400", label: "Gold" },
    { value: "from-blue-200 to-blue-400", label: "Blue" },
    { value: "from-emerald-200 to-emerald-400", label: "Emerald" },
    { value: "from-purple-200 to-purple-400", label: "Purple" },
    { value: "from-rose-200 to-rose-400", label: "Rose" },
];

export default function GalleryAdmin() {
    return (
        <RoleGate allow={["admin"]}>
            <GalleryAdminView />
        </RoleGate>
    );
}

function GalleryAdminView() {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<GalleryItem | "new" | null>(null);
    const [filter, setFilter] = useState<GalleryCategory | "all">("all");

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setItems(await listGalleryAdmin());
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load gallery");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    const visible = filter === "all" ? items : items.filter((i) => i.category === filter);

    return (
        <div>
            <PageHeader
                eyebrow="Portfolio content"
                title="Gallery"
                subtitle="Photos on the website's Gallery page, grouped by category. Add one photo at a time with “+ Add photo”."
                actions={
                    <button
                        onClick={() => setEditing("new")}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        + Add photo
                    </button>
                }
            />

            <div className="p-4 md:p-8">
                {error && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
                )}

                <GalleryGuide items={items} />

                <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {CATEGORIES.map((c) => {
                        const shown = items.filter((i) => i.category === c.value && i.isActive).length;
                        const [min, max] = c.aim;
                        const tone = shown === 0 ? "text-slate-500" : shown < min ? "text-amber-700" : shown > max ? "text-slate-700" : "text-emerald-700";
                        return (
                            <button
                                key={c.value}
                                type="button"
                                onClick={() => setFilter(filter === c.value ? "all" : c.value)}
                                aria-pressed={filter === c.value}
                                className={
                                    "rounded-lg border p-3 text-left transition-colors " +
                                    (filter === c.value ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50")
                                }
                            >
                                <span className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-semibold text-slate-900">{c.label}</span>
                                    <span className={`text-xs font-semibold ${tone}`}>
                                        {shown} shown · aim {min}–{max}{shown >= min && shown <= max ? " ✓" : ""}
                                    </span>
                                </span>
                                <span className="mt-1 block text-[11px] leading-snug text-slate-500">{c.what}</span>
                            </button>
                        );
                    })}
                </div>
                <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
                    {filter === "all" ? (
                        "Showing all photos — tap a category above to see only that one."
                    ) : (
                        <>
                            Showing <strong className="text-slate-700">{CATEGORIES.find((c) => c.value === filter)?.label}</strong> only.
                            <FilterChip active={false} onClick={() => setFilter("all")}>Show all</FilterChip>
                        </>
                    )}
                </div>

                {loading ? (
                    <div className="text-sm text-slate-500">Loading…</div>
                ) : visible.length === 0 ? (
                    <Card>
                        <div className="text-center text-sm text-slate-500">No gallery items in this filter.</div>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {visible.map((item) => (
                            <GalleryCard key={item.id} item={item} onEdit={() => setEditing(item)} onChanged={refresh} />
                        ))}
                    </div>
                )}
            </div>

            {editing && (
                <EditDialog
                    existing={editing === "new" ? null : editing}
                    nextOrder={items.length}
                    onClose={() => setEditing(null)}
                    onSaved={() => { setEditing(null); refresh(); }}
                />
            )}
        </div>
    );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={
                "rounded-full px-3 py-1 " +
                (active ? "bg-blue-600 text-white" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100")
            }
        >{children}</button>
    );
}

function GalleryCard({ item, onEdit, onChanged }: { item: GalleryItem; onEdit: () => void; onChanged: () => void }) {
    const [busy, setBusy] = useState(false);
    async function toggle() {
        setBusy(true);
        try { await updateGalleryItem(item.id, { isActive: !item.isActive }); onChanged(); } finally { setBusy(false); }
    }
    async function remove() {
        if (!confirm(`Delete "${item.title}"?`)) return;
        setBusy(true);
        try { await deleteGalleryItem(item.id); onChanged(); } finally { setBusy(false); }
    }
    return (
        <Card padding={false} className="overflow-hidden">
            <div className={`relative aspect-[4/3] w-full ${item.photoUrl ? "" : `bg-gradient-to-br ${item.accent}`}`}>
                {item.photoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.photoUrl} alt={item.title} className="h-full w-full object-cover" />
                )}
                <div className="absolute right-2 top-2 flex gap-1">
                    <Badge tone="brand">{item.category}</Badge>
                    {!item.isActive && <Badge tone="neutral">Hidden</Badge>}
                </div>
            </div>
            <div className="p-4">
                <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                <p className="mt-1 line-clamp-2 text-xs text-slate-600">{item.description}</p>
                <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
                    <button onClick={onEdit} disabled={busy} className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100">Edit</button>
                    <button onClick={toggle} disabled={busy} className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100">
                        {item.isActive ? "Hide" : "Show"}
                    </button>
                    <button onClick={remove} disabled={busy} className="ml-auto text-xs text-red-700 hover:underline">Delete</button>
                </div>
            </div>
        </Card>
    );
}

function EditDialog({
    existing, nextOrder, onClose, onSaved,
}: {
    existing: GalleryItem | null; nextOrder: number; onClose: () => void; onSaved: () => void;
}) {
    const [title, setTitle] = useState(existing?.title ?? "");
    const [description, setDescription] = useState(existing?.description ?? "");
    const [category, setCategory] = useState<GalleryCategory>(existing?.category ?? "campus");
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
                await updateGalleryItem(existing.id, { title, description, category, accent, order, isActive, photoUrl });
            } else {
                await createGalleryItem({ title, description, category, accent, order, isActive, photoUrl });
            }
            onSaved();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save");
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
            <form onSubmit={handleSubmit} className="my-8 w-full max-w-lg space-y-4 rounded-xl bg-white p-6 shadow-xl">
                <h2 className="text-base font-semibold text-slate-900">
                    {existing ? "Edit photo" : "Add a photo"}
                </h2>
                {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{error}</div>}

                <HelpField as="div" label="Photo" info="Landscape photos work best. The thumbnail is cropped to 4:3; visitors who open it see the whole photo.">
                    <ImageField slot="gallery" subpath="gallery" value={photoUrl} onChange={setPhotoUrl} />
                </HelpField>

                <HelpField label="Title" hint="A short caption, e.g. “Annual Sports Day 2026”.">
                    <input required value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} className={inputCls} placeholder="Annual Sports Day 2026" />
                </HelpField>
                <HelpField label="Description" hint="One sentence shown when the photo is opened.">
                    <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={200} className={inputCls} placeholder="Class VIII students in the 100 m relay final." />
                </HelpField>

                <div className="grid grid-cols-2 gap-3">
                    <HelpField label="Category" hint={CATEGORIES.find((c) => c.value === category)?.what}>
                        <select value={category} onChange={(e) => setCategory(e.target.value as GalleryCategory)} className={inputCls}>
                            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                    </HelpField>
                    <HelpField label="Position" hint="Lower numbers appear first.">
                        <input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value) || 0)} className={inputCls} />
                    </HelpField>
                </div>

                <HelpField label="Colour if no photo" hint="Only used while there's no photo — normally you can ignore this.">
                    <select value={accent} onChange={(e) => setAccent(e.target.value)} className={inputCls}>
                        {ACCENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </HelpField>

                <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                    Show this photo on the website (untick to hide it without deleting)
                </label>

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                    <button type="button" onClick={onClose} className="rounded-md px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">Cancel</button>
                    <button type="submit" disabled={saving} className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                        {saving ? "Saving…" : existing ? "Save changes" : "Create"}
                    </button>
                </div>
            </form>
        </div>
    );
}

const inputCls = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500";

/** What a full, healthy gallery looks like. */
function GalleryGuide({ items }: { items: GalleryItem[] }) {
    const shown = items.filter((i) => i.isActive).length;
    return (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-sm text-blue-950">
            <span className="font-semibold">
                {shown} photo{shown === 1 ? "" : "s"} on the website · aim for 25–40 in total
            </span>
            <InfoTip label="About the gallery">
                <strong>What to upload:</strong> your best, clearest photos — one or two per event, not every shot. Landscape,
                1600 × 1200 px or larger (any size is resized automatically).
                <br />
                <strong>How many:</strong> each category below shows its target. 25–40 photos in total keeps the page full but
                quick to load.
                <br />
                <strong>Keep it fresh:</strong> each term, add new event photos and hide or delete old ones.
                <br />
                <strong>Permission:</strong> get parents&apos; consent before showing students, and don&apos;t put children&apos;s
                full names in captions.
            </InfoTip>
        </div>
    );
}
