// Contact Domain — Cloud Function Handlers
// ────────────────────────────────────────
// The website's "Send Us a Message" form. Anyone can call it (no login), so it
// checks every field, quietly drops bot submissions (a hidden "website" field
// people never see), and allows a few messages per hour from one connection.
// Messages land in contactMessages, read by admins on the portal's Messages page.

import { createHash } from "crypto";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "../../shared/firestore";

const REGION = "asia-south1";

// Per connection (hashed IP address) per hour.
const MAX_PER_HOUR = 5;
const WINDOW_MS = 60 * 60 * 1000;

export const CONTACT_SUBJECTS = ["admissions", "academics", "fees", "hostel", "careers", "other"] as const;
export type ContactSubject = (typeof CONTACT_SUBJECTS)[number];

export interface ContactMessage {
    id: string;
    name: string;
    email: string;
    phone: string;
    subject: ContactSubject | "";
    message: string;
    read: boolean;
    createdAt: number;
}

export interface SubmitContactInput {
    name: string;
    email?: string;
    phone?: string;
    subject?: string;
    message: string;
    // Honeypot: hidden on the form, so only bots fill it in.
    website?: string;
}

function text(raw: unknown, max: number): string {
    return typeof raw === "string" ? raw.trim().replace(/\s+\n/g, "\n").slice(0, max) : "";
}

interface Window {
    count: number;
    windowStart: number;
}

/** Send a message to the school from the website. */
export const submitContactMessage = onCall<SubmitContactInput>({ region: REGION }, async (request) => {
    const data = request.data ?? ({} as SubmitContactInput);
    // A bot filled the hidden field: pretend it worked, store nothing.
    if (typeof data.website === "string" && data.website.trim()) return { ok: true };

    const name = text(data.name, 80);
    const email = text(data.email, 120);
    const phone = text(data.phone, 20);
    const message = text(data.message, 2000);
    const subject = (CONTACT_SUBJECTS as readonly string[]).includes(String(data.subject)) ? (data.subject as ContactSubject) : "";

    if (name.length < 2) throw new HttpsError("invalid-argument", "Please enter your name.");
    if (message.length < 5) throw new HttpsError("invalid-argument", "Please write your message.");
    if (!email && !phone) throw new HttpsError("invalid-argument", "Please give a phone number or an email so the school can reply.");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpsError("invalid-argument", "That email address doesn't look right.");
    const digits = phone.replace(/\D/g, "");
    if (phone && (digits.length < 10 || digits.length > 13)) throw new HttpsError("invalid-argument", "That phone number doesn't look right.");

    // Rate limit by the sender's address — stored only as a hash.
    const forwarded = String(request.rawRequest.headers["x-forwarded-for"] ?? "").split(",")[0].trim();
    const ip = forwarded || request.rawRequest.ip || "unknown";
    const limitRef = db.collection("contactRateLimits").doc(createHash("sha256").update(ip).digest("hex"));
    const ref = db.collection("contactMessages").doc();
    const now = Date.now();

    await db.runTransaction(async (tx) => {
        const held = (await tx.get(limitRef)).data() as Window | undefined;
        const fresh = !held || now - held.windowStart > WINDOW_MS;
        if (!fresh && held.count >= MAX_PER_HOUR) {
            throw new HttpsError("resource-exhausted", "You've sent several messages already. Please call the school, or try again in an hour.");
        }
        tx.set(limitRef, fresh ? { count: 1, windowStart: now } : { count: held.count + 1, windowStart: held.windowStart });
        const msg: ContactMessage = { id: ref.id, name, email, phone, subject, message, read: false, createdAt: now };
        tx.set(ref, msg);
    });
    return { ok: true };
});
