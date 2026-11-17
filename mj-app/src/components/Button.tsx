import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import type { Icon } from "./icons";
import { colors, radius, shadow } from "./theme";

type Variant = "primary" | "accent" | "secondary" | "danger";

interface Props {
    label: string;
    onPress: () => void;
    variant?: Variant;
    icon?: Icon;
    busy?: boolean;
    disabled?: boolean;
}

const FG: Record<Variant, string> = {
    primary: colors.onBrand,
    accent: colors.onBrand,
    secondary: colors.brand,
    danger: colors.danger,
};

export function Button({ label, onPress, variant = "primary", icon: IconCmp, busy = false, disabled = false }: Props) {
    const off = disabled || busy;
    const fg = FG[variant];
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: off, busy }}
            onPress={onPress}
            disabled={off}
            style={({ pressed }) => [styles.base, styles[variant], off && styles.off, pressed && styles.pressed]}
        >
            {busy ? (
                <ActivityIndicator color={fg} />
            ) : (
                <View style={styles.content}>
                    {IconCmp && <IconCmp size={19} color={fg} strokeWidth={2.3} />}
                    <Text style={[styles.label, { color: fg }]}>{label}</Text>
                </View>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: {
        minHeight: 52,
        borderRadius: radius.md,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 18,
    },
    content: { flexDirection: "row", alignItems: "center", gap: 8 },
    primary: { backgroundColor: colors.brand, boxShadow: shadow.button },
    accent: { backgroundColor: colors.accent, boxShadow: "0 6px 14px rgba(239, 122, 26, 0.32)" },
    secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    danger: { backgroundColor: colors.surface, borderWidth: 1, borderColor: "#F5C9C9" },
    off: { opacity: 0.55, boxShadow: "none" },
    pressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
    label: { fontSize: 16, fontWeight: "700", letterSpacing: 0.2 },
});
