// Shows "New marks for …" when a push arrives while the app is open — Android
// only shows the system notification when the app is in the background.
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "../lib/store";
import { Bell } from "./icons";
import { colors, radius, shadow } from "./theme";

const SHOW_MS = 5000;

export function NoticeBanner() {
    const { notice, dismissNotice } = useStore();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (!notice) return;
        const timer = setTimeout(dismissNotice, SHOW_MS);
        return () => clearTimeout(timer);
    }, [notice, dismissNotice]);

    if (!notice) return null;
    return (
        <Pressable accessibilityRole="alert" onPress={dismissNotice} style={[styles.banner, { top: insets.top + 8 }]}>
            <View style={styles.icon}>
                <Bell size={18} color={colors.onBrand} strokeWidth={2.3} />
            </View>
            <View style={styles.text}>
                <Text style={styles.title}>{notice.title}</Text>
                {!!notice.body && <Text style={styles.body}>{notice.body}</Text>}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    banner: {
        position: "absolute",
        left: 12,
        right: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: colors.brandDeep,
        borderRadius: radius.lg,
        paddingVertical: 12,
        paddingHorizontal: 14,
        boxShadow: shadow.raised,
    },
    icon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.accent,
        alignItems: "center",
        justifyContent: "center",
    },
    text: { flex: 1 },
    title: { color: colors.onBrand, fontWeight: "800", fontSize: 15 },
    body: { color: "#C9D0F2", marginTop: 2, fontSize: 14 },
});
