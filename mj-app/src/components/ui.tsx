// Building blocks shared by every screen: cards, the navy hero band, pills,
// progress bars, avatars, stat tiles, menu rows and notices.
import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, type StyleProp, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronRight, CircleAlert, Info, type Icon } from "./icons";
import { colors, gradients, initials, radius, shadow } from "./theme";

// ── Card ──────────────────────────────────────────

export function Card({
    children,
    style,
    onPress,
    accessibilityLabel,
}: {
    children: ReactNode;
    style?: StyleProp<ViewStyle>;
    onPress?: () => void;
    accessibilityLabel?: string;
}) {
    if (!onPress) return <View style={[styles.card, style]}>{children}</View>;
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            onPress={onPress}
            style={({ pressed }) => [styles.card, style, pressed && styles.cardPressed]}
        >
            {children}
        </Pressable>
    );
}

// ── Hero: the navy band at the top of a screen ───

/**
 * `safeTop` when the screen has no header (the band then runs under the status
 * bar and starts with a gradient); otherwise it continues the navy header.
 */
export function Hero({ children, safeTop = false, style }: { children: ReactNode; safeTop?: boolean; style?: StyleProp<ViewStyle> }) {
    const insets = useSafeAreaInsets();
    return (
        <View
            style={[
                styles.hero,
                safeTop ? { paddingTop: insets.top + 14, backgroundImage: gradients.brand } : null,
                style,
            ]}
        >
            <View pointerEvents="none" style={styles.heroGlowA} />
            <View pointerEvents="none" style={styles.heroGlowB} />
            {children}
        </View>
    );
}

// ── Small pieces ──────────────────────────────────

export function Pill({ label, fg, bg, icon: IconCmp }: { label: string; fg: string; bg: string; icon?: Icon }) {
    return (
        <View style={[styles.pill, { backgroundColor: bg }]}>
            {IconCmp && <IconCmp size={13} color={fg} strokeWidth={2.5} />}
            <Text style={[styles.pillText, { color: fg }]} numberOfLines={1}>
                {label}
            </Text>
        </View>
    );
}

export function ProgressBar({
    percent,
    color,
    height = 8,
    track = colors.surfaceAlt,
}: {
    percent: number;
    color: string;
    height?: number;
    track?: string;
}) {
    const width = Math.min(100, Math.max(0, percent));
    return (
        <View style={[styles.track, { height, borderRadius: height / 2, backgroundColor: track }]}>
            <View style={{ width: `${width}%`, height, borderRadius: height / 2, backgroundColor: color }} />
        </View>
    );
}

export function Avatar({ name, size = 44, variant = "brand" }: { name: string; size?: number; variant?: "brand" | "glass" | "soft" }) {
    const look =
        variant === "glass"
            ? { backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder }
            : variant === "soft"
              ? { backgroundColor: colors.brandSoft }
              : { backgroundImage: gradients.brand };
    const fg = variant === "soft" ? colors.brand : colors.onBrand;
    return (
        <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }, look]}>
            <Text style={[styles.avatarText, { color: fg, fontSize: Math.round(size * 0.36) }]}>{initials(name)}</Text>
        </View>
    );
}

export function SectionTitle({ title, action }: { title: string; action?: { label: string; onPress: () => void } }) {
    return (
        <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {action && (
                <Pressable accessibilityRole="button" onPress={action.onPress} hitSlop={8}>
                    <Text style={styles.sectionAction}>{action.label}</Text>
                </Pressable>
            )}
        </View>
    );
}

/** A round icon button — glass on the navy band, plain on white. */
export function IconButton({
    icon: IconCmp,
    label,
    onPress,
    busy = false,
    variant = "glass",
}: {
    icon: Icon;
    label: string;
    onPress: () => void;
    busy?: boolean;
    variant?: "glass" | "plain";
}) {
    const fg = variant === "glass" ? colors.onBrand : colors.brand;
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ busy, disabled: busy }}
            onPress={onPress}
            disabled={busy}
            hitSlop={6}
            style={({ pressed }) => [styles.iconButton, variant === "glass" ? styles.iconGlass : styles.iconPlain, pressed && styles.dim]}
        >
            {busy ? <ActivityIndicator size="small" color={fg} /> : <IconCmp size={20} color={fg} strokeWidth={2.2} />}
        </Pressable>
    );
}

/** A number with a label: glass on the navy band, white elsewhere. */
export function StatTile({
    label,
    value,
    sub,
    icon: IconCmp,
    color,
    variant = "surface",
}: {
    label: string;
    value: string;
    sub?: string;
    icon?: Icon;
    color?: string;
    variant?: "surface" | "glass";
}) {
    const glass = variant === "glass";
    return (
        <View style={[styles.stat, glass ? styles.statGlass : styles.statSurface]}>
            <View style={styles.statTop}>
                {IconCmp && <IconCmp size={15} color={glass ? colors.onBrandMuted : colors.muted} strokeWidth={2.2} />}
                <Text style={[styles.statLabel, glass && styles.onBrandMuted]} numberOfLines={1}>
                    {label}
                </Text>
            </View>
            <Text style={[styles.statValue, { color: glass ? colors.onBrand : (color ?? colors.ink) }]} numberOfLines={1}>
                {value}
            </Text>
            {!!sub && (
                <Text style={[styles.statSub, glass && styles.onBrandMuted]} numberOfLines={1}>
                    {sub}
                </Text>
            )}
        </View>
    );
}

// ── Menu rows (settings-style list) ──────────────

export function MenuGroup({ children }: { children: ReactNode }) {
    return <View style={styles.menu}>{children}</View>;
}

