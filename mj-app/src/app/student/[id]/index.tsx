// One child: a summary band, then Results (one row per exam — tap for
// subject-wise marks) and Attendance (month calendar) tabs.
import { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Redirect, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Button } from "../../../components/Button";
import { Trash2 } from "../../../components/icons";
import { RefreshButton, useRefresh } from "../../../components/RefreshButton";
import { StudentOverview } from "../../../components/StudentOverview";
import { colors } from "../../../components/theme";
import { Notice } from "../../../components/ui";
import { timeLabel } from "../../../lib/dates";
import { formatUpdated } from "../../../lib/exams";
import { useStore } from "../../../lib/store";

export default function StudentScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { state, loaded, refreshing, removeChild } = useStore();
    const refresh = useRefresh();
    const router = useRouter();
    const [removing, setRemoving] = useState(false);

    const child = state.children.find((c) => c.student.id === id);
    const results = useMemo(() => Object.values(child?.results ?? {}), [child?.results]);

    if (!loaded) return null;
    if (!child) return <Redirect href="/" />;

    const firstName = child.student.name.split(" ")[0];

    function confirmRemove() {
        if (!child) return;
        Alert.alert(
            `Remove ${child.student.name}?`,
            "Their marks will be deleted from this phone and new marks will stop arriving. You can add them again with the Student ID and mobile number.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                        setRemoving(true);
                        await removeChild(child.student.id);
                        router.replace("/");
                    },
                },
            ]
        );
    }

    return (
        <>
            <Stack.Screen options={{ title: firstName, headerRight: () => <RefreshButton /> }} />
            <StudentOverview
                name={child.student.name}
                subtitle={`${child.student.className} · ID ${child.student.code}`}
                results={results}
                attendance={child.attendance}
                refreshing={refreshing}
                onRefresh={refresh}
                onOpenExam={(exam) =>
                    router.push({ pathname: "/student/[id]/exam/[key]", params: { id: child.student.id, key: exam.key } })
                }
                before={!!child.refreshProblem && <Notice tone="warning" text={child.refreshProblem} />}
                after={
                    <View style={styles.footer}>
                        <Text style={styles.updated}>
                            Updated {formatUpdated(child.updatedAt)}
                            {state.checkedAt ? ` · Checked for news ${timeLabel(state.checkedAt)}` : ""}
                            {"\nNew marks appear here on their own — no need to refresh."}
                        </Text>
                        <Button
                            label={`Remove ${firstName} from this phone`}
                            variant="danger"
                            icon={Trash2}
                            onPress={confirmRemove}
                            busy={removing}
                        />
                    </View>
                }
            />
        </>
    );
}

const styles = StyleSheet.create({
    footer: { gap: 12, marginTop: 12 },
    updated: { fontSize: 12, color: colors.muted, textAlign: "center", lineHeight: 18 },
});
