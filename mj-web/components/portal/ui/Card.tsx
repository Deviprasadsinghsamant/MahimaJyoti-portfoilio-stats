"use client";

import { clsx } from "clsx";

export function Card({
    children,
    className,
    padding = true,
}: {
    children: React.ReactNode;
    className?: string;
    padding?: boolean;
}) {
    return (
        <div
            className={clsx(
                "rounded-xl border border-slate-200 bg-white shadow-sm",
                padding && "p-5",
                className
            )}
        >
            {children}
        </div>
    );
}

export function CardHeader({
    title,
    subtitle,
    action,
    className,
}: {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={clsx("mb-4 flex items-start justify-between gap-3", className)}>
            <div>
                <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}
