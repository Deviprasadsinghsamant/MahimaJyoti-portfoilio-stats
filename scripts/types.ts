// Duplicated from mj-func/src/shared/types.ts for the seed script.
// Keep in sync when the schema changes.

export type UserRole = "admin" | "teacher" | "staff";
export type Gender = "male" | "female" | "other";
export type AttendanceStatus = "present" | "absent";
export type ExamType = "baseline" | "internal-assessment" | "summative";

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
    teacherId: string | null;
    academicYear: string;
}

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
