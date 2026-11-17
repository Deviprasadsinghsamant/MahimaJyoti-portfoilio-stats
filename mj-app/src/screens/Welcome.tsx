// First screen: Parent or Teacher, as two cards side by side. Also where
// "switch" leads when the other side isn't set up on this phone yet.
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowRight, Check, type Icon, Presentation, ShieldCheck, Users } from "../components/icons";
import { TextLink } from "../components/TextLink";
import { colors, gradients, radius, shadow } from "../components/theme";
import { Hero } from "../components/ui";
import { PRIVACY_POLICY_URL } from "../lib/config";
import { useMode } from "../lib/mode";
import { useStore } from "../lib/store";
import { useTeacher } from "../lib/teacher";

export function Welcome() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { setMode } = useMode();
    const { state } = useStore();
    const teacher = useTeacher();
    const children = state.children.length;

    return (
        <>
            <Stack.Screen options={{ headerShown: false, title: "Mahima Jyoti" }} />
            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} bounces={false}>
                <Hero safeTop style={styles.hero}>
                    <View style={styles.logoRing}>
                        <Image
                            source={require("../../assets/logo.png")}
                            style={styles.logo}
                            accessibilityLabel="Mahima Jyoti Awasika Vidyapitha logo"
                        />
                    </View>
                    <Text style={styles.school}>Mahima Jyoti{"\n"}Awasika Vidyapitha</Text>
                    <Text style={styles.place}>Hakimapada, Angul · Odisha</Text>
                </Hero>

                <View style={styles.sheet}>
                    <Text style={styles.welcome}>Welcome</Text>
                    <Text style={styles.lead}>Choose how you&apos;d like to continue</Text>

                    <View style={styles.roles}>
                        <RoleCard
                            title="Parent"
                            body="Your child's marks and attendance"
                            icon={Users}
                            tone="accent"
                            status={children > 0 ? `${children} ${children === 1 ? "child" : "children"} added` : null}
                            onPress={() => (children > 0 ? setMode("parent") : router.push("/add"))}
                        />
                        <RoleCard
                            title="Teacher"
                            body="Class attendance and students' marks"
                            icon={Presentation}
                            tone="brand"
                            status={teacher.signedIn ? "Signed in" : null}
                            onPress={() => (teacher.signedIn ? setMode("teacher") : router.push("/teacher/sign-in"))}
                        />
                    </View>

                    <View style={styles.trust}>
                        <ShieldCheck size={18} color={colors.success} strokeWidth={2.3} />
                        <Text style={styles.trustText}>
                            Parents sign in with the Student ID and a mobile number the school has on record. Teachers use their
                            school website login.
                        </Text>
                    </View>
                    <TextLink label="Privacy policy" tone="muted" onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} />
                </View>
            </ScrollView>
        </>
    );
}

function RoleCard({
    title,
    body,
    icon: IconCmp,
    tone,
    status,
    onPress,
}: {
    title: string;
    body: string;
    icon: Icon;
    tone: "accent" | "brand";
    status: string | null;
    onPress: () => void;
}) {
    const fg = tone === "accent" ? colors.accentDeep : colors.brand;
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Continue as ${title.toLowerCase()}. ${body}.${status ? ` ${status}.` : ""}`}
            onPress={onPress}
            style={({ pressed }) => [
                styles.role,
                { backgroundImage: tone === "accent" ? gradients.parentCard : gradients.teacherCard },
                pressed && styles.rolePressed,
            ]}
        >
            <View style={[styles.roleIcon, { backgroundImage: tone === "accent" ? gradients.accent : gradients.brand }]}>
                <IconCmp size={28} color={colors.onBrand} strokeWidth={2.1} />
            </View>
            <Text style={styles.roleTitle}>{title}</Text>
            <Text style={styles.roleBody}>{body}</Text>
            <View style={styles.roleSpacer} />
            {status ? (
                <View style={styles.roleStatus}>
                    <Check size={13} color={colors.success} strokeWidth={3} />
                    <Text style={styles.roleStatusText} numberOfLines={1}>
                        {status}
                    </Text>
                </View>
            ) : null}
            <View style={[styles.roleGo, { backgroundColor: fg }]}>
                <Text style={styles.roleGoText}>{status ? "Open" : "Sign in"}</Text>
                <ArrowRight size={16} color={colors.onBrand} strokeWidth={2.5} />
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    content: { flexGrow: 1, backgroundColor: colors.background },
    hero: { alignItems: "center", paddingBottom: 72 },
    logoRing: {
        width: 136,
        height: 136,
        borderRadius: 68,
        backgroundColor: colors.surface,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 5,
        borderColor: "rgba(255,255,255,0.28)",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
        marginTop: 18,
    },
    logo: { width: 120, height: 120 },
    school: { fontSize: 25, lineHeight: 31, fontWeight: "800", color: colors.onBrand, textAlign: "center", marginTop: 18 },
    place: { fontSize: 14, color: colors.onBrandMuted, marginTop: 6, fontWeight: "500" },

    sheet: {
        marginTop: -44,
        marginHorizontal: 16,
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        padding: 20,
        gap: 4,
        boxShadow: shadow.raised,
    },
    welcome: { fontSize: 24, fontWeight: "800", color: colors.ink },
    lead: { fontSize: 15, color: colors.muted },
    roles: { flexDirection: "row", gap: 12, marginTop: 18, marginBottom: 6 },

    role: {
        flex: 1,
        minHeight: 228,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14,
        gap: 6,
        boxShadow: shadow.card,
    },
    rolePressed: { transform: [{ scale: 0.97 }] },
    roleIcon: {
        width: 56,
        height: 56,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    roleTitle: { fontSize: 19, fontWeight: "800", color: colors.ink },
    roleBody: { fontSize: 13, lineHeight: 18, color: colors.text },
    roleSpacer: { flex: 1 },
    roleStatus: { flexDirection: "row", alignItems: "center", gap: 4 },
    roleStatusText: { fontSize: 12, fontWeight: "700", color: colors.success, flexShrink: 1 },
    roleGo: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        borderRadius: radius.md,
        paddingVertical: 10,
        marginTop: 4,
    },
    roleGoText: { fontSize: 14, fontWeight: "800", color: colors.onBrand },

    trust: {
        flexDirection: "row",
        gap: 10,
        backgroundColor: colors.successSoft,
        borderRadius: radius.md,
        padding: 12,
        marginTop: 12,
    },
    trustText: { flex: 1, fontSize: 13, lineHeight: 18, color: colors.text },
});
