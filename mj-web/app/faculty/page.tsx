"use client";

import { Mail, BookOpen } from "lucide-react";
import { FadeIn, StaggerContainer, staggerItem } from "@/components/animations/FadeIn";
import { motion } from "framer-motion";

const facultyMembers = [
    {
        name: "Dr. Suresh Kumar Mishra",
        role: "Principal & Director of Academics",
        subject: "Physics",
        qualification: "Ph.D. in Physics, IIT Kharagpur",
        experience: "28 years",
        color: "from-navy-700 to-navy-900",
    },
    {
        name: "Prof. Anjali Mohapatra",
        role: "Vice Principal",
        subject: "English Literature",
        qualification: "M.A., M.Phil. (English), Utkal University",
        experience: "22 years",
        color: "from-gold-500 to-gold-700",
    },
    {
        name: "Dr. Rajesh Panda",
        role: "Head of Science Department",
        subject: "Chemistry",
        qualification: "Ph.D. in Organic Chemistry",
        experience: "20 years",
        color: "from-blue-500 to-blue-700",
    },
    {
        name: "Mrs. Sanjukta Das",
        role: "Senior Faculty",
        subject: "Mathematics",
        qualification: "M.Sc. Mathematics, NIT Rourkela",
        experience: "18 years",
        color: "from-emerald-500 to-emerald-700",
    },
    {
        name: "Dr. Priya Rath",
        role: "Head of Arts Department",
        subject: "Political Science",
        qualification: "Ph.D. in Political Science",
        experience: "16 years",
        color: "from-purple-500 to-purple-700",
    },
    {
        name: "Mr. Bibhu Prasad Nayak",
        role: "Senior Faculty",
        subject: "Biology",
        qualification: "M.Sc. Zoology, Berhampur University",
        experience: "15 years",
        color: "from-teal-500 to-teal-700",
    },
    {
        name: "Mrs. Laxmipriya Sahoo",
        role: "Senior Faculty",
        subject: "Computer Science",
        qualification: "MCA, IGNOU",
        experience: "12 years",
        color: "from-indigo-500 to-indigo-700",
    },
    {
        name: "Mr. Deepak Mohanty",
        role: "Senior Faculty",
        subject: "History & Economics",
        qualification: "M.A. History, Ravenshaw University",
        experience: "14 years",
        color: "from-rose-500 to-rose-700",
    },
    {
        name: "Mrs. Sunita Behera",
        role: "Faculty",
        subject: "Odia Language",
        qualification: "M.A. Odia Literature",
        experience: "10 years",
        color: "from-amber-500 to-amber-700",
    },
    {
        name: "Mr. Ashish Kumar Sahu",
        role: "Sports Director",
        subject: "Physical Education",
        qualification: "M.P.Ed, Utkal University",
        experience: "11 years",
        color: "from-orange-500 to-orange-700",
    },
    {
        name: "Mrs. Ranjita Mishra",
        role: "Faculty",
        subject: "Hindi",
        qualification: "M.A. Hindi, Sambalpur University",
        experience: "9 years",
        color: "from-cyan-500 to-cyan-700",
    },
    {
        name: "Dr. Satyabrata Panigrahi",
        role: "Faculty",
        subject: "Geography",
        qualification: "Ph.D. in Geography",
        experience: "8 years",
        color: "from-lime-600 to-lime-800",
    },
];

export default function FacultyPage() {
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
                    <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {facultyMembers.map((member) => (
                            <motion.div
                                key={member.name}
                                variants={staggerItem}
                                className="group relative p-6 rounded-2xl bg-white border border-gray-100 card-hover overflow-hidden"
                            >
                                {/* Top gradient */}
                                <div
                                    className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${member.color}`}
                                />

                                {/* Avatar */}
                                <div className="flex items-start gap-4 mb-4">
                                    <div
                                        className={`w-14 h-14 rounded-xl bg-gradient-to-br ${member.color} flex items-center justify-center shrink-0 shadow-lg`}
                                    >
                                        <span className="text-xl font-heading font-bold text-white">
                                            {member.name
                                                .split(" ")
                                                .map((n) => n[0])
                                                .slice(0, 2)
                                                .join("")}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-base font-heading font-bold text-navy-950 truncate">
                                            {member.name}
                                        </h3>
                                        <p className="text-xs text-gold-600 font-medium">
                                            {member.role}
                                        </p>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="space-y-2 mb-5">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="w-3.5 h-3.5 text-muted shrink-0" />
                                        <span className="text-xs text-muted">{member.subject}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-3.5 h-3.5 text-muted shrink-0" />
                                        <span className="text-xs text-muted truncate">
                                            {member.qualification}
                                        </span>
                                    </div>
                                </div>

                                {/* Experience badge */}
                                <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-navy-50">
                                    <span className="text-xs font-semibold text-navy-700">
                                        {member.experience} experience
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </StaggerContainer>
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
