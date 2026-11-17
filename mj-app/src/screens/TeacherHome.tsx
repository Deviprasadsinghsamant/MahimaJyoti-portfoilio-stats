// Teacher home: today's register for each class they take attendance for, a
// student search, and every class. Works from the downloaded lists, so nothing
// here calls the server unless the teacher asks.
import { useMemo, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Button } from "../components/Button";
import {
    ArrowLeftRight,
    ChevronRight,
    CircleCheck,
    CircleX,
    ClipboardCheck,
    Clock,
    FileText,
    LogOut,
    RefreshCw,
    School,
    Search,
    WifiOff,
} from "../components/icons";
import { colors, radius, shadow } from "../components/theme";
import { Avatar, Card, EmptyState, Hero, IconButton, MenuGroup, MenuRow, Notice, Pill, ProgressBar, SectionTitle, StatTile } from "../components/ui";
import { PRIVACY_POLICY_URL } from "../lib/config";
import { timeLabel, todayIso } from "../lib/dates";
import { useMode } from "../lib/mode";
import { useStore } from "../lib/store";
import { useTeacher } from "../lib/teacher";
import { registerKey } from "../lib/teacherStorage";
import type { TeacherClass, TeacherStudent } from "../lib/types";

const MAX_MATCHES = 40;

function greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
}

