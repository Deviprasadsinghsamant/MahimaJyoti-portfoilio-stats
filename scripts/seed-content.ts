// One-off seed for portfolio content. Idempotent: skips faculty that already
// exist (matched by name), and skips siteContent/{pageId} docs that already exist.
// Run once after enabling Firebase Storage.
//
//   cd scripts && npx ts-node seed-content.ts

import * as admin from "firebase-admin";
import * as path from "path";
import * as fs from "fs";

const KEY_PATH = path.join(__dirname, "service-account.json");
if (!fs.existsSync(KEY_PATH)) {
    console.error(`Missing service account key at ${KEY_PATH}. See scripts/README.md.`);
    process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(KEY_PATH) });
const db = admin.firestore();

// ─── Faculty ────────────────────────────────────────

const FACULTY_SEED = [
    { name: "Dr. Suresh Kumar Mishra", role: "Principal & Director of Academics", subject: "Physics", qualification: "Ph.D. in Physics, IIT Kharagpur", experience: "28 years", accent: "from-navy-700 to-navy-900" },
    { name: "Prof. Anjali Mohapatra", role: "Vice Principal", subject: "English Literature", qualification: "M.A., M.Phil. (English), Utkal University", experience: "22 years", accent: "from-gold-500 to-gold-700" },
    { name: "Dr. Rajesh Panda", role: "Head of Science Department", subject: "Chemistry", qualification: "Ph.D. in Organic Chemistry", experience: "20 years", accent: "from-blue-500 to-blue-700" },
    { name: "Mrs. Sanjukta Das", role: "Senior Faculty", subject: "Mathematics", qualification: "M.Sc. Mathematics, NIT Rourkela", experience: "18 years", accent: "from-emerald-500 to-emerald-700" },
    { name: "Dr. Priya Rath", role: "Head of Arts Department", subject: "Political Science", qualification: "Ph.D. in Political Science", experience: "16 years", accent: "from-purple-500 to-purple-700" },
    { name: "Mr. Bibhu Prasad Nayak", role: "Senior Faculty", subject: "Biology", qualification: "M.Sc. Zoology, Berhampur University", experience: "15 years", accent: "from-teal-500 to-teal-700" },
    { name: "Mrs. Laxmipriya Sahoo", role: "Senior Faculty", subject: "Computer Science", qualification: "MCA, IGNOU", experience: "12 years", accent: "from-indigo-500 to-indigo-700" },
    { name: "Mr. Deepak Mohanty", role: "Senior Faculty", subject: "History & Economics", qualification: "M.A. History, Ravenshaw University", experience: "14 years", accent: "from-rose-500 to-rose-700" },
    { name: "Mrs. Sunita Behera", role: "Faculty", subject: "Odia Language", qualification: "M.A. Odia Literature", experience: "10 years", accent: "from-amber-500 to-amber-700" },
];

async function seedFaculty() {
    console.log("Seeding faculty…");
    const existing = await db.collection("faculty").get();
    const existingNames = new Set(existing.docs.map((d) => (d.data() as { name: string }).name));
    let created = 0;
    for (let i = 0; i < FACULTY_SEED.length; i++) {
        const m = FACULTY_SEED[i];
        if (existingNames.has(m.name)) continue;
        const ref = db.collection("faculty").doc();
        const now = Date.now();
        await ref.set({ id: ref.id, ...m, photoUrl: null, order: i, isActive: true, createdAt: now, updatedAt: now });
        created++;
    }
    console.log(`  ${created} new, ${FACULTY_SEED.length - created} skipped.`);
}

// ─── Gallery ────────────────────────────────────────

const GALLERY_SEED = [
    { title: "Main Academic Block", description: "The heart of our campus — smart classrooms and faculty offices.", category: "campus", accent: "from-navy-200 to-navy-400" },
    { title: "Annual Day Celebration", description: "Cultural performances and award ceremonies.", category: "events", accent: "from-gold-200 to-gold-400" },
    { title: "Science Laboratory", description: "Fully equipped Physics and Chemistry labs.", category: "academics", accent: "from-blue-200 to-blue-400" },
    { title: "Sports Day 2025", description: "Annual athletics meet with inter-house tournaments.", category: "sports", accent: "from-emerald-200 to-emerald-400" },
    { title: "Library & Resource Centre", description: "10,000+ volumes with a digital reading zone.", category: "campus", accent: "from-amber-200 to-amber-400" },
    { title: "Republic Day Parade", description: "Students participating in the flag hoisting ceremony.", category: "events", accent: "from-rose-200 to-rose-400" },
    { title: "Computer Science Lab", description: "Modern computer lab with high-speed internet.", category: "academics", accent: "from-indigo-200 to-indigo-400" },
    { title: "Basketball Court", description: "Outdoor court for inter-school tournaments.", category: "sports", accent: "from-teal-200 to-teal-400" },
    { title: "Assembly Ground", description: "Morning assemblies, yoga, and cultural events.", category: "campus", accent: "from-purple-200 to-purple-400" },
];

