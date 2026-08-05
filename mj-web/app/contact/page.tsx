"use client";

import { useState } from "react";
import {
    MapPin,
    Phone,
    Mail,
    Clock,
    Send,
    CheckCircle2,
    Facebook,
    Twitter,
    Instagram,
    Youtube,
} from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";
import { motion, AnimatePresence } from "framer-motion";

const contactInfo = [
    {
        icon: MapPin,
        title: "Visit Us",
        lines: ["Mahanadi Vihar, Cuttack", "Odisha, India — 753004"],
    },
    {
        icon: Phone,
        title: "Call Us",
        lines: ["+91 98765 43210", "+91 67120 12345"],
    },
    {
        icon: Mail,
        title: "Email Us",
        lines: ["info@mahanadijagruti.edu.in", "admissions@mahanadijagruti.edu.in"],
    },
    {
        icon: Clock,
        title: "Office Hours",
        lines: ["Mon – Sat: 8:00 AM – 4:00 PM", "Sunday: Closed"],
    },
];

const socialLinks = [
    { icon: Facebook, label: "Facebook", href: "#" },
    { icon: Twitter, label: "Twitter", href: "#" },
    { icon: Instagram, label: "Instagram", href: "#" },
    { icon: Youtube, label: "Youtube", href: "#" },
];

export default function ContactPage() {
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 4000);
    };

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
                            Contact
                        </span>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white leading-tight">
                            Get In
                            <br />
                            <span className="text-gradient-gold">Touch</span>
                        </h1>
                        <p className="mt-6 text-lg text-ivory-400/70 max-w-2xl leading-relaxed">
                            Have questions about admissions, academics, or anything else?
                            We&apos;d love to hear from you.
                        </p>
                    </FadeIn>
                </div>
            </section>

            {/* Contact Cards */}
            <section className="section-padding bg-white">
                <div className="container-narrow mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
                        {contactInfo.map((info, i) => (
                            <FadeIn key={info.title} delay={i * 0.1}>
                                <div className="p-6 rounded-2xl bg-ivory-50 border border-gray-100 card-hover text-center h-full">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-gold-500/20">
                                        <info.icon className="w-6 h-6 text-navy-950" />
                                    </div>
                                    <h3 className="text-sm font-heading font-bold text-navy-950 mb-3">
                                        {info.title}
                                    </h3>
                                    {info.lines.map((line) => (
                                        <p key={line} className="text-sm text-muted leading-relaxed">
                                            {line}
                                        </p>
                                    ))}
                                </div>
                            </FadeIn>
                        ))}
                    </div>

                    {/* Form + Map */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Contact Form */}
                        <FadeIn direction="left">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-heading font-bold text-navy-950 mb-2">
                                    Send Us a Message
                                </h2>
                                <p className="text-muted text-sm mb-8">
                                    Fill in the form below and we&apos;ll get back to you within
                                    24 hours.
                                </p>

                                <AnimatePresence mode="wait">
                                    {submitted ? (
                                        <motion.div
                                            key="success"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center"
                                        >
                                            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                                            <h3 className="text-lg font-heading font-bold text-navy-950 mb-2">
                                                Message Sent!
                                            </h3>
                                            <p className="text-sm text-muted">
                                                Thank you for reaching out. We&apos;ll respond shortly.
                                            </p>
                                        </motion.div>
                                    ) : (
                                        <motion.form
                                            key="form"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            onSubmit={handleSubmit}
                                            className="space-y-5"
                                        >
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                <div>
                                                    <label
                                                        htmlFor="name"
                                                        className="block text-sm font-medium text-navy-800 mb-1.5"
                                                    >
                                                        Full Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id="name"
                                                        required
                                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-ivory-50 text-navy-900 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-all"
                                                        placeholder="Your name"
                                                    />
                                                </div>
                                                <div>
                                                    <label
                                                        htmlFor="email"
                                                        className="block text-sm font-medium text-navy-800 mb-1.5"
                                                    >
                                                        Email
                                                    </label>
                                                    <input
                                                        type="email"
                                                        id="email"
                                                        required
                                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-ivory-50 text-navy-900 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-all"
                                                        placeholder="your@email.com"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="phone"
                                                    className="block text-sm font-medium text-navy-800 mb-1.5"
                                                >
                                                    Phone Number
                                                </label>
                                                <input
                                                    type="tel"
                                                    id="phone"
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-ivory-50 text-navy-900 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-all"
                                                    placeholder="+91 XXXXX XXXXX"
                                                />
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="subject"
                                                    className="block text-sm font-medium text-navy-800 mb-1.5"
                                                >
                                                    Subject
                                                </label>
                                                <select
                                                    id="subject"
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-ivory-50 text-navy-900 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-all"
                                                >
                                                    <option value="">Select a topic</option>
                                                    <option value="admissions">Admissions Inquiry</option>
                                                    <option value="academics">Academic Query</option>
                                                    <option value="fees">Fee Information</option>
                                                    <option value="careers">Career / Jobs</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="message"
                                                    className="block text-sm font-medium text-navy-800 mb-1.5"
                                                >
                                                    Message
                                                </label>
                                                <textarea
                                                    id="message"
                                                    rows={4}
                                                    required
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-ivory-50 text-navy-900 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-all resize-none"
                                                    placeholder="How can we help?"
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-semibold hover:from-gold-400 hover:to-gold-500 transition-all shadow-lg shadow-gold-500/25 hover:-translate-y-0.5"
                                            >
                                                <Send className="w-4 h-4" />
                                                Send Message
                                            </button>
                                        </motion.form>
                                    )}
                                </AnimatePresence>
                            </div>
                        </FadeIn>

                        {/* Map + Social */}
                        <FadeIn direction="right" delay={0.2}>
                            <div>
                                {/* Map placeholder */}
                                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-navy-100 mb-6 relative">
                                    <iframe
                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3736.8456!2d85.8312!3d20.4625!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjDCsDI3JzQ1LjAiTiA4NcKwNDknNTIuMyJF!5e0!3m2!1sen!2sin!4v1234567890"
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        allowFullScreen
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        title="School Location"
                                        className="absolute inset-0"
                                    />
                                </div>

                                {/* Social */}
                                <div className="p-6 rounded-2xl bg-navy-950">
                                    <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
                                        Follow Us
                                    </h3>
                                    <div className="flex gap-3">
                                        {socialLinks.map((s) => (
                                            <a
                                                key={s.label}
                                                href={s.href}
                                                aria-label={s.label}
                                                className="w-11 h-11 rounded-xl bg-white/5 hover:bg-gold-500/20 flex items-center justify-center text-ivory-400 hover:text-gold-400 transition-all"
                                            >
                                                <s.icon className="w-5 h-5" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>
        </>
    );
}
