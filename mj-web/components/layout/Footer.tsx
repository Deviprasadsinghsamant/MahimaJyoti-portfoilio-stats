"use client";

// Site footer. Contact details and social links come from Admin → Contact page,
// the Programs column from Admin → Academics page; a column with nothing to show
// is left out rather than showing placeholders.
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { DynIcon } from "@/components/portal/DynIcon";
import { contactHref } from "@/lib/portal/contactLinks";
import { getSiteContent } from "@/lib/portal/content";
import type { AcademicsContent, ContactContent } from "@/domain/portal/content-types";

const quickLinks = [
    { label: "About Us", href: "/about" },
    { label: "Academics", href: "/academics" },
    { label: "Faculty", href: "/faculty" },
    { label: "Admissions", href: "/admissions" },
    { label: "Gallery", href: "/gallery" },
    { label: "Contact", href: "/contact" },
];

export function Footer() {
    const [contact, setContact] = useState<ContactContent | null>(null);
    const [academics, setAcademics] = useState<AcademicsContent | null>(null);

    useEffect(() => {
        getSiteContent("contact").then(setContact).catch(() => setContact(null));
        getSiteContent("academics").then(setAcademics).catch(() => setAcademics(null));
    }, []);

    const socialLinks = (contact?.socialLinks ?? []).filter((s) => s.href);
    const contactInfo = (contact?.contactInfo ?? []).filter((b) => b.lines.some(Boolean));
    const programLinks = (academics?.programs ?? [])
        .filter((p) => p.title)
        .map((p) => ({ label: p.title, href: p.id ? `/academics#${p.id}` : "/academics" }));

    return (
        <footer className="bg-navy-950 text-ivory-300">
            {/* Gold line */}
            <div className="h-1 bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600" />

            <div className="container-narrow mx-auto px-4 sm:px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
                    {/* Brand Column */}
                    <div className="lg:col-span-1">
                        <Link href="/" className="flex items-center gap-3 mb-5">
                            <Image
                                src="/logo.png"
                                alt="Mahima Jyoti Awasika Vidyapitha logo"
                                width={44}
                                height={44}
                                unoptimized
                                className="w-11 h-11 rounded-full bg-white"
                            />
                            <div className="flex flex-col">
                                <span className="text-lg font-heading font-bold text-white leading-tight">
                                    MahimaJyoti
                                </span>
                                <span className="text-[10px] text-gold-400/80 tracking-widest uppercase font-medium">
                                    Excellence in Education
                                </span>
                            </div>
                        </Link>
                        <p className="text-sm text-ivory-400/70 leading-relaxed mb-6">
                            Mahima Jyoti Awasika Vidyapitha — a residential school in Angul, Odisha.
                        </p>
                        {socialLinks.length > 0 && (
                            <div className="flex gap-3">
                                {socialLinks.map((social) => (
                                    <a
                                        key={social.href}
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={social.label || social.icon}
                                        className="w-10 h-10 rounded-lg bg-white/5 hover:bg-gold-500/20 flex items-center justify-center text-ivory-400 hover:text-gold-400 transition-all"
                                    >
                                        <DynIcon name={social.icon} className="w-4 h-4" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-5">
                            Quick Links
                        </h3>
                        <ul className="space-y-3">
                            {quickLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-ivory-400/70 hover:text-gold-400 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Programs */}
                    {programLinks.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-5">
                                Programs
                            </h3>
                            <ul className="space-y-3">
                                {programLinks.map((link) => (
                                    <li key={link.href + link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-ivory-400/70 hover:text-gold-400 transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Contact */}
                    <div>
                        <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-5">
                            Contact Us
                        </h3>
                        <ul className="space-y-4">
                            {contactInfo.length === 0 ? (
                                <li className="flex items-start gap-3">
                                    <MapPin className="w-4 h-4 text-gold-400 mt-1 shrink-0" />
                                    <span className="text-sm text-ivory-400/70">
                                        Hakimapada, Angul,
                                        <br />
                                        Odisha, India
                                    </span>
                                </li>
                            ) : (
                                contactInfo.map((block, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <DynIcon name={block.icon} className="w-4 h-4 text-gold-400 mt-1 shrink-0" />
                                        <span className="text-sm text-ivory-400/70">
                                            {block.lines.filter(Boolean).map((line, j) => {
                                                const href = contactHref(block.kind, line);
                                                return href ? (
                                                    <a
                                                        key={j}
                                                        href={href}
                                                        className="block hover:text-gold-400 transition-colors"
                                                        {...(block.kind === "whatsapp" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                                                    >
                                                        {block.kind === "whatsapp" ? `WhatsApp: ${line}` : line}
                                                    </a>
                                                ) : (
                                                    <span key={j} className="block">
                                                        {line}
                                                    </span>
                                                );
                                            })}
                                        </span>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-white/5">
                <div className="container-narrow mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-ivory-500/50">
                        © {new Date().getFullYear()} Mahima Jyoti Awasika Vidyapitha. All rights reserved.
                    </p>
                    <div className="flex gap-5 text-xs text-ivory-500/50">
                        <Link href="/privacy" className="hover:text-gold-400 transition-colors">
                            Privacy Policy
                        </Link>
                        <Link href="/portal/login" className="hover:text-gold-400 transition-colors">
                            Staff login
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
