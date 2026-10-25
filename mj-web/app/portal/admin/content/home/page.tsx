"use client";

import { AdminFormShell } from "@/components/portal/admin/AdminFormShell";
import { SectionArrayEditor } from "@/components/portal/admin/SectionArrayEditor";
import { IconPicker } from "@/components/portal/admin/IconPicker";
import { getSiteContent, saveSiteContent } from "@/lib/portal/content";
import type { HomeContent } from "@/domain/portal/content-types";

const emptyHome = (): HomeContent => ({
    academicPathways: [],
    highlights: [],
    notices: [],
    testimonials: [],
    updatedAt: 0,
});

export default function HomeAdmin() {
    return (
        <AdminFormShell<HomeContent>
            title="Home page content"
            subtitle="Everything visible on the public homepage — programs summary, highlights strip, notice board, testimonials."
            load={() => getSiteContent("home")}
            empty={emptyHome}
            save={(d) => saveSiteContent("home", d)}
        >
            {({ data, setData }) => (
                <>
                    <SectionArrayEditor
                        title="Academic pathways"
                        subtitle="Cards on the homepage summarising the school's programs."
                        items={data.academicPathways}
                        onChange={(academicPathways) => setData({ ...data, academicPathways })}
                        newItem={() => ({
                            icon: "BookOpen",
                            title: "",
                            subtitle: "",
                            description: "",
                            gradient: "from-blue-500 to-blue-700",
                            glow: "shadow-blue-500/20",
                            href: "/academics",
                        })}
                        renderItem={(item, update) => (
                            <div className="grid gap-3 md:grid-cols-2">
                                <Field label="Title"><Text v={item.title} onChange={(title) => update({ title })} /></Field>
                                <Field label="Subtitle"><Text v={item.subtitle} onChange={(subtitle) => update({ subtitle })} placeholder="Class 1 – 10 · BSE Board" /></Field>
                                <Field label="Icon"><IconPicker value={item.icon} onChange={(icon) => update({ icon })} /></Field>
                                <Field label="Link href"><Text v={item.href} onChange={(href) => update({ href })} placeholder="/academics#primary" /></Field>
                                <Field label="Gradient (Tailwind)"><Text v={item.gradient} onChange={(gradient) => update({ gradient })} placeholder="from-blue-500 to-blue-700" /></Field>
                                <Field label="Glow (Tailwind shadow)"><Text v={item.glow} onChange={(glow) => update({ glow })} placeholder="shadow-blue-500/20" /></Field>
                                <Field label="Description" full>
                                    <Textarea v={item.description} onChange={(description) => update({ description })} rows={3} />
                                </Field>
                            </div>
                        )}
                    />

                    <SectionArrayEditor
                        title="Highlight badges"
                        subtitle="Small icons + text shown in the hero highlights strip."
                        items={data.highlights}
                        onChange={(highlights) => setData({ ...data, highlights })}
                        newItem={() => ({ icon: "Star", text: "" })}
                        renderItem={(item, update) => (
                            <div className="grid gap-3 md:grid-cols-2">
                                <Field label="Icon"><IconPicker value={item.icon} onChange={(icon) => update({ icon })} /></Field>
                                <Field label="Text"><Text v={item.text} onChange={(text) => update({ text })} /></Field>
                            </div>
                        )}
                    />

                    <SectionArrayEditor
                        title="Notice board"
                        subtitle="Latest announcements shown on the homepage."
                        items={data.notices}
                        onChange={(notices) => setData({ ...data, notices })}
                        newItem={() => ({ date: "", title: "", tag: "Notice" })}
                        renderItem={(item, update) => (
                            <div className="grid gap-3 md:grid-cols-3">
                                <Field label="Date"><Text v={item.date} onChange={(date) => update({ date })} placeholder="Feb 20, 2026" /></Field>
                                <Field label="Tag"><Text v={item.tag} onChange={(tag) => update({ tag })} placeholder="Admissions / Events / Academics" /></Field>
                                <Field label="Title" full><Text v={item.title} onChange={(title) => update({ title })} /></Field>
                            </div>
                        )}
                    />

                    <SectionArrayEditor
                        title="Testimonials"
                        subtitle="Parents, students, and alumni quotes."
                        items={data.testimonials}
                        onChange={(testimonials) => setData({ ...data, testimonials })}
                        newItem={() => ({ name: "", role: "", quote: "" })}
                        renderItem={(item, update) => (
                            <div className="grid gap-3 md:grid-cols-2">
                                <Field label="Name"><Text v={item.name} onChange={(name) => update({ name })} /></Field>
                                <Field label="Role"><Text v={item.role} onChange={(role) => update({ role })} placeholder="Parent, Class 8" /></Field>
                                <Field label="Quote" full><Textarea v={item.quote} onChange={(quote) => update({ quote })} rows={3} /></Field>
                            </div>
                        )}
                    />
                </>
            )}
        </AdminFormShell>
    );
}

// ─── tiny shared inputs ──────────────────────────────

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
    return (
        <label className={`block text-xs font-medium text-slate-700 ${full ? "md:col-span-full" : ""}`}>
            <span className="mb-1 block">{label}</span>
            {children}
        </label>
    );
}
function Text({ v, onChange, placeholder }: { v: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <input value={v} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
    );
}
function Textarea({ v, onChange, rows = 3 }: { v: string; onChange: (v: string) => void; rows?: number }) {
    return (
        <textarea value={v} onChange={(e) => onChange(e.target.value)} rows={rows}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
    );
}
