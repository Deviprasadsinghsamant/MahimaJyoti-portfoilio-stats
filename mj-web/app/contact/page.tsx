"use client";

import { useEffect, useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";
import { motion, AnimatePresence } from "framer-motion";
import { DynIcon } from "@/components/portal/DynIcon";
import { contactHref } from "@/lib/portal/contactLinks";
import { getSiteContent } from "@/lib/portal/content";
import { CONTACT_SUBJECTS, sendContactMessage, type ContactForm } from "@/lib/portal/messages";
import type { ContactContent } from "@/domain/portal/content-types";

const emptyForm = (): ContactForm => ({ name: "", email: "", phone: "", subject: "", message: "", website: "" });

const inputClass =
    "w-full px-4 py-3 rounded-xl border border-gray-200 bg-ivory-50 text-navy-900 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-all";

export default function ContactPage() {
    const [data, setData] = useState<ContactContent | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState<ContactForm>(emptyForm);
    const [sending, setSending] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        getSiteContent("contact")
            .then((d) => setData(d ?? { contactInfo: [], socialLinks: [], mapEmbedUrl: "", updatedAt: 0 }))
            .catch(() => setData({ contactInfo: [], socialLinks: [], mapEmbedUrl: "", updatedAt: 0 }));
    }, []);

    const set = (patch: Partial<ContactForm>) => setForm((f) => ({ ...f, ...patch }));

    // Sends to the school's Messages inbox in the portal (submitContactMessage).
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        if (!form.phone.trim() && !form.email.trim()) {
            setFormError("Please give a phone number or an email so the school can reply.");
            return;
        }
        setSending(true);
        try {
            await sendContactMessage(form);
            setSubmitted(true);
            setForm(emptyForm());
        } catch (err) {
            setFormError(err instanceof Error ? err.message : "The message couldn't be sent. Please try again.");
        } finally {
            setSending(false);
        }
    };

    const contactInfo = data?.contactInfo ?? [];
    const socialLinks = data?.socialLinks ?? [];
    const mapEmbedUrl = data?.mapEmbedUrl ?? "";

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
                            Have questions about admissions, academics, or anything else? We&apos;d love to hear from you.
                        </p>
                    </FadeIn>
                </div>
            </section>

            <section className="section-padding bg-white">
                <div className="container-narrow mx-auto">
                    {contactInfo.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
                            {contactInfo.map((info, i) => (
                                <FadeIn key={i} delay={i * 0.1}>
                                    <div className="p-6 rounded-2xl bg-ivory-50 border border-gray-100 card-hover text-center h-full">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-gold-500/20">
                                            <DynIcon name={info.icon} className="w-6 h-6 text-navy-950" />
                                        </div>
                                        <h3 className="text-sm font-heading font-bold text-navy-950 mb-3">{info.title}</h3>
                                        {info.lines.map((line, j) => {
                                            const href = contactHref(info.kind, line);
                                            return (
                                                <p key={j} className="text-sm text-muted leading-relaxed">
                                                    {href ? (
                                                        <a href={href} className="hover:text-gold-700 underline-offset-2 hover:underline" {...(info.kind === "whatsapp" ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                                                            {line}
                                                        </a>
                                                    ) : (
                                                        line
                                                    )}
                                                </p>
                                            );
                                        })}
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Contact form → the portal's Messages inbox */}
                        <FadeIn direction="left">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-heading font-bold text-navy-950 mb-2">Send Us a Message</h2>
                                <p className="text-muted text-sm mb-8">
                                    Write to the school office and we&apos;ll get back to you by phone or email.
                                </p>
                                <AnimatePresence mode="wait">
                                    {submitted ? (
                                        <motion.div key="success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                                            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                                            <h3 className="text-lg font-heading font-bold text-navy-950 mb-2">Message sent</h3>
                                            <p className="text-sm text-muted">Thank you. The school office has received your message and will get back to you.</p>
                                            <button type="button" onClick={() => setSubmitted(false)} className="mt-4 text-sm font-semibold text-navy-600 hover:text-gold-700">
                                                Send another message
                                            </button>
                                        </motion.div>
                                    ) : (
                                        <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleSubmit} className="space-y-5">
                                            <div>
                                                <label htmlFor="name" className="block text-sm font-medium text-navy-800 mb-1.5">Your name</label>
                                                <input type="text" id="name" required minLength={2} maxLength={80} autoComplete="name" value={form.name} onChange={(e) => set({ name: e.target.value })} className={inputClass} placeholder="Your name" />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                <div>
                                                    <label htmlFor="phone" className="block text-sm font-medium text-navy-800 mb-1.5">Phone number</label>
                                                    <input type="tel" id="phone" maxLength={20} autoComplete="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} className={inputClass} placeholder="10-digit mobile number" />
                                                </div>
                                                <div>
                                                    <label htmlFor="email" className="block text-sm font-medium text-navy-800 mb-1.5">
                                                        Email <span className="font-normal text-muted">(optional)</span>
                                                    </label>
                                                    <input type="email" id="email" maxLength={120} autoComplete="email" value={form.email} onChange={(e) => set({ email: e.target.value })} className={inputClass} placeholder="your@email.com" />
                                                </div>
                                            </div>
                                            <p className="-mt-3 text-xs text-muted">Give a phone number or an email (or both) so the school can reply.</p>
                                            <div>
                                                <label htmlFor="subject" className="block text-sm font-medium text-navy-800 mb-1.5">Topic</label>
                                                <select id="subject" value={form.subject} onChange={(e) => set({ subject: e.target.value })} className={inputClass}>
                                                    <option value="">Select a topic</option>
                                                    {CONTACT_SUBJECTS.map((s) => (
                                                        <option key={s.value} value={s.value}>{s.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label htmlFor="message" className="block text-sm font-medium text-navy-800 mb-1.5">Message</label>
                                                <textarea id="message" rows={4} required minLength={5} maxLength={2000} value={form.message} onChange={(e) => set({ message: e.target.value })} className={`${inputClass} resize-none`} placeholder="How can we help?" />
                                            </div>
                                            {/* Spam trap: hidden from people, so only bots fill it in. */}
                                            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                                                <label htmlFor="website">Website</label>
                                                <input type="text" id="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set({ website: e.target.value })} />
                                            </div>
                                            {formError && (
                                                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                                                    {formError}
                                                </div>
                                            )}
                                            <button type="submit" disabled={sending} className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-semibold hover:from-gold-400 hover:to-gold-500 transition-all shadow-lg shadow-gold-500/25 hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0">
                                                <Send className="w-4 h-4" />
                                                {sending ? "Sending…" : "Send Message"}
                                            </button>
                                        </motion.form>
                                    )}
                                </AnimatePresence>
                            </div>
                        </FadeIn>

                        {/* Map + Social */}
                        <FadeIn direction="right" delay={0.2}>
                            <div>
                                {mapEmbedUrl && (
                                    <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-navy-100 mb-6 relative">
                                        <iframe
                                            src={mapEmbedUrl}
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
                                )}

                                {socialLinks.length > 0 && (
                                    <div className="p-6 rounded-2xl bg-navy-950">
                                        <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Follow Us</h3>
                                        <div className="flex gap-3">
                                            {socialLinks.map((s, i) => (
                                                <a key={i} href={s.href || "#"} aria-label={s.label} target="_blank" rel="noopener noreferrer"
                                                    className="w-11 h-11 rounded-xl bg-white/5 hover:bg-gold-500/20 flex items-center justify-center text-ivory-400 hover:text-gold-400 transition-all">
                                                    <DynIcon name={s.icon} className="w-5 h-5" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>
        </>
    );
}
