"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, GraduationCap } from "lucide-react";
import { clsx } from "clsx";

const navLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Academics", href: "/academics" },
    { label: "Faculty", href: "/faculty" },
    { label: "Admissions", href: "/admissions" },
    { label: "Gallery", href: "/gallery" },
    { label: "Contact", href: "/contact" },
];

export function Header() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header
            className={clsx(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
                scrolled
                    ? "bg-navy-950/95 backdrop-blur-xl shadow-lg shadow-navy-950/20"
                    : "bg-transparent"
            )}
        >
            {/* Top accent bar */}
            <div className="h-1 bg-gradient-to-r from-gold-500 via-gold-300 to-gold-500" />

            <div className="container-narrow mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-18 md:h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/25 group-hover:shadow-gold-500/40 transition-shadow">
                            <GraduationCap className="w-6 h-6 md:w-7 md:h-7 text-navy-950" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg md:text-xl font-heading font-bold text-white leading-tight tracking-tight">
                                MahimaJyoti
                            </span>
                            <span className="text-[10px] md:text-xs text-gold-400/80 tracking-widest uppercase font-medium">
                                Excellence in Education
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden lg:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="relative px-4 py-2 text-sm font-medium text-ivory-300 hover:text-gold-400 transition-colors link-underline"
                            >
                                {link.label}
                            </Link>
                        ))}
                        <Link
                            href="/admissions"
                            className="ml-4 px-5 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 hover:from-gold-400 hover:to-gold-500 transition-all shadow-lg shadow-gold-500/25 hover:shadow-gold-500/40 hover:-translate-y-0.5"
                        >
                            Apply Now
                        </Link>
                    </nav>

                    {/* Mobile toggle */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="lg:hidden p-2 rounded-lg text-ivory-300 hover:bg-white/10 transition-colors"
                        aria-label="Toggle navigation"
                    >
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Nav */}
            <div
                className={clsx(
                    "lg:hidden overflow-hidden transition-all duration-500 ease-in-out",
                    isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                )}
            >
                <nav className="bg-navy-950/98 backdrop-blur-xl border-t border-white/5 px-6 py-4 space-y-1">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsOpen(false)}
                            className="block px-4 py-3 text-base font-medium text-ivory-300 hover:text-gold-400 hover:bg-white/5 rounded-lg transition-colors"
                        >
                            {link.label}
                        </Link>
                    ))}
                    <div className="pt-3">
                        <Link
                            href="/admissions"
                            onClick={() => setIsOpen(false)}
                            className="block text-center px-5 py-3 text-sm font-semibold rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 hover:from-gold-400 hover:to-gold-500 transition-all"
                        >
                            Apply Now
                        </Link>
                    </div>
                </nav>
            </div>
        </header>
    );
}
