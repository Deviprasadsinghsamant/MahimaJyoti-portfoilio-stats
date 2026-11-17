// Two or three tabs in a pill, e.g. "Results | Attendance".
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Icon } from "./icons";
import { colors, radius, shadow } from "./theme";

export interface Tab<K extends string> {
    key: K;
    label: string;
    icon?: Icon;
}

export function SegmentedTabs<K extends string>({ tabs, value, onChange }: { tabs: Tab<K>[]; value: K; onChange: (key: K) => void }) {
    return (
        <View style={styles.bar} accessibilityRole="tablist">
            {tabs.map(({ key, label, icon: IconCmp }) => {
                const on = key === value;
                return (
                    <Pressable
                        key={key}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: on }}
                        onPress={() => onChange(key)}
                        style={[styles.tab, on && styles.tabOn]}
                    >
                        {IconCmp && <IconCmp size={16} color={on ? colors.onBrand : colors.muted} strokeWidth={2.3} />}
                        <Text style={[styles.label, on && styles.labelOn]}>{label}</Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    bar: {
        flexDirection: "row",
        backgroundColor: colors.surface,
        borderRadius: radius.pill,
        padding: 5,
        borderWidth: 1,
        borderColor: colors.border,
        boxShadow: shadow.card,
    },
    tab: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 10,
        borderRadius: radius.pill,
    },
    tabOn: { backgroundColor: colors.brand },
    label: { fontSize: 14, fontWeight: "700", color: colors.muted },
    labelOn: { color: colors.onBrand },
});
