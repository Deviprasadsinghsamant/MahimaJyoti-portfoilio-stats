"use client";

import { useEffect, useState } from "react";
import { Mail, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { FadeIn, StaggerContainer, staggerItem } from "@/components/animations/FadeIn";
import { listFacultyPublic } from "@/lib/portal/content";
import type { FacultyMember } from "@/domain/portal/content-types";

export default function FacultyPage() {
    const [members, setMembers] = useState<FacultyMember[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        listFacultyPublic()
            .then(setMembers)
            .catch((err) => setError(err instanceof Error ? err.message : "Failed to load faculty"));
    }, []);

    return (
        <>
            {/* Hero */}
            <section className="relative pt-32 pb-20 bg-navy-950 overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-gold-500/8 rounded-full blur-[120px]" />
                </div>
                <div className="container-narrow mx-auto px-4 sm:px-6 relative">
                    <FadeIn>
                        <span className="inline-block px-4 py-1.5 rounded-full border border-gold-500/20 bg-gold-500/5 text-gold-400 text-xs font-semibold tracking-wider uppercase mb-6">
                            Our Team
                        </span>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white leading-tight">
                            Meet Our
                            <br />
                            <span className="text-gradient-gold">Distinguished Faculty</span>
                        </h1>
                        <p className="mt-6 text-lg text-ivory-400/70 max-w-2xl leading-relaxed">
                            Our dedicated educators bring decades of experience, deep subject
                            expertise, and a passion for nurturing the next generation.
                        </p>
                    </FadeIn>
                </div>
            </section>

            {/* Faculty Grid */}
            <section className="section-padding bg-white">
                <div className="container-narrow mx-auto">
                    {error ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            Could not load faculty. Please refresh.
                        </div>
                    ) : members === null ? (
                        <FacultyGridSkeleton />
                    ) : members.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center text-muted">
                            Faculty profiles will appear here soon.
                        </div>
                    ) : (
                        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {members.map((member) => (
                                <motion.div
                                    key={member.id}
                                    variants={staggerItem}
                                    className="group relative rounded-2xl bg-white border border-gray-100 card-hover overflow-hidden"
                                >
                                    {/* Photo or gradient */}
                                    <div className={`relative aspect-[4/3] w-full ${member.photoUrl ? "" : "bg-gradient-to-br"} ${member.photoUrl ? "" : member.accent}`}>
                                        {member.photoUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={member.photoUrl}
                                                alt={member.name}
                                                className="h-full w-full object-cover"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center">
                                                <span className="text-5xl font-heading font-bold text-white">
                                                    {member.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                                                </span>
                                            </div>
                                        )}
                                        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${member.accent}`} />
                                    </div>

                                    <div className="p-6">
                                        <h3 className="text-base font-heading font-bold text-navy-950">
                                            {member.name}
                                        </h3>
                                        <p className="mt-1 text-xs text-gold-600 font-medium">
                                            {member.role}
                                        </p>

                                        <div className="mt-4 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="w-3.5 h-3.5 text-muted shrink-0" />
                                                <span className="text-xs text-muted">{member.subject}</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Mail className="w-3.5 h-3.5 text-muted shrink-0 mt-0.5" />
                                                <span className="text-xs text-muted">
                                                    {member.qualification}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-4 inline-flex items-center px-3 py-1.5 rounded-lg bg-navy-50">
                                            <span className="text-xs font-semibold text-navy-700">
                                                {member.experience} experience
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </StaggerContainer>
                    )}
                </div>
            </section>

            {/* Join CTA */}
            <section className="py-20 bg-ivory-50">
                <div className="container-narrow mx-auto px-4 sm:px-6 text-center">
                    <FadeIn>
                        <h2 className="text-3xl md:text-4xl font-heading font-bold text-navy-950 mb-4">
                            Join Our Team
                        </h2>
                        <p className="text-muted max-w-xl mx-auto mb-8">
                            We&apos;re always looking for passionate educators. If you share our
                            vision for excellence, we&apos;d love to hear from you.
                        </p>
                        <a
                            href="/contact"
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-semibold hover:from-gold-400 hover:to-gold-500 transition-all shadow-xl shadow-gold-500/25 hover:-translate-y-0.5"
                        >
                            Get in Touch
                        </a>
                    </FadeIn>
                </div>
            </section>
        </>
    );
}

function FacultyGridSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                    <div className="aspect-[4/3] w-full animate-pulse bg-gray-100" />
                    <div className="p-6 space-y-3">
                        <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
                        <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                    </div>
                </div>
            ))}
        </div>
    );
}
