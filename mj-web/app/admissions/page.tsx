"use client";

import {
    FileText,
    ClipboardCheck,
    CreditCard,
    Calendar,
    CheckCircle2,
    ArrowRight,
    BookOpen,
    GraduationCap,
    Trophy,
    Phone,
} from "lucide-react";
import { FadeIn, StaggerContainer, staggerItem } from "@/components/animations/FadeIn";
import { motion } from "framer-motion";

const steps = [
    {
        step: 1,
        icon: FileText,
        title: "Obtain Prospectus",
        desc: "Collect the prospectus and application form from the school office or download from the website.",
    },
    {
        step: 2,
        icon: ClipboardCheck,
        title: "Submit Application",
        desc: "Complete the application form with necessary documents and submit to the admissions office.",
    },
    {
        step: 3,
        icon: Calendar,
        title: "Entrance Assessment",
        desc: "Attend the entrance assessment on the scheduled date. Previous academic records are also reviewed.",
    },
    {
        step: 4,
        icon: CheckCircle2,
        title: "Admission Confirmation",
        desc: "Receive your admission offer, complete the registration, and pay the fees to confirm your seat.",
    },
];

const eligibility = [
    {
        icon: BookOpen,
        program: "Primary (Class 1–10)",
        board: "BSE",
        color: "from-blue-500 to-blue-700",
        criteria: [
            "Age-appropriate entry as per BSE norms",
            "Transfer certificate from previous school",
            "Birth certificate & Aadhaar card",
            "Previous year mark sheet (Class 2 onwards)",
            "2 passport-size photographs",
        ],
    },
    {
        icon: GraduationCap,
        program: "Intermediate (+2)",
        board: "CHSE",
        color: "from-gold-500 to-gold-700",
        criteria: [
            "Passed Class 10 (BSE or equivalent board)",
            "Minimum 50% aggregate or equivalent",
            "Board-issued mark sheet & certificate",
            "Migration / TC from previous institution",
            "Stream selection: Science or Arts",
        ],
    },
    {
        icon: Trophy,
        program: "Graduation (B.A./B.Sc./B.Com)",
        board: "Utkal University",
        color: "from-emerald-500 to-emerald-700",
        criteria: [
            "Passed +2 (CHSE or equivalent board)",
            "Minimum eligibility as per Utkal University",
            "+2 mark sheet & board certificate",
            "Migration / TC from previous institution",
            "University e-admission registration (if applicable)",
        ],
    },
];

const feeHighlights = [
    { label: "Primary (1–5)", range: "₹12,000 – ₹18,000 / year" },
    { label: "Secondary (6–10)", range: "₹18,000 – ₹25,000 / year" },
    { label: "Intermediate (+2)", range: "₹22,000 – ₹30,000 / year" },
    { label: "Graduation", range: "As per Utkal University norms" },
];

