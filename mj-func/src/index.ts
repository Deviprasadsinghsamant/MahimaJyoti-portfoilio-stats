// Cloud Functions Entry Point
// ───────────────────────────

import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Re-export domain handlers
export { academicsApi } from "./domains/academics/handlers";
export { facultyApi } from "./domains/faculty/handlers";
export { eventsApi } from "./domains/events/handlers";
export { authApi } from "./domains/auth/handlers";