export function TeacherHome() {
    const teacher = useTeacher();
    const router = useRouter();
    const { setMode } = useMode();
    const { state: parentState } = useStore();
    const [query, setQuery] = useState("");
    const [busy, setBusy] = useState(false);

    const data = teacher.state;
    const sync = data?.sync;
    const classNames = useMemo(() => new Map((sync?.classes ?? []).map((c) => [c.id, c.name])), [sync?.classes]);
    const counts = useMemo(() => {
        const n = new Map<string, number>();
        sync?.students.forEach((s) => n.set(s.classId, (n.get(s.classId) ?? 0) + 1));
        return n;
    }, [sync?.students]);
    const matches = useMemo(() => search(sync?.students ?? [], query), [sync?.students, query]);

    async function updateList() {
        setBusy(true);
        const message = await teacher.sync();
        setBusy(false);
        if (message) Alert.alert("Student list", message);
    }

    function confirmSignOut() {
        Alert.alert("Sign out?", "Your class lists are removed from this phone. Sign in again any time.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Sign out",
                style: "destructive",
                onPress: async () => {
                    await teacher.signOut();
                    setMode(parentState.children.length > 0 ? "parent" : null);
                },
            },
        ]);
    }

    const menu = (
        <>
            <SectionTitle title="Account" />
            <MenuGroup>
                {sync && (
                    <MenuRow
                        icon={RefreshCw}
                        label="Update student list"
                        sub={`Downloaded ${timeLabel(sync.syncedAt)}`}
                        onPress={updateList}
                        busy={busy || teacher.syncing}
                    />
                )}
                <MenuRow
                    icon={ArrowLeftRight}
                    label="Switch to parent"
                    sub={parentState.children.length > 0 ? "Your children on this phone" : "Add your child"}
                    onPress={() => (parentState.children.length > 0 ? setMode("parent") : router.push("/add"))}
                />
                <MenuRow icon={FileText} label="Privacy policy" onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} />
                <MenuRow icon={LogOut} label="Sign out" tone="danger" onPress={confirmSignOut} last />
            </MenuGroup>
        </>
    );

    if (!sync) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false, title: "Teacher" }} />
                <ScrollView contentContainerStyle={styles.content}>
                    <Hero safeTop>
                        <Text style={styles.eyebrow}>{greeting()}</Text>
                        <Text style={styles.title}>Teacher</Text>
                    </Hero>
                    <View style={[styles.body, styles.bodyLifted]}>
                        <Card style={styles.gap}>
                            <EmptyState
                                icon={WifiOff}
                                title="Student list not downloaded"
                                body="The class and student lists couldn't be downloaded. Check the internet connection and try again."
                            />
                            <Button label="Try again" icon={RefreshCw} onPress={updateList} busy={busy || teacher.syncing} />
                        </Card>
                        {menu}
                    </View>
                </ScrollView>
            </>
        );
    }

    const markClasses = sync.classes.filter((c) => sync.markClassIds.includes(c.id));
    const classes = [...markClasses, ...sync.classes.filter((c) => !sync.markClassIds.includes(c.id))];
    const today = todayIso();
    const isAdmin = sync.me.role === "admin";
    const takenToday = markClasses.filter((c) => {
        const k = registerKey(c.id, today);
        return !!data.registers[k] || !!data.pending[k];
    }).length;
    const roleLabel = isAdmin
        ? "Principal"
        : markClasses.length > 0
          ? `Class teacher · ${markClasses.map((c) => c.name.replace(/^Class /, "")).join(", ")}`
          : "Teacher";

    return (
        <>
            <Stack.Screen options={{ headerShown: false, title: "Teacher" }} />
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Hero safeTop style={styles.hero}>
                    <View style={styles.top}>
                        <Avatar name={sync.me.name || "Teacher"} size={48} variant="glass" />
                        <View style={styles.flex}>
                            <Text style={styles.eyebrow}>{greeting()}</Text>
                            <Text style={styles.title} numberOfLines={1}>
                                {sync.me.name || "Teacher"}
                            </Text>
                        </View>
                        <IconButton icon={RefreshCw} label="Update student list" onPress={updateList} busy={busy || teacher.syncing} />
                    </View>
                    <View style={styles.role}>
                        <Text style={styles.roleText} numberOfLines={1}>
                            {roleLabel}
                        </Text>
                    </View>
                    <View style={styles.stats}>
                        <StatTile variant="glass" label="Classes" value={String(sync.classes.length)} />
                        <StatTile variant="glass" label="Students" value={String(sync.students.length)} />
                        {markClasses.length > 0 ? (
                            <StatTile variant="glass" label="Taken today" value={`${takenToday}/${markClasses.length}`} />
                        ) : (
                            <StatTile variant="glass" label="Today" value={shortToday()} />
                        )}
                    </View>
                </Hero>

                <View style={styles.body}>
                    <View style={styles.searchBox}>
                        <Search size={20} color={colors.muted} />
                        <TextInput
                            value={query}
                            onChangeText={setQuery}
                            placeholder="Search a student by name or ID"
                            placeholderTextColor={colors.muted}
                            autoCorrect={false}
                            style={styles.searchInput}
                            accessibilityLabel="Search students by name or Student ID"
                        />
                    </View>

                    {query.trim().length >= 2 &&
                        (matches.length === 0 ? (
                            <Text style={styles.muted}>No student matches “{query.trim()}”.</Text>
                        ) : (
                            <View style={styles.list}>
                                {matches.map((s, i) => (
                                    <StudentRow
                                        key={s.id}
                                        student={s}
                                        sub={`${classNames.get(s.classId) ?? ""} · ${s.code}`}
                                        last={i === matches.length - 1}
                                        onPress={() => router.push({ pathname: "/teacher/student/[id]", params: { id: s.id } })}
                                    />
                                ))}
                            </View>
                        ))}

                    {data.notices.length > 0 && (
                        <Notice tone="warning" text={data.notices.join("\n")}>
                            <Pressable onPress={teacher.dismissNotices} hitSlop={8} style={styles.noticeOk}>
                                <Text style={styles.noticeOkText}>OK</Text>
                            </Pressable>
                        </Notice>
                    )}

                    <SectionTitle title="Today's attendance" />
                    {markClasses.length === 0 ? (
                        <Notice
                            text="Attendance is taken by each class's class teacher, and you aren't one yet. The school office assigns class teachers on the website."
                        />
                    ) : (
                        markClasses.map((cls) => (
                            <RegisterCard
                                key={cls.id}
                                cls={cls}
                                count={counts.get(cls.id) ?? 0}
                                registerKeyToday={registerKey(cls.id, today)}
                                onPress={() => router.push({ pathname: "/teacher/attendance/[classId]", params: { classId: cls.id } })}
                            />
                        ))
                    )}

                    <SectionTitle title="All classes" />
                    <View style={styles.grid}>
                        {classes.map((c) => {
                            const mine = sync.markClassIds.includes(c.id) && !isAdmin;
                            return (
                                <Pressable
                                    key={c.id}
                                    accessibilityRole="button"
                                    accessibilityLabel={`${c.name}, ${counts.get(c.id) ?? 0} students`}
                                    onPress={() => router.push({ pathname: "/teacher/class/[id]", params: { id: c.id } })}
                                    style={({ pressed }) => [styles.classTile, mine && styles.classMine, pressed && styles.pressed]}
                                >
                                    <View style={styles.classTop}>
                                        <View style={[styles.classIcon, mine && styles.classIconMine]}>
                                            <School size={18} color={mine ? colors.onBrand : colors.brand} strokeWidth={2.2} />
                                        </View>
                                        {mine && <Pill label="Your class" fg={colors.accentDeep} bg={colors.accentSoft} />}
                                    </View>
                                    <Text style={styles.className} numberOfLines={1}>
                                        {c.name.replace(/^Class /, "")}
                                    </Text>
                                    <Text style={styles.muted}>{counts.get(c.id) ?? 0} students</Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    {menu}
                </View>
            </ScrollView>
        </>
    );
}

function shortToday(): string {
    return new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function RegisterCard({ cls, count, registerKeyToday, onPress }: { cls: TeacherClass; count: number; registerKeyToday: string; onPress: () => void }) {
    const { state } = useTeacher();
    const isAdmin = state?.sync?.me.role === "admin";
    const register = state?.registers[registerKeyToday];
    const pending = state?.pending[registerKeyToday];
    const records = pending?.records ?? register?.records ?? [];
    const absent = records.filter((r) => r.status === "absent").length;
    const total = records.length;
    const done = !!register || !!pending;

    let detail: string;
    if (pending) detail = "Saved on this phone — it will send when there's internet.";
    else if (register) detail = `Taken at ${timeLabel(register.updatedAt)}${register.markedByName ? ` by ${register.markedByName}` : ""}`;
    else detail = `${count} students · everyone starts as present`;

    return (
        <Card style={[styles.register, pending && styles.registerPending]}>
            <View style={styles.registerTop}>
                <View style={[styles.registerIcon, done ? styles.registerIconDone : null]}>
                    {done ? (
                        <CircleCheck size={22} color={colors.success} strokeWidth={2.3} />
                    ) : (
                        <ClipboardCheck size={22} color={colors.accentDeep} strokeWidth={2.3} />
                    )}
                </View>
                <View style={styles.flex}>
                    <Text style={styles.registerTitle}>{cls.name}</Text>
                    <View style={styles.registerMeta}>
                        <Clock size={12} color={colors.muted} />
                        <Text style={styles.muted} numberOfLines={2}>
                            {detail}
                        </Text>
                    </View>
                </View>
                {pending ? (
                    <Pill icon={WifiOff} label="Waiting" fg={colors.warning} bg={colors.warningSoft} />
                ) : register ? (
                    <Pill label="Done" fg={colors.success} bg={colors.successSoft} />
                ) : (
                    <Pill label="Not taken" fg={colors.accentDeep} bg={colors.accentSoft} />
                )}
            </View>
            {done && total > 0 && (
                <View style={styles.registerCounts}>
                    <ProgressBar percent={((total - absent) / total) * 100} color={colors.success} track={colors.dangerSoft} height={8} />
                    <View style={styles.countRow}>
                        <CircleCheck size={14} color={colors.success} />
                        <Text style={[styles.countText, { color: colors.success }]}>{total - absent} present</Text>
                        <CircleX size={14} color={colors.danger} style={styles.countGap} />
                        <Text style={[styles.countText, { color: colors.danger }]}>{absent} absent</Text>
                    </View>
                </View>
            )}
            <Button
                label={done ? (isAdmin ? "View or correct" : "View register") : "Take attendance"}
                variant={done ? "secondary" : "accent"}
                icon={done ? undefined : ClipboardCheck}
                onPress={onPress}
            />
        </Card>
    );
}

function StudentRow({ student, sub, last, onPress }: { student: TeacherStudent; sub: string; last: boolean; onPress: () => void }) {
    return (
        <Pressable
            accessibilityRole="button"
            onPress={onPress}
            style={({ pressed }) => [styles.row, !last && styles.rowDivider, pressed && styles.rowPressed]}
        >
            <Avatar name={student.name} size={38} variant="soft" />
            <View style={styles.flex}>
                <Text style={styles.rowTitle}>{student.name}</Text>
                <Text style={styles.muted}>{sub}</Text>
            </View>
            <ChevronRight size={18} color={colors.muted} />
        </Pressable>
    );
}

function search(students: TeacherStudent[], raw: string): TeacherStudent[] {
    const q = raw.trim().toLowerCase();
    if (q.length < 2) return [];
    const code = q.replace(/\s+/g, "").toUpperCase();
    return students
        .filter((s) => s.name.toLowerCase().includes(q) || (s.code && s.code.startsWith(code)))
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, MAX_MATCHES);
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    gap: { gap: 12 },
    content: { paddingBottom: 36 },
    hero: { paddingBottom: 52 },
    top: { flexDirection: "row", alignItems: "center", gap: 12 },
    eyebrow: { fontSize: 12, fontWeight: "800", color: colors.accent, textTransform: "uppercase", letterSpacing: 1 },
    title: { fontSize: 23, fontWeight: "800", color: colors.onBrand },
    role: {
        alignSelf: "flex-start",
        marginTop: 12,
        backgroundColor: colors.glass,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        borderRadius: radius.pill,
        paddingHorizontal: 12,
        paddingVertical: 5,
        maxWidth: "100%",
    },
    roleText: { color: colors.onBrand, fontSize: 13, fontWeight: "700" },
    stats: { flexDirection: "row", gap: 10, marginTop: 16 },

    body: { paddingHorizontal: 16, gap: 12, marginTop: -28 },
    bodyLifted: { marginTop: -16 },
    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: colors.border,
        boxShadow: shadow.raised,
    },
    searchInput: { flex: 1, paddingVertical: 15, fontSize: 16, color: colors.ink },
    muted: { fontSize: 13, color: colors.muted, flexShrink: 1 },
    noticeOk: { alignSelf: "flex-start", marginTop: 6 },
    noticeOkText: { fontSize: 14, fontWeight: "800", color: colors.warning },

    list: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
        boxShadow: shadow.card,
    },
    row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 11 },
    rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    rowPressed: { backgroundColor: colors.surfaceAlt },
    rowTitle: { fontSize: 15, fontWeight: "700", color: colors.ink },

    register: { gap: 14 },
    registerPending: { borderColor: "#F3D58A" },
    registerTop: { flexDirection: "row", alignItems: "center", gap: 12 },
    registerIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" },
    registerIconDone: { backgroundColor: colors.successSoft },
    registerTitle: { fontSize: 17, fontWeight: "800", color: colors.ink },
    registerMeta: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
    registerCounts: { gap: 8 },
    countRow: { flexDirection: "row", alignItems: "center", gap: 5 },
    countGap: { marginLeft: 10 },
    countText: { fontSize: 13, fontWeight: "700" },

    grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 },
    classTile: {
        width: "48.3%",
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14,
        gap: 4,
        boxShadow: shadow.card,
    },
    classMine: { borderColor: "#F7C9A1" },
    pressed: { transform: [{ scale: 0.97 }] },
    classTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
    classIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
    classIconMine: { backgroundColor: colors.accent },
    className: { fontSize: 18, fontWeight: "800", color: colors.ink },
});
