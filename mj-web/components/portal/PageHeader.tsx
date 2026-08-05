"use client";

export function PageHeader({
    title,
    subtitle,
    actions,
    eyebrow,
}: {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    eyebrow?: string;
}) {
    return (
        <div className="border-b border-slate-200 bg-white">
            <div className="flex flex-col gap-3 px-4 py-5 md:flex-row md:items-end md:justify-between md:px-8 md:py-6">
                <div>
                    {eyebrow && (
                        <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-blue-700">
                            {eyebrow}
                        </div>
                    )}
                    <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">{title}</h1>
                    {subtitle && <p className="mt-1 text-sm text-slate-600 md:max-w-2xl">{subtitle}</p>}
                </div>
                {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
        </div>
    );
}
