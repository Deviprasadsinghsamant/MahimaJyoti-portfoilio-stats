// Parent home: every child on this phone, with their latest exam and this month's attendance.
import { Image, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { ArrowLeftRight, Award, CalendarCheck, ChevronRight, CircleX, Clock, FileText, UserPlus } from "../components/icons";
import { RefreshButton, useRefresh } from "../components/RefreshButton";
import { attendanceTone, colors, radius, scoreTone } from "../components/theme";
import { Avatar, Card, Hero, MenuGroup, MenuRow, Notice, Pill, SectionTitle, StatTile } from "../components/ui";
import { monthName, totals } from "../lib/attendance";
import { PRIVACY_POLICY_URL } from "../lib/config";
import { todayIso } from "../lib/dates";
import { formatPercent, formatUpdated, groupExams } from "../lib/exams";
import { useMode } from "../lib/mode";
import { useStore } from "../lib/store";
import { useTeacher } from "../lib/teacher";
import type { StoredChild } from "../lib/types";

export function ParentHome() {
    const { state, refreshing } = useStore();
    const refresh = useRefresh();
    const router = useRouter();
    const { setMode } = useMode();
    const teacher = useTeacher();
    const count = state.children.length;

    return (
        <>
            <Stack.Screen options={{ headerShown: false, title: "My children" }} />
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.brand]} progressBackgroundColor={colors.surface} />
                }
            >
                <Hero safeTop>
                    <View style={styles.top}>
                        <View style={styles.logoWrap}>
                            <Image source={require("../../assets/logo.png")} style={styles.logo} accessibilityLabel="School logo" />
                        </View>
                        <View style={styles.flex}>
                            <Text style={styles.eyebrow}>Mahima Jyoti</Text>
                            <Text style={styles.title}>{count === 1 ? "My child" : "My children"}</Text>
                        </View>
                        <RefreshButton />
                    </View>
                    <Text style={styles.heroText}>New marks and attendance appear here on their own as soon as the school enters them.</Text>
                </Hero>

                <View style={styles.body}>
                    {state.children.map((child) => (
                        <ChildCard key={child.student.id} child={child} onPress={() => router.push(`/student/${child.student.id}`)} />
                    ))}

                    <Pressable
                        accessibilityRole="button"
                        onPress={() => router.push("/add")}
                        style={({ pressed }) => [styles.add, pressed && styles.addPressed]}
                    >
                        <View style={styles.addIcon}>
                            <UserPlus size={20} color={colors.brand} strokeWidth={2.3} />
                        </View>
                        <View style={styles.flex}>
                            <Text style={styles.addTitle}>Add another child</Text>
                            <Text style={styles.addSub}>Brothers or sisters at the school</Text>
                        </View>
                        <ChevronRight size={18} color={colors.muted} />
                    </Pressable>

                    <SectionTitle title="More" />
                    <MenuGroup>
                        <MenuRow
                            icon={ArrowLeftRight}
                            label="Switch to teacher"
                            sub={teacher.signedIn ? "Signed in on this phone" : "Sign in with your school login"}
                            onPress={() => (teacher.signedIn ? setMode("teacher") : router.push("/teacher/sign-in"))}
                        />
                        <MenuRow icon={FileText} label="Privacy policy" onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} last />
                    </MenuGroup>
                </View>
            </ScrollView>
        </>
    );
}

function ChildCard({ child, onPress }: { child: StoredChild; onPress: () => void }) {
    const latest = groupExams(Object.values(child.results))[0];
    const today = todayIso();
    const month = today.slice(0, 7);
    const att = totals(child.attendance?.days, month);
    const absentToday = child.attendance?.days[today] === "A";

    return (
        <Card onPress={onPress} accessibilityLabel={`${child.student.name}, ${child.student.className}. Open results.`} style={styles.child}>
            <View style={styles.childTop}>
                <Avatar name={child.student.name} size={52} />
                <View style={styles.flex}>
                    <Text style={styles.name} numberOfLines={1}>
                        {child.student.name}
                    </Text>
                    <Text style={styles.meta}>
                        {child.student.className} · ID {child.student.code}
                    </Text>
                </View>
                <View style={styles.go}>
                    <ChevronRight size={18} color={colors.brand} strokeWidth={2.5} />
                </View>
            </View>

            {absentToday && <Pill icon={CircleX} label="Marked absent today" fg={colors.danger} bg={colors.dangerSoft} />}

            <View style={styles.stats}>
                <StatTile
                    icon={Award}
                    label="Latest exam"
                    value={latest ? formatPercent(latest.percent) : "—"}
                    sub={latest?.title ?? "No marks yet"}
                    color={latest ? scoreTone(latest.percent).fg : colors.muted}
                />
                <StatTile
                    icon={CalendarCheck}
                    label="Attendance"
                    value={att.days ? `${Math.round(att.percent)}%` : "—"}
                    sub={att.days ? `${att.present}/${att.days} days in ${monthName(month).slice(0, 3)}` : `None in ${monthName(month)}`}
                    color={att.days ? attendanceTone(att.percent).fg : colors.muted}
                />
            </View>

            {!!child.refreshProblem && <Notice tone="warning" text={child.refreshProblem} />}

            <View style={styles.childFoot}>
                <Clock size={13} color={colors.muted} />
                <Text style={styles.updated}>Updated {formatUpdated(child.updatedAt)}</Text>
                <View style={styles.flex} />
                <Text style={styles.open}>View results</Text>
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    content: { paddingBottom: 36 },
    top: { flexDirection: "row", alignItems: "center", gap: 12 },
    logoWrap: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: colors.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    logo: { width: 40, height: 40 },
    eyebrow: { fontSize: 12, fontWeight: "800", color: colors.accent, textTransform: "uppercase", letterSpacing: 1 },
    title: { fontSize: 24, fontWeight: "800", color: colors.onBrand },
    heroText: { fontSize: 13, lineHeight: 19, color: colors.onBrandMuted, marginTop: 14, paddingBottom: 18 },

    body: { paddingHorizontal: 16, gap: 14, marginTop: -30 },
    child: { gap: 12 },
    childTop: { flexDirection: "row", alignItems: "center", gap: 12 },
    name: { fontSize: 18, fontWeight: "800", color: colors.ink },
    meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
    go: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
    stats: { flexDirection: "row", gap: 10 },
    childFoot: { flexDirection: "row", alignItems: "center", gap: 6 },
    updated: { fontSize: 12, color: colors.muted },
    open: { fontSize: 13, fontWeight: "800", color: colors.brandBright },

    add: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderRadius: radius.lg,
        borderWidth: 1.5,
        borderStyle: "dashed",
        borderColor: "#C5CCE6",
        padding: 14,
        backgroundColor: colors.surfaceAlt,
    },
    addPressed: { backgroundColor: colors.brandSoft },
    addIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
    addTitle: { fontSize: 15, fontWeight: "800", color: colors.ink },
    addSub: { fontSize: 12, color: colors.muted, marginTop: 1 },
});
