"use client";

import { useEffect, useState } from "react";
import { Camera, X } from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";
import { motion, AnimatePresence } from "framer-motion";
import { listGalleryPublic } from "@/lib/portal/content";
import type { GalleryCategory, GalleryItem } from "@/domain/portal/content-types";

type Filter = GalleryCategory | "all";

const CATEGORY_LABELS: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "campus", label: "Campus" },
    { id: "events", label: "Events" },
    { id: "sports", label: "Sports" },
    { id: "academics", label: "Academics" },
    { id: "achievements", label: "Achievements" },
    { id: "cultural", label: "Cultural" },
];

export default function GalleryPage() {
    const [items, setItems] = useState<GalleryItem[] | null>(null);
    const [activeFilter, setActiveFilter] = useState<Filter>("all");
    const [lightbox, setLightbox] = useState<string | null>(null);

    useEffect(() => {
        listGalleryPublic().then(setItems).catch(() => setItems([]));
    }, []);

    const filtered = items === null
        ? []
        : activeFilter === "all" ? items : items.filter((item) => item.category === activeFilter);

    const lightboxItem = lightbox !== null && items ? items.find((g) => g.id === lightbox) ?? null : null;

    // Categories are constrained to those actually populated + "All".
    const populatedCategories = items === null
        ? CATEGORY_LABELS
        : CATEGORY_LABELS.filter((c) => c.id === "all" || items.some((i) => i.category === c.id));

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
                            A visual journey through our campus, events, academic activities, and sporting achievements.
                        </p>
                    </FadeIn>
                </div>
            </section>

            {/* Filter + Grid */}
            <section className="section-padding bg-white">
                <div className="container-narrow mx-auto">
                    {items === null ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-gray-100" />
                            ))}
                        </div>
                    ) : items.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center text-muted">
                            Gallery photos will appear here soon.
                        </div>
                    ) : (
                        <>
                            <FadeIn>
                                <div className="flex flex-wrap gap-3 justify-center mb-12">
                                    {populatedCategories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setActiveFilter(cat.id)}
                                            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeFilter === cat.id
                                                ? "bg-navy-950 text-white shadow-lg"
                                                : "bg-ivory-50 text-muted hover:bg-navy-50 hover:text-navy-700"
                                                }`}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </FadeIn>

                            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                                <div className={`aspect-[4/3] ${item.photoUrl ? "" : `bg-gradient-to-br ${item.accent}`} flex items-center justify-center transition-transform duration-500 group-hover:scale-105`}>
                                                    {item.photoUrl ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={item.photoUrl} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
                                                    ) : (
                                                        <div className="text-center p-6">
                                                            <Camera className="w-12 h-12 text-white/40 mx-auto mb-3" />
                                                            <p className="text-white/60 text-sm font-medium">{item.title}</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="absolute inset-0 bg-navy-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                                                    <div>
                                                        <span className="inline-block px-2.5 py-1 rounded-md bg-gold-500/80 text-navy-950 text-[10px] font-bold uppercase mb-2">
                                                            {item.category}
                                                        </span>
                                                        <h3 className="text-base font-heading font-bold text-white">{item.title}</h3>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        </>
                    )}
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
                            <div className={`aspect-[16/10] rounded-2xl overflow-hidden ${lightboxItem.photoUrl ? "" : `bg-gradient-to-br ${lightboxItem.accent}`} flex items-center justify-center mb-6`}>
                                {lightboxItem.photoUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={lightboxItem.photoUrl} alt={lightboxItem.title} className="h-full w-full object-contain" />
                                ) : (
                                    <Camera className="w-20 h-20 text-white/30" />
                                )}
                            </div>
                            <h3 className="text-2xl font-heading font-bold text-white mb-2">{lightboxItem.title}</h3>
                            <p className="text-ivory-400/70">{lightboxItem.description}</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
