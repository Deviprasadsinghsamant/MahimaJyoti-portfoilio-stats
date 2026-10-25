"use client";

import { AdminFormShell } from "@/components/portal/admin/AdminFormShell";
import { SectionArrayEditor } from "@/components/portal/admin/SectionArrayEditor";
import { IconPicker } from "@/components/portal/admin/IconPicker";
import { getSiteContent, saveSiteContent } from "@/lib/portal/content";
import type { AboutContent } from "@/domain/portal/content-types";

const empty = (): AboutContent => ({
    timeline: [],
    values: [],
    infrastructure: [],
    updatedAt: 0,
});

export default function AboutAdmin() {
    return (
        <AdminFormShell<AboutContent>
            title="About page content"
            subtitle="Journey timeline, core values, and infrastructure highlights on /about."
            load={() => getSiteContent("about")}
            empty={empty}
            save={(d) => saveSiteContent("about", d)}
        >
            {({ data, setData }) => (
                <>
                    <SectionArrayEditor
                        title="Journey / timeline"
                        items={data.timeline}
                        onChange={(timeline) => setData({ ...data, timeline })}
                        newItem={() => ({ year: "", title: "", desc: "" })}
                        renderItem={(item, update) => (
                            <div className="grid gap-3 md:grid-cols-3">
                                <Field label="Year"><Text v={item.year} onChange={(year) => update({ year })} /></Field>
                                <Field label="Title" full={false}><Text v={item.title} onChange={(title) => update({ title })} /></Field>
                                <Field label="Description" full><Textarea v={item.desc} onChange={(desc) => update({ desc })} /></Field>
                            </div>
                        )}
                    />

                    <SectionArrayEditor
                        title="Core values"
                        items={data.values}
                        onChange={(values) => setData({ ...data, values })}
                        newItem={() => ({ icon: "Target", title: "", desc: "" })}
                        renderItem={(item, update) => (
                            <div className="grid gap-3 md:grid-cols-2">
                                <Field label="Icon"><IconPicker value={item.icon} onChange={(icon) => update({ icon })} /></Field>
                                <Field label="Title"><Text v={item.title} onChange={(title) => update({ title })} /></Field>
                                <Field label="Description" full><Textarea v={item.desc} onChange={(desc) => update({ desc })} /></Field>
                            </div>
                        )}
                    />

                    <SectionArrayEditor
                        title="Infrastructure"
                        items={data.infrastructure}
                        onChange={(infrastructure) => setData({ ...data, infrastructure })}
                        newItem={() => ({ icon: "Building2", title: "", desc: "" })}
                        renderItem={(item, update) => (
                            <div className="grid gap-3 md:grid-cols-2">
                                <Field label="Icon"><IconPicker value={item.icon} onChange={(icon) => update({ icon })} /></Field>
                                <Field label="Title"><Text v={item.title} onChange={(title) => update({ title })} /></Field>
                                <Field label="Description" full><Textarea v={item.desc} onChange={(desc) => update({ desc })} /></Field>
                            </div>
                        )}
                    />
                </>
            )}
        </AdminFormShell>
    );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
    return <label className={`block text-xs font-medium text-slate-700 ${full ? "md:col-span-full" : ""}`}><span className="mb-1 block">{label}</span>{children}</label>;
}
function Text({ v, onChange, placeholder }: { v: string; onChange: (v: string) => void; placeholder?: string }) {
    return <input value={v} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />;
}
function Textarea({ v, onChange }: { v: string; onChange: (v: string) => void }) {
    return <textarea value={v} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />;
}
