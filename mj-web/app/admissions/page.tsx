"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CreditCard, Phone, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { FadeIn, StaggerContainer, staggerItem } from "@/components/animations/FadeIn";
import { DynIcon } from "@/components/portal/DynIcon";
import { getSiteContent } from "@/lib/portal/content";
import type { AdmissionsContent } from "@/domain/portal/content-types";

// Gradient rotated per eligibility card for visual variety.
const ELIGIBILITY_ACCENTS = [
    "from-blue-500 to-blue-700",
    "from-gold-500 to-gold-700",
    "from-emerald-500 to-emerald-700",
    "from-purple-500 to-purple-700",
    "from-rose-500 to-rose-700",
];

export default function AdmissionsPage() {
    const [data, setData] = useState<AdmissionsContent | null>(null);

    useEffect(() => {
        getSiteContent("admissions")
            .then((d) => setData(d ?? { steps: [], eligibility: [], feeHighlights: [], updatedAt: 0 }))
            .catch(() => setData({ steps: [], eligibility: [], feeHighlights: [], updatedAt: 0 }));
    }, []);

    const steps = data?.steps ?? [];
    const eligibility = data?.eligibility ?? [];
    const feeHighlights = data?.feeHighlights ?? [];

    return (
        <>
            {/* Hero */}
            <section className="relative pt-32 pb-20 bg-navy-950 overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-1/3 right-1/3 w-80 h-80 bg-gold-500/8 rounded-full blur-[120px]" />
                </div>
                <div className="container-narrow mx-auto px-4 sm:px-6 relative">
                    <FadeIn>
                        <span className="inline-block px-4 py-1.5 rounded-full border border-gold-500/20 bg-gold-500/5 text-gold-400 text-xs font-semibold tracking-wider uppercase mb-6">
                            Admissions 2026-27
                        </span>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white leading-tight">
                            Your Future
                            <br />
                            <span className="text-gradient-gold">Starts Here</span>
                        </h1>
                        <p className="mt-6 text-lg text-ivory-400/70 max-w-2xl leading-relaxed">
                            Join our community of learners. We offer a transparent, simple admission process across all our programs.
                        </p>
                    </FadeIn>
                </div>
            </section>

            {/* Process Steps */}
            {steps.length > 0 && (
                <section className="section-padding bg-white">
                    <div className="container-narrow mx-auto">
                        <FadeIn>
                            <div className="text-center mb-16">
                                <span className="inline-block px-4 py-1.5 rounded-full bg-navy-50 text-navy-600 text-xs font-semibold tracking-wider uppercase mb-4">How to Apply</span>
                                <h2 className="text-3xl md:text-4xl font-heading font-bold text-navy-950">Admission Process</h2>
                            </div>
                        </FadeIn>
                        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {steps.map((s, i) => (
                                <motion.div key={i} variants={staggerItem} className="relative p-6 rounded-2xl bg-white border border-gray-100 card-hover text-center">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-gold-500/20">
                                        <span className="text-lg font-heading font-bold text-navy-950">{s.step}</span>
                                    </div>
                                    <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center mx-auto mb-4">
                                        <DynIcon name={s.icon} className="w-5 h-5 text-navy-500" />
                                    </div>
                                    <h3 className="text-base font-heading font-bold text-navy-950 mb-2">{s.title}</h3>
                                    <p className="text-sm text-muted">{s.desc}</p>
                                </motion.div>
                            ))}
                        </StaggerContainer>
                    </div>
                </section>
            )}

            {/* Eligibility */}
            {eligibility.length > 0 && (
                <section className="section-padding bg-ivory-50">
                    <div className="container-narrow mx-auto">
                        <FadeIn>
                            <div className="text-center mb-16">
                                <span className="inline-block px-4 py-1.5 rounded-full bg-gold-50 text-gold-700 text-xs font-semibold tracking-wider uppercase mb-4">Requirements</span>
                                <h2 className="text-3xl md:text-4xl font-heading font-bold text-navy-950">Eligibility Criteria</h2>
                            </div>
                        </FadeIn>
                        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {eligibility.map((e, i) => {
                                const accent = ELIGIBILITY_ACCENTS[i % ELIGIBILITY_ACCENTS.length];
                                return (
                                    <motion.div key={i} variants={staggerItem} className="p-8 rounded-2xl bg-white border border-gray-100 card-hover overflow-hidden relative">
                                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accent}`} />
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center mb-5 shadow-lg`}>
                                            <DynIcon name={e.icon} className="w-6 h-6 text-white" />
                                        </div>
                                        <h3 className="text-lg font-heading font-bold text-navy-950 mb-3">{e.program}</h3>
                                        <ul className="space-y-3">
                                            {e.requirements.map((c, j) => (
                                                <li key={j} className="flex items-start gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                                    <span className="text-sm text-muted">{c}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </motion.div>
                                );
                            })}
                        </StaggerContainer>
                    </div>
                </section>
            )}

            {/* Fee Structure */}
            {feeHighlights.length > 0 && (
                <section className="section-padding bg-white">
                    <div className="container-narrow mx-auto">
                        <FadeIn>
                            <div className="text-center mb-12">
                                <span className="inline-block px-4 py-1.5 rounded-full bg-navy-50 text-navy-600 text-xs font-semibold tracking-wider uppercase mb-4">Fee Structure</span>
                                <h2 className="text-3xl md:text-4xl font-heading font-bold text-navy-950">Affordable Quality Education</h2>
                                <p className="mt-3 text-muted max-w-xl mx-auto text-sm">
                                    We believe quality education should be accessible. Scholarships available for meritorious and economically weaker students.
                                </p>
                            </div>
                        </FadeIn>
                        <FadeIn delay={0.2}>
                            <div className="max-w-2xl mx-auto">
                                <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                                    <div className="bg-navy-950 px-6 py-4">
                                        <div className="grid grid-cols-2 text-sm font-semibold text-ivory-300">
                                            <span>Program</span>
                                            <span className="text-right">Annual Fee Range</span>
                                        </div>
                                    </div>
                                    {feeHighlights.map((fee, i) => (
                                        <div key={i} className={`px-6 py-4 grid grid-cols-2 items-center ${i % 2 === 0 ? "bg-white" : "bg-ivory-50"}`}>
                                            <span className="text-sm font-medium text-navy-800">
                                                <CreditCard className="w-4 h-4 inline mr-2 text-gold-500" />
                                                {fee.label}
                                            </span>
                                            <span className="text-sm text-muted text-right font-medium">{fee.range}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-muted text-center mt-4">
                                    * Fees are indicative and subject to revision. Contact the office for exact figures.
                                </p>
                            </div>
                        </FadeIn>
                    </div>
                </section>
            )}

            {/* CTA (static) */}
            <section className="py-20 bg-navy-950 relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gold-500/5 rounded-full blur-[120px]" />
                </div>
                <div className="container-narrow mx-auto px-4 sm:px-6 relative">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <FadeIn>
                            <div>
                                <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-3">Have Questions?</h2>
                                <p className="text-ivory-400/70">Our admissions team is here to help you through every step.</p>
                            </div>
                        </FadeIn>
                        <FadeIn delay={0.2}>
                            <div className="flex flex-wrap gap-4">
                                <a href="/contact" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-semibold hover:from-gold-400 hover:to-gold-500 transition-all shadow-xl shadow-gold-500/25 hover:-translate-y-0.5">
                                    Contact Us
                                    <ArrowRight className="w-4 h-4" />
                                </a>
                                <a href="tel:+919876543210" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/15 text-ivory-300 font-medium hover:bg-white/5 transition-all">
                                    <Phone className="w-4 h-4" />
                                    Call Now
                                </a>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>
        </>
    );
}
