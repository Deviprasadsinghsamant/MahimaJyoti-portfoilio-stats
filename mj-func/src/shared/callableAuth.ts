// Who is calling a callable function — portal accounts only (admin, teacher, staff).

import { HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import type { UserRole } from "./types";

const PORTAL_ROLES: UserRole[] = ["admin", "teacher", "staff"];

export interface Caller {
    uid: string;
    role: UserRole;
    // The account's display name (set when the login is created); may be empty.
    name: string;
    // The demo login for app-store reviewers (custom claim `demo`): limited to
    // demo classes and students. See scripts/demo-review.ts.
    demo: boolean;
}

export function requirePortalUser(request: CallableRequest): Caller {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Sign in first.");
    }
    const role = request.auth.token.role as UserRole | undefined;
    if (!role || !PORTAL_ROLES.includes(role)) {
        throw new HttpsError("permission-denied", "This needs a school staff login.");
    }
    const name = typeof request.auth.token.name === "string" ? request.auth.token.name : "";
    return { uid: request.auth.uid, role, name, demo: request.auth.token.demo === true };
}
