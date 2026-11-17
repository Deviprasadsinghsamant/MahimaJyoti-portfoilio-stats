"use client";

import { useEffect, useState } from "react";
import { BookMarked } from "lucide-react";
import { motion } from "framer-motion";
import { FadeIn, StaggerContainer, staggerItem } from "@/components/animations/FadeIn";
import { DynIcon } from "@/components/portal/DynIcon";
import { getSiteContent } from "@/lib/portal/content";
import type { AcademicsContent } from "@/domain/portal/content-types";

export default function AcademicsPage() {
    const [data, setData] = useState<AcademicsContent | null>(null);

    useEffect(() => {
        getSiteContent("academics")
            .then((d) => setData(d ?? { programs: [], updatedAt: 0 }))
            .catch(() => setData({ programs: [], updatedAt: 0 }));
    }, []);

    const programs = data?.programs ?? [];

    return (
        <>
            {/* Hero */}
            <section className="relative pt-32 pb-20 bg-navy-950 overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gold-500/8 rounded-full blur-[128px]" />
                    <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px]" />
                </div>
                <div className="container-narrow mx-auto px-4 sm:px-6 relative">
                    <FadeIn>
                        <span className="inline-block px-4 py-1.5 rounded-full border border-gold-500/20 bg-gold-500/5 text-gold-400 text-xs font-semibold tracking-wider uppercase mb-6">
                            Academics
                        </span>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white leading-tight">
                            Every Stage,
                            <br />
                            <span className="text-gradient-gold">One Vision</span>
                        </h1>
                        <p className="mt-6 text-lg text-ivory-400/70 max-w-2xl leading-relaxed">
                            Explore what we teach at each stage of a child&apos;s schooling, and the subjects every class studies.
                        </p>
                    </FadeIn>
                </div>
            </section>

            {/* Programs */}
            {programs.length === 0 ? (
                <section className="section-padding bg-white">
                    <div className="container-narrow mx-auto text-center text-muted">
                        Academic programs will appear here soon.
                    </div>
                </section>
            ) : (
                programs.map((program, idx) => (
                    <section
                        key={program.id || idx}
                        id={program.id}
                        className={`section-padding ${idx % 2 === 0 ? "bg-white" : "bg-ivory-50"}`}
                    >
                        <div className="container-narrow mx-auto">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                                <FadeIn direction={idx % 2 === 0 ? "left" : "right"}>
                                    <div>
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${program.color} flex items-center justify-center shadow-lg`}>
                                                <DynIcon name={program.icon} className="w-7 h-7 text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl md:text-3xl font-heading font-bold text-navy-950">{program.title}</h2>
                                                <p className="text-sm text-muted">{program.level}</p>
                                            </div>
                                        </div>

                                        {program.board && (
                                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${program.bgColor} mb-6`}>
                                                <BookMarked className={`w-4 h-4 ${program.textColor}`} />
                                                <span className={`text-xs font-semibold ${program.textColor}`}>{program.board}</span>
                                            </div>
                                        )}

                                        <p className="text-muted leading-relaxed mb-8">{program.description}</p>

                                        {program.features.length > 0 && (
                                            <>
                                                <h3 className="text-sm font-semibold text-navy-950 tracking-wider uppercase mb-4">Key Features</h3>
                                                <div className="space-y-3">
                                                    {program.features.map((feature, i) => (
                                                        <div key={i} className="flex items-start gap-3">
                                                            <div className="mt-1.5 w-2 h-2 rounded-full bg-gold-500 shrink-0" />
                                                            <span className="text-sm text-navy-800">{feature}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </FadeIn>

                                {program.subjects.length > 0 && (
                                    <FadeIn direction={idx % 2 === 0 ? "right" : "left"} delay={0.2}>
                                        <div>
                                            <h3 className="text-sm font-semibold text-navy-950 tracking-wider uppercase mb-6">Subjects Offered</h3>
                                            <StaggerContainer className="grid grid-cols-2 gap-3">
                                                {program.subjects.map((subject, i) => (
                                                    <motion.div key={i} variants={staggerItem} className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 hover:border-gold-200 hover:shadow-md transition-all">
                                                        <div className="w-9 h-9 rounded-lg bg-navy-50 flex items-center justify-center shrink-0">
                                                            <DynIcon name={subject.icon} className="w-4 h-4 text-navy-500" />
                                                        </div>
                                                        <span className="text-sm font-medium text-navy-800">{subject.name}</span>
                                                    </motion.div>
                                                ))}
                                            </StaggerContainer>
                                        </div>
                                    </FadeIn>
                                )}
                            </div>
                        </div>
                    </section>
                ))
            )}

            {/* CTA (static) */}
            <section className="py-20 bg-navy-950 relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gold-500/5 rounded-full blur-[120px]" />
                </div>
                <div className="container-narrow mx-auto px-4 sm:px-6 relative text-center">
                    <FadeIn>
                        <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">Ready to Start Your Academic Journey?</h2>
                        <p className="text-ivory-400/70 max-w-xl mx-auto mb-8">Explore our admission process and secure your spot for the upcoming session.</p>
                        <a href="/admissions" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-semibold hover:from-gold-400 hover:to-gold-500 transition-all shadow-xl shadow-gold-500/25 hover:-translate-y-0.5">
                            View Admissions
                        </a>
                    </FadeIn>
                </div>
            </section>
        </>
    );
}
