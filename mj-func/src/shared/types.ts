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

export interface Attendance {
    id: string;
    classId: string;
    date: string;
    records: AttendanceRecord[];
    markedBy: string;
    markedByRole: UserRole;
    createdAt: number;
}

export type ExamType = "baseline" | "internal-assessment" | "summative";

export interface Result {
    id: string;
    studentId: string;
    subjectId: string;
    classId: string;
    examType: ExamType;
    examNumber: number;
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
