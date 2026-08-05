// Validated categorical palette (from the data-viz reference palette).
// Passes CVD ΔE ≥ 8 and normal-vision ΔE ≥ 15 on adjacent pairs.
// Slot order matters: assign in fixed order, never cycle.
export const CHART_PALETTE = [
    "#2a78d6", // blue    — primary brand
    "#eb6834", // orange
    "#1baf7a", // aqua
    "#eda100", // yellow
    "#e87ba4", // magenta
    "#008300", // green
    "#4a3aa7", // violet
    "#e34948", // red
];

// Score bucket → color pill (background + text). Used on results cells.
export function scoreBucket(pct: number): {
    label: string;
    bg: string;
    fg: string;
} {
    if (pct >= 85) return { label: "excellent", bg: "bg-emerald-50", fg: "text-emerald-800" };
    if (pct >= 70) return { label: "good", bg: "bg-sky-50", fg: "text-sky-800" };
    if (pct >= 55) return { label: "average", bg: "bg-amber-50", fg: "text-amber-800" };
    if (pct >= 40) return { label: "below", bg: "bg-orange-50", fg: "text-orange-800" };
    return { label: "fail", bg: "bg-red-50", fg: "text-red-800" };
}

// Neutral chart theme for Chart.js — text tokens stay ink, grid recessive.
export const CHART_INK = "#334155";
export const CHART_MUTED = "#94a3b8";
export const CHART_GRID = "#e2e8f0";
