// Auth Guard Middleware for Cloud Functions
// ──────────────────────────────────────────

import * as admin from "firebase-admin";
import type { Request, Response, NextFunction } from "express";
import type { UserRole, AuthUser } from "./types";

export interface AuthRequest extends Request {
    user?: AuthUser;
}

/**
 * Verify Firebase ID token and attach user info to request.
 */
export async function verifyAuth(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Missing or invalid authorization header" });
        return;
    }

    const token = authHeader.split("Bearer ")[1];

    try {
        const decoded = await admin.auth().verifyIdToken(token);
        req.user = {
            uid: decoded.uid,
            email: decoded.email ?? null,
            displayName: decoded.name ?? null,
            role: (decoded.role as UserRole) ?? "public",
        };
        next();
    } catch {
        res.status(401).json({ error: "Invalid or expired token" });
    }
}

/**
 * Role-based access control middleware.
 */
export function requireRole(...roles: UserRole[]) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            res.status(401).json({ error: "Not authenticated" });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({ error: "Insufficient permissions" });
            return;
        }

        next();
    };
}
