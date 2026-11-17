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

// Photo fields hold a Firebase Storage download URL, or null for none. Sizes for
// each photo slot are in lib/portal/imageSpecs.ts (and HOW_TO_UPDATE.md).

export interface AcademicPathway {
    icon: string;
    title: string;
    subtitle: string;      // e.g. "Class 1 – 10 · BSE Board"
    description: string;
    gradient: string;      // a COLOR_PRESETS gradient (lib/portal/colorPresets.ts)
    glow: string;          // the same preset's glow
    href: string;          // link target, e.g. "/academics#primary"
    photoUrl?: string | null;
}
export interface Highlight { icon: string; text: string; }
export interface Notice {
    date: string;
    title: string;
    tag: string;
    // Optional: a page or PDF the notice opens.
    link?: string;
}
export interface Testimonial { name: string; role: string; quote: string; photoUrl?: string | null; }

// Each section below is optional; a section with nothing filled in is hidden.
export interface HomeHero {
    badge: string;          // e.g. "Admissions Open 2026-27"
    titleLine1: string;
    titleLine2: string;     // shown highlighted in gold
    intro: string;
    photoUrl: string | null;
}
export interface Stat { value: number; suffix: string; label: string; }
export interface WhyChooseUs {
    titleLine1: string;
    titleLine2: string;     // highlighted
    text: string;
    points: string[];
    photoUrl: string | null;
    // Small card over the photo, e.g. "100%" / "Board results". Hidden when empty.
    badgeValue: string;
    badgeLabel: string;
}
export interface HomeCta { title: string; text: string; }

export interface HomeContent {
    hero?: HomeHero;
    stats?: Stat[];
    whyChooseUs?: WhyChooseUs;
    cta?: HomeCta;
    academicPathways: AcademicPathway[];
    highlights: Highlight[];
    notices: Notice[];
    testimonials: Testimonial[];
    updatedAt: number;
}

export interface TimelineEntry { year: string; title: string; desc: string; }
export interface ValueEntry { icon: string; title: string; desc: string; }
export interface InfrastructureEntry { icon: string; title: string; desc: string; photoUrl?: string | null; }

export interface PrincipalMessage {
    name: string;
    title: string;          // e.g. "Principal"
    message: string;
    photoUrl: string | null;
}

export interface AboutContent {
    // The line under the page heading.
    intro?: string;
    // Shown in the Vision / Mission cards; each is hidden when empty.
    vision?: string;
    mission?: string;
    // Hidden until a name and message are filled in.
    principal?: PrincipalMessage;
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
    // A COLOR_PRESETS scheme (lib/portal/colorPresets.ts): gradient, bg, text.
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

export type ContactKind = "address" | "phone" | "whatsapp" | "email" | "hours";
export interface ContactBlock {
    icon: string;
    title: string;
    lines: string[];
    // What the lines are, so the site can make them tappable (call / WhatsApp / email).
    kind?: ContactKind;
}
export interface SocialLink { icon: string; label: string; href: string; }

// What the admin fills in on the Contact page; contactInfo and socialLinks
// (which the website shows) are built from these when saving.
export interface ContactDetails {
    address: string;                // one line per row
    phones: string[];
    whatsapp: string;
    emails: string[];
    officeHours: string;            // one line per row
}
export interface SocialProfiles {
    facebook: string;
    instagram: string;
    youtube: string;
    twitter: string;
    linkedin: string;
}

export interface ContactContent {
    details?: ContactDetails;
    social?: SocialProfiles;
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
