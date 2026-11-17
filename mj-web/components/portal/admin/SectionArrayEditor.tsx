"use client";

import { CountBadge, Example, InfoTip, ShownBadge } from "./Help";

/** What a section is for, shown in its header so the page explains itself. */
interface SectionGuide {
    title: string;
    // One line: what to put here.
    subtitle?: string;
    // Where on the website it appears, e.g. "Home page, under the banner".
    where?: string;
    // The ⓘ tip: fuller guidance.
    help?: React.ReactNode;
    // A sample of good content.
    example?: React.ReactNode;
}

function SectionHeader({ title, subtitle, where, help, badge }: SectionGuide & { badge?: React.ReactNode }) {
    return (
        <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
                <h3 className="flex items-center text-sm font-semibold text-slate-900">
                    {title}
                    {help && <InfoTip label={`About “${title}”`}>{help}</InfoTip>}
                </h3>
                {subtitle && <p className="mt-0.5 text-xs text-slate-600">{subtitle}</p>}
                {where && <p className="mt-0.5 text-[11px] text-slate-400">Appears on: {where}</p>}
            </div>
            {badge}
        </div>
    );
}

/**
 * Generic editor for arrays of homogeneous objects (e.g. testimonials,
 * timeline entries, values). Renders one card per item with a `renderItem`
 * function; adds "+ Add", "Move up/down", "Delete" buttons, and says how many
 * items the section should have.
 *
 * Consumers own the item shape and edit UI — this component just handles the
 * list plumbing so every section editor doesn't repeat it.
 */
export function SectionArrayEditor<T>({
    title,
    subtitle,
    where,
    help,
    example,
    recommended,
    noun = "item",
    itemTitle,
    items,
    onChange,
    newItem,
    renderItem,
    minItems = 0,
}: SectionGuide & {
    // How many items look right on the website.
    recommended?: { min: number; max: number };
    // Singular name for one item, e.g. "notice" — used in "+ Add notice".
    noun?: string;
    // Card heading for an item, e.g. its title; falls back to "notice 1".
    itemTitle?: (item: T) => string;
    items: T[];
    onChange: (items: T[]) => void;
    /** Factory for a blank item when "+ Add" is clicked. */
    newItem: () => T;
    /** Render the per-item editor. */
    renderItem: (item: T, update: (patch: Partial<T>) => void, index: number) => React.ReactNode;
    minItems?: number;
}) {
    function set(index: number, next: T) {
        const copy = items.slice();
        copy[index] = next;
        onChange(copy);
    }

    function remove(index: number) {
        if (items.length <= minItems) return;
        onChange(items.filter((_, i) => i !== index));
    }

    function move(index: number, dir: -1 | 1) {
        const target = index + dir;
        if (target < 0 || target >= items.length) return;
        const copy = items.slice();
        [copy[index], copy[target]] = [copy[target], copy[index]];
        onChange(copy);
    }

    function add() {
        onChange([...items, newItem()]);
    }

    const addButton = (
        <button
            type="button"
            onClick={add}
            className="rounded-md border border-blue-600 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
        >
            + Add {noun}
        </button>
    );

    return (
        <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <SectionHeader
                title={title}
                subtitle={subtitle}
                where={where}
                help={help}
                badge={
                    recommended ? (
                        <CountBadge count={items.length} min={recommended.min} max={recommended.max} noun={noun} />
                    ) : (
                        <ShownBadge state={items.length ? "shown" : "hidden"} />
                    )
                }
            />
            {example && <Example>{example}</Example>}
            {items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-xs text-slate-500">
                    <p className="mb-3">Nothing added yet — this section is hidden on the website until you add one.</p>
                    {addButton}
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((item, i) => (
                        <div key={i} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="mb-3 flex items-center justify-between gap-2">
                                <span className="truncate text-xs font-semibold text-slate-500">
                                    {i + 1}. {itemTitle?.(item)?.trim() || `New ${noun}`}
                                </span>
                                <div className="flex shrink-0 items-center gap-1">
                                    <IconBtn label="Move up" onClick={() => move(i, -1)} disabled={i === 0}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M18 15l-6-6-6 6" />
                                        </svg>
                                    </IconBtn>
                                    <IconBtn label="Move down" onClick={() => move(i, +1)} disabled={i === items.length - 1}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M6 9l6 6 6-6" />
                                        </svg>
                                    </IconBtn>
                                    <IconBtn label={`Delete this ${noun}`} onClick={() => remove(i)} disabled={items.length <= minItems} tone="danger">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                        </svg>
                                    </IconBtn>
                                </div>
                            </div>
                            {renderItem(item, (patch) => set(i, { ...item, ...patch }), i)}
                        </div>
                    ))}
                    <div>{addButton}</div>
                </div>
            )}
        </section>
    );
}

/** A one-off section (not a list) styled like SectionArrayEditor, e.g. the home banner. */
export function SectionCard({
    title,
    subtitle,
    where,
    help,
    example,
    state,
    children,
}: SectionGuide & {
    // Whether it currently shows on the website.
    state?: "shown" | "hidden" | "default";
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <SectionHeader title={title} subtitle={subtitle} where={where} help={help} badge={state && <ShownBadge state={state} />} />
            {example && <Example>{example}</Example>}
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">{children}</div>
        </section>
    );
}

function IconBtn({
    children, onClick, disabled, label, tone,
}: {
    children: React.ReactNode; onClick: () => void; disabled?: boolean; label: string; tone?: "danger";
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            title={label}
            className={
                "rounded p-1 disabled:opacity-40 " +
                (tone === "danger" ? "text-red-700 hover:bg-red-50" : "text-slate-500 hover:bg-slate-100")
            }
        >
            {children}
        </button>
    );
}

/** Convenience for editing an array of primitive strings (e.g. features, requirements, address lines). */
export function StringListEditor({
    items, onChange, placeholder, minItems = 0, addLabel = "+ Add line",
}: {
    items: string[];
    onChange: (items: string[]) => void;
    placeholder?: string;
    minItems?: number;
    addLabel?: string;
}) {
    return (
        <div className="space-y-2">
            {items.map((val, i) => (
                <div key={i} className="flex items-center gap-2">
                    <input
                        value={val}
                        onChange={(e) => {
                            const copy = items.slice();
                            copy[i] = e.target.value;
                            onChange(copy);
                        }}
                        placeholder={placeholder}
                        aria-label={`${placeholder ?? "Line"} ${i + 1}`}
                        className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500"
                    />
                    <button
                        type="button"
                        onClick={() => onChange(items.filter((_, ix) => ix !== i))}
                        disabled={items.length <= minItems}
                        className="rounded p-1 text-red-700 hover:bg-red-50 disabled:opacity-40"
                        aria-label="Remove"
                    >
                        ×
                    </button>
                </div>
            ))}
            <button
                type="button"
                onClick={() => onChange([...items, ""])}
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
            >
                {addLabel}
            </button>
        </div>
    );
}
