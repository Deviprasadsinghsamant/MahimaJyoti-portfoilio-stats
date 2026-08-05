// Faculty Domain — Cloud Function Handlers

import * as functions from "firebase-functions";
import cors from "cors";
import { getDoc, getDocs } from "../../shared/firestore";

const corsHandler = cors({ origin: true });

interface FacultyMember {
    id: string;
    name: string;
    role: string;
    subject: string;
}

export const facultyApi = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        try {
            if (req.method === "GET") {
                const pathParts = req.path.split("/").filter(Boolean);

                if (pathParts.length === 0) {
                    const faculty = await getDocs<FacultyMember>("faculty");
                    res.json({ data: faculty });
                } else {
                    const member = await getDoc<FacultyMember>("faculty", pathParts[0]);
                    if (!member) {
                        res.status(404).json({ error: "Faculty member not found" });
                        return;
                    }
                    res.json({ data: member });
                }
            } else {
                res.status(405).json({ error: "Method not allowed" });
            }
        } catch (error) {
            console.error("Faculty API error:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    });
});
