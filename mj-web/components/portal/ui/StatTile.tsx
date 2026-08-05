"use client";

import { clsx } from "clsx";

interface Props {
    label: string;
    value: string | number;
    suffix?: string;
    hint?: string;
    tone?: "default" | "brand" | "positive" | "warning";
}

const TONE_STYLES: Record<NonNullable<Props["tone"]>, string> = {
    default: "border-slate-200",
    brand: "border-blue-200 bg-gradient-to-br from-blue-50 to-white",
    positive: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white",
    warning: "border-amber-200 bg-gradient-to-br from-amber-50 to-white",
};

export function StatTile({ label, value, suffix, hint, tone = "default" }: Props) {
    return (
        <div className={clsx("rounded-xl border bg-white p-4 shadow-sm", TONE_STYLES[tone])}>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {label}
            </div>
            <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-semibold text-slate-900 tabular-nums">{value}</span>
                {suffix && <span className="text-sm text-slate-500">{suffix}</span>}
            </div>
            {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
        </div>
    );
}