export default function AdmissionsPage() {
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
                            Join our community of learners. We offer a transparent, simple
                            admission process across all our programs.
                        </p>
                    </FadeIn>
                </div>
            </section>

            {/* Process Steps */}
            <section className="section-padding bg-white">
                <div className="container-narrow mx-auto">
                    <FadeIn>
                        <div className="text-center mb-16">
                            <span className="inline-block px-4 py-1.5 rounded-full bg-navy-50 text-navy-600 text-xs font-semibold tracking-wider uppercase mb-4">
                                How to Apply
                            </span>
                            <h2 className="text-3xl md:text-4xl font-heading font-bold text-navy-950">
                                Admission Process
                            </h2>
                        </div>
                    </FadeIn>

                    <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {steps.map((s) => (
                            <motion.div
                                key={s.step}
                                variants={staggerItem}
                                className="relative p-6 rounded-2xl bg-white border border-gray-100 card-hover text-center"
                            >
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-gold-500/20">
                                    <span className="text-lg font-heading font-bold text-navy-950">
                                        {s.step}
                                    </span>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center mx-auto mb-4">
                                    <s.icon className="w-5 h-5 text-navy-500" />
                                </div>
                                <h3 className="text-base font-heading font-bold text-navy-950 mb-2">
                                    {s.title}
                                </h3>
                                <p className="text-sm text-muted">{s.desc}</p>
                            </motion.div>
                        ))}
                    </StaggerContainer>
                </div>
            </section>

            {/* Eligibility */}
            <section className="section-padding bg-ivory-50">
                <div className="container-narrow mx-auto">
                    <FadeIn>
                        <div className="text-center mb-16">
                            <span className="inline-block px-4 py-1.5 rounded-full bg-gold-50 text-gold-700 text-xs font-semibold tracking-wider uppercase mb-4">
                                Requirements
                            </span>
                            <h2 className="text-3xl md:text-4xl font-heading font-bold text-navy-950">
                                Eligibility Criteria
                            </h2>
                        </div>
                    </FadeIn>

                    <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {eligibility.map((e) => (
                            <motion.div
                                key={e.program}
                                variants={staggerItem}
                                className="p-8 rounded-2xl bg-white border border-gray-100 card-hover overflow-hidden relative"
                            >
                                <div
                                    className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${e.color}`}
                                />
                                <div
                                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${e.color} flex items-center justify-center mb-5 shadow-lg`}
                                >
                                    <e.icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-lg font-heading font-bold text-navy-950 mb-1">
                                    {e.program}
                                </h3>
                                <p className="text-xs text-gold-600 font-semibold mb-5">
                                    {e.board} Board
                                </p>
                                <ul className="space-y-3">
                                    {e.criteria.map((c) => (
                                        <li key={c} className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                            <span className="text-sm text-muted">{c}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </StaggerContainer>
                </div>
            </section>

            {/* Fee Structure */}
            <section className="section-padding bg-white">
                <div className="container-narrow mx-auto">
                    <FadeIn>
                        <div className="text-center mb-12">
                            <span className="inline-block px-4 py-1.5 rounded-full bg-navy-50 text-navy-600 text-xs font-semibold tracking-wider uppercase mb-4">
                                Fee Structure
                            </span>
                            <h2 className="text-3xl md:text-4xl font-heading font-bold text-navy-950">
                                Affordable Quality Education
                            </h2>
                            <p className="mt-3 text-muted max-w-xl mx-auto text-sm">
                                We believe quality education should be accessible. Scholarships
                                available for meritorious and economically weaker students.
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
                                    <div
                                        key={fee.label}
                                        className={`px-6 py-4 grid grid-cols-2 items-center ${i % 2 === 0 ? "bg-white" : "bg-ivory-50"
                                            }`}
                                    >
                                        <span className="text-sm font-medium text-navy-800">
                                            <CreditCard className="w-4 h-4 inline mr-2 text-gold-500" />
                                            {fee.label}
                                        </span>
                                        <span className="text-sm text-muted text-right font-medium">
                                            {fee.range}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-muted text-center mt-4">
                                * Fees are indicative and subject to revision. Contact the office
                                for exact figures.
                            </p>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 bg-navy-950 relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gold-500/5 rounded-full blur-[120px]" />
                </div>
                <div className="container-narrow mx-auto px-4 sm:px-6 relative">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <FadeIn>
                            <div>
                                <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-3">
                                    Have Questions?
                                </h2>
                                <p className="text-ivory-400/70">
                                    Our admissions team is here to help you through every step.
                                </p>
                            </div>
                        </FadeIn>
                        <FadeIn delay={0.2}>
                            <div className="flex flex-wrap gap-4">
                                <a
                                    href="/contact"
                                    className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-semibold hover:from-gold-400 hover:to-gold-500 transition-all shadow-xl shadow-gold-500/25 hover:-translate-y-0.5"
                                >
                                    Contact Us
                                    <ArrowRight className="w-4 h-4" />
                                </a>
                                <a
                                    href="tel:+919876543210"
                                    className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/15 text-ivory-300 font-medium hover:bg-white/5 transition-all"
                                >
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
