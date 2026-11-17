"use client";

import { useEffect, useState } from "react";
import { Eye, Target, Users } from "lucide-react";
import { FadeIn, StaggerContainer, staggerItem } from "@/components/animations/FadeIn";
import { motion } from "framer-motion";
import { DynIcon } from "@/components/portal/DynIcon";
import { getSiteContent } from "@/lib/portal/content";
import type { AboutContent } from "@/domain/portal/content-types";

export default function AboutPage() {
    const [data, setData] = useState<AboutContent | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getSiteContent("about")
            .then((d) => setData(d ?? { timeline: [], values: [], infrastructure: [], updatedAt: 0 }))
            .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
    }, []);

    const timeline = data?.timeline ?? [];
    const values = data?.values ?? [];
    const infrastructure = data?.infrastructure ?? [];
    const principal = data?.principal;

    return (
        <>
            {/* Hero */}
            <section className="relative pt-32 pb-20 bg-navy-950 overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-gold-500/8 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px]" />
                </div>
                <div className="container-narrow mx-auto px-4 sm:px-6 relative">
                    <FadeIn>
                        <span className="inline-block px-4 py-1.5 rounded-full border border-gold-500/20 bg-gold-500/5 text-gold-400 text-xs font-semibold tracking-wider uppercase mb-6">
                            About Us
                        </span>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white leading-tight">
                            A Legacy of
                            <br />
                            <span className="text-gradient-gold">Academic Excellence</span>
                        </h1>
                        <p className="mt-6 text-lg text-ivory-400/70 max-w-2xl leading-relaxed">
                            {data?.intro ||
                                "Nurturing young minds through quality education, strong values, and holistic development."}
                        </p>
                    </FadeIn>
                </div>
            </section>

            {/* Vision / Mission — each card hidden until written in Admin → About page */}
            {(data?.vision || data?.mission) && (
            <section className="section-padding bg-white">
                <div className="container-narrow mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {data?.vision && (
                        <FadeIn delay={0.1}>
                            <div className="p-8 rounded-2xl bg-navy-950 text-white h-full">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mb-5">
                                    <Eye className="w-6 h-6 text-navy-950" />
                                </div>
                                <h3 className="text-xl font-heading font-bold mb-3">Our Vision</h3>
                                <p className="text-ivory-400/70 leading-relaxed text-sm whitespace-pre-line">{data.vision}</p>
                            </div>
                        </FadeIn>
                        )}
                        {data?.mission && (
                        <FadeIn delay={0.3}>
                            <div className="p-8 rounded-2xl bg-gradient-to-br from-gold-50 to-ivory-100 border border-gold-100 h-full">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-navy-700 to-navy-900 flex items-center justify-center mb-5">
                                    <Target className="w-6 h-6 text-gold-400" />
                                </div>
                                <h3 className="text-xl font-heading font-bold text-navy-950 mb-3">
                                    Our Mission
                                </h3>
                                <p className="text-muted leading-relaxed text-sm whitespace-pre-line">{data.mission}</p>
                            </div>
                        </FadeIn>
                        )}
                    </div>
                </div>
            </section>
            )}

            {/* Timeline */}
            {timeline.length > 0 && (
                <section className="section-padding bg-ivory-50">
                    <div className="container-narrow mx-auto">
                        <FadeIn>
                            <div className="text-center mb-16">
                                <span className="inline-block px-4 py-1.5 rounded-full bg-navy-50 text-navy-600 text-xs font-semibold tracking-wider uppercase mb-4">
                                    Our Journey
                                </span>
                                <h2 className="text-3xl md:text-4xl font-heading font-bold text-navy-950">
                                    Milestones Through the Years
                                </h2>
                            </div>
                        </FadeIn>
                        <div className="relative">
                            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gold-400 via-navy-200 to-gold-400 md:-translate-x-0.5" />
                            <div className="space-y-12">
                                {timeline.map((item, i) => {
                                    const card = (
                                        <div className="p-6 rounded-xl bg-white border border-gray-100 shadow-sm">
                                            <span className="text-xs font-bold text-gold-600 tracking-wider">{item.year}</span>
                                            <h3 className="text-lg font-heading font-bold text-navy-950 mt-1">{item.title}</h3>
                                            <p className="text-sm text-muted mt-2">{item.desc}</p>
                                        </div>
                                    );
                                    return (
                                        <FadeIn key={i} delay={i * 0.1} direction={i % 2 === 0 ? "left" : "right"}>
                                            <div className={`relative flex flex-col md:flex-row items-start gap-6 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse md:text-right"}`}>
                                                <div className="absolute left-6 md:left-1/2 w-4 h-4 rounded-full bg-gold-500 border-4 border-white shadow-md -translate-x-1/2 mt-1 z-10" />
                                                <div className="ml-16 md:ml-0 md:w-[calc(50%-2rem)] md:pr-8">{i % 2 === 0 && card}</div>
                                                <div className="hidden md:block md:w-[calc(50%-2rem)] md:pl-8">{i % 2 !== 0 && card}</div>
                                                <div className="md:hidden ml-16">{i % 2 !== 0 && card}</div>
                                            </div>
                                        </FadeIn>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Values */}
            {values.length > 0 && (
                <section className="section-padding bg-white">
                    <div className="container-narrow mx-auto">
                        <FadeIn>
                            <div className="text-center mb-16">
                                <span className="inline-block px-4 py-1.5 rounded-full bg-gold-50 text-gold-700 text-xs font-semibold tracking-wider uppercase mb-4">
                                    Our Values
                                </span>
                                <h2 className="text-3xl md:text-4xl font-heading font-bold text-navy-950">
                                    What We Stand For
                                </h2>
                            </div>
                        </FadeIn>
                        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {values.map((v, i) => (
                                <motion.div key={i} variants={staggerItem} className="text-center p-8 rounded-2xl bg-ivory-50 border border-gray-100 card-hover">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-gold-500/20">
                                        <DynIcon name={v.icon} className="w-7 h-7 text-navy-950" />
                                    </div>
                                    <h3 className="text-lg font-heading font-bold text-navy-950 mb-2">{v.title}</h3>
                                    <p className="text-sm text-muted">{v.desc}</p>
                                </motion.div>
                            ))}
                        </StaggerContainer>
                    </div>
                </section>
            )}

            {/* Principal's Message — hidden until a name and message are entered */}
            {principal?.name && principal.message && (
            <section className="section-padding bg-navy-950 relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-0 right-1/4 w-80 h-80 bg-gold-500/5 rounded-full blur-[120px]" />
                </div>
                <div className="container-narrow mx-auto px-4 sm:px-6 relative">
                    <div className="max-w-3xl mx-auto text-center">
                        <FadeIn>
                            {principal.photoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={principal.photoUrl}
                                    alt={principal.name}
                                    className="w-48 h-60 rounded-2xl object-cover mx-auto mb-8 ring-4 ring-gold-500/20"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-navy-700 to-navy-800 flex items-center justify-center mx-auto mb-8 ring-4 ring-gold-500/20">
                                    <Users className="w-10 h-10 text-gold-400" />
                                </div>
                            )}
                            <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-6">Principal&apos;s Message</h2>
                            <blockquote className="text-lg text-ivory-300/80 leading-relaxed italic mb-8 whitespace-pre-line">
                                &ldquo;{principal.message}&rdquo;
                            </blockquote>
                            <div>
                                <p className="text-gold-400 font-heading font-bold text-lg">{principal.name}</p>
                                {principal.title && <p className="text-ivory-500/60 text-sm">{principal.title}</p>}
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>
            )}

            {/* Infrastructure */}
            {infrastructure.length > 0 && (
                <section className="section-padding bg-ivory-50">
                    <div className="container-narrow mx-auto">
                        <FadeIn>
                            <div className="text-center mb-16">
                                <span className="inline-block px-4 py-1.5 rounded-full bg-navy-50 text-navy-600 text-xs font-semibold tracking-wider uppercase mb-4">
                                    Infrastructure
                                </span>
                                <h2 className="text-3xl md:text-4xl font-heading font-bold text-navy-950">
                                    Our Facilities
                                </h2>
                            </div>
                        </FadeIn>
                        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {infrastructure.map((item, i) => (
                                <motion.div key={i} variants={staggerItem} className="overflow-hidden rounded-xl bg-white border border-gray-100 card-hover">
                                    {item.photoUrl && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={item.photoUrl} alt={item.title} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                                    )}
                                    <div className="flex items-start gap-5 p-6">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-navy-700 to-navy-900 flex items-center justify-center shrink-0">
                                            <DynIcon name={item.icon} className="w-6 h-6 text-gold-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-heading font-bold text-navy-950 mb-1">{item.title}</h3>
                                            <p className="text-sm text-muted">{item.desc}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </StaggerContainer>
                    </div>
                </section>
            )}

            {error && (
                <section className="py-8">
                    <div className="container-narrow mx-auto px-4">
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            Could not load some sections. Please refresh.
                        </div>
                    </div>
                </section>
            )}
        </>
    );
}
