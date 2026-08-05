"use client";

import {
    BookOpen,
    GraduationCap,
    Trophy,
    Beaker,
    Palette,
    Calculator,
    Globe2,
    Atom,
    BookMarked,
    Binary,
    Landmark,
    Languages,
} from "lucide-react";
import { FadeIn, StaggerContainer, staggerItem } from "@/components/animations/FadeIn";
import { motion } from "framer-motion";

const programs = [
    {
        id: "primary",
        icon: BookOpen,
        title: "Primary Education",
        board: "Board of Secondary Education (BSE), Odisha",
        level: "Class 1 – 10",
        color: "from-blue-500 to-blue-700",
        bgColor: "bg-blue-50",
        textColor: "text-blue-700",
        description:
            "A comprehensive curriculum that builds strong academic foundations while fostering creativity, critical thinking, and personal values. Our primary program ensures every child discovers their potential.",
        features: [
            "Activity-based learning methodology",
            "Regular assessments & parent feedback",
            "Language proficiency in English, Odia & Hindi",
            "Value education & personality development",
            "Smart classroom integration",
            "Annual exhibitions & competitions",
        ],
        subjects: [
            { icon: Languages, name: "English" },
            { icon: Calculator, name: "Mathematics" },
            { icon: Beaker, name: "Science" },
            { icon: Globe2, name: "Social Studies" },
            { icon: Languages, name: "Odia" },
            { icon: Languages, name: "Hindi" },
            { icon: Binary, name: "Computer Science" },
            { icon: Palette, name: "Art & Craft" },
        ],
    },
    {
        id: "intermediate",
        icon: GraduationCap,
        title: "Intermediate (+2)",
        board: "Council of Higher Secondary Education (CHSE), Odisha",
        level: "Science & Arts Streams",
        color: "from-gold-500 to-gold-700",
        bgColor: "bg-gold-50",
        textColor: "text-gold-700",
        description:
            "Rigorous academic preparation for competitive exams and higher education. Choose between Science and Arts streams with experienced faculty and modern laboratory facilities.",
        features: [
            "Dedicated JEE/NEET preparation support",
            "Fully equipped Physics, Chemistry & Bio labs",
            "Guest lectures from industry professionals",
            "Career counselling & university guidance",
            "Regular mock tests & performance tracking",
            "Scholarship programs for merit students",
        ],
        subjects: [
            { icon: Atom, name: "Physics" },
            { icon: Beaker, name: "Chemistry" },
            { icon: Calculator, name: "Mathematics" },
            { icon: Beaker, name: "Biology" },
            { icon: BookMarked, name: "English" },
            { icon: Landmark, name: "Political Science" },
            { icon: Globe2, name: "History" },
            { icon: Globe2, name: "Economics" },
        ],
    },
    {
        id: "graduation",
        icon: Trophy,
        title: "Graduation",
        board: "Utkal University, Bhubaneswar",
        level: "B.A. / B.Sc. / B.Com Programs",
        color: "from-emerald-500 to-emerald-700",
        bgColor: "bg-emerald-50",
        textColor: "text-emerald-700",
        description:
            "Undergraduate degree programs designed to provide deep subject knowledge, research exposure, and career-ready skills — all under the prestigious affiliation of Utkal University.",
        features: [
            "University-approved curriculum & exams",
            "Experienced post-graduate faculty",
            "Research projects & field studies",
            "Campus placement assistance",
            "Seminars, workshops & conferences",
            "Library with 10,000+ academic volumes",
        ],
        subjects: [
            { icon: BookMarked, name: "B.A. (Arts)" },
            { icon: Atom, name: "B.Sc. (Science)" },
            { icon: Calculator, name: "B.Com (Commerce)" },
            { icon: Globe2, name: "Geography" },
            { icon: Landmark, name: "Pol. Science" },
            { icon: Languages, name: "Odia Literature" },
            { icon: Globe2, name: "Economics" },
            { icon: Globe2, name: "History" },
        ],
    },
];

