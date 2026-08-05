"use client";

import { useState } from "react";
import { Camera, Trophy, BookOpen, Users, X } from "lucide-react";
import { FadeIn, StaggerContainer, staggerItem } from "@/components/animations/FadeIn";
import { motion, AnimatePresence } from "framer-motion";

const categories = [
    { id: "all", label: "All", icon: Camera },
    { id: "campus", label: "Campus", icon: BookOpen },
    { id: "events", label: "Events", icon: Trophy },
    { id: "sports", label: "Sports", icon: Users },
    { id: "academics", label: "Academics", icon: BookOpen },
];

const galleryItems = [
    {
        id: 1,
        category: "campus",
        title: "Main Academic Block",
        desc: "The heart of our campus — featuring smart classrooms and faculty offices.",
        color: "from-navy-200 to-navy-400",
    },
    {
        id: 2,
        category: "events",
        title: "Annual Day Celebration",
        desc: "Cultural performances and award ceremonies celebrating student excellence.",
        color: "from-gold-200 to-gold-400",
    },
    {
        id: 3,
        category: "academics",
        title: "Science Laboratory",
        desc: "Fully equipped Physics and Chemistry labs for hands-on learning.",
        color: "from-blue-200 to-blue-400",
    },
    {
        id: 4,
        category: "sports",
        title: "Sports Day 2025",
        desc: "Annual athletics meet with inter-house cricket and football tournaments.",
        color: "from-emerald-200 to-emerald-400",
    },
    {
        id: 5,
        category: "campus",
        title: "Library & Resource Centre",
        desc: "10,000+ volumes with a dedicated digital reading zone.",
        color: "from-amber-200 to-amber-400",
    },
    {
        id: 6,
        category: "events",
        title: "Republic Day Parade",
        desc: "Students participating in the flag hoisting and march past ceremony.",
        color: "from-rose-200 to-rose-400",
    },
    {
        id: 7,
        category: "academics",
        title: "Computer Science Lab",
        desc: "Modern computer lab with high-speed internet and programming tools.",
        color: "from-indigo-200 to-indigo-400",
    },
    {
        id: 8,
        category: "sports",
        title: "Basketball Court",
        desc: "Outdoor basketball court for inter-school and district-level tournaments.",
        color: "from-teal-200 to-teal-400",
    },
    {
        id: 9,
        category: "campus",
        title: "Assembly Ground",
        desc: "Morning assemblies, yoga sessions, and cultural events venue.",
        color: "from-purple-200 to-purple-400",
    },
    {
        id: 10,
        category: "events",
        title: "Science Exhibition",
        desc: "Student projects showcasing innovation and scientific inquiry.",
        color: "from-cyan-200 to-cyan-400",
    },
    {
        id: 11,
        category: "academics",
        title: "Smart Classroom",
        desc: "Interactive boards and digital projectors for immersive learning.",
        color: "from-orange-200 to-orange-400",
    },
    {
        id: 12,
        category: "campus",
        title: "Garden & Green Areas",
        desc: "Landscaped gardens promoting eco-consciousness and outdoor learning.",
        color: "from-lime-200 to-lime-400",
    },
];

export default function GalleryPage() {
    const [activeFilter, setActiveFilter] = useState("all");
    const [lightbox, setLightbox] = useState<number | null>(null);

    const filtered =
        activeFilter === "all"
            ? galleryItems
            : galleryItems.filter((item) => item.category === activeFilter);

    const lightboxItem = lightbox !== null ? galleryItems.find((g) => g.id === lightbox) : null;

    return (
        <>
            {/* Hero */}
            <section className="relative pt-32 pb-20 bg-navy-950 overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-1/3 left-1/2 w-80 h-80 bg-gold-500/8 rounded-full blur-[120px]" />
                </div>
                <div className="container-narrow mx-auto px-4 sm:px-6 relative">
                    <FadeIn>
                        <span className="inline-block px-4 py-1.5 rounded-full border border-gold-500/20 bg-gold-500/5 text-gold-400 text-xs font-semibold tracking-wider uppercase mb-6">
                            Gallery
                        </span>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white leading-tight">
                            Campus Life
                            <br />
                            <span className="text-gradient-gold">In Pictures</span>
                        </h1>
                        <p className="mt-6 text-lg text-ivory-400/70 max-w-2xl leading-relaxed">
                            A visual journey through our campus, events, academic activities,
                            and sporting achievements.
                        </p>
                    </FadeIn>
                </div>
            </section>

            {/* Filter + Grid */}
            <section className="section-padding bg-white">
                <div className="container-narrow mx-auto">
                    {/* Category filters */}
                    <FadeIn>
                        <div className="flex flex-wrap gap-3 justify-center mb-12">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveFilter(cat.id)}
                                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeFilter === cat.id
                                            ? "bg-navy-950 text-white shadow-lg"
                                            : "bg-ivory-50 text-muted hover:bg-navy-50 hover:text-navy-700"
                                        }`}
                                >
                                    <cat.icon className="w-4 h-4" />
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </FadeIn>

                    {/* Gallery grid */}
                    <motion.div
                        layout
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        <AnimatePresence mode="popLayout">
                            {filtered.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.4 }}
                                    className="group cursor-pointer"
                                    onClick={() => setLightbox(item.id)}
                                >
                                    <div className="relative overflow-hidden rounded-2xl">
                                        <div
                                            className={`aspect-[4/3] bg-gradient-to-br ${item.color} flex items-center justify-center transition-transform duration-500 group-hover:scale-105`}
                                        >
                                            <div className="text-center p-6">
                                                <Camera className="w-12 h-12 text-white/40 mx-auto mb-3" />
                                                <p className="text-white/60 text-sm font-medium">
                                                    {item.title}
                                                </p>
                                            </div>
                                        </div>
                                        {/* Overlay on hover */}
                                        <div className="absolute inset-0 bg-navy-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                                            <div>
                                                <span className="inline-block px-2.5 py-1 rounded-md bg-gold-500/80 text-navy-950 text-[10px] font-bold uppercase mb-2">
                                                    {item.category}
                                                </span>
                                                <h3 className="text-base font-heading font-bold text-white">
                                                    {item.title}
                                                </h3>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </section>

            {/* Lightbox */}
            <AnimatePresence>
                {lightboxItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-navy-950/90 backdrop-blur-xl flex items-center justify-center p-4"
                        onClick={() => setLightbox(null)}
                    >
                        <button
                            className="absolute top-6 right-6 p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                            onClick={() => setLightbox(null)}
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="max-w-3xl w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div
                                className={`aspect-[16/10] rounded-2xl bg-gradient-to-br ${lightboxItem.color} flex items-center justify-center mb-6`}
                            >
                                <Camera className="w-20 h-20 text-white/30" />
                            </div>
                            <h3 className="text-2xl font-heading font-bold text-white mb-2">
                                {lightboxItem.title}
                            </h3>
                            <p className="text-ivory-400/70">{lightboxItem.desc}</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
