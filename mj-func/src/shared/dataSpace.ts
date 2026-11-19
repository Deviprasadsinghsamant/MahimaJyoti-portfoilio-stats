// Where the school's records live — and the separate set for app-store review.
//
// Google Play's reviewers sign in with a demo parent (Student ID MJ9001) and a
// demo teacher login (token claim `demo`). Their class, subjects, student,
// marks and attendance live in demo* collections (scripts/demo-review.ts), not
// in the school's own. The website, the real app and the Firestore rules only
// ever read the school's collections, so review data can't appear anywhere
// real — no filters needed. Only the functions that serve a demo login or the
// demo student read the demo set.

export interface DataSpace {
    demo: boolean;
    classes: string;
    subjects: string;
    students: string;
    results: string;
    attendance: string;
    attendanceSummary: string;
}

export const SCHOOL_DATA: DataSpace = {
    demo: false,
    classes: "classes",
    subjects: "subjects",
    students: "students",
    results: "results",
    attendance: "attendance",
    attendanceSummary: "attendanceSummary",
};

export const DEMO_DATA: DataSpace = {
    demo: true,
    classes: "demoClasses",
    subjects: "demoSubjects",
    students: "demoStudents",
    results: "demoResults",
    attendance: "demoAttendance",
    attendanceSummary: "demoAttendanceSummary",
};

// Every demo document id starts with this (real ids are Firestore auto-ids,
// which never contain "-"), so a student id alone says which set it's in.
export const DEMO_ID_PREFIX = "demo-review-";

export function dataSpace(demo: boolean): DataSpace {
    return demo ? DEMO_DATA : SCHOOL_DATA;
}

export function dataSpaceOfStudent(studentId: string): DataSpace {
    return dataSpace(studentId.startsWith(DEMO_ID_PREFIX));
}