export default function AcademicsPage() {
    return (
        <>
            {/* Hero */}
            <section className="relative pt-32 pb-20 bg-navy-950 overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-gold-500/8 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px]" />
                </div>
                <div className="container-narrow mx-auto px-4 sm:px-6 relative">
                    <FadeIn>
                        <span className="inline-block px-4 py-1.5 rounded-full border border-gold-500/20 bg-gold-500/5 text-gold-400 text-xs font-semibold tracking-wider uppercase mb-6">
                            Academics
                        </span>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white leading-tight">
                            Three Streams,
                            <br />
                            <span className="text-gradient-gold">One Vision</span>
                        </h1>
                        <p className="mt-6 text-lg text-ivory-400/70 max-w-2xl leading-relaxed">
                            From foundational learning to university-level education — explore
                            our comprehensive academic programs designed for every stage of growth.
                        </p>
                    </FadeIn>
                </div>
            </section>

            {/* Programs */}
            {programs.map((program, idx) => (
                <section
                    key={program.id}
                    id={program.id}
                    className={`section-padding ${idx % 2 === 0 ? "bg-white" : "bg-ivory-50"}`}
                >
                    <div className="container-narrow mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                            {/* Info */}
                            <FadeIn direction={idx % 2 === 0 ? "left" : "right"}>
                                <div>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div
                                            className={`w-14 h-14 rounded-xl bg-gradient-to-br ${program.color} flex items-center justify-center shadow-lg`}
                                        >
                                            <program.icon className="w-7 h-7 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl md:text-3xl font-heading font-bold text-navy-950">
                                                {program.title}
                                            </h2>
                                            <p className="text-sm text-muted">{program.level}</p>
                                        </div>
                                    </div>

                                    <div
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${program.bgColor} mb-6`}
                                    >
                                        <BookMarked className={`w-4 h-4 ${program.textColor}`} />
                                        <span className={`text-xs font-semibold ${program.textColor}`}>
                                            {program.board}
                                        </span>
                                    </div>

                                    <p className="text-muted leading-relaxed mb-8">
                                        {program.description}
                                    </p>

                                    <h3 className="text-sm font-semibold text-navy-950 tracking-wider uppercase mb-4">
                                        Key Features
                                    </h3>
                                    <div className="space-y-3">
                                        {program.features.map((feature) => (
                                            <div key={feature} className="flex items-start gap-3">
                                                <div className="mt-1.5 w-2 h-2 rounded-full bg-gold-500 shrink-0" />
                                                <span className="text-sm text-navy-800">{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </FadeIn>

                            {/* Subjects Grid */}
                            <FadeIn
                                direction={idx % 2 === 0 ? "right" : "left"}
                                delay={0.2}
                            >
                                <div>
                                    <h3 className="text-sm font-semibold text-navy-950 tracking-wider uppercase mb-6">
                                        Subjects Offered
                                    </h3>
                                    <StaggerContainer className="grid grid-cols-2 gap-3">
                                        {program.subjects.map((subject) => (
                                            <motion.div
                                                key={subject.name}
                                                variants={staggerItem}
                                                className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 hover:border-gold-200 hover:shadow-md transition-all"
                                            >
                                                <div className="w-9 h-9 rounded-lg bg-navy-50 flex items-center justify-center shrink-0">
                                                    <subject.icon className="w-4 h-4 text-navy-500" />
                                                </div>
                                                <span className="text-sm font-medium text-navy-800">
                                                    {subject.name}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </StaggerContainer>
                                </div>
                            </FadeIn>
                        </div>
                    </div>
                </section>
            ))}

            {/* CTA */}
            <section className="py-20 bg-navy-950 relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gold-500/5 rounded-full blur-[120px]" />
                </div>
                <div className="container-narrow mx-auto px-4 sm:px-6 relative text-center">
                    <FadeIn>
                        <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
                            Ready to Start Your Academic Journey?
                        </h2>
                        <p className="text-ivory-400/70 max-w-xl mx-auto mb-8">
                            Explore our admission process and secure your spot for the upcoming session.
                        </p>
                        <a
                            href="/admissions"
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-semibold hover:from-gold-400 hover:to-gold-500 transition-all shadow-xl shadow-gold-500/25 hover:-translate-y-0.5"
                        >
                            View Admissions
                        </a>
                    </FadeIn>
                </div>
            </section>
        </>
    );
}
