"use client";

import { AdminFormShell } from "@/components/portal/admin/AdminFormShell";
import { ColorPresetPicker } from "@/components/portal/admin/ColorPresetPicker";
import { Field, TextArea, TextInput } from "@/components/portal/admin/Help";
import { SectionArrayEditor, StringListEditor } from "@/components/portal/admin/SectionArrayEditor";
import { IconPicker } from "@/components/portal/admin/IconPicker";
import { getSiteContent, saveSiteContent } from "@/lib/portal/content";
import { COLOR_PRESETS } from "@/lib/portal/colorPresets";
import type { AcademicsContent } from "@/domain/portal/content-types";

const empty = (): AcademicsContent => ({
    programs: [],
    updatedAt: 0,
});

/** "Upper Primary" → "upper-primary". */
function slugify(text: string): string {
    return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function AcademicsAdmin() {
    return (
        <AdminFormShell<AcademicsContent>
            title="Academics page"
            subtitle="What the school teaches at each stage — one program per stage, with its features and subjects."
            publicPath="/academics"
            load={() => getSiteContent("academics")}
            empty={empty}
            save={(d) => saveSiteContent("academics", d)}
        >
            {({ data, setData }) => (
                <SectionArrayEditor
                    title="Programs (stages of schooling)"
                    subtitle="Each program gets its own section on the Academics page and a link in the footer."
                    where="Academics page (one section each) and the footer's “Programs” links"
                    recommended={{ min: 2, max: 4 }}
                    noun="program"
                    itemTitle={(p) => (p.level ? `${p.title} — ${p.level}` : p.title)}
                    help={
                        <>
                            Group classes the way the school does, e.g. <em>Primary</em> (IV–V), <em>Upper Primary</em> (VI–VIII) and
                            <em> Secondary</em> (IX–X). For each, list 3–6 features and every subject taught. The home page&apos;s
                            pathway cards should match these.
                        </>
                    }
                    example={<>Upper Primary · Class VI – VIII · Board of Secondary Education, Odisha · Subjects: Odia, English, Hindi / Sanskrit, Mathematics, Science, Social Science</>}
                    items={data.programs}
                    onChange={(programs) => setData({ ...data, programs })}
                    newItem={() => ({
                        id: "",
                        icon: "BookOpen",
                        title: "",
                        board: "",
                        level: "",
                        color: COLOR_PRESETS[0].gradient,
                        bgColor: COLOR_PRESETS[0].bg,
                        textColor: COLOR_PRESETS[0].text,
                        description: "",
                        features: [],
                        subjects: [],
                    })}
                    renderItem={(item, update) => (
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Program name" hint="e.g. Upper Primary.">
                                <TextInput
                                    value={item.title}
                                    // A new program gets its link id from its name; an existing id is kept.
                                    onChange={(title) => update(item.id ? { title } : { title, id: slugify(title) })}
                                    placeholder="Upper Primary"
                                    maxLength={40}
                                />
                            </Field>
                            <Field label="Classes" hint="Which classes this covers.">
                                <TextInput value={item.level} onChange={(level) => update({ level })} placeholder="Class VI – VIII" maxLength={40} />
                            </Field>
                            <Field label="Board" optional hint="The board or curriculum followed.">
                                <TextInput value={item.board} onChange={(board) => update({ board })} placeholder="Board of Secondary Education, Odisha" maxLength={60} />
                            </Field>
                            <Field
                                label="Link id"
                                hint="Made from the name automatically, e.g. upper-primary. Don't change it once other pages link to it."
                                info="Used in links like /academics#upper-primary — the home page cards and the footer jump straight to this program."
                            >
                                <TextInput value={item.id} onChange={(id) => update({ id: slugify(id) })} placeholder="upper-primary" maxLength={30} />
                            </Field>
                            <Field label="Description" hint="2–3 sentences about learning at this stage." full>
                                <TextArea value={item.description} onChange={(description) => update({ description })} rows={3} maxLength={400} />
                            </Field>
                            <Field label="Icon">
                                <IconPicker value={item.icon} onChange={(icon) => update({ icon })} />
                            </Field>
                            <Field as="div" label="Colour" hint="Colour of this program's icon and board label.">
                                <ColorPresetPicker gradient={item.color} onChange={(p) => update({ color: p.gradient, bgColor: p.bg, textColor: p.text })} />
                            </Field>
                            <Field as="div" label="Key features" hint="3–6 short points, e.g. “Activity-based learning”, “Weekly tests”." full>
                                <StringListEditor items={item.features} onChange={(features) => update({ features })} placeholder="Activity-based learning" addLabel="+ Add feature" />
                            </Field>
                            <Field as="div" label="Subjects taught" hint="Every subject at this stage, each with an icon." full>
                                <SubjectsEditor value={item.subjects} onChange={(subjects) => update({ subjects })} />
                            </Field>
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
                        placeholder="Mathematics" aria-label={`Subject ${i + 1}`}
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500" />
                    <button type="button" onClick={() => onChange(value.filter((_, ix) => ix !== i))}
                        className="rounded p-2 text-red-700 hover:bg-red-50" aria-label="Remove subject">×</button>
                </div>
            ))}
            <button type="button" onClick={() => onChange([...value, { icon: "BookOpen", name: "" }])}
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100">
                + Add subject
            </button>
        </div>
    );
}
