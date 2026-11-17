// A class's register for today, or a missed one from the two days before.
// Marking happens on the phone only (with a draft, so nothing is lost if the
// teacher leaves the screen); "Save and finalise" sends the whole register in
// one call. After that it's final for the class teacher — only the principal
// (an admin login) can correct it, here or on the website.
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../../../components/Button";
import { Check, CircleCheck, CircleX, LockKeyhole, WifiOff } from "../../../components/icons";
import { TextLink } from "../../../components/TextLink";
import { colors, radius, shadow } from "../../../components/theme";
import { Notice } from "../../../components/ui";
import { addDays, dayLabel, timeLabel, todayIso } from "../../../lib/dates";
import { MARK_DAYS_BACK, studentsOf, useTeacher } from "../../../lib/teacher";
import { clearDraft, loadDraft, registerKey, saveDraft } from "../../../lib/teacherStorage";
import type { AttendanceRecord, AttendanceStatus, TeacherStudent } from "../../../lib/types";

type Marks = Record<string, AttendanceStatus>;

/** Everyone present, then whatever the register (or the save waiting to send) says. */
function baseMarks(students: TeacherStudent[], records: AttendanceRecord[] | undefined): Marks {
    const marks: Marks = Object.fromEntries(students.map((s) => [s.id, "present" as AttendanceStatus]));
    records?.forEach((r) => {
        if (r.studentId in marks) marks[r.studentId] = r.status;
    });
    return marks;
}

