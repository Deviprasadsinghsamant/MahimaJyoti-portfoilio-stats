// The frame of both sign-in screens: navy band with the logo and a heading,
// then the form on a raised white card.
import type { ReactNode } from "react";
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radius, shadow } from "./theme";
import { Hero } from "./ui";

export function SignInLayout({ eyebrow, title, lead, children, below }: { eyebrow: string; title: string; lead: string; children: ReactNode; below?: ReactNode }) {
    return (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Hero style={styles.hero}>
                    <View style={styles.row}>
                        <View style={styles.logoWrap}>
                            <Image source={require("../../assets/logo.png")} style={styles.logo} accessibilityLabel="School logo" />
                        </View>
                        <View style={styles.flex}>
                            <Text style={styles.eyebrow}>{eyebrow}</Text>
                            <Text style={styles.title}>{title}</Text>
                        </View>
                    </View>
                    <Text style={styles.lead}>{lead}</Text>
                </Hero>
                <View style={styles.card}>{children}</View>
                {below && <View style={styles.below}>{below}</View>}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    content: { paddingBottom: 32 },
    hero: { paddingBottom: 56 },
    row: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 6 },
    logoWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.surface,
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
    },
    logo: { width: 56, height: 56 },
    eyebrow: { fontSize: 12, fontWeight: "800", color: colors.accent, textTransform: "uppercase", letterSpacing: 1 },
    title: { fontSize: 23, fontWeight: "800", color: colors.onBrand, marginTop: 2 },
    lead: { fontSize: 14, lineHeight: 20, color: colors.onBrandMuted, marginTop: 14 },
    card: {
        marginTop: -34,
        marginHorizontal: 16,
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        padding: 20,
        gap: 16,
        boxShadow: shadow.raised,
    },
    below: { paddingHorizontal: 24, paddingTop: 16, gap: 8 },
});
