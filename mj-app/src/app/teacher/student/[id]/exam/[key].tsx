// One exam of a student, for teachers: read from the copy downloaded when the
// student was opened — no new download.
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { ExamDetail } from "../../../../../components/Results";
import { colors } from "../../../../../components/theme";
import { Notice } from "../../../../../components/ui";
import { groupExams } from "../../../../../lib/exams";
import { type CachedStudent, loadCachedStudent } from "../../../../../lib/teacherStorage";

export default function TeacherExamScreen() {
    const { id, key } = useLocalSearchParams<{ id: string; key: string }>();
    const [cached, setCached] = useState<CachedStudent | null | undefined>(undefined);

    useEffect(() => {
        let alive = true;
        loadCachedStudent(id).then((c) => alive && setCached(c));
        return () => {
            alive = false;
        };
    }, [id]);

    const exam = useMemo(() => groupExams(cached?.detail.results ?? []).find((e) => e.key === key), [cached, key]);

    if (cached === undefined) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={colors.brand} size="large" />
            </View>
        );
    }
    if (!cached || !exam) {
        return (
            <View style={styles.center}>
                <Notice tone="warning" text="This exam isn't on the phone any more. Go back and open the student again." />
            </View>
        );
    }
    return (
        <>
            <Stack.Screen options={{ title: exam.title }} />
            <ExamDetail exam={exam} studentName={cached.detail.student.name} />
        </>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
});
