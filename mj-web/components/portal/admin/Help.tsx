"use client";

// Self-explaining building blocks for the website content editors: the ⓘ tip,
// labelled fields with a hint underneath, an example box, and the "how many"
// counter — so a first-time user can see on the page what goes where.

import { useEffect, useId, useRef, useState } from "react";

/**
 * An ⓘ button. Hovering or focusing previews the explanation; a click (or tap)
 * keeps it open until clicked again, clicked elsewhere, or Escape.
 */
export function InfoTip({ children, label = "What is this?" }: { children: React.ReactNode; label?: string }) {
    const [hover, setHover] = useState(false);
    const [pinned, setPinned] = useState(false);
    const open = hover || pinned;
    const id = useId();
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (!pinned) return;
        const close = (e: Event) => {
            if (!ref.current?.contains(e.target as Node)) {
                setPinned(false);
                setHover(false);
            }
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setPinned(false);
                setHover(false);
            }
        };
        document.addEventListener("mousedown", close);
        document.addEventListener("touchstart", close);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", close);
            document.removeEventListener("touchstart", close);
            document.removeEventListener("keydown", onKey);
        };
    }, [pinned]);

    return (
        <span
            ref={ref}
            className="relative inline-flex align-middle"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <button
                type="button"
                aria-label={label}
                aria-expanded={open}
                aria-describedby={open ? id : undefined}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (pinned) {
                        setPinned(false);
                        setHover(false);
                    } else {
                        setPinned(true);
                    }
                }}
                onFocus={() => setHover(true)}
                onBlur={() => setHover(false)}
                className="ml-1 inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-blue-300 bg-blue-50 font-serif text-[11px] font-bold italic leading-none text-blue-700 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
                i
            </button>
            {open && (
                <span
                    id={id}
                    role="tooltip"
                    className="absolute left-0 top-full z-50 mt-2 block w-80 max-w-[85vw] rounded-lg border border-slate-200 bg-white p-3 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-slate-700 shadow-xl"
                >
                    {children}
                </span>
            )}
        </span>
    );
}

/**
 * A labelled form field: the title (with an optional ⓘ), the control, and a
 * plain-language hint under it. `as="div"` for controls that mustn't sit inside
 * a <label> (photo uploads, lists with their own buttons).
 */
export function Field({
    label,
    hint,
    info,
    optional,
    full,
    as = "label",
    children,
}: {
    label: string;
    hint?: React.ReactNode;
    info?: React.ReactNode;
    optional?: boolean;
    full?: boolean;
    as?: "label" | "div";
    children: React.ReactNode;
}) {
    const title = (
        <span className="mb-1 flex items-center text-xs font-semibold text-slate-800">
            {label}
            {optional && <span className="ml-1.5 font-normal text-slate-400">(optional)</span>}
            {info && <InfoTip label={`About “${label}”`}>{info}</InfoTip>}
        </span>
    );
    const hintEl = hint && <span className="mt-1 block text-[11px] leading-snug text-slate-500">{hint}</span>;
    return (
        <div className={full ? "md:col-span-full" : undefined}>
            {title}
            {as === "label" ? (
                <label className="block">
                    <span className="sr-only">{label}</span>
                    {children}
                </label>
            ) : (
                children
            )}
            {hintEl}
        </div>
    );
}

const inputClass =
    "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export function TextInput({
    value,
    onChange,
    placeholder,
    type = "text",
    maxLength,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: "text" | "tel" | "email" | "url";
    maxLength?: number;
}) {
    return (
        <span className="block">
            <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength} className={inputClass} />
            {maxLength && value.length > maxLength * 0.8 && (
                <span className="mt-0.5 block text-right text-[10px] text-slate-400">
                    {value.length} / {maxLength}
                </span>
            )}
        </span>
    );
}

export function TextArea({
    value,
    onChange,
    placeholder,
    rows = 3,
    maxLength,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    rows?: number;
    maxLength?: number;
}) {
    return (
        <span className="block">
            <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} maxLength={maxLength} className={inputClass} />
            {maxLength && (
                <span className={"mt-0.5 block text-right text-[10px] " + (value.length > maxLength * 0.9 ? "text-amber-600" : "text-slate-400")}>
                    {value.length} / {maxLength}
                </span>
            )}
        </span>
    );
}

/** A soft box showing an example of good content. */
export function Example({ title = "Example", children }: { title?: string; children: React.ReactNode }) {
    return (
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs leading-relaxed text-amber-900">
            <span className="font-semibold">{title}: </span>
            {children}
        </div>
    );
}

/** "2 added · aim for 3–4": green when in range, amber when short, slate when over. */
export function CountBadge({ count, min, max, noun }: { count: number; min: number; max: number; noun: string }) {
    const aim = min === max ? `${min}` : `${min}–${max}`;
    const tone =
        count === 0
            ? "border-slate-200 bg-slate-50 text-slate-500"
            : count < min
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : count > max
                ? "border-slate-300 bg-slate-100 text-slate-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-800";
    const note = count > max ? " — consider removing some" : count >= min ? " ✓" : "";
    return (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${tone}`}>
            {count} {count === 1 ? noun : `${noun}s`} · aim for {aim}
            {note}
        </span>
    );
}

/** Whether a section will appear on the website. */
export function ShownBadge({ state }: { state: "shown" | "hidden" | "default" }) {
    const styles = {
        shown: ["border-emerald-200 bg-emerald-50 text-emerald-800", "Shown on website"],
        hidden: ["border-slate-200 bg-slate-50 text-slate-500", "Hidden until filled in"],
        default: ["border-blue-200 bg-blue-50 text-blue-800", "Showing default text"],
    } as const;
    const [cls, text] = styles[state];
    return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>{text}</span>;
}