async function seedGallery() {
    console.log("Seeding gallery…");
    const existing = await db.collection("galleryItems").get();
    const existingTitles = new Set(existing.docs.map((d) => (d.data() as { title: string }).title));
    let created = 0;
    for (let i = 0; i < GALLERY_SEED.length; i++) {
        const it = GALLERY_SEED[i];
        if (existingTitles.has(it.title)) continue;
        const ref = db.collection("galleryItems").doc();
        const now = Date.now();
        await ref.set({ id: ref.id, ...it, photoUrl: null, order: i, isActive: true, createdAt: now, updatedAt: now });
        created++;
    }
    console.log(`  ${created} new, ${GALLERY_SEED.length - created} skipped.`);
}

// ─── Site content (per-page docs) ──────────────────

const HOME_CONTENT = {
    academicPathways: [
        { icon: "BookOpen", title: "Primary Education", subtitle: "Class 1 – 10 · BSE Board", description: "A strong academic foundation with holistic development, activity-based learning, and value education for younger minds.", gradient: "from-blue-500 to-blue-700", glow: "shadow-blue-500/20", href: "/academics#primary" },
        { icon: "GraduationCap", title: "Intermediate (+2)", subtitle: "Science & Arts · CHSE Board", description: "Rigorous preparation for higher studies with specialised streams, experienced faculty, and modern laboratory facilities.", gradient: "from-gold-500 to-gold-700", glow: "shadow-gold-500/20", href: "/academics#intermediate" },
        { icon: "Trophy", title: "Graduation", subtitle: "Utkal University Affiliated", description: "Undergraduate degree programs with a focus on academic excellence, research exposure, and career-ready skills.", gradient: "from-emerald-500 to-emerald-700", glow: "shadow-emerald-500/20", href: "/academics#graduation" },
    ],
    highlights: [
        { icon: "Shield", text: "Government Recognized & Accredited" },
        { icon: "Star", text: "Award-Winning Faculty" },
        { icon: "Clock", text: "Decades of Academic Excellence" },
        { icon: "Award", text: "Modern Infrastructure" },
    ],
    notices: [
        { date: "Feb 20, 2026", title: "Admissions Open for 2026-27 Session", tag: "Admissions" },
        { date: "Feb 15, 2026", title: "Annual Sports Day — March 5th, 2026", tag: "Events" },
        { date: "Feb 10, 2026", title: "Board Exam Preparation Workshop", tag: "Academics" },
        { date: "Feb 05, 2026", title: "Parent-Teacher Meeting Schedule Released", tag: "Notice" },
    ],
    testimonials: [
        { name: "Dr. Ananya Patel", role: "Parent, Class 8", quote: "The holistic approach to education here has transformed my child's confidence and academic performance. The teachers genuinely care." },
        { name: "Rajesh Mohanty", role: "Alumni, Batch 2022", quote: "My years at MahimaJyoti gave me the foundation I needed for engineering. The science labs and faculty support were exceptional." },
        { name: "Priya Dash", role: "Parent, +2 Science", quote: "From academics to extra-curriculars, the school provides a well-rounded experience. We're proud to be part of this institution." },
    ],
};

