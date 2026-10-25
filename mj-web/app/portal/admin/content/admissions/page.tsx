"use client";

import { AdminFormShell } from "@/components/portal/admin/AdminFormShell";
import { SectionArrayEditor, StringListEditor } from "@/components/portal/admin/SectionArrayEditor";
import { IconPicker } from "@/components/portal/admin/IconPicker";
import { getSiteContent, saveSiteContent } from "@/lib/portal/content";
import type { AdmissionsContent } from "@/domain/portal/content-types";

const empty = (): AdmissionsContent => ({
    steps: [],
    eligibility: [],
    feeHighlights: [],
    updatedAt: 0,
});

export default function AdmissionsAdmin() {
    return (
        <AdminFormShell<AdmissionsContent>
            title="Admissions page content"
            subtitle="Application steps, eligibility per program, and fee highlights on /admissions."
            load={() => getSiteContent("admissions")}
            empty={empty}
            save={(d) => saveSiteContent("admissions", d)}
        >
            {({ data, setData }) => (
                <>
                    <SectionArrayEditor
                        title="Application steps"
                        items={data.steps}
                        onChange={(steps) => setData({ ...data, steps: steps.map((s, i) => ({ ...s, step: i + 1 })) })}
                        newItem={() => ({ step: data.steps.length + 1, icon: "FileText", title: "", desc: "" })}
                        renderItem={(item, update) => (
                            <div className="grid gap-3 md:grid-cols-2">
                                <Field label="Icon"><IconPicker value={item.icon} onChange={(icon) => update({ icon })} /></Field>
                                <Field label="Title"><Text v={item.title} onChange={(title) => update({ title })} /></Field>
                                <Field label="Description" full><Textarea v={item.desc} onChange={(desc) => update({ desc })} /></Field>
                            </div>
                        )}
                    />

                    <SectionArrayEditor
                        title="Eligibility by program"
                        items={data.eligibility}
                        onChange={(eligibility) => setData({ ...data, eligibility })}
                        newItem={() => ({ icon: "BookOpen", program: "", requirements: [] })}
                        renderItem={(item, update) => (
                            <div className="space-y-3">
                                <div className="grid gap-3 md:grid-cols-2">
                                    <Field label="Icon"><IconPicker value={item.icon} onChange={(icon) => update({ icon })} /></Field>
                                    <Field label="Program"><Text v={item.program} onChange={(program) => update({ program })} /></Field>
                                </div>
                                <div>
                                    <div className="mb-1 text-xs font-medium text-slate-700">Requirements</div>
                                    <StringListEditor items={item.requirements} onChange={(requirements) => update({ requirements })}
                                        placeholder="Birth certificate copy" />
                                </div>
                            </div>
                        )}
                    />

                    <SectionArrayEditor
                        title="Fee highlights"
                        items={data.feeHighlights}
                        onChange={(feeHighlights) => setData({ ...data, feeHighlights })}
                        newItem={() => ({ label: "", range: "" })}
                        renderItem={(item, update) => (
                            <div className="grid gap-3 md:grid-cols-2">
                                <Field label="Label"><Text v={item.label} onChange={(label) => update({ label })} placeholder="Primary (1–5)" /></Field>
                                <Field label="Fee range"><Text v={item.range} onChange={(range) => update({ range })} placeholder="₹12,000 – ₹18,000 / year" /></Field>
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
