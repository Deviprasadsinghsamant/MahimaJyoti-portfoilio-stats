"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  GraduationCap,
  BookOpen,
  Users,
  Trophy,
  ArrowRight,
  Star,
  Clock,
  Shield,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { FadeIn, StaggerContainer, staggerItem } from "@/components/animations/FadeIn";
import { AnimatedCounter } from "@/components/animations/AnimatedCounter";

/* ─── Data ─── */
const academicPathways = [
  {
    icon: BookOpen,
    title: "Primary Education",
    subtitle: "Class 1 – 10 · BSE Board",
    description:
      "A strong academic foundation with holistic development, activity-based learning, and value education for younger minds.",
    color: "from-blue-500 to-blue-700",
    glow: "shadow-blue-500/20",
    href: "/academics#primary",
  },
  {
    icon: GraduationCap,
    title: "Intermediate (+2)",
    subtitle: "Science & Arts · CHSE Board",
    description:
      "Rigorous preparation for higher studies with specialised streams, experienced faculty, and modern laboratory facilities.",
    color: "from-gold-500 to-gold-700",
    glow: "shadow-gold-500/20",
    href: "/academics#intermediate",
  },
  {
    icon: Trophy,
    title: "Graduation",
    subtitle: "Utkal University Affiliated",
    description:
      "Undergraduate degree programs with a focus on academic excellence, research exposure, and career-ready skills.",
    color: "from-emerald-500 to-emerald-700",
    glow: "shadow-emerald-500/20",
    href: "/academics#graduation",
  },
];

const highlights = [
  { icon: Shield, text: "Government Recognized & Accredited" },
  { icon: Star, text: "Award-Winning Faculty" },
  { icon: Clock, text: "Decades of Academic Excellence" },
  { icon: Sparkles, text: "Modern Infrastructure" },
];

const notices = [
  {
    date: "Feb 20, 2026",
    title: "Admissions Open for 2026-27 Session",
    tag: "Admissions",
  },
  {
    date: "Feb 15, 2026",
    title: "Annual Sports Day — March 5th, 2026",
    tag: "Events",
  },
  {
    date: "Feb 10, 2026",
    title: "Board Exam Preparation Workshop",
    tag: "Academics",
  },
  {
    date: "Feb 05, 2026",
    title: "Parent-Teacher Meeting Schedule Released",
    tag: "Notice",
  },
];

