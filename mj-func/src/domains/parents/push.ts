// Parents Domain — push messages
// ──────────────────────────────
// Finding the phones signed in to a student and sending them data (the app
// stores it, even when closed) and, for news worth knowing, a notification.

import * as admin from "firebase-admin";
import { db } from "../../shared/firestore";
import type { PushData } from "./types";

// Tokens FCM will never deliver to again (app uninstalled, token rotated).
const STALE_TOKEN_CODES = [
    "messaging/registration-token-not-registered",
    "messaging/invalid-registration-token",
    "messaging/invalid-argument",
];

// Firestore's array-contains-any takes at most 30 values; sendEach at most 500 messages.
const ANY_LIMIT = 30;
const SEND_LIMIT = 500;

export type Device = FirebaseFirestore.QueryDocumentSnapshot;

function chunks<T>(items: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
    return out;
}

export async function devicesFor(studentId: string): Promise<Device[]> {
    const snap = await db.collection("parentDevices").where("studentIds", "array-contains", studentId).get();
    return snap.docs;
}

/** Every phone signed in to any of these students — one read per phone, not per student. */
export async function devicesForAny(studentIds: string[]): Promise<Device[]> {
    const snaps = await Promise.all(
        chunks(studentIds, ANY_LIMIT).map((ids) =>
            db.collection("parentDevices").where("studentIds", "array-contains-any", ids).get()
        )
    );
    const byId = new Map<string, Device>();
    snaps.forEach((s) => s.docs.forEach((d) => byId.set(d.id, d)));
    return Array.from(byId.values());
}

export function studentIdsOf(device: Device): string[] {
    const ids = device.data().studentIds;
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [];
}

export interface Push {
    device: Device;
    data: PushData;
    notification?: { title: string; body: string };
    // A notification replaces an earlier one with the same tag in the phone's tray.
    tag?: string;
}

export async function send(pushes: Push[]): Promise<void> {
    for (const batch of chunks(pushes, SEND_LIMIT)) {
        const messages: admin.messaging.TokenMessage[] = batch.map((p) => ({
            token: String(p.device.data().token),
            data: p.data as unknown as Record<string, string>,
            // Wake the app to store the data even when it's closed: high priority on
            // Android, content-available on iOS.
            android: { priority: "high", ...(p.tag ? { notification: { tag: p.tag } } : {}) },
            apns: { payload: { aps: { contentAvailable: true } } },
            ...(p.notification ? { notification: p.notification } : {}),
        }));
        const res = await admin.messaging().sendEach(messages);
        const stale = res.responses
            .map((r, i) => (!r.success && STALE_TOKEN_CODES.includes(r.error?.code ?? "") ? batch[i].device.ref : null))
            .filter((ref): ref is FirebaseFirestore.DocumentReference => ref !== null);
        await Promise.all(stale.map((ref) => ref.delete()));
    }
}

/** The same message to every phone in the list. */
export async function sendToDevices(
    devices: Device[],
    data: PushData,
    notification?: { title: string; body: string }
): Promise<void> {
    await send(devices.map((device) => ({ device, data, notification })));
}