export default function RegisterScreen() {
    const { classId } = useLocalSearchParams<{ classId: string }>();
    const teacher = useTeacher();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const sync = teacher.state?.sync;
    const cls = sync?.classes.find((c) => c.id === classId);
    const isAdmin = sync?.me.role === "admin";
    const students = useMemo(() => studentsOf(sync, classId), [sync, classId]);
    const today = todayIso();
    const dates = Array.from({ length: MARK_DAYS_BACK + 1 }, (_, i) => addDays(today, -i));
    const [date, setDate] = useState(today);
    const key = registerKey(classId, date);
    const register = teacher.state?.registers[key];
    const pending = teacher.state?.pending[key];
    // Finalised (or waiting to send): read-only for a class teacher.
    const locked = !isAdmin && (!!register || !!pending);

    const [marks, setMarks] = useState<Marks | null>(null);
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);

    // Start from a draft in progress, else the save waiting to send, else the saved register.
    useEffect(() => {
        let alive = true;
        loadDraft(key).then((draft) => {
            if (!alive) return;
            const base = baseMarks(students, pending?.records ?? register?.records);
            if (draft && locked) clearDraft(key);
            const useDraft = !!draft && !locked;
            setMarks(useDraft ? { ...base, ...draft } : base);
            setDirty(useDraft);
        });
        return () => {
            alive = false;
        };
    }, [key, students, register, pending, locked]);

    if (!sync || !cls) {
        return (
            <View style={styles.missing}>
                <Notice tone="warning" text="This class isn't in your student list. Update the list on the home screen." />
            </View>
        );
    }
    if (!sync.markClassIds.includes(cls.id)) {
        return (
            <View style={styles.missing}>
                <Notice tone="warning" text={`Only the class teacher of ${cls.name} can take its attendance.`} />
            </View>
        );
    }

    const absent = marks ? students.filter((s) => marks[s.id] === "absent").length : 0;
    const present = students.length - absent;

    function update(next: Marks) {
        setMarks(next);
        setDirty(true);
        saveDraft(key, next);
    }

    function toggle(studentId: string) {
        if (!marks || locked) return;
        update({ ...marks, [studentId]: marks[studentId] === "absent" ? "present" : "absent" });
    }

    function confirmSave() {
        if (!marks || !cls) return;
        const records: AttendanceRecord[] = students.map((s) => ({ studentId: s.id, status: marks[s.id] ?? "present" }));
        Alert.alert(
            `Save ${cls.name} attendance for ${dayLabel(date).toLowerCase()}?`,
            `${present} present, ${absent} absent.` +
                (absent ? " Parents of absent students will get a notification." : "") +
                (isAdmin ? "" : "\n\nOnce saved it's final — only the principal can correct it."),
            [
                { text: "Keep marking", style: "cancel" },
                { text: isAdmin ? "Save" : "Save and finalise", onPress: () => save(records) },
            ]
        );
    }

    async function save(records: AttendanceRecord[]) {
        setSaving(true);
        try {
            const outcome = await teacher.saveRegister(classId, date, records, register?.updatedAt ?? null);
            clearDraft(key);
            setDirty(false);
            if (outcome.kind === "conflict" || outcome.kind === "locked") {
                setMarks(baseMarks(students, outcome.register.records));
                const by = outcome.register.markedByName || "Someone else";
                Alert.alert(
                    "Already saved",
                    `${by} saved this register at ${timeLabel(outcome.register.updatedAt)}. Their marks are shown now` +
                        (outcome.kind === "locked"
                            ? " — it's final, and only the principal can correct it."
                            : " — check them and save again if anything needs changing.")
                );
            } else if (outcome.kind === "queued") {
                Alert.alert(
                    "Saved on this phone",
                    "There's no internet right now. The register will be sent automatically when the phone is back online.",
                    [{ text: "OK", onPress: () => router.back() }]
                );
            } else {
                Alert.alert("Attendance saved", `${present} present, ${absent} absent.`, [{ text: "OK", onPress: () => router.back() }]);
            }
        } catch (err) {
            Alert.alert("Couldn't save", err instanceof Error ? err.message : "Please try again.");
        } finally {
            setSaving(false);
        }
    }

    const by = register?.markedByName ? ` by ${register.markedByName}` : "";
    let status: string;
    if (pending) status = `Finalised on this phone at ${timeLabel(pending.queuedAt)} — it will be sent when there's internet.`;
    else if (register && locked) status = `Finalised at ${timeLabel(register.updatedAt)}${by}. Only the principal can correct it.`;
    else if (register) status = `Saved at ${timeLabel(register.updatedAt)}${by}. As principal you can correct it.`;
    else if (isAdmin) status = "Not taken yet. Everyone starts as present — tap the students who are absent.";
    else status = "Not taken yet. Everyone starts as present — tap the students who are absent. Once saved it's final.";

    const statusTone = pending ? "warning" : register ? "success" : "info";

    return (
        <View style={styles.flex}>
            <Stack.Screen options={{ title: `${cls.name.replace(/^Class /, "")} attendance` }} />
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.dates}>
                    {dates.map((d) => {
                        const k = registerKey(classId, d);
                        const done = !!teacher.state?.registers[k] || !!teacher.state?.pending[k];
                        const on = d === date;
                        return (
                            <Pressable
                                key={d}
                                accessibilityRole="button"
                                accessibilityState={{ selected: on }}
                                onPress={() => setDate(d)}
                                style={[styles.dateChip, on && styles.dateChipOn]}
                            >
                                <Text style={[styles.dateText, on && styles.dateTextOn]}>{dayLabel(d, today)}</Text>
                                <View style={styles.dateSubRow}>
                                    {done && <Check size={12} color={on ? colors.onBrand : colors.success} strokeWidth={3} />}
                                    <Text style={[styles.dateSub, on && styles.dateSubOn, done && !on && styles.dateSubDone]}>
                                        {done ? "Saved" : "Not taken"}
                                    </Text>
                                </View>
                            </Pressable>
                        );
                    })}
                </View>

                <Notice tone={statusTone} icon={pending ? WifiOff : locked ? LockKeyhole : undefined} text={status}>
                    {!!pending && (
                        <Pressable onPress={teacher.sendPending} hitSlop={8} style={styles.sendNow}>
                            <Text style={styles.sendNowText}>Send now</Text>
                        </Pressable>
                    )}
                </Notice>

                <View style={styles.counts}>
                    <View style={[styles.countTile, { backgroundColor: colors.successSoft }]}>
                        <Text style={[styles.countValue, { color: colors.success }]}>{present}</Text>
                        <Text style={styles.countLabel}>Present</Text>
                    </View>
                    <View style={[styles.countTile, { backgroundColor: colors.dangerSoft }]}>
                        <Text style={[styles.countValue, { color: colors.danger }]}>{absent}</Text>
                        <Text style={styles.countLabel}>Absent</Text>
                    </View>
                    <View style={[styles.countTile, { backgroundColor: colors.brandSoft }]}>
                        <Text style={[styles.countValue, { color: colors.brand }]}>{students.length}</Text>
                        <Text style={styles.countLabel}>Students</Text>
                    </View>
                </View>

                {!locked && (
                    <View style={styles.listHead}>
                        <Text style={styles.listHint}>Tap a student to mark absent</Text>
                        {absent > 0 && <TextLink label="Mark all present" onPress={() => marks && update(baseMarks(students, []))} />}
                    </View>
                )}

                {!marks ? (
                    <ActivityIndicator color={colors.brand} />
                ) : (
                    <View style={styles.list}>
                        {students.map((s, i) => {
                            const isAbsent = marks[s.id] === "absent";
                            return (
                                <Pressable
                                    key={s.id}
                                    accessibilityRole={locked ? "text" : "button"}
                                    accessibilityLabel={`${s.name}, ${isAbsent ? "absent" : "present"}${locked ? "" : ". Tap to change."}`}
                                    onPress={() => toggle(s.id)}
                                    disabled={locked}
                                    style={({ pressed }) => [
                                        styles.row,
                                        i < students.length - 1 && styles.divider,
                                        isAbsent && styles.rowAbsent,
                                        pressed && styles.pressed,
                                    ]}
                                >
                                    <View style={[styles.roll, isAbsent && styles.rollAbsent]}>
                                        <Text style={[styles.rollText, isAbsent && styles.rollTextAbsent]}>{s.rollNo ?? "—"}</Text>
                                    </View>
                                    <Text style={styles.name} numberOfLines={1}>
                                        {s.name}
                                    </Text>
                                    <View style={[styles.mark, isAbsent ? styles.markAbsent : styles.markPresent]}>
                                        {isAbsent ? (
                                            <CircleX size={15} color={colors.onBrand} strokeWidth={2.5} />
                                        ) : (
                                            <CircleCheck size={15} color={colors.success} strokeWidth={2.5} />
                                        )}
                                        <Text style={[styles.markText, isAbsent ? styles.markTextAbsent : styles.markTextPresent]}>
                                            {isAbsent ? "Absent" : "Present"}
                                        </Text>
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>
                )}
                {!locked && <Text style={styles.hint}>Student missing? Update the student list on the home screen.</Text>}
            </ScrollView>
            <View style={[styles.bar, { paddingBottom: insets.bottom + 12 }]}>
                {locked ? (
                    <View style={styles.finalRow}>
                        <LockKeyhole size={16} color={colors.muted} />
                        <Text style={styles.final}>Final — only the principal can correct this register.</Text>
                    </View>
                ) : (
                    <Button
                        label={register ? (dirty ? "Save correction" : "Saved") : `Save and finalise · ${present}/${students.length} present`}
                        icon={register && !dirty ? Check : undefined}
                        onPress={confirmSave}
                        busy={saving}
                        disabled={!marks || (!!register && !dirty) || students.length === 0}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    content: { padding: 16, gap: 12, paddingBottom: 24 },
    missing: { padding: 24 },
    dates: { flexDirection: "row", gap: 8 },
    dateChip: {
        flex: 1,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingVertical: 10,
        alignItems: "center",
        boxShadow: shadow.card,
    },
    dateChipOn: { backgroundColor: colors.brand, borderColor: colors.brand },
    dateText: { fontSize: 14, fontWeight: "800", color: colors.ink },
    dateTextOn: { color: colors.onBrand },
    dateSubRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
    dateSub: { fontSize: 12, color: colors.muted, fontWeight: "600" },
    dateSubOn: { color: colors.onBrandMuted },
    dateSubDone: { color: colors.success },
    sendNow: { alignSelf: "flex-start", marginTop: 6 },
    sendNowText: { fontSize: 14, fontWeight: "800", color: colors.warning },
    counts: { flexDirection: "row", gap: 10 },
    countTile: { flex: 1, borderRadius: radius.md, paddingVertical: 10, alignItems: "center" },
    countValue: { fontSize: 24, fontWeight: "800" },
    countLabel: { fontSize: 12, fontWeight: "700", color: colors.text },
    listHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: 36 },
    listHint: { fontSize: 13, color: colors.muted, fontWeight: "600" },
    list: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
        boxShadow: shadow.card,
    },
    row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
    divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    rowAbsent: { backgroundColor: "#FFF5F5" },
    pressed: { opacity: 0.7 },
    roll: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
    rollAbsent: { backgroundColor: colors.dangerSoft },
    rollText: { fontSize: 13, fontWeight: "800", color: colors.brand },
    rollTextAbsent: { color: colors.danger },
    name: { flex: 1, fontSize: 15, fontWeight: "700", color: colors.ink },
    mark: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: radius.pill },
    markPresent: { backgroundColor: colors.successSoft },
    markAbsent: { backgroundColor: colors.danger },
    markText: { fontSize: 13, fontWeight: "800" },
    markTextPresent: { color: colors.success },
    markTextAbsent: { color: colors.onBrand },
    hint: { fontSize: 13, color: colors.muted, textAlign: "center" },
    finalRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
    final: { fontSize: 14, fontWeight: "600", color: colors.text, flexShrink: 1 },
    bar: {
        paddingHorizontal: 16,
        paddingTop: 12,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        boxShadow: "0 -6px 18px rgba(18, 26, 82, 0.06)",
    },
});
