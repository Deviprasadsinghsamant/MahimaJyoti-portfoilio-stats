import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "./theme";

/** A plain text action, for secondary choices like "Privacy policy". */
export function TextLink({ label, onPress, tone = "brand" }: { label: string; onPress: () => void; tone?: "brand" | "danger" | "muted" }) {
    return (
        <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8} style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
            <Text style={[styles.label, tone === "danger" && styles.danger, tone === "muted" && styles.muted]}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    link: { paddingVertical: 8, alignSelf: "center" },
    pressed: { opacity: 0.6 },
    label: { color: colors.brandBright, fontSize: 14, fontWeight: "700" },
    danger: { color: colors.danger },
    muted: { color: colors.muted, fontWeight: "600" },
});
