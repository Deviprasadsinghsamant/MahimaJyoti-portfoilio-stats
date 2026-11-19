// Auth Utilities
// ──────────────
// Phone + password auth backed by Firebase Email/Password provider.
// Phones are mapped to a synthetic email address so we can reuse the
// email/password provider without exposing real emails to users.

import {
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onIdTokenChanged,
    type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "./firebase";
import { clearMemoCache } from "./portal/cache";
import type { UserRole, AuthUser, PortalUser } from "@/domain/portal/types";

export const PHONE_EMAIL_DOMAIN = "mahimajyoti.internal";

export function phoneToEmail(phone: string): string {
    const trimmed = phone.trim();
    const digits = trimmed.startsWith("+")
        ? trimmed.slice(1).replace(/\D/g, "")
        : trimmed.replace(/\D/g, "");
    return `${digits}@${PHONE_EMAIL_DOMAIN}`;
}

export async function signInWithPhone(phone: string, password: string) {
    const auth = getFirebaseAuth();
    return signInWithEmailAndPassword(auth, phoneToEmail(phone), password);
}

export async function signOut() {
    clearMemoCache();
    const auth = getFirebaseAuth();
    return firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
    const auth = getFirebaseAuth();
    // onIdTokenChanged fires on sign-in, sign-out, AND every ID-token refresh
    // (Firebase auto-refreshes every ~55 minutes). Keeping the subscription on
    // this event means custom-claim changes propagate to the UI without a full
    // reload.
    return onIdTokenChanged(auth, callback);
}

export async function forceTokenRefresh(): Promise<void> {
    const user = getFirebaseAuth().currentUser;
    if (!user) return;
    await user.getIdToken(true);
}

// Retry a Firestore write once after forcing a token refresh — recovers
// from stale-claim permission-denied errors without user re-login.
export async function withTokenRetry<T>(fn: () => Promise<T>): Promise<T> {
    try {
        return await fn();
    } catch (err) {
        const code = (err as { code?: string })?.code;
        if (code === "permission-denied" || code === "unauthenticated") {
            await forceTokenRefresh();
            return await fn();
        }
        throw err;
    }
}

export async function getUserRole(user: User): Promise<UserRole | null> {
    const tokenResult = await user.getIdTokenResult();
    // The demo login for app-store reviewers works in the app only.
    if (tokenResult.claims.demo === true) return null;
    const role = tokenResult.claims.role;
    if (role === "admin" || role === "teacher" || role === "staff") {
        return role;
    }
    return null;
}

export async function toAuthUser(user: User): Promise<AuthUser | null> {
    const role = await getUserRole(user);
    if (!role) return null;
    return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role,
    };
}

export async function fetchPortalUser(uid: string): Promise<PortalUser | null> {
    const db = getFirebaseDb();
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return null;
    return snap.data() as PortalUser;
}
