export type UserRole = "admin" | "teacher" | "staff";

export interface AuthUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    role: UserRole;
}

export interface PortalUser {
    uid: string;
    phone: string;
    displayName: string;
    role: UserRole;
    isActive: boolean;
    createdAt: number;
}

export type Gender = "male" | "female" | "other";

export interface SchoolClass {
    id: string;
    name: string;
    grade: number;
    section: string;
    academicYear: string;
    classTeacherId: string | null;
}

export interface Student {
    id: string;
    // Permanent Student ID parents sign in to the app with, e.g. "MJ0042".
    studentCode?: string;
    name: string;
    parentName: string;
    // null when not recorded (e.g. students imported from result sheets).
    gender: Gender | null;
    rollNo: string | null;
    contactNumber: string;
    classId: string;
    admissionYear: string;
    isActive: boolean;
    createdAt: number;
}

export interface Subject {
    id: string;
    name: string;
    classId: string;
    // null when no teacher is assigned yet (or their assignment was removed).
    teacherId: string | null;
    academicYear: string;
}

export type AttendanceStatus = "present" | "absent";

export interface AttendanceRecord {
    studentId: string;
    status: AttendanceStatus;
}

// One register per class per day, id `${classId}_${date}`. Saved only through the
// saveAttendance function (mj-func/src/domains/attendance/handlers.ts).
export interface Attendance {
    id: string;
    classId: string;
    // ISO date (YYYY-MM-DD), India time.
    date: string;
    academicYear: string;
    records: AttendanceRecord[];
    markedBy: string;
    markedByName: string;
    markedByRole: UserRole;
    createdAt: number;
    // Last save; sent back with the next save so it can't overwrite a newer one.
    updatedAt: number;
}

// subject-test: a test in one subject (class / unit test), numbered per subject —
// Mathematics Test 1, 2, … — with its own total marks.
export type ExamType = "baseline" | "internal-assessment" | "summative" | "subject-test";

export interface Result {
    id: string;
    studentId: string;
    subjectId: string;
    classId: string;
    examType: ExamType;
    // Which instance within the exam type — e.g. Unit Test 1, 2, 3 … for the same student/subject/year.
    examNumber: number;
    // ISO date (YYYY-MM-DD) the exam was held. Drives chronological ordering in charts.
    examDate: string;
    marksObtained: number;
    totalMarks: number;
    academicYear: string;
    teacherId: string;
    uploadedBy: string;
    createdAt: number;
}

export interface Syllabus {
    id: string;
    classId: string;
    subjectId: string;
    title: string;
    content: string;
    uploadedBy: string;
    createdAt: number;
}
