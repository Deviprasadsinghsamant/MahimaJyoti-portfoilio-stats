"use client";

import { ICON_MAP, ICON_NAMES, type IconName, getIcon } from "@/lib/portal/iconRegistry";

interface Props {
    value: string;
    onChange: (name: IconName) => void;
    className?: string;
}

export function IconPicker({ value, onChange, className }: Props) {
    const Current = getIcon(value);
    return (
        <div className={`space-y-2 ${className ?? ""}`}>
            <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
                    {Current ? <Current className="h-5 w-5" /> : <span className="text-xs text-slate-400">?</span>}
                </div>
                <select
                    value={ICON_NAMES.includes(value as IconName) ? value : ""}
                    onChange={(e) => onChange(e.target.value as IconName)}
                    className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                    <option value="">— pick an icon —</option>
                    {ICON_NAMES.map((n) => (
                        <option key={n} value={n}>{n}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}

export { ICON_NAMES, ICON_MAP };
