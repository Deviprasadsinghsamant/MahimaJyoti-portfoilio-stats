// The app's look, taken from the school logo: navy (the lettering) with the
// orange of the emblem as the accent. Scores and attendance use green / blue /
// amber / red so a parent can read them at a glance.

export const colors = {
    background: "#F3F5FB",
    surface: "#FFFFFF",
    surfaceAlt: "#F7F8FC",
    border: "#E3E7F1",
    ink: "#0D1440",
    text: "#3A4466",
    muted: "#7B849E",

    brand: "#1E2A78",
    brandDeep: "#121A52",
    brandBright: "#3346B8",
    brandSoft: "#E9ECFB",

    accent: "#EF7A1A",
    accentDeep: "#C95F0A",
    accentSoft: "#FFF1E4",

    danger: "#C62828",
    dangerSoft: "#FDECEC",
    warning: "#B45309",
    warningSoft: "#FEF3C7",
    success: "#16834A",
    successSoft: "#E3F6EA",
    info: "#2459D6",
    infoSoft: "#E6EEFF",

    onBrand: "#FFFFFF",
    onBrandMuted: "rgba(255,255,255,0.72)",
    glass: "rgba(255,255,255,0.12)",
    glassBorder: "rgba(255,255,255,0.18)",
};

export const gradients = {
    brand: "linear-gradient(160deg, #2C3CA3 0%, #1E2A78 55%, #121A52 100%)",
    accent: "linear-gradient(135deg, #F59A3C 0%, #EF7A1A 60%, #D9650C 100%)",
    parentCard: "linear-gradient(160deg, #FFF6EE 0%, #FFFFFF 70%)",
    teacherCard: "linear-gradient(160deg, #EEF0FD 0%, #FFFFFF 70%)",
};

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 };

export const shadow = {
    card: "0 6px 18px rgba(18, 26, 82, 0.07)",
    raised: "0 12px 28px rgba(18, 26, 82, 0.14)",
    button: "0 6px 14px rgba(30, 42, 120, 0.28)",
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };

/** Colour for a percentage: green ≥ 75, blue ≥ 50, amber ≥ 33, red below. */
export function scoreTone(percent: number): { fg: string; bg: string } {
    if (percent >= 75) return { fg: colors.success, bg: colors.successSoft };
    if (percent >= 50) return { fg: colors.info, bg: colors.infoSoft };
    if (percent >= 33) return { fg: colors.warning, bg: colors.warningSoft };
    return { fg: colors.danger, bg: colors.dangerSoft };
}

/** Attendance: green from 90%, amber from 75% (the usual minimum), red below. */
export function attendanceTone(percent: number): { fg: string; bg: string } {
    if (percent >= 90) return { fg: colors.success, bg: colors.successSoft };
    if (percent >= 75) return { fg: colors.warning, bg: colors.warningSoft };
    return { fg: colors.danger, bg: colors.dangerSoft };
}

/** "Rahul Kumar Sahu" → "RK". */
export function initials(name: string): string {
    return (
        name
            .split(/\s+/)
            .filter((w) => /^[A-Za-z]/.test(w))
            .slice(0, 2)
            .map((w) => w[0].toUpperCase())
            .join("") || "?"
    );
}
