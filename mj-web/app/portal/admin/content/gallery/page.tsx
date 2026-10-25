"use client";

import { useCallback, useEffect, useState } from "react";
import { RoleGate } from "@/components/portal/RoleGate";
import { PageHeader } from "@/components/portal/PageHeader";
import { Card } from "@/components/portal/ui/Card";
import { Badge } from "@/components/portal/ui/Badge";
import { ImageField } from "@/components/portal/admin/ImageField";
import {
    listGalleryAdmin,
    createGalleryItem,
    updateGalleryItem,
    deleteGalleryItem,
} from "@/lib/portal/content";
import type { GalleryCategory, GalleryItem } from "@/domain/portal/content-types";

const CATEGORIES: { value: GalleryCategory; label: string }[] = [
    { value: "campus", label: "Campus" },
    { value: "events", label: "Events" },
    { value: "academics", label: "Academics" },
    { value: "sports", label: "Sports" },
    { value: "achievements", label: "Achievements" },
    { value: "cultural", label: "Cultural" },
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
                subtitle="Images shown on /gallery. Only active items are visible to visitors."
                actions={
                    <button
                        onClick={() => setEditing("new")}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        + Add item
                    </button>
                }
            />

            <div className="p-4 md:p-8">
                {error && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
                )}

                <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold uppercase tracking-widest text-slate-500">Filter</span>
                    <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>All</FilterChip>
                    {CATEGORIES.map((c) => (
                        <FilterChip key={c.value} active={filter === c.value} onClick={() => setFilter(c.value)}>{c.label}</FilterChip>
                    ))}
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
                    {existing ? "Edit gallery item" : "New gallery item"}
                </h2>
                {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{error}</div>}

                <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">Photo</label>
                    <ImageField subpath="gallery" value={photoUrl} onChange={setPhotoUrl} />
                </div>

                <Field label="Title"><input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} /></Field>
                <Field label="Description">
                    <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputCls} />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                    <Field label="Category">
                        <select value={category} onChange={(e) => setCategory(e.target.value as GalleryCategory)} className={inputCls}>
                            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                    </Field>
                    <Field label="Sort order"><input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value) || 0)} className={inputCls} /></Field>
                </div>

                <Field label="Fallback accent (used when no photo uploaded)">
                    <select value={accent} onChange={(e) => setAccent(e.target.value)} className={inputCls}>
                        {ACCENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </Field>

                <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                    Show on public /gallery page
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
function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return <label className="block text-xs font-medium text-slate-700"><span className="mb-1 block">{label}</span>{children}</label>;
}
