// Auth Domain — Cloud Function Handlers
// ──────────────────────────────────────
// Admin-only functions for managing user roles.

import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import cors from "cors";

const corsHandler = cors({ origin: true });

/**
 * Set custom claims (role) for a user.
 * Only callable by admins.
 */
export const authApi = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        try {
            if (req.method !== "POST") {
                res.status(405).json({ error: "Method not allowed" });
                return;
            }

            // Verify the caller is an admin
            const authHeader = req.headers.authorization;
            if (!authHeader?.startsWith("Bearer ")) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }

            const token = authHeader.split("Bearer ")[1];
            const decoded = await admin.auth().verifyIdToken(token);

            if (decoded.role !== "admin") {
                res.status(403).json({ error: "Admin access required" });
                return;
            }

            const { uid, role } = req.body;

            if (!uid || !role) {
                res.status(400).json({ error: "uid and role are required" });
                return;
            }

            const validRoles = ["admin", "staff", "student", "public"];
            if (!validRoles.includes(role)) {
                res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(", ")}` });
                return;
            }

            await admin.auth().setCustomUserClaims(uid, { role });
            res.json({ success: true, message: `Role "${role}" set for user ${uid}` });
        } catch (error) {
            console.error("Auth API error:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    });
});