const ABOUT_CONTENT = {
    timeline: [
        { year: "1998", title: "Foundation", desc: "Institution founded with a vision for holistic education in Odisha." },
        { year: "2003", title: "BSE Affiliation", desc: "Received Board of Secondary Education affiliation for classes 1–10." },
        { year: "2008", title: "CHSE Programs", desc: "Launched Intermediate (+2) Science & Arts streams under CHSE." },
        { year: "2013", title: "Graduation Programs", desc: "Affiliated with Utkal University for undergraduate degree programs." },
        { year: "2018", title: "Campus Expansion", desc: "State-of-the-art labs, library, and sports complex inaugurated." },
        { year: "2024", title: "Digital Transformation", desc: "Smart classrooms and digital learning infrastructure deployed." },
    ],
    values: [
        { icon: "Target", title: "Excellence", desc: "Striving for the highest standards in academics, sports, and character." },
        { icon: "Heart", title: "Compassion", desc: "Fostering empathy, kindness, and social responsibility in every student." },
        { icon: "Lightbulb", title: "Innovation", desc: "Embracing modern pedagogy and technology for future-ready learning." },
        { icon: "Users", title: "Community", desc: "Building strong bonds among students, faculty, parents, and alumni." },
    ],
    infrastructure: [
        { icon: "Building2", title: "Smart Classrooms", desc: "Digital projectors, interactive boards, and Wi-Fi-enabled learning spaces." },
        { icon: "BookOpen", title: "Library & Resource Centre", desc: "10,000+ books, digital journals, and a quiet reading zone." },
        { icon: "Award", title: "Science Laboratories", desc: "Physics, Chemistry, Biology, and Computer Science labs with modern equipment." },
        { icon: "Target", title: "Sports Complex", desc: "Cricket, football, basketball, badminton, and indoor games facilities." },
    ],
};

const ACADEMICS_CONTENT = {
    programs: [
        {
            id: "primary", icon: "BookOpen", title: "Primary Education", board: "Board of Secondary Education (BSE), Odisha", level: "Class 1 – 10",
            color: "from-blue-500 to-blue-700", bgColor: "bg-blue-50", textColor: "text-blue-700",
            description: "A comprehensive curriculum that builds strong academic foundations while fostering creativity, critical thinking, and personal values. Our primary program ensures every child discovers their potential.",
            features: [
                "Activity-based learning methodology",
                "Regular assessments & parent feedback",
                "Language proficiency in English, Odia & Hindi",
                "Value education & personality development",
                "Smart classroom integration",
                "Annual exhibitions & competitions",
            ],
            subjects: [
                { icon: "Languages", name: "English" },
                { icon: "Calculator", name: "Mathematics" },
                { icon: "Beaker", name: "Science" },
                { icon: "Globe2", name: "Social Studies" },
                { icon: "Languages", name: "Odia" },
                { icon: "Languages", name: "Hindi" },
                { icon: "Binary", name: "Computer Science" },
                { icon: "Palette", name: "Art & Craft" },
            ],
        },
        {
            id: "intermediate", icon: "GraduationCap", title: "Intermediate (+2)", board: "Council of Higher Secondary Education (CHSE), Odisha", level: "Class 11 – 12",
            color: "from-gold-500 to-gold-700", bgColor: "bg-gold-50", textColor: "text-gold-700",
            description: "Two-year higher secondary program preparing students for undergraduate studies, competitive exams, and career pathways. Choose from Science and Arts streams with expert guidance.",
            features: [
                "Science & Arts streams available",
                "Preparation for JEE, NEET, CUET",
                "Practical laboratory sessions",
                "Career counselling & mentorship",
                "Regular mock tests & analysis",
                "Guest lectures from industry experts",
            ],
            subjects: [
                { icon: "Beaker", name: "Physics" },
                { icon: "Beaker", name: "Chemistry" },
                { icon: "Calculator", name: "Mathematics" },
                { icon: "Beaker", name: "Biology" },
                { icon: "Languages", name: "English" },
                { icon: "Globe2", name: "Political Science" },
                { icon: "Globe2", name: "History" },
                { icon: "Calculator", name: "Economics" },
            ],
        },
        {
            id: "graduation", icon: "Trophy", title: "Graduation", board: "Affiliated to Utkal University", level: "3 Year UG",
            color: "from-emerald-500 to-emerald-700", bgColor: "bg-emerald-50", textColor: "text-emerald-700",
            description: "Undergraduate degree programs designed to develop domain expertise alongside real-world skills. Small class sizes and dedicated faculty ensure a personalised learning experience.",
            features: [
                "Bachelor's degree programs",
                "Research project opportunities",
                "Industry internships",
                "Career placement assistance",
                "Well-stocked academic library",
                "Alumni mentorship network",
            ],
            subjects: [
                { icon: "Calculator", name: "B.A. Economics" },
                { icon: "Globe2", name: "B.A. Political Science" },
                { icon: "Languages", name: "B.A. English" },
                { icon: "Beaker", name: "B.Sc. Physics" },
                { icon: "Beaker", name: "B.Sc. Chemistry" },
                { icon: "Calculator", name: "B.Sc. Mathematics" },
                { icon: "Binary", name: "B.Sc. Computer Science" },
                { icon: "Globe2", name: "B.A. History" },
            ],
        },
    ],
};

