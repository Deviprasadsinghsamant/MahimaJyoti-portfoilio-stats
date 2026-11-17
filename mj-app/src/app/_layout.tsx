import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    getInitialNotification,
    getMessaging,
    onNotificationOpenedApp,
    type RemoteMessage,
} from "@react-native-firebase/messaging";
import { NoticeBanner } from "../components/NoticeBanner";
import { colors } from "../components/theme";
import { ModeProvider } from "../lib/mode";
import { StoreProvider } from "../lib/store";
import { TeacherProvider } from "../lib/teacher";

// The home screen always sits beneath every other screen, so Back after opening a notification lands there.
export const unstable_settings = { anchor: "index" };

export default function RootLayout() {
    return (
        <ModeProvider>
            <StoreProvider>
                <TeacherProvider>
                    {/* Navy headers everywhere, so the status bar text is light. */}
                    <StatusBar style="light" />
                    <Stack
                        screenOptions={{
                            headerStyle: { backgroundColor: colors.brand },
                            headerTintColor: colors.onBrand,
                            headerTitleStyle: { fontWeight: "800", fontSize: 18 },
                            headerShadowVisible: false,
                            contentStyle: { backgroundColor: colors.background },
                            animation: "slide_from_right",
                        }}
                    >
                        <Stack.Screen name="index" options={{ title: "Mahima Jyoti" }} />
                        <Stack.Screen name="add" options={{ title: "Parent sign-in" }} />
                        <Stack.Screen name="student/[id]/index" options={{ title: "Student" }} />
                        <Stack.Screen name="student/[id]/exam/[key]" options={{ title: "Result" }} />
                        <Stack.Screen name="teacher/sign-in" options={{ title: "Teacher sign-in" }} />
                        <Stack.Screen name="teacher/attendance/[classId]" options={{ title: "Attendance" }} />
                        <Stack.Screen name="teacher/class/[id]" options={{ title: "Class" }} />
                        <Stack.Screen name="teacher/student/[id]/index" options={{ title: "Student" }} />
                        <Stack.Screen name="teacher/student/[id]/exam/[key]" options={{ title: "Result" }} />
                    </Stack>
                    <OpenFromNotification />
                    <NoticeBanner />
                </TeacherProvider>
            </StoreProvider>
        </ModeProvider>
    );
}

// Kept outside the component: the layout remounts when Android recreates the activity, and
// getInitialNotification then reports the same tap that onNotificationOpenedApp already handled.
const openedMessages = new Set<string>();

/** Tapping a "New marks" notification opens that child's results. */
function OpenFromNotification() {
    const router = useRouter();
    useEffect(() => {
        const messaging = getMessaging();
        const open = (message: RemoteMessage | null) => {
            const studentId = message?.data?.studentId;
            if (!message || typeof studentId !== "string" || !studentId) return;
            const key = message.messageId ?? `${studentId}:${message.sentTime}`;
            if (openedMessages.has(key)) return;
            openedMessages.add(key);
            router.navigate(`/student/${studentId}`, { withAnchor: true });
        };
        getInitialNotification(messaging).then(open);
        return onNotificationOpenedApp(messaging, open);
    }, [router]);
    return null;
}
