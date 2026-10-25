"use client";

import { AdminFormShell } from "@/components/portal/admin/AdminFormShell";
import { SectionArrayEditor, StringListEditor } from "@/components/portal/admin/SectionArrayEditor";
import { IconPicker } from "@/components/portal/admin/IconPicker";
import { getSiteContent, saveSiteContent } from "@/lib/portal/content";
import type { ContactContent } from "@/domain/portal/content-types";

const empty = (): ContactContent => ({
    contactInfo: [],
    socialLinks: [],
    mapEmbedUrl: "",
    updatedAt: 0,
});

export default function ContactAdmin() {
    return (
        <AdminFormShell<ContactContent>
            title="Contact page content"
            subtitle="Address blocks, social links, and Google Maps embed on /contact."
            load={() => getSiteContent("contact")}
            empty={empty}
            save={(d) => saveSiteContent("contact", d)}
        >
            {({ data, setData }) => (
                <>
                    <SectionArrayEditor
                        title="Contact blocks"
                        subtitle="Address, phone numbers, emails, office hours."
                        items={data.contactInfo}
                        onChange={(contactInfo) => setData({ ...data, contactInfo })}
                        newItem={() => ({ icon: "MapPin", title: "", lines: [""] })}
                        renderItem={(item, update) => (
                            <div className="space-y-3">
                                <div className="grid gap-3 md:grid-cols-2">
                                    <Field label="Icon"><IconPicker value={item.icon} onChange={(icon) => update({ icon })} /></Field>
                                    <Field label="Title"><Text v={item.title} onChange={(title) => update({ title })} placeholder="Visit Us" /></Field>
                                </div>
                                <div>
                                    <div className="mb-1 text-xs font-medium text-slate-700">Lines (one per row)</div>
                                    <StringListEditor items={item.lines} onChange={(lines) => update({ lines })} placeholder="Mahanadi Vihar, Cuttack" minItems={1} />
                                </div>
                            </div>
                        )}
                    />

                    <SectionArrayEditor
                        title="Social links"
                        items={data.socialLinks}
                        onChange={(socialLinks) => setData({ ...data, socialLinks })}
                        newItem={() => ({ icon: "Facebook", label: "", href: "" })}
                        renderItem={(item, update) => (
                            <div className="grid gap-3 md:grid-cols-3">
                                <Field label="Icon"><IconPicker value={item.icon} onChange={(icon) => update({ icon })} /></Field>
                                <Field label="Label"><Text v={item.label} onChange={(label) => update({ label })} placeholder="Facebook" /></Field>
                                <Field label="URL"><Text v={item.href} onChange={(href) => update({ href })} placeholder="https://facebook.com/…" /></Field>
                            </div>
                        )}
                    />

                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                        <h3 className="text-sm font-semibold text-slate-900">Google Maps embed</h3>
                        <p className="mt-0.5 text-xs text-slate-500">
                            On Google Maps, click Share → Embed a map → copy the URL from the <code>src=&quot;…&quot;</code> attribute and paste below.
                        </p>
                        <input
                            value={data.mapEmbedUrl}
                            onChange={(e) => setData({ ...data, mapEmbedUrl: e.target.value })}
                            placeholder="https://www.google.com/maps/embed?pb=…"
                            className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-xs outline-none focus:border-blue-500"
                        />
                    </div>
                </>
            )}
        </AdminFormShell>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return <label className="block text-xs font-medium text-slate-700"><span className="mb-1 block">{label}</span>{children}</label>;
}
function Text({ v, onChange, placeholder }: { v: string; onChange: (v: string) => void; placeholder?: string }) {
    return <input value={v} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />;
}