const ADMISSIONS_CONTENT = {
    steps: [
        { step: 1, icon: "FileText", title: "Obtain Prospectus", desc: "Collect the prospectus and application form from the school office or download from the website." },
        { step: 2, icon: "ClipboardCheck", title: "Submit Application", desc: "Complete the application form with necessary documents and submit to the admissions office." },
        { step: 3, icon: "Calendar", title: "Entrance Assessment", desc: "Attend the entrance assessment on the scheduled date. Previous academic records are also reviewed." },
        { step: 4, icon: "CheckCircle2", title: "Admission Confirmation", desc: "Receive your admission offer, complete the registration, and pay the fees to confirm your seat." },
    ],
    eligibility: [
        { icon: "BookOpen", program: "Primary (Class 1–10)", requirements: ["Birth certificate copy", "Previous academic transcripts", "Transfer certificate (if applicable)", "Parent's ID & address proof", "2 passport photographs"] },
        { icon: "GraduationCap", program: "Intermediate (+2)", requirements: ["Class 10 board certificate", "Class 10 mark sheet", "Transfer certificate", "Character certificate", "4 passport photographs"] },
        { icon: "Trophy", program: "Graduation", requirements: ["Class 12 board certificate", "Class 12 mark sheet", "Migration certificate", "Character certificate", "Aadhaar / ID copy", "4 passport photographs"] },
    ],
    feeHighlights: [
        { label: "Primary (1–5)", range: "₹12,000 – ₹18,000 / year" },
        { label: "Secondary (6–10)", range: "₹18,000 – ₹25,000 / year" },
        { label: "Intermediate (+2)", range: "₹22,000 – ₹30,000 / year" },
        { label: "Graduation", range: "₹25,000 – ₹40,000 / year" },
    ],
};

const CONTACT_CONTENT = {
    contactInfo: [
        { icon: "MapPin", title: "Visit Us", lines: ["Mahanadi Vihar, Cuttack", "Odisha, India — 753004"] },
        { icon: "Phone", title: "Call Us", lines: ["+91 98765 43210", "+91 67120 12345"] },
        { icon: "Mail", title: "Email Us", lines: ["info@mahanadijagruti.edu.in", "admissions@mahanadijagruti.edu.in"] },
        { icon: "Clock", title: "Office Hours", lines: ["Mon – Sat: 8:00 AM – 4:00 PM", "Sunday: Closed"] },
    ],
    socialLinks: [
        { icon: "Facebook", label: "Facebook", href: "#" },
        { icon: "Twitter", label: "Twitter", href: "#" },
        { icon: "Instagram", label: "Instagram", href: "#" },
        { icon: "Youtube", label: "Youtube", href: "#" },
    ],
    mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3736.8456!2d85.8312!3d20.4625!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjDCsDI3JzQ1LjAiTiA4NcKwNDknNTIuMyJF!5e0!3m2!1sen!2sin!4v1234567890",
};

async function seedPage(pageId: string, content: unknown) {
    const ref = db.collection("siteContent").doc(pageId);
    const snap = await ref.get();
    if (snap.exists) {
        console.log(`  ${pageId} — already exists, skipped`);
        return;
    }
    await ref.set({ ...(content as object), updatedAt: Date.now() });
    console.log(`  + ${pageId}`);
}

async function seedSiteContent() {
    console.log("Seeding siteContent pages…");
    await seedPage("home", HOME_CONTENT);
    await seedPage("about", ABOUT_CONTENT);
    await seedPage("academics", ACADEMICS_CONTENT);
    await seedPage("admissions", ADMISSIONS_CONTENT);
    await seedPage("contact", CONTACT_CONTENT);
}

async function main() {
    await seedFaculty();
    await seedGallery();
    await seedSiteContent();
    console.log("Done.");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
