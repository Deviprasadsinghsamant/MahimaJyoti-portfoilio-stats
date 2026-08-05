// Seed Firestore + Firebase Auth with sample school data.
// Run: npm run seed  (from /scripts)
//
// Requires a service account key JSON at scripts/service-account.json
// (gitignored — see scripts/README.md).

import * as admin from "firebase-admin";
import * as path from "path";
import * as fs from "fs";

import type {
    Gender,
    UserRole,
    AttendanceStatus,
    ExamType,
} from "./types";

const KEY_PATH = path.join(__dirname, "service-account.json");

if (!fs.existsSync(KEY_PATH)) {
    console.error(`Missing service account key at ${KEY_PATH}`);
    console.error("See scripts/README.md for how to generate one.");
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(KEY_PATH),
});

const db = admin.firestore();
const auth = admin.auth();

const ACADEMIC_YEAR = "2025-2026";
const FAKE_EMAIL_DOMAIN = "mahimajyoti.internal";
const DEFAULT_PASSWORD = "Password123!";

interface SeedUser {
    phone: string;
    displayName: string;
    role: UserRole;
}

const users: SeedUser[] = [
    { phone: "+919000000001", displayName: "Anita Rao (Principal)", role: "admin" },
    { phone: "+919000000002", displayName: "Rakesh Mishra (Vice-Principal)", role: "admin" },
    { phone: "+919000000101", displayName: "Suman Behera", role: "teacher" },
    { phone: "+919000000102", displayName: "Priya Panda", role: "teacher" },
    { phone: "+919000000103", displayName: "Arun Sahoo", role: "teacher" },
    { phone: "+919000000201", displayName: "Manoj Das", role: "staff" },
    { phone: "+919000000202", displayName: "Kavita Nayak", role: "staff" },
];

const classDefinitions = [
    { name: "Class 6-A", grade: 6, section: "A" },
    { name: "Class 7-A", grade: 7, section: "A" },
    { name: "Class 8-A", grade: 8, section: "A" },
];

const subjectsPerClass = ["Mathematics", "Science", "English", "Social Studies", "Hindi"];

const studentNames = [
    "Aarav Kumar", "Diya Patel", "Ishaan Singh", "Kavya Sharma", "Vihaan Reddy",
    "Anaya Nair", "Reyansh Gupta", "Myra Iyer", "Advik Menon", "Sara Chatterjee",
    "Kabir Joshi", "Anika Rao", "Vivaan Bhat", "Riya Malhotra", "Aryan Kapoor",
    "Zara Ahmed", "Neel Verma", "Ira Sen", "Rohan Bose", "Meera Pillai",
    "Dhruv Mehta", "Aditi Deshmukh", "Yuvan Krishnan", "Saanvi Rao", "Arjun Naidu",
    "Tara Bhattacharya", "Krish Choudhary", "Mira Ghosh", "Aarush Pandey", "Ananya Roy",
];

const genders: Gender[] = ["male", "female", "male", "female", "male",
    "female", "male", "female", "male", "female",
    "male", "female", "male", "female", "male",
    "female", "male", "female", "male", "female",
    "male", "female", "male", "female", "male",
    "female", "male", "female", "male", "female"];

function fakeEmail(phone: string) {
    return `${phone.replace("+", "")}@${FAKE_EMAIL_DOMAIN}`;
}

function random(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
    return arr[random(0, arr.length - 1)];
}

async function clear() {
    console.log("Clearing existing seed data...");
    const collections = ["users", "classes", "students", "subjects", "attendance", "results", "syllabus"];
    for (const col of collections) {
        const snap = await db.collection(col).get();
        const batch = db.batch();
        snap.docs.forEach((d) => batch.delete(d.ref));
        if (!snap.empty) await batch.commit();
    }
}