const testimonials = [
  {
    name: "Dr. Ananya Patel",
    role: "Parent, Class 8",
    quote:
      "The holistic approach to education here has transformed my child's confidence and academic performance. The teachers genuinely care.",
  },
  {
    name: "Rajesh Mohanty",
    role: "Alumni, Batch 2022",
    quote:
      "My years at MahimaJyoti gave me the foundation I needed for engineering. The science labs and faculty support were exceptional.",
  },
  {
    name: "Priya Dash",
    role: "Parent, +2 Science",
    quote:
      "From academics to extra-curriculars, the school provides a well-rounded experience. We're proud to be part of this institution.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ═══════ HERO ═══════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-navy-950">
        {/* Background gradient orbs */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-gold-500/10 rounded-full blur-[128px]" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-navy-700/20 rounded-full blur-[200px]" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative container-narrow mx-auto px-4 sm:px-6 pt-32 pb-20">
          <div className="max-w-4xl">
            {/* Badge */}
            <FadeIn delay={0.2}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold-500/20 bg-gold-500/5 mb-8">
                <Sparkles className="w-4 h-4 text-gold-400" />
                <span className="text-sm text-gold-400 font-medium">
                  Admissions Open 2026-27
                </span>
              </div>
            </FadeIn>

            {/* Heading */}
            <FadeIn delay={0.3}>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-white leading-[1.1] tracking-tight">
                Nurturing Minds,
                <br />
                <span className="text-gradient-gold">Shaping Futures</span>
              </h1>
            </FadeIn>

            {/* Subtext */}
            <FadeIn delay={0.5}>
              <p className="mt-6 text-lg md:text-xl text-ivory-400/70 max-w-2xl leading-relaxed">
                A premier educational institution offering comprehensive
                programs from Primary to Graduation — affiliated with BSE, CHSE,
                and Utkal University.
              </p>
            </FadeIn>

            {/* CTAs */}
            <FadeIn delay={0.7}>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/admissions"
                  className="group inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-semibold text-base hover:from-gold-400 hover:to-gold-500 transition-all shadow-xl shadow-gold-500/25 hover:shadow-gold-500/40 hover:-translate-y-0.5"
                >
                  Apply for Admission
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/academics"
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-xl border border-white/10 text-ivory-300 font-medium text-base hover:bg-white/5 hover:border-white/20 transition-all"
                >
                  Explore Programs
                </Link>
              </div>
            </FadeIn>

            {/* Trust signals */}
            <FadeIn delay={0.9}>
              <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
                {highlights.map((h) => (
                  <div
                    key={h.text}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05]"
                  >
                    <h.icon className="w-5 h-5 text-gold-400 shrink-0" />
                    <span className="text-xs text-ivory-400/60 font-medium leading-tight">
                      {h.text}
                    </span>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>


      </section>

      {/* ═══════ ACADEMIC PATHWAYS ═══════ */}
      <section className="section-padding bg-white">
        <div className="container-narrow mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full bg-navy-50 text-navy-600 text-xs font-semibold tracking-wider uppercase mb-4">
                Our Programs
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-navy-950">
                Academic Pathways
              </h2>
              <p className="mt-4 text-muted max-w-2xl mx-auto">
                Three comprehensive educational streams designed to guide
                students from primary education to university-level graduation.
              </p>
            </div>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {academicPathways.map((program) => (
              <motion.div key={program.title} variants={staggerItem}>
                <Link href={program.href} className="block group">
                  <div
                    className={`relative p-8 rounded-2xl bg-white border border-gray-100 card-hover overflow-hidden`}
                  >
                    {/* Gradient accent */}
                    <div
                      className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${program.color}`}
                    />

                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${program.color} flex items-center justify-center mb-6 shadow-lg ${program.glow}`}
                    >
                      <program.icon className="w-7 h-7 text-white" />
                    </div>

                    <h3 className="text-xl font-heading font-bold text-navy-950 mb-1">
                      {program.title}
                    </h3>
                    <p className="text-sm text-gold-600 font-medium mb-4">
                      {program.subtitle}
                    </p>
                    <p className="text-sm text-muted leading-relaxed mb-6">
                      {program.description}
                    </p>

                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-navy-600 group-hover:text-gold-600 transition-colors">
                      Learn More
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ═══════ STATS ═══════ */}
      <section className="py-20 bg-navy-950 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-gold-500/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px]" />
        </div>
        <div className="container-narrow mx-auto px-4 sm:px-6 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <AnimatedCounter end={2500} suffix="+" label="Students" />
            <AnimatedCounter end={120} suffix="+" label="Faculty Members" />
            <AnimatedCounter end={25} suffix="+" label="Years of Excellence" />
            <AnimatedCounter end={15} suffix="+" label="Programs Offered" />
          </div>
        </div>
      </section>

      {/* ═══════ WHY CHOOSE US ═══════ */}
      <section className="section-padding bg-ivory-50">
        <div className="container-narrow mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeIn direction="left">
              <div>
                <span className="inline-block px-4 py-1.5 rounded-full bg-gold-50 text-gold-700 text-xs font-semibold tracking-wider uppercase mb-4">
                  Why Choose Us
                </span>
                <h2 className="text-3xl md:text-4xl font-heading font-bold text-navy-950 mb-6">
                  Where Tradition Meets
                  <br />
                  <span className="text-gold-600">Modern Excellence</span>
                </h2>
                <p className="text-muted leading-relaxed mb-8">
                  With decades of educational excellence, we combine
                  time-tested values with modern teaching methodologies
                  to create an enriching learning environment.
                </p>
                <div className="space-y-4">
                  {[
                    "Board-affiliated curriculum with proven results",
                    "State-of-the-art science & computer labs",
                    "Dedicated sports facilities & extra-curriculars",
                    "Personalised mentorship & career guidance",
                    "Safe, inclusive, and nurturing campus",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <div className="mt-1 w-5 h-5 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shrink-0">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <span className="text-sm text-navy-800">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            <FadeIn direction="right" delay={0.2}>
              <div className="relative">
                <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-navy-100 to-navy-200 overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-8">
                      <GraduationCap className="w-20 h-20 text-navy-400 mx-auto mb-4" />
                      <p className="text-navy-500 font-heading text-xl font-semibold">
                        Campus Life
                      </p>
                    </div>
                  </div>
                </div>
                {/* Floating badge */}
                <div className="absolute -bottom-6 -left-6 px-6 py-4 rounded-xl bg-white shadow-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-heading font-bold text-navy-950">
                        A+
                      </p>
                      <p className="text-xs text-muted">NAAC Grading</p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ═══════ NOTICES ═══════ */}
      <section className="section-padding bg-white">
        <div className="container-narrow mx-auto">
          <FadeIn>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
              <div>
                <span className="inline-block px-4 py-1.5 rounded-full bg-navy-50 text-navy-600 text-xs font-semibold tracking-wider uppercase mb-3">
                  Latest Updates
                </span>
                <h2 className="text-3xl md:text-4xl font-heading font-bold text-navy-950">
                  Notices & Events
                </h2>
              </div>
              <Link
                href="/about"
                className="inline-flex items-center gap-1 text-sm font-semibold text-navy-600 hover:text-gold-600 transition-colors"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notices.map((notice) => (
              <motion.div
                key={notice.title}
                variants={staggerItem}
                className="group p-5 rounded-xl border border-gray-100 hover:border-gold-200 hover:bg-gold-50/30 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-lg bg-navy-50 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-navy-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted">
                        {notice.date}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-gold-100 text-gold-700 text-[10px] font-semibold uppercase">
                        {notice.tag}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-navy-900 group-hover:text-gold-700 transition-colors">
                      {notice.title}
                    </h3>
                  </div>
                </div>
              </motion.div>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ═══════ TESTIMONIALS ═══════ */}
      <section className="section-padding bg-ivory-50">
        <div className="container-narrow mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full bg-gold-50 text-gold-700 text-xs font-semibold tracking-wider uppercase mb-4">
                Testimonials
              </span>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-navy-950">
                Voices of Our Community
              </h2>
            </div>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <motion.div
                key={t.name}
                variants={staggerItem}
                className="p-8 rounded-2xl bg-white border border-gray-100 card-hover"
              >
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-gold-400 text-gold-400"
                    />
                  ))}
                </div>
                <p className="text-sm text-muted leading-relaxed mb-6 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy-200 to-navy-300 flex items-center justify-center">
                    <Users className="w-5 h-5 text-navy-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy-950">
                      {t.name}
                    </p>
                    <p className="text-xs text-muted">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ═══════ CTA BANNER ═══════ */}
      <section className="relative py-24 bg-navy-950 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gold-500/5 rounded-full blur-[150px]" />
        </div>
        <div className="container-narrow mx-auto px-4 sm:px-6 relative text-center">
          <FadeIn>
            <h2 className="text-3xl md:text-5xl font-heading font-bold text-white mb-6">
              Begin Your Journey With Us
            </h2>
            <p className="text-lg text-ivory-400/70 max-w-2xl mx-auto mb-10">
              Admissions are now open for the 2026-27 academic session. Join a
              legacy of academic excellence and holistic development.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/admissions"
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-semibold hover:from-gold-400 hover:to-gold-500 transition-all shadow-xl shadow-gold-500/25 hover:-translate-y-0.5"
              >
                Apply Now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/15 text-ivory-300 font-medium hover:bg-white/5 transition-all"
              >
                Contact Us
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
