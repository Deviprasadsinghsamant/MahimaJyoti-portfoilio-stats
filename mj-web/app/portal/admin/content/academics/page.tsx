"use client";

import { AdminFormShell } from "@/components/portal/admin/AdminFormShell";
import { SectionArrayEditor, StringListEditor } from "@/components/portal/admin/SectionArrayEditor";
import { IconPicker } from "@/components/portal/admin/IconPicker";
import { getSiteContent, saveSiteContent } from "@/lib/portal/content";
import type { AcademicsContent } from "@/domain/portal/content-types";

const empty = (): AcademicsContent => ({
    programs: [],
    updatedAt: 0,
});

export default function AcademicsAdmin() {
    return (
        <AdminFormShell<AcademicsContent>
            title="Academics page content"
            subtitle="Programs shown on /academics — Primary, Intermediate, Graduation, etc. Each program lists its features and subjects."
            load={() => getSiteContent("academics")}
            empty={empty}
            save={(d) => saveSiteContent("academics", d)}
        >
            {({ data, setData }) => (
                <SectionArrayEditor
                    title="Programs"
                    items={data.programs}
                    onChange={(programs) => setData({ ...data, programs })}
                    newItem={() => ({
                        id: "",
                        icon: "BookOpen",
                        title: "",
                        board: "",
                        level: "",
                        color: "from-blue-500 to-blue-700",
                        bgColor: "bg-blue-50",
                        textColor: "text-blue-700",
                        description: "",
                        features: [],
                        subjects: [],
                    })}
                    renderItem={(item, update) => (
                        <div className="space-y-4">
                            <div className="grid gap-3 md:grid-cols-2">
                                <Field label="Slug (unique id)"><Text v={item.id} onChange={(id) => update({ id })} placeholder="primary" /></Field>
                                <Field label="Icon"><IconPicker value={item.icon} onChange={(icon) => update({ icon })} /></Field>
                                <Field label="Title"><Text v={item.title} onChange={(title) => update({ title })} /></Field>
                                <Field label="Level"><Text v={item.level} onChange={(level) => update({ level })} placeholder="Class 1 – 10" /></Field>
                                <Field label="Board" full><Text v={item.board} onChange={(board) => update({ board })} placeholder="Board of Secondary Education, Odisha" /></Field>
                                <Field label="Description" full><Textarea v={item.description} onChange={(description) => update({ description })} /></Field>
                                <Field label="Header gradient"><Text v={item.color} onChange={(color) => update({ color })} placeholder="from-blue-500 to-blue-700" /></Field>
                                <Field label="Section bg"><Text v={item.bgColor} onChange={(bgColor) => update({ bgColor })} placeholder="bg-blue-50" /></Field>
                                <Field label="Section text"><Text v={item.textColor} onChange={(textColor) => update({ textColor })} placeholder="text-blue-700" /></Field>
                            </div>

                            <div>
                                <div className="mb-1 text-xs font-medium text-slate-700">Features (bullet points)</div>
                                <StringListEditor items={item.features} onChange={(features) => update({ features })} placeholder="Activity-based learning methodology" />
                            </div>

                            <div>
                                <div className="mb-1 text-xs font-medium text-slate-700">Subjects (icon + name)</div>
                                <SubjectsEditor value={item.subjects} onChange={(subjects) => update({ subjects })} />
                            </div>
                        </div>
                    )}
                />
            )}
        </AdminFormShell>
    );
}

function SubjectsEditor({
    value, onChange,
}: {
    value: { icon: string; name: string }[];
    onChange: (v: { icon: string; name: string }[]) => void;
}) {
    return (
        <div className="space-y-2">
            {value.map((s, i) => (
                <div key={i} className="grid gap-2 md:grid-cols-[1fr_2fr_auto]">
                    <IconPicker value={s.icon} onChange={(icon) => { const c = value.slice(); c[i] = { ...s, icon }; onChange(c); }} />
                    <input value={s.name} onChange={(e) => { const c = value.slice(); c[i] = { ...s, name: e.target.value }; onChange(c); }}
                        placeholder="Mathematics" className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
                    <button type="button" onClick={() => onChange(value.filter((_, ix) => ix !== i))}
                        className="rounded p-2 text-red-700 hover:bg-red-50" aria-label="Remove">×</button>
                </div>
            ))}
            <button type="button" onClick={() => onChange([...value, { icon: "BookOpen", name: "" }])}
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100">
                + Add subject
            </button>
        </div>
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
