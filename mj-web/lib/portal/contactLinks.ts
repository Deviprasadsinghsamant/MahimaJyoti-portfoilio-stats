// Contact details → what the website shows, and the links that make them tappable.

import type { ContactBlock, ContactDetails, SocialLink, SocialProfiles } from "@/domain/portal/content-types";

const lines = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean);

/** The Contact page's cards (also used by the footer and the privacy policy). */
export function contactBlocks(d: ContactDetails): ContactBlock[] {
    const blocks: ContactBlock[] = [];
    if (lines(d.address).length) blocks.push({ kind: "address", icon: "MapPin", title: "Visit Us", lines: lines(d.address) });
    const phones = d.phones.map((p) => p.trim()).filter(Boolean);
    if (phones.length) blocks.push({ kind: "phone", icon: "Phone", title: "Call Us", lines: phones });
    if (d.whatsapp.trim()) blocks.push({ kind: "whatsapp", icon: "MessageCircle", title: "WhatsApp", lines: [d.whatsapp.trim()] });
    const emails = d.emails.map((e) => e.trim()).filter(Boolean);
    if (emails.length) blocks.push({ kind: "email", icon: "Mail", title: "Email Us", lines: emails });
    if (lines(d.officeHours).length) blocks.push({ kind: "hours", icon: "Clock", title: "Office Hours", lines: lines(d.officeHours) });
    return blocks;
}

const SOCIAL: { key: keyof SocialProfiles; icon: string; label: string }[] = [
    { key: "facebook", icon: "Facebook", label: "Facebook" },
    { key: "instagram", icon: "Instagram", label: "Instagram" },
    { key: "youtube", icon: "Youtube", label: "YouTube" },
    { key: "twitter", icon: "Twitter", label: "X (Twitter)" },
    { key: "linkedin", icon: "Linkedin", label: "LinkedIn" },
];

export function socialLinksFrom(s: SocialProfiles): SocialLink[] {
    return SOCIAL.filter(({ key }) => s[key].trim()).map(({ key, icon, label }) => ({ icon, label, href: s[key].trim() }));
}

/** Digits for a phone link; a 10-digit Indian number gets the 91 country code. */
function phoneDigits(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
    return digits.length === 10 ? `91${digits}` : digits;
}

/** Where tapping a contact line goes, if anywhere. */
export function contactHref(kind: ContactBlock["kind"], line: string): string | null {
    if (kind === "phone") return phoneDigits(line).length >= 10 ? `tel:+${phoneDigits(line)}` : null;
    if (kind === "whatsapp") return phoneDigits(line).length >= 10 ? `https://wa.me/${phoneDigits(line)}` : null;
    if (kind === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(line.trim()) ? `mailto:${line.trim()}` : null;
    return null;
}

export function looksLikePhone(raw: string): boolean {
    const digits = raw.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 13;
}

export function looksLikeEmail(raw: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim());
}
