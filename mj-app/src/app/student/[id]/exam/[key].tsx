// One exam of a child: overall percentage on top, then each subject's marks out
// of the total and its percentage. Read from the phone — no download.
import { useMemo } from "react";
import { Redirect, Stack, useLocalSearchParams } from "expo-router";
import { ExamDetail } from "../../../../components/Results";
import { groupExams } from "../../../../lib/exams";
import { useStore } from "../../../../lib/store";

export default function ChildExamScreen() {
    const { id, key } = useLocalSearchParams<{ id: string; key: string }>();
    const { state, loaded } = useStore();
    const child = state.children.find((c) => c.student.id === id);
    const exam = useMemo(() => groupExams(Object.values(child?.results ?? {})).find((e) => e.key === key), [child?.results, key]);

    if (!loaded) return null;
    if (!child) return <Redirect href="/" />;
    if (!exam) return <Redirect href={{ pathname: "/student/[id]", params: { id } }} />;

    return (
        <>
            <Stack.Screen options={{ title: exam.title }} />
            <ExamDetail exam={exam} studentName={child.student.name} />
        </>
    );
}
