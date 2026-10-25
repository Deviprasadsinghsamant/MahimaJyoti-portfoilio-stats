// Portfolio content models — editable via the admin panel, rendered on the
// public portfolio pages.

// ─── Faculty (its own collection) ───────────────────

export interface FacultyMember {
    id: string;
    name: string;
    role: string;
    subject: string;
    qualification: string;
    experience: string;
    photoUrl: string | null;
    accent: string;
    order: number;
    isActive: boolean;
    createdAt: number;
    updatedAt: number;
}

// ─── Gallery (its own collection) ───────────────────

export type GalleryCategory = "campus" | "events" | "academics" | "sports" | "achievements" | "cultural";

export interface GalleryItem {
    id: string;
    title: string;
    description: string;
    category: GalleryCategory;
    photoUrl: string | null;
    accent: string;                 // gradient used when no photo
    order: number;
    isActive: boolean;
    createdAt: number;
    updatedAt: number;
}

// ─── Site content (one Firestore doc per page in `siteContent`) ───

export interface AcademicPathway {
    icon: string;
    title: string;
    subtitle: string;      // e.g. "Class 1 – 10 · BSE Board"
    description: string;
    gradient: string;      // Tailwind "from-… to-…"
    glow: string;          // Tailwind shadow color, e.g. "shadow-blue-500/20"
    href: string;          // link target, e.g. "/academics#primary"
}
export interface Highlight { icon: string; text: string; }
export interface Notice { date: string; title: string; tag: string; }
export interface Testimonial { name: string; role: string; quote: string; }

export interface HomeContent {
    academicPathways: AcademicPathway[];
    highlights: Highlight[];
    notices: Notice[];
    testimonials: Testimonial[];
    updatedAt: number;
}

export interface TimelineEntry { year: string; title: string; desc: string; }
export interface ValueEntry { icon: string; title: string; desc: string; }
export interface InfrastructureEntry { icon: string; title: string; desc: string; }

export interface AboutContent {
    timeline: TimelineEntry[];
    values: ValueEntry[];
    infrastructure: InfrastructureEntry[];
    updatedAt: number;
}

export interface AcademicSubject { icon: string; name: string; }
export interface AcademicProgram {
    id: string;                     // stable slug ("primary", "intermediate", "graduation")
    icon: string;
    title: string;
    board: string;
    level: string;
    color: string;
    bgColor: string;
    textColor: string;
    description: string;
    features: string[];
    subjects: AcademicSubject[];
}

export interface AcademicsContent {
    programs: AcademicProgram[];
    updatedAt: number;
}

export interface AdmissionStep { step: number; icon: string; title: string; desc: string; }
export interface EligibilityItem { icon: string; program: string; requirements: string[]; }
export interface FeeItem { label: string; range: string; }

export interface AdmissionsContent {
    steps: AdmissionStep[];
    eligibility: EligibilityItem[];
    feeHighlights: FeeItem[];
    updatedAt: number;
}

export interface ContactBlock { icon: string; title: string; lines: string[]; }
export interface SocialLink { icon: string; label: string; href: string; }

export interface ContactContent {
    contactInfo: ContactBlock[];
    socialLinks: SocialLink[];
    mapEmbedUrl: string;            // Google Maps embed src
    updatedAt: number;
}

// Map of pageId → content type. Used only for compile-time hints.
export type SiteContentByPage = {
    home: HomeContent;
    about: AboutContent;
    academics: AcademicsContent;
    admissions: AdmissionsContent;
    contact: ContactContent;
};
export type SiteContentPageId = keyof SiteContentByPage;
