// School structure for 2026-27, transcribed from SCHOOL TIME TABLE.pdf
// (Mahima Jyoti Awasika Vidyapitha, Hakimapada, Angul).
//
// Each subject below is the one teacher who takes all its periods in that
// section. Not imported: R.C (remedial periods, rotating teachers) and PLAY
// (no teacher). Classes IV and V aren't in the timetable but have results,
// so they exist here with no subject teachers.

export type SubjectCode =
    | "FLO" // First language, Odia
    | "SLE" // Second language, English
    | "TLS" // Third language, Sanskrit
    | "TLH" // Third language, Hindi
    | "MTH"
    | "GSC" // Science (IX–X: the combined mark from Baseline / IA sheets)
    | "SSC" // Social Science (IX–X: the combined mark from Baseline / IA sheets)
    | "SCP" // Physical Science (IX–X)
    | "SCL" // Life Science (IX–X)
    | "SSH" // History (IX–X)
    | "SSG" // Geography (IX–X)
    | "GK"
    | "COMPUTER"
    | "DRAWING"
    | "DEBATE";

export const SUBJECT_NAMES: Record<SubjectCode, string> = {
    FLO: "Odia",
    SLE: "English",
    TLS: "Sanskrit",
    TLH: "Hindi",
    MTH: "Mathematics",
    GSC: "Science",
    SSC: "Social Science",
    SCP: "Physical Science",
    SCL: "Life Science",
    SSH: "History",
    SSG: "Geography",
    GK: "General Knowledge",
    COMPUTER: "Computer",
    DRAWING: "Drawing",
    DEBATE: "Debate",
};

// Phone numbers are placeholders (Indian mobiles never start with 1), so
// nobody's real number is used. Replace each one on Staff & Teachers.
export const TEACHERS = [
    { key: "biswajit", name: "Biswajit Sir", phone: "+911000000101" },
    { key: "bubun", name: "Bubun Sir", phone: "+911000000102" },
    { key: "chinmaya", name: "Chinmaya Sir", phone: "+911000000103" },
    { key: "debaraj", name: "Debaraj Sir", phone: "+911000000104" },
    { key: "ganesh", name: "Ganesh Sir", phone: "+911000000105" },
    { key: "krishna", name: "Krishna Madam", phone: "+911000000106" },
    { key: "kumuda", name: "Kumuda Sir", phone: "+911000000107" },
    { key: "luckys", name: "Luckys Madam", phone: "+911000000108" },
    { key: "madusmita", name: "Madusmita Madam", phone: "+911000000109" },
    { key: "mamata", name: "Mamata Madam", phone: "+911000000110" },
    { key: "nibedita", name: "Nibedita Madam", phone: "+911000000111" },
    { key: "pinki", name: "Pinki Madam", phone: "+911000000112" },
    { key: "pradeep", name: "Pradeep Sir", phone: "+911000000113" },
    { key: "satya", name: "Satya Sir", phone: "+911000000114" },
    { key: "subhashree", name: "Subhashree Madam", phone: "+911000000115" },
    // Only takes R.C in X-A, so has no subjects here. A different teacher from Subhashree Madam.
    { key: "subhashreeS", name: "Subhashree S Madam", phone: "+911000000116" },
    { key: "suvendu", name: "Suvendu Sir", phone: "+911000000117" },
    { key: "tuna", name: "Tuna Sir", phone: "+911000000118" },
] as const;

export type TeacherKey = (typeof TEACHERS)[number]["key"];

// Grade groups as the result sheets name them.
export type GradeLabel = "IV" | "V" | "VI" | "VII" | "VIII" | "IX" | "X";

export const GRADES: Record<GradeLabel, number> = { IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 };

export interface SectionDef {
    grade: GradeLabel;
    section: string;
    name: string;
    // null = subject exists for marks but has no teacher.
    subjects: Partial<Record<SubjectCode, TeacherKey | null>>;
}

const CO_CURRICULAR: SectionDef["subjects"] = {
    COMPUTER: "satya",
    DRAWING: "ganesh",
    GK: "madusmita",
    DEBATE: "kumuda",
};

