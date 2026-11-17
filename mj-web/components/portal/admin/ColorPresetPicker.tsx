"use client";

import { COLOR_PRESETS, presetForGradient, type ColorPreset } from "@/lib/portal/colorPresets";

/** Pick a card colour by name; `gradient` identifies the current choice. */
export function ColorPresetPicker({ gradient, onChange }: { gradient: string; onChange: (preset: ColorPreset) => void }) {
    const current = presetForGradient(gradient);
    return (
        <div className="flex flex-wrap gap-2">
            {COLOR_PRESETS.map((p) => (
                <button
                    key={p.id}
                    type="button"
                    onClick={() => onChange(p)}
                    aria-pressed={current?.id === p.id}
                    className={
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs " +
                        (current?.id === p.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100")
                    }
                >
                    <span className={`h-3 w-3 rounded-full ${p.swatch}`} />
                    {p.label}
                </button>
            ))}
        </div>
    );
}
