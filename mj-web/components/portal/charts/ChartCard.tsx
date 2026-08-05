"use client";

import { useEffect, useState } from "react";

interface Props {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
    filters?: React.ReactNode;
    children: React.ReactNode;
    heightClass?: string;
    fullscreenHeightClass?: string;
    className?: string;
}

/**
 * Card wrapper that adds an expand icon → opens the chart in a full-screen modal.
 * The children receive the same interactivity (Chart.js re-renders responsively).
 */
export function ChartCard({
    title,
    subtitle,
    action,
    filters,
    children,
    heightClass = "h-72",
    fullscreenHeightClass = "h-[70vh]",
    className,
}: Props) {
    const [fs, setFs] = useState(false);

    useEffect(() => {
        if (!fs) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setFs(false);
        };
        document.addEventListener("keydown", onKey);
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = previous;
        };
    }, [fs]);

    return (
        <>
            <div className={`flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-sm ${className ?? ""}`}>
                <Header
                    title={title}
                    subtitle={subtitle}
                    action={action}
                    onExpand={() => setFs(true)}
                />
                {filters && (
                    <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 px-5 py-3">
                        {filters}
                    </div>
                )}
                <div className={`flex-1 px-3 pb-4 ${heightClass}`}>{children}</div>
            </div>

            {fs && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
                    <div className="flex h-full max-h-[95vh] w-full max-w-6xl flex-col rounded-xl bg-white shadow-2xl">
                        <Header
                            title={title}
                            subtitle={subtitle}
                            action={
                                <button
                                    onClick={() => setFs(false)}
                                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                    aria-label="Close"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                                        <path d="M6 6l12 12M18 6L6 18" />
                                    </svg>
                                </button>
                            }
                            hideExpand
                        />
                        {filters && (
                            <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 px-5 py-3">
                                {filters}
                            </div>
                        )}
                        <div className={`flex-1 px-6 pb-6 ${fullscreenHeightClass}`}>{children}</div>
                    </div>
                </div>
            )}
        </>
    );
}

function Header({
    title,
    subtitle,
    action,
    onExpand,
    hideExpand,
}: {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
    onExpand?: () => void;
    hideExpand?: boolean;
}) {
    return (
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
            <div>
                <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-1">
                {action}
                {!hideExpand && (
                    <button
                        onClick={onExpand}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Expand chart"
                        title="Full screen"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 3h6v6M9 21H3v-6M21 3l-8 8M3 21l8-8" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}