async function seedUsers() {
    console.log("Seeding users + Auth accounts...");
    const created: (SeedUser & { uid: string })[] = [];
    for (const u of users) {
        const email = fakeEmail(u.phone);
        let uid: string;
        try {
            const existing = await auth.getUserByEmail(email);
            uid = existing.uid;
            await auth.updateUser(uid, { displayName: u.displayName, password: DEFAULT_PASSWORD });
        } catch {
            const rec = await auth.createUser({
                email,
                password: DEFAULT_PASSWORD,
                displayName: u.displayName,
            });
            uid = rec.uid;
        }
        await auth.setCustomUserClaims(uid, { role: u.role });
        await db.collection("users").doc(uid).set({
            uid,
            phone: u.phone,
            displayName: u.displayName,
            role: u.role,
            isActive: true,
            createdAt: Date.now(),
        });
        created.push({ ...u, uid });
        console.log(`  ${u.role.padEnd(7)} ${u.phone}  ${u.displayName}`);
    }
    return created;
}

async function seedClasses(teacherIds: string[]) {
    console.log("Seeding classes...");
    const created: { id: string; name: string; grade: number; section: string; classTeacherId: string }[] = [];
    for (let i = 0; i < classDefinitions.length; i++) {
        const def = classDefinitions[i];
        const ref = db.collection("classes").doc();
        const doc = {
            id: ref.id,
            name: def.name,
            grade: def.grade,
            section: def.section,
            academicYear: ACADEMIC_YEAR,
            classTeacherId: teacherIds[i % teacherIds.length],
        };
        await ref.set(doc);
        created.push(doc);
        console.log(`  ${def.name} → teacher ${doc.classTeacherId.slice(0, 8)}`);
    }
    return created;
}

async function seedStudents(classes: { id: string; name: string }[]) {
    console.log("Seeding students...");
    const created: { id: string; name: string; classId: string }[] = [];
    for (let i = 0; i < studentNames.length; i++) {
        const cls = classes[i % classes.length];
        const ref = db.collection("students").doc();
        const doc = {
            id: ref.id,
            name: studentNames[i],
            parentName: `Parent of ${studentNames[i].split(" ")[0]}`,
            gender: genders[i],
            rollNo: String(Math.floor(i / classes.length) + 1),
            contactNumber: `+9199${String(10000000 + i).slice(-8)}`,
            classId: cls.id,
            admissionYear: ACADEMIC_YEAR,
            isActive: true,
            createdAt: Date.now(),
        };
        await ref.set(doc);
        created.push({ id: ref.id, name: doc.name, classId: cls.id });
    }
    console.log(`  ${created.length} students across ${classes.length} classes`);
    return created;
}

async function seedSubjects(classes: { id: string }[], teacherIds: string[]) {
    console.log("Seeding subjects...");
    const created: { id: string; name: string; classId: string; teacherId: string }[] = [];
    for (const cls of classes) {
        for (let i = 0; i < subjectsPerClass.length; i++) {
            const ref = db.collection("subjects").doc();
            const doc = {
                id: ref.id,
                name: subjectsPerClass[i],
                classId: cls.id,
                teacherId: teacherIds[i % teacherIds.length],
                academicYear: ACADEMIC_YEAR,
            };
            await ref.set(doc);
            created.push(doc);
        }
    }
    console.log(`  ${created.length} subjects total`);
    return created;
}

async function seedAttendance(
    classes: { id: string }[],
    students: { id: string; classId: string }[],
    users: { uid: string; role: UserRole }[]
) {
    console.log("Seeding 10 school days of attendance...");
    const markers = users.filter((u) => u.role === "teacher" || u.role === "staff");
    const today = new Date();
    let total = 0;
    for (let d = 0; d < 10; d++) {
        const date = new Date(today);
        date.setDate(today.getDate() - d);
        // skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        const iso = date.toISOString().slice(0, 10);
        for (const cls of classes) {
            const marker = pick(markers);
            const clsStudents = students.filter((s) => s.classId === cls.id);
            const records = clsStudents.map((s) => ({
                studentId: s.id,
                status: (Math.random() < 0.9 ? "present" : "absent") as AttendanceStatus,
            }));
            const ref = db.collection("attendance").doc();
            await ref.set({
                id: ref.id,
                classId: cls.id,
                date: iso,
                records,
                markedBy: marker.uid,
                markedByRole: marker.role,
                createdAt: Date.now(),
            });
            total++;
        }
    }
    console.log(`  ${total} attendance docs`);
}

