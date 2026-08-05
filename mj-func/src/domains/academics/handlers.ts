// Academics Domain — Cloud Function Handlers
// ────────────────────────────────────────────

import * as functions from "firebase-functions";
import cors from "cors";
import { getDoc, getDocs } from "../../shared/firestore";

const corsHandler = cors({ origin: true });

interface AcademicProgram {
    id: string;
    title: string;
    board: string;
    level: string;
    description: string;
}

/**
 * HTTPS Cloud Function for academics API.
 * GET /academics — list all programs
 * GET /academics/:id — get a specific program
 */
export const academicsApi = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        try {
            if (req.method === "GET") {
                const pathParts = req.path.split("/").filter(Boolean);

                if (pathParts.length === 0) {
                    // List all programs
                    const programs = await getDocs<AcademicProgram>("academics");
                    res.json({ data: programs });
                } else {
                    // Get single program
                    const program = await getDoc<AcademicProgram>("academics", pathParts[0]);
                    if (!program) {
                        res.status(404).json({ error: "Program not found" });
                        return;
                    }
                    res.json({ data: program });
                }
            } else {
                res.status(405).json({ error: "Method not allowed" });
            }
        } catch (error) {
            console.error("Academics API error:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    });
});
