// Admissions Domain Types

export type AdmissionStatus = "open" | "closed" | "waitlist";

export interface AdmissionInfo {
    id: string;
    programId: string;
    academicYear: string;
    status: AdmissionStatus;
    deadline?: string;
    eligibility: string[];
    requiredDocuments: string[];
    feeStructure: FeeItem[];
    process: AdmissionStep[];
}

export interface FeeItem {
    label: string;
    amount: number;
    frequency: "one-time" | "monthly" | "quarterly" | "annually";
    isOptional?: boolean;
}

export interface AdmissionStep {
    step: number;
    title: string;
    description: string;
}

export interface AdmissionApplication {
    id: string;
    studentName: string;
    parentName: string;
    email: string;
    phone: string;
    programId: string;
    status: "pending" | "reviewed" | "accepted" | "rejected";
    submittedAt: string;
    documents: string[];
}
