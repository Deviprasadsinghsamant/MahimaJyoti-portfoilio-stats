// A student as a teacher sees them: contact, attendance and every result —
// read-only. Downloaded when first opened and reused from the phone for a day.
import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Phone, RefreshCw, UserRound } from "../../../../components/icons";
import { StudentOverview } from "../../../../components/StudentOverview";
import { colors, radius } from "../../../../components/theme";
import { IconButton, Notice } from "../../../../components/ui";
import { timeLabel } from "../../../../lib/dates";
import { useTeacher } from "../../../../lib/teacher";
import type { CachedStudent } from "../../../../lib/teacherStorage";

export default function TeacherStudentScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const teacher = useTeacher();
    const { loadStudent } = teacher;
    const listed = teacher.state?.sync?.students.find((s) => s.id === id);
    const className = teacher.state?.sync?.classes.find((c) => c.id === listed?.classId)?.name ?? "";

    const [cached, setCached] = useState<CachedStudent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;
        loadStudent(id).then(
            (c) => {
                if (!alive) return;
                setCached(c);
                setLoading(false);
            },
            (err) => {
                if (!alive) return;
                setError(err instanceof Error ? err.message : "Couldn't load this student.");
                setLoading(false);
            }
        );
        return () => {
            alive = false;
        };
    }, [id, loadStudent]);

    async function refresh() {
        setLoading(true);
        setError(null);
        try {
            setCached(await loadStudent(id, true));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't load this student.");
        } finally {
            setLoading(false);
        }
    }

    const detail = cached?.detail;
    const name = detail?.student.name ?? listed?.name ?? "Student";
    const code = detail?.student.code ?? listed?.code ?? "";

    const header = (
        <Stack.Screen
            options={{
                title: name.split(" ")[0],
                headerRight: () => <IconButton icon={RefreshCw} label="Download again" onPress={refresh} busy={loading} />,
            }}
        />
    );

    if (!detail) {
        return (
            <>
                {header}
                <View style={styles.center}>
                    {loading ? <ActivityIndicator color={colors.brand} size="large" /> : <Notice tone="danger" text={error ?? "Couldn't load this student."} />}
                </View>
            </>
        );
    }

    return (
        <>
            {header}
            <StudentOverview
                name={name}
                subtitle={`${detail.student.className || className} · ID ${code}`}
                results={detail.results}
                attendance={detail.attendance}
                onOpenExam={(exam) => router.push({ pathname: "/teacher/student/[id]/exam/[key]", params: { id, key: exam.key } })}
                heroExtra={
                    (!!detail.parentName || detail.phones.length > 0) && (
                        <View style={styles.contact}>
                            {!!detail.parentName && (
                                <View style={styles.parent}>
                                    <UserRound size={15} color={colors.onBrandMuted} />
                                    <Text style={styles.parentText}>Parent: {detail.parentName}</Text>
                                </View>
                            )}
                            <View style={styles.phones}>
                                {detail.phones.map((p) => (
                                    <Pressable
                                        key={p}
                                        accessibilityRole="link"
                                        accessibilityLabel={`Call +91 ${p}`}
                                        onPress={() => Linking.openURL(`tel:+91${p}`)}
                                        style={({ pressed }) => [styles.call, pressed && styles.pressed]}
                                    >
                                        <Phone size={14} color={colors.onBrand} strokeWidth={2.4} />
                                        <Text style={styles.callText}>+91 {p}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    )
                }
                before={!!error && <Notice tone="danger" text={error} />}
                after={<Text style={styles.updated}>Downloaded {timeLabel(cached?.fetchedAt ?? 0)}. Marks are changed on the school website.</Text>}
            />
        </>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
    contact: { marginTop: 14, gap: 10 },
    parent: { flexDirection: "row", alignItems: "center", gap: 6 },
    parentText: { fontSize: 14, color: colors.onBrandMuted, fontWeight: "600" },
    phones: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    call: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: colors.accent,
        borderRadius: radius.pill,
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    pressed: { opacity: 0.8 },
    callText: { color: colors.onBrand, fontSize: 13, fontWeight: "800" },
    updated: { fontSize: 12, color: colors.muted, textAlign: "center", marginTop: 12 },
});
