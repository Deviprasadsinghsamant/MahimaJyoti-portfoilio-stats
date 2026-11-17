// One class's students, from the downloaded list. Opening a student fetches their marks.
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Button } from "../../../components/Button";
import { ChevronRight, ClipboardCheck, Search } from "../../../components/icons";
import { colors, radius, shadow } from "../../../components/theme";
import { Avatar, Hero, Notice } from "../../../components/ui";
import { studentsOf, useTeacher } from "../../../lib/teacher";

export default function ClassScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const sync = useTeacher().state?.sync;
    const cls = sync?.classes.find((c) => c.id === id);
    const students = useMemo(() => studentsOf(sync, id), [sync, id]);
    const [query, setQuery] = useState("");
    const q = query.trim().toLowerCase();
    const shown = q ? students.filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().startsWith(q)) : students;

    if (!sync || !cls) {
        return (
            <View style={styles.missing}>
                <Notice tone="warning" text="This class isn't in your student list. Update the list on the home screen." />
            </View>
        );
    }

    const canMark = sync.markClassIds.includes(cls.id);

    return (
        <>
            <Stack.Screen options={{ title: cls.name }} />
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Hero style={styles.hero}>
                    <Text style={styles.title}>{cls.name}</Text>
                    <Text style={styles.sub}>
                        {students.length} students{cls.academicYear ? ` · ${cls.academicYear}` : ""}
                    </Text>
                    {canMark && (
                        <View style={styles.action}>
                            <Button
                                label="Take attendance"
                                variant="accent"
                                icon={ClipboardCheck}
                                onPress={() => router.push({ pathname: "/teacher/attendance/[classId]", params: { classId: cls.id } })}
                            />
                        </View>
                    )}
                </Hero>

                <View style={styles.body}>
                    <View style={styles.searchBox}>
                        <Search size={19} color={colors.muted} />
                        <TextInput
                            value={query}
                            onChangeText={setQuery}
                            placeholder={`Search in ${cls.name.replace(/^Class /, "")}`}
                            placeholderTextColor={colors.muted}
                            autoCorrect={false}
                            style={styles.searchInput}
                            accessibilityLabel="Search this class"
                        />
                    </View>
                    <View style={styles.list}>
                        {shown.map((s, i) => (
                            <Pressable
                                key={s.id}
                                accessibilityRole="button"
                                accessibilityLabel={`${s.name}, roll ${s.rollNo ?? "not set"}`}
                                onPress={() => router.push({ pathname: "/teacher/student/[id]", params: { id: s.id } })}
                                style={({ pressed }) => [styles.row, i < shown.length - 1 && styles.divider, pressed && styles.pressed]}
                            >
                                <Avatar name={s.name} size={40} variant="soft" />
                                <View style={styles.rowText}>
                                    <Text style={styles.name} numberOfLines={1}>
                                        {s.name}
                                    </Text>
                                    <Text style={styles.code}>
                                        Roll {s.rollNo ?? "—"} · {s.code}
                                    </Text>
                                </View>
                                <ChevronRight size={18} color={colors.muted} />
                            </Pressable>
                        ))}
                        {shown.length === 0 && <Text style={styles.none}>No student matches “{query.trim()}”.</Text>}
                    </View>
                </View>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    content: { paddingBottom: 32 },
    missing: { padding: 24 },
    hero: { paddingBottom: 50 },
    title: { fontSize: 26, fontWeight: "800", color: colors.onBrand },
    sub: { fontSize: 14, color: colors.onBrandMuted, marginTop: 2 },
    action: { marginTop: 16 },
    body: { paddingHorizontal: 16, gap: 12, marginTop: -26 },
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
    searchInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: colors.ink },
    list: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
        boxShadow: shadow.card,
    },
    row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 11 },
    divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    pressed: { backgroundColor: colors.surfaceAlt },
    rowText: { flex: 1 },
    name: { fontSize: 15, fontWeight: "700", color: colors.ink },
    code: { fontSize: 12, color: colors.muted, marginTop: 1 },
    none: { padding: 16, fontSize: 14, color: colors.muted, textAlign: "center" },
});
