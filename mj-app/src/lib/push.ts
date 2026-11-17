// Firebase Cloud Messaging: the school's server pushes every new or corrected
// result (mj-func/src/domains/parents/triggers.ts) and every register entry
// (mj-func/src/domains/attendance/handlers.ts) to this phone, and these
// handlers write it straight into local storage.

import { PermissionsAndroid, Platform } from "react-native";
import {
    getMessaging,
    getToken,
    requestPermission,
    setBackgroundMessageHandler,
    type RemoteMessage,
} from "@react-native-firebase/messaging";
import { updateState, withPush } from "./storage";
import type { PushData } from "./types";

const KINDS = new Set(["result", "result-deleted", "student", "attendance"]);

export function pushDataOf(message: RemoteMessage): PushData | null {
    const data = message.data as Record<string, unknown> | undefined;
    return data && typeof data.kind === "string" && KINDS.has(data.kind) ? (data as unknown as PushData) : null;
}

export async function handleRemoteMessage(message: RemoteMessage): Promise<void> {
    const data = pushDataOf(message);
    if (data) await updateState((state) => withPush(state, data));
}

/** Must run before the app renders (index.ts): handles messages while the app is in the background or closed. */
export function registerBackgroundHandler(): void {
    setBackgroundMessageHandler(getMessaging(), handleRemoteMessage);
}

/** This phone's FCM token, or null if Firebase can't provide one (e.g. no Google Play services). */
export async function getDeviceToken(): Promise<string | null> {
    try {
        return await getToken(getMessaging());
    } catch {
        return null;
    }
}

/** Ask to show notifications. Android 13+ needs the runtime permission; older Android doesn't. */
export async function askNotificationPermission(): Promise<void> {
    try {
        if (Platform.OS === "android" && Number(Platform.Version) >= 33) {
            await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        } else if (Platform.OS === "ios") {
            await requestPermission(getMessaging());
        }
    } catch {
        // Marks still arrive and are stored without notification permission.
    }
}
