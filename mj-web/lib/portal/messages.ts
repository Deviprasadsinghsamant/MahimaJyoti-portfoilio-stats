// Messages from the website's contact form: sending (public, through the
// submitContactMessage function) and the admin inbox.

import {
    collection,
    deleteDoc,
    doc,
    getCountFromServer,
    getDocs,
    limit,
    orderBy,
    query,
    updateDoc,
    where,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { getFirebaseDb, getFirebaseFunctions } from "@/lib/firebase";
import { withTokenRetry } from "@/lib/auth";

// Keep in sync with CONTACT_SUBJECTS in mj-func/src/domains/contact/handlers.ts.
export const CONTACT_SUBJECTS = [
    { value: "admissions", label: "Admissions enquiry" },
    { value: "academics", label: "Academic query" },
    { value: "fees", label: "Fees" },
    { value: "hostel", label: "Hostel / residential" },
    { value: "careers", label: "Jobs at the school" },
    { value: "other", label: "Other" },
] as const;

export type ContactSubject = (typeof CONTACT_SUBJECTS)[number]["value"];

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

export interface ContactForm {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
    // Hidden from people; bots fill it in.
    website: string;
}

export function subjectLabel(subject: string): string {
    return CONTACT_SUBJECTS.find((s) => s.value === subject)?.label ?? "General";
}

/** Send the form. Throws an Error with a message for the visitor. */
export async function sendContactMessage(form: ContactForm): Promise<void> {
    const call = httpsCallable<ContactForm, { ok: boolean }>(getFirebaseFunctions(), "submitContactMessage");
    try {
        await call(form);
    } catch (err) {
        const code = (err as { code?: string })?.code ?? "";
        if (code === "functions/invalid-argument" || code === "functions/resource-exhausted") {
            throw err instanceof Error ? err : new Error("Please check the form and try again.");
        }
        throw new Error("The message couldn't be sent just now. Please try again, or call the school.");
    }
}

// The inbox shows the newest messages; older ones stay stored.
const INBOX_SIZE = 100;

function messagesRef() {
    return collection(getFirebaseDb(), "contactMessages");
}

export async function listMessages(): Promise<ContactMessage[]> {
    const snap = await getDocs(query(messagesRef(), orderBy("createdAt", "desc"), limit(INBOX_SIZE)));
    return snap.docs.map((d) => d.data() as ContactMessage);
}

/** Unread messages — counted on the server (cheap: no message is downloaded). */
export async function countUnreadMessages(): Promise<number> {
    const snap = await getCountFromServer(query(messagesRef(), where("read", "==", false)));
    return snap.data().count;
}

export async function setMessageRead(id: string, read: boolean): Promise<void> {
    await withTokenRetry(() => updateDoc(doc(messagesRef(), id), { read }));
}

export async function deleteMessage(id: string): Promise<void> {
    await withTokenRetry(() => deleteDoc(doc(messagesRef(), id)));
}
