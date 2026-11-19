// Staff Domain — Cloud Function Handlers
// ──────────────────────────────────────
// Admin-only callables that create and manage teacher / staff accounts.
// Creating a login needs the Admin SDK (Auth user + custom role claim), so it
// can't run in the browser. Class and subject assignments are plain Firestore
// writes that admins are already allowed to make, so they stay in the web app.

import * as admin from "firebase-admin";
import type { UpdateRequest } from "firebase-admin/auth";
import { onCall, HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { db } from "../../shared/firestore";
import type { PortalUser, UserRole } from "../../shared/types";

// Same region as Firestore. Keep in sync with FUNCTIONS_REGION in mj-web/lib/firebase.ts.
const REGION = "asia-south1";

// Keep in sync with PHONE_EMAIL_DOMAIN / phoneToEmail in mj-web/lib/auth.ts.
const PHONE_EMAIL_DOMAIN = "mahimajyoti.internal";

// Admin accounts are not managed from the portal.
const MANAGED_ROLES: UserRole[] = ["teacher", "staff"];
const MIN_PASSWORD_LENGTH = 8;

export interface CreateStaffInput {
    displayName: string;
    phone: string;
    role: UserRole;
    password: string;
}

export interface UpdateStaffInput {
    uid: string;
    displayName?: string;
    phone?: string;
    role?: UserRole;
    isActive?: boolean;
    // Empty or missing leaves the password unchanged.
    password?: string;
}

function requireAdmin(request: CallableRequest): string {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Sign in first.");
    }
    if (request.auth.token.role !== "admin") {
        throw new HttpsError("permission-denied", "Admin access required.");
    }
    return request.auth.uid;
}

// Accepts "+<country code><number>" or a bare 10-digit Indian mobile number —
// the same shapes the portal login form turns into a phone number.
function normalizePhone(raw: unknown): string {
    if (typeof raw !== "string" || !raw.trim()) {
        throw new HttpsError("invalid-argument", "Phone number is required.");
    }
    const trimmed = raw.trim();
    const digits = trimmed.replace(/\D/g, "");
    if (trimmed.startsWith("+")) {
        if (digits.length < 10 || digits.length > 15) {
            throw new HttpsError("invalid-argument", "Phone number with country code must have 10–15 digits.");
        }
        return `+${digits}`;
    }
    if (digits.length === 10) {
        return `+91${digits}`;
    }
    throw new HttpsError("invalid-argument", "Enter a 10-digit mobile number, or start with + and the country code.");
}

function phoneToEmail(phone: string): string {
    return `${phone.replace(/\D/g, "")}@${PHONE_EMAIL_DOMAIN}`;
}

function parseName(raw: unknown): string {
    const name = typeof raw === "string" ? raw.trim().replace(/\s+/g, " ") : "";
    if (!name) {
        throw new HttpsError("invalid-argument", "Full name is required.");
    }
    if (name.length > 80) {
        throw new HttpsError("invalid-argument", "Full name must be 80 characters or fewer.");
    }
    return name;
}

function parseRole(raw: unknown): UserRole {
    if (!MANAGED_ROLES.includes(raw as UserRole)) {
        throw new HttpsError("invalid-argument", "Role must be teacher or staff.");
    }
    return raw as UserRole;
}

