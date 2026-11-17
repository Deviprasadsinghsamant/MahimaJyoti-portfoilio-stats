// Named colour schemes for cards on the public site (academic pathways and
// programs). Admins pick a name; the site uses the classes below. Tailwind only
// generates classes it finds written out in the source, so every class must
// appear here in full — typing new class names into the admin wouldn't work.

export interface ColorPreset {
    id: string;
    label: string;
    // Icon tile / header gradient.
    gradient: string;
    // Soft shadow under the icon tile.
    glow: string;
    // Light badge background and its text colour.
    bg: string;
    text: string;
    // Swatch for the picker.
    swatch: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
    { id: "blue", label: "Blue", gradient: "from-blue-500 to-blue-700", glow: "shadow-blue-500/20", bg: "bg-blue-50", text: "text-blue-700", swatch: "bg-blue-600" },
    { id: "emerald", label: "Green", gradient: "from-emerald-500 to-emerald-700", glow: "shadow-emerald-500/20", bg: "bg-emerald-50", text: "text-emerald-700", swatch: "bg-emerald-600" },
    { id: "amber", label: "Gold", gradient: "from-amber-500 to-amber-700", glow: "shadow-amber-500/20", bg: "bg-amber-50", text: "text-amber-700", swatch: "bg-amber-600" },
    { id: "orange", label: "Orange", gradient: "from-orange-500 to-orange-700", glow: "shadow-orange-500/20", bg: "bg-orange-50", text: "text-orange-700", swatch: "bg-orange-600" },
    { id: "rose", label: "Rose", gradient: "from-rose-500 to-rose-700", glow: "shadow-rose-500/20", bg: "bg-rose-50", text: "text-rose-700", swatch: "bg-rose-600" },
    { id: "violet", label: "Purple", gradient: "from-violet-500 to-violet-700", glow: "shadow-violet-500/20", bg: "bg-violet-50", text: "text-violet-700", swatch: "bg-violet-600" },
    { id: "teal", label: "Teal", gradient: "from-teal-500 to-teal-700", glow: "shadow-teal-500/20", bg: "bg-teal-50", text: "text-teal-700", swatch: "bg-teal-600" },
    { id: "indigo", label: "Navy", gradient: "from-indigo-600 to-indigo-800", glow: "shadow-indigo-500/20", bg: "bg-indigo-50", text: "text-indigo-700", swatch: "bg-indigo-700" },
];

/** The preset whose gradient matches, if any (older entries stored raw classes). */
export function presetForGradient(gradient: string): ColorPreset | undefined {
    return COLOR_PRESETS.find((p) => p.gradient === gradient);
}
