import Link from "next/link";
import {
    GraduationCap,
    MapPin,
    Phone,
    Mail,
    Facebook,
    Twitter,
    Instagram,
    Youtube,
} from "lucide-react";

const quickLinks = [
    { label: "About Us", href: "/about" },
    { label: "Academics", href: "/academics" },
    { label: "Faculty", href: "/faculty" },
    { label: "Admissions", href: "/admissions" },
    { label: "Gallery", href: "/gallery" },
    { label: "Contact", href: "/contact" },
];

const programLinks = [
    { label: "Primary (BSE)", href: "/academics#primary" },
    { label: "Intermediate (CHSE)", href: "/academics#intermediate" },
    { label: "Graduation (Utkal)", href: "/academics#graduation" },
];

const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Youtube, href: "#", label: "Youtube" },
];

export function Footer() {
    return (
        <footer className="bg-navy-950 text-ivory-300">
            {/* Gold line */}
            <div className="h-1 bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600" />

            <div className="container-narrow mx-auto px-4 sm:px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
                    {/* Brand Column */}
                    <div className="lg:col-span-1">
                        <Link href="/" className="flex items-center gap-3 mb-5">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                                <GraduationCap className="w-6 h-6 text-navy-950" />
                            </div>
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
                            Nurturing minds and shaping futures through holistic education.
                            Affiliated with BSE, CHSE, and Utkal University.
                        </p>
                        <div className="flex gap-3">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    aria-label={social.label}
                                    className="w-10 h-10 rounded-lg bg-white/5 hover:bg-gold-500/20 flex items-center justify-center text-ivory-400 hover:text-gold-400 transition-all"
                                >
                                    <social.icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
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
                    <div>
                        <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-5">
                            Programs
                        </h3>
                        <ul className="space-y-3">
                            {programLinks.map((link) => (
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

                    {/* Contact */}
                    <div>
                        <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-5">
                            Contact Us
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 text-gold-400 mt-1 shrink-0" />
                                <span className="text-sm text-ivory-400/70">
                                    Mahanadi Vihar, Cuttack,
                                    <br />
                                    Odisha, India — 753004
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-gold-400 shrink-0" />
                                <a
                                    href="tel:+919876543210"
                                    className="text-sm text-ivory-400/70 hover:text-gold-400 transition-colors"
                                >
                                    +91 98765 43210
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-gold-400 shrink-0" />
                                <a
                                    href="mailto:info@mahanadijagruti.edu.in"
                                    className="text-sm text-ivory-400/70 hover:text-gold-400 transition-colors"
                                >
                                    info@mahanadijagruti.edu.in
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-white/5">
                <div className="container-narrow mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-ivory-500/50">
                        © {new Date().getFullYear()} MahimaJyoti. All rights reserved.
                    </p>
                    <div className="flex gap-5 text-xs text-ivory-500/50">
                        <Link href="#" className="hover:text-gold-400 transition-colors">
                            Privacy Policy
                        </Link>
                        <Link href="#" className="hover:text-gold-400 transition-colors">
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
