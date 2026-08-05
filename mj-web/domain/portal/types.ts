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
    name: string;
    parentName: string;
    gender: Gender;
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
    teacherId: string;
    academicYear: string;
}

export type AttendanceStatus = "present" | "absent";

export interface AttendanceRecord {
    studentId: string;
    status: AttendanceStatus;
}

export interface Attendance {
    id: string;
    classId: string;
    date: string;
    records: AttendanceRecord[];
    markedBy: string;
    markedByRole: UserRole;
    createdAt: number;
}

export type ExamType = "unit-test" | "midterm" | "final";

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