// IX–X: Science and Social Science are taught as separate papers, but only
// Summative Assessment marks are split. Baseline and Internal Assessment marks
// go to the combined subjects, which have no single teacher.
const COMBINED_IX_X: SectionDef["subjects"] = { GSC: null, SSC: null };

export const SECTIONS: SectionDef[] = [
    {
        grade: "IV", section: "A", name: "Class IV",
        subjects: { FLO: null, SLE: null, TLS: null, TLH: null, MTH: null, GSC: null, GK: null },
    },
    {
        grade: "V", section: "A", name: "Class V",
        subjects: { FLO: null, SLE: null, TLS: null, TLH: null, MTH: null, GSC: null, GK: null },
    },
    {
        grade: "VI", section: "A", name: "Class VI",
        subjects: {
            FLO: "madusmita", SLE: "pinki", TLS: "krishna", TLH: "krishna", MTH: "biswajit",
            GSC: "subhashree", SSC: "nibedita", ...CO_CURRICULAR,
        },
    },
    {
        grade: "VII", section: "A", name: "Class VII",
        subjects: {
            FLO: "nibedita", SLE: "pinki", TLS: "mamata", TLH: "krishna", MTH: "biswajit",
            GSC: "subhashree", SSC: "subhashree", ...CO_CURRICULAR,
        },
    },
    {
        grade: "VIII", section: "A", name: "Class VIII-A",
        subjects: {
            FLO: "nibedita", SLE: "pinki", TLS: "debaraj", MTH: "luckys",
            GSC: "luckys", SSC: "tuna", ...CO_CURRICULAR,
        },
    },
    {
        grade: "VIII", section: "B", name: "Class VIII-B",
        subjects: {
            FLO: "nibedita", SLE: "pinki", TLH: "krishna", MTH: "chinmaya",
            GSC: "luckys", SSC: "biswajit", ...CO_CURRICULAR,
        },
    },
    {
        grade: "IX", section: "A", name: "Class IX-A",
        subjects: {
            FLO: "biswajit", SLE: "ganesh", TLS: "debaraj", TLH: "krishna", MTH: "chinmaya",
            SCP: "luckys", SCL: "suvendu", SSH: "subhashree", SSG: "tuna", ...COMBINED_IX_X,
        },
    },
    {
        grade: "IX", section: "B", name: "Class IX-B",
        subjects: {
            FLO: "mamata", SLE: "ganesh", TLS: "debaraj", MTH: "chinmaya",
            SCP: "chinmaya", SCL: "suvendu", SSH: "subhashree", SSG: "tuna", ...COMBINED_IX_X,
        },
    },
    {
        grade: "IX", section: "C", name: "Class IX-C",
        subjects: {
            FLO: "mamata", SLE: "ganesh", TLH: "krishna", MTH: "pradeep",
            SCP: "luckys", SCL: "suvendu", SSH: "subhashree", SSG: "tuna", ...COMBINED_IX_X,
        },
    },
    {
        grade: "X", section: "A", name: "Class X-A",
        subjects: {
            FLO: "biswajit", SLE: "ganesh", TLS: "biswajit", MTH: "chinmaya",
            SCP: "subhashree", SCL: "pradeep", SSH: "subhashree", SSG: "tuna", ...COMBINED_IX_X,
        },
    },
    {
        grade: "X", section: "B", name: "Class X-B",
        subjects: {
            FLO: "biswajit", SLE: "ganesh", TLS: "biswajit", MTH: "pradeep",
            SCP: "subhashree", SCL: "pradeep", SSH: "subhashree", SSG: "tuna", ...COMBINED_IX_X,
        },
    },
];

export function sectionsOf(grade: GradeLabel): SectionDef[] {
    return SECTIONS.filter((s) => s.grade === grade);
}

export function findSection(grade: GradeLabel, section: string): SectionDef | undefined {
    return SECTIONS.find((s) => s.grade === grade && s.section === section);
}
