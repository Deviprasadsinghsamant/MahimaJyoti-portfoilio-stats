// Events Domain — Cloud Function Handlers

import * as functions from "firebase-functions/v1";
import cors from "cors";
import { getDocs } from "../../shared/firestore";

const corsHandler = cors({ origin: true });

interface EventItem {
    id: string;
    title: string;
    date: string;
    category: string;
}

export const eventsApi = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        try {
            if (req.method === "GET") {
                const events = await getDocs<EventItem>("events");
                const notices = await getDocs<EventItem>("notices");
                res.json({ data: { events, notices } });
            } else {
                res.status(405).json({ error: "Method not allowed" });
            }
        } catch (error) {
            console.error("Events API error:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    });
});