async function seedResults(
    students: { id: string; classId: string }[],
    subjects: { id: string; classId: string; teacherId: string }[],
    users: { uid: string; role: UserRole }[]
) {
    console.log("Seeding results (6 unit tests + 3 midterms + 1 final per student × subject)...");
    const uploader = users.find((u) => u.role === "staff")!;

    // Exam schedule for the academic year 2025-2026 (Apr 2025 → Mar 2026).
    // Each entry is (examType, examNumber, examDate, totalMarks).
    const schedule: { examType: ExamType; examNumber: number; examDate: string; totalMarks: number }[] = [
        { examType: "unit-test", examNumber: 1, examDate: "2025-05-15", totalMarks: 25 },
        { examType: "unit-test", examNumber: 2, examDate: "2025-06-25", totalMarks: 25 },
        { examType: "midterm", examNumber: 1, examDate: "2025-08-05", totalMarks: 100 },
        { examType: "unit-test", examNumber: 3, examDate: "2025-09-10", totalMarks: 25 },
        { examType: "unit-test", examNumber: 4, examDate: "2025-10-20", totalMarks: 25 },
        { examType: "midterm", examNumber: 2, examDate: "2025-11-25", totalMarks: 100 },
        { examType: "unit-test", examNumber: 5, examDate: "2026-01-15", totalMarks: 25 },
        { examType: "midterm", examNumber: 3, examDate: "2026-02-10", totalMarks: 100 },
        { examType: "unit-test", examNumber: 6, examDate: "2026-02-25", totalMarks: 25 },
        { examType: "final", examNumber: 1, examDate: "2026-03-15", totalMarks: 100 },
    ];

    let total = 0;
    for (const student of students) {
        const clsSubjects = subjects.filter((s) => s.classId === student.classId);
        // Give each student a per-subject "skill" (baseline percent) so their trend has personality,
        // then add a slow upward drift and a small random jitter — makes charts read like real learning.
        for (const subject of clsSubjects) {
            const baseline = random(45, 88); // student's floor in this subject (%)
            const drift = random(0, 15) / 10; // small term-over-term drift (0.0 – 1.5 pts per exam)
            for (let i = 0; i < schedule.length; i++) {
                const exam = schedule[i];
                const target = Math.min(99, baseline + drift * i + random(-6, 6));
                const marks = Math.max(0, Math.min(exam.totalMarks, Math.round((target / 100) * exam.totalMarks)));
                const ref = db.collection("results").doc();
                await ref.set({
                    id: ref.id,
                    studentId: student.id,
                    subjectId: subject.id,
                    classId: student.classId,
                    examType: exam.examType,
                    examNumber: exam.examNumber,
                    examDate: exam.examDate,
                    marksObtained: marks,
                    totalMarks: exam.totalMarks,
                    academicYear: ACADEMIC_YEAR,
                    teacherId: subject.teacherId,
                    uploadedBy: uploader.uid,
                    createdAt: Date.now(),
                });
                total++;
            }
        }
    }
    console.log(`  ${total} result docs`);
}

async function seedSyllabus(subjects: { id: string; classId: string; teacherId: string; name: string }[]) {
    console.log("Seeding syllabus entries...");
    for (const sub of subjects.slice(0, 5)) {
        const ref = db.collection("syllabus").doc();
        await ref.set({
            id: ref.id,
            classId: sub.classId,
            subjectId: sub.id,
            title: `${sub.name} — Term 1 Syllabus`,
            content: `Week 1-4: Chapter 1-2\nWeek 5-8: Chapter 3-4\nWeek 9-12: Chapter 5-6`,
            uploadedBy: sub.teacherId,
            createdAt: Date.now(),
        });
    }
    console.log(`  5 syllabus docs`);
}

async function main() {
    await clear();
    const seededUsers = await seedUsers();
    const teacherIds = seededUsers.filter((u) => u.role === "teacher").map((u) => u.uid);
    const classes = await seedClasses(teacherIds);
    const students = await seedStudents(classes);
    const subjects = await seedSubjects(classes, teacherIds);
    await seedAttendance(classes, students, seededUsers);
    await seedResults(students, subjects, seededUsers);
    await seedSyllabus(subjects);
    console.log("\nDone. Login credentials:");
    seededUsers.forEach((u) => {
        console.log(`  [${u.role}] phone: ${u.phone}  password: ${DEFAULT_PASSWORD}`);
    });
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