function parsePassword(raw: unknown): string {
    if (typeof raw !== "string" || raw.length < MIN_PASSWORD_LENGTH) {
        throw new HttpsError("invalid-argument", `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    }
    return raw;
}

function errorCode(err: unknown): string | undefined {
    return (err as { code?: string })?.code;
}

/**
 * Create a teacher or staff login: Auth user (phone mapped to a synthetic
 * email), role claim, and users/{uid} profile. Returns the profile.
 */
export const createStaffAccount = onCall<CreateStaffInput>({ region: REGION }, async (request): Promise<PortalUser> => {
    requireAdmin(request);
    const displayName = parseName(request.data?.displayName);
    const phone = normalizePhone(request.data?.phone);
    const role = parseRole(request.data?.role);
    const password = parsePassword(request.data?.password);

    let uid: string;
    try {
        const record = await admin.auth().createUser({ email: phoneToEmail(phone), password, displayName });
        uid = record.uid;
    } catch (err) {
        if (errorCode(err) === "auth/email-already-exists") {
            throw new HttpsError("already-exists", `An account already exists for ${phone}.`);
        }
        throw err;
    }

    // Roll the Auth user back if the role or profile can't be written, so a
    // retry with the same phone number doesn't fail with "already exists".
    try {
        await admin.auth().setCustomUserClaims(uid, { role });
        const profile: PortalUser = {
            uid,
            phone,
            displayName,
            role,
            isActive: true,
            createdAt: Date.now(),
        };
        await db.collection("users").doc(uid).set(profile);
        return profile;
    } catch (err) {
        await admin.auth().deleteUser(uid).catch(() => undefined);
        throw err;
    }
});

/**
 * Edit a teacher or staff account: name, phone, role, active flag, password.
 * Only fields that are present and different are changed. Returns the profile.
 */
export const updateStaffAccount = onCall<UpdateStaffInput>({ region: REGION }, async (request): Promise<PortalUser> => {
    const callerUid = requireAdmin(request);
    const data = request.data ?? ({} as Partial<UpdateStaffInput>);
    const uid = typeof data.uid === "string" ? data.uid : "";
    if (!uid) {
        throw new HttpsError("invalid-argument", "uid is required.");
    }
    if (uid === callerUid) {
        throw new HttpsError("failed-precondition", "You can't change your own account here.");
    }

    const ref = db.collection("users").doc(uid);
    const snap = await ref.get();
    if (!snap.exists) {
        throw new HttpsError("not-found", "No such user.");
    }
    const current = snap.data() as PortalUser;
    if (!MANAGED_ROLES.includes(current.role)) {
        throw new HttpsError("permission-denied", "Only teacher and staff accounts can be managed here.");
    }

    const patch: Partial<PortalUser> = {};
    const authPatch: UpdateRequest = {};

    if (data.displayName !== undefined) {
        const displayName = parseName(data.displayName);
        if (displayName !== current.displayName) {
            patch.displayName = displayName;
            authPatch.displayName = displayName;
        }
    }
    if (data.phone !== undefined) {
        const phone = normalizePhone(data.phone);
        if (phone !== current.phone) {
            patch.phone = phone;
            authPatch.email = phoneToEmail(phone);
        }
    }
    if (data.isActive !== undefined) {
        if (typeof data.isActive !== "boolean") {
            throw new HttpsError("invalid-argument", "isActive must be true or false.");
        }
        if (data.isActive !== current.isActive) {
            patch.isActive = data.isActive;
            authPatch.disabled = !data.isActive;
        }
    }
    if (data.password !== undefined && data.password !== "") {
        authPatch.password = parsePassword(data.password);
    }
    const role = data.role !== undefined ? parseRole(data.role) : current.role;
    const roleChanged = role !== current.role;
    if (roleChanged) patch.role = role;

    if (Object.keys(authPatch).length > 0) {
        try {
            await admin.auth().updateUser(uid, authPatch);
        } catch (err) {
            if (errorCode(err) === "auth/email-already-exists") {
                throw new HttpsError("already-exists", `Another account already uses ${patch.phone}.`);
            }
            throw err;
        }
    }
    if (roleChanged) {
        // Keep any other claim (e.g. demo, for the app-store review login).
        const { customClaims } = await admin.auth().getUser(uid);
        await admin.auth().setCustomUserClaims(uid, { ...customClaims, role });
    }
    // Revoke refresh tokens when access changes so the old session can't be
    // renewed. The ID token already issued stays valid until it expires (≤ 1 hour).
    if (roleChanged || authPatch.password || patch.isActive === false) {
        await admin.auth().revokeRefreshTokens(uid);
    }
    if (Object.keys(patch).length > 0) {
        await ref.update(patch);
    }
    return { ...current, ...patch };
});
