"use client";

import { clsx } from "clsx";

interface Props {
    children: React.ReactNode;
    tone?: "neutral" | "brand" | "positive" | "warning" | "danger";
    size?: "sm" | "md";
    className?: string;
}

const TONE: Record<NonNullable<Props["tone"]>, string> = {
    neutral: "bg-slate-100 text-slate-700",
    brand: "bg-blue-50 text-blue-800 ring-1 ring-inset ring-blue-200",
    positive: "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200",
    warning: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200",
    danger: "bg-red-50 text-red-800 ring-1 ring-inset ring-red-200",
};

const SIZE: Record<NonNullable<Props["size"]>, string> = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
};

export function Badge({ children, tone = "neutral", size = "md", className }: Props) {
    return (
        <span className={clsx("inline-flex items-center rounded-full font-medium", TONE[tone], SIZE[size], className)}>
            {children}
        </span>
    );
}
