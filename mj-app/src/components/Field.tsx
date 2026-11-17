// A labelled text box with an icon, for the sign-in forms.
import { type Ref, useState } from "react";
import { StyleSheet, Text, TextInput, type TextInputInstance, type TextInputProps, View } from "react-native";
import type { Icon } from "./icons";
import { colors, radius } from "./theme";

export function Field({
    label,
    icon: IconCmp,
    error,
    ref,
    ...input
}: TextInputProps & { label: string; icon: Icon; error?: string | null; ref?: Ref<TextInputInstance> }) {
    const [focused, setFocused] = useState(false);
    const border = error ? colors.danger : focused ? colors.brand : colors.border;
    return (
        <View style={styles.wrap}>
            <Text style={styles.label}>{label}</Text>
            <View style={[styles.box, { borderColor: border }, focused && styles.boxFocused]}>
                <IconCmp size={19} color={error ? colors.danger : focused ? colors.brand : colors.muted} strokeWidth={2.2} />
                <TextInput
                    ref={ref}
                    placeholderTextColor="#A3AABD"
                    accessibilityLabel={label}
                    {...input}
                    onFocus={(e) => {
                        setFocused(true);
                        input.onFocus?.(e);
                    }}
                    onBlur={(e) => {
                        setFocused(false);
                        input.onBlur?.(e);
                    }}
                    style={styles.input}
                />
            </View>
            {!!error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { gap: 6 },
    label: { fontSize: 13, fontWeight: "700", color: colors.text },
    box: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        borderWidth: 1.5,
        borderRadius: radius.md,
        paddingHorizontal: 14,
        backgroundColor: colors.surfaceAlt,
    },
    boxFocused: { backgroundColor: colors.surface },
    input: { flex: 1, paddingVertical: 13, fontSize: 17, color: colors.ink },
    error: { color: colors.danger, fontSize: 12, fontWeight: "600" },
});