export function MenuRow({
    icon: IconCmp,
    label,
    sub,
    onPress,
    tone = "default",
    last = false,
    busy = false,
}: {
    icon: Icon;
    label: string;
    sub?: string;
    onPress: () => void;
    tone?: "default" | "danger";
    last?: boolean;
    busy?: boolean;
}) {
    const fg = tone === "danger" ? colors.danger : colors.brand;
    const bg = tone === "danger" ? colors.dangerSoft : colors.brandSoft;
    return (
        <Pressable
            accessibilityRole="button"
            onPress={onPress}
            disabled={busy}
            style={({ pressed }) => [styles.menuRow, !last && styles.menuDivider, pressed && styles.menuPressed]}
        >
            <View style={[styles.menuIcon, { backgroundColor: bg }]}>
                <IconCmp size={18} color={fg} strokeWidth={2.2} />
            </View>
            <View style={styles.flex}>
                <Text style={[styles.menuLabel, tone === "danger" && { color: colors.danger }]}>{label}</Text>
                {!!sub && <Text style={styles.menuSub}>{sub}</Text>}
            </View>
            {busy ? <ActivityIndicator size="small" color={colors.brand} /> : <ChevronRight size={18} color={colors.muted} />}
        </Pressable>
    );
}

// ── Notices and empty states ─────────────────────

const NOTICE_TONES = {
    info: { fg: colors.info, bg: colors.infoSoft },
    warning: { fg: colors.warning, bg: colors.warningSoft },
    danger: { fg: colors.danger, bg: colors.dangerSoft },
    success: { fg: colors.success, bg: colors.successSoft },
};

export function Notice({
    text,
    tone = "info",
    icon,
    children,
}: {
    text: string;
    tone?: keyof typeof NOTICE_TONES;
    icon?: Icon;
    children?: ReactNode;
}) {
    const t = NOTICE_TONES[tone];
    const IconCmp = icon ?? (tone === "info" ? Info : CircleAlert);
    return (
        <View style={[styles.notice, { backgroundColor: t.bg }]}>
            <IconCmp size={18} color={t.fg} strokeWidth={2.2} style={styles.noticeIcon} />
            <View style={styles.flex}>
                <Text style={[styles.noticeText, { color: t.fg }]}>{text}</Text>
                {children}
            </View>
        </View>
    );
}

export function EmptyState({ icon: IconCmp, title, body }: { icon: Icon; title: string; body: string }) {
    return (
        <View style={styles.empty}>
            <View style={styles.emptyIcon}>
                <IconCmp size={28} color={colors.brand} strokeWidth={2} />
            </View>
            <Text style={styles.emptyTitle}>{title}</Text>
            <Text style={styles.emptyBody}>{body}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    dim: { opacity: 0.6 },
    onBrandMuted: { color: colors.onBrandMuted },

    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        boxShadow: shadow.card,
    },
    cardPressed: { transform: [{ scale: 0.985 }], opacity: 0.94 },

    hero: {
        backgroundColor: colors.brand,
        paddingHorizontal: 20,
        paddingTop: 6,
        paddingBottom: 28,
        borderBottomLeftRadius: radius.xl,
        borderBottomRightRadius: radius.xl,
        overflow: "hidden",
    },
    heroGlowA: {
        position: "absolute",
        width: 260,
        height: 260,
        borderRadius: 130,
        top: -110,
        right: -80,
        backgroundColor: "rgba(255,255,255,0.06)",
    },
    heroGlowB: {
        position: "absolute",
        width: 150,
        height: 150,
        borderRadius: 75,
        bottom: -70,
        left: -40,
        backgroundColor: "rgba(239,122,26,0.22)",
    },

    pill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.pill,
    },
    pillText: { fontSize: 12, fontWeight: "700" },

    track: { width: "100%", overflow: "hidden" },

    avatar: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
    avatarText: { fontWeight: "800", letterSpacing: 0.5 },

    sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10, marginBottom: 2 },
    sectionTitle: { fontSize: 17, fontWeight: "800", color: colors.ink },
    sectionAction: { fontSize: 14, fontWeight: "700", color: colors.brandBright },

    iconButton: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
    iconGlass: { backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder },
    iconPlain: { backgroundColor: colors.brandSoft },

    stat: { flex: 1, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, gap: 2 },
    statSurface: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
    statGlass: { backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder },
    statTop: { flexDirection: "row", alignItems: "center", gap: 5 },
    statLabel: { fontSize: 12, fontWeight: "600", color: colors.muted, flexShrink: 1 },
    statValue: { fontSize: 20, fontWeight: "800", marginTop: 2 },
    statSub: { fontSize: 11, color: colors.muted },

    menu: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
        boxShadow: shadow.card,
    },
    menuRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
    menuDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    menuPressed: { backgroundColor: colors.surfaceAlt },
    menuIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
    menuLabel: { fontSize: 15, fontWeight: "600", color: colors.ink },
    menuSub: { fontSize: 12, color: colors.muted, marginTop: 1 },

    notice: { flexDirection: "row", gap: 10, borderRadius: radius.md, padding: 12 },
    noticeIcon: { marginTop: 1 },
    noticeText: { fontSize: 14, lineHeight: 20, fontWeight: "500" },

    empty: {
        alignItems: "center",
        gap: 6,
        paddingVertical: 32,
        paddingHorizontal: 24,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    emptyIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.brandSoft,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 6,
    },
    emptyTitle: { fontSize: 17, fontWeight: "800", color: colors.ink },
    emptyBody: { fontSize: 14, color: colors.muted, textAlign: "center", lineHeight: 20 },
});
