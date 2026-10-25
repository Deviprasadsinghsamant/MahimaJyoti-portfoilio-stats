"use client";

/**
 * Generic editor for arrays of homogeneous objects (e.g. testimonials,
 * timeline entries, values). Renders one card per item with a `renderItem`
 * function; adds "+ Add", "Move up/down", "Delete" buttons.
 *
 * Consumers own the item shape and edit UI — this component just handles the
 * list plumbing so every section editor doesn't repeat it.
 */
export function SectionArrayEditor<T>({
    title,
    subtitle,
    items,
    onChange,
    newItem,
    renderItem,
    minItems = 0,
}: {
    title: string;
    subtitle?: string;
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

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                    {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
                </div>
                <button
                    type="button"
                    onClick={add}
                    className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
                >
                    + Add
                </button>
            </div>
            {items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                    No entries yet.
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((item, i) => (
                        <div key={i} className="rounded-lg border border-slate-200 bg-white p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                    #{i + 1}
                                </span>
                                <div className="flex items-center gap-1">
                                    <IconBtn label="Up" onClick={() => move(i, -1)} disabled={i === 0}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M18 15l-6-6-6 6" />
                                        </svg>
                                    </IconBtn>
                                    <IconBtn label="Down" onClick={() => move(i, +1)} disabled={i === items.length - 1}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M6 9l6 6 6-6" />
                                        </svg>
                                    </IconBtn>
                                    <IconBtn label="Delete" onClick={() => remove(i)} disabled={items.length <= minItems} tone="danger">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                        </svg>
                                    </IconBtn>
                                </div>
                            </div>
                            {renderItem(item, (patch) => set(i, { ...item, ...patch }), i)}
                        </div>
                    ))}
                </div>
            )}
        </div>
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
    items, onChange, placeholder, minItems = 0,
}: {
    items: string[];
    onChange: (items: string[]) => void;
    placeholder?: string;
    minItems?: number;
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
                        className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
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
                + Add line
            </button>
        </div>
    );
}
