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
export { createStaffAccount, updateStaffAccount } from "./domains/staff/handlers";
export { parentSync, parentUnlink } from "./domains/parents/handlers";
export { pushResultToParents, pushStudentToParents } from "./domains/parents/triggers";
export { saveAttendance } from "./domains/attendance/handlers";
export { teacherSync, teacherStudent } from "./domains/teachers/handlers";
export { submitContactMessage } from "./domains/contact/handlers";
