"use client";

import { AdminFormShell } from "@/components/portal/admin/AdminFormShell";
import { Field, TextArea, TextInput } from "@/components/portal/admin/Help";
import { ImageField } from "@/components/portal/admin/ImageField";
import { SectionArrayEditor, SectionCard } from "@/components/portal/admin/SectionArrayEditor";
import { IconPicker } from "@/components/portal/admin/IconPicker";
import { getSiteContent, saveSiteContent } from "@/lib/portal/content";
import type { AboutContent, PrincipalMessage } from "@/domain/portal/content-types";

const emptyPrincipal = (): PrincipalMessage => ({ name: "", title: "Principal", message: "", photoUrl: null });

const empty = (): AboutContent => ({
    intro: "",
    vision: "",
    mission: "",
    principal: emptyPrincipal(),
    timeline: [],
    values: [],
    infrastructure: [],
    updatedAt: 0,
});

export default function AboutAdmin() {
    return (
        <AdminFormShell<AboutContent>
            title="About page"
            subtitle="The school's story — who you are, what you stand for, and your facilities. Sections below follow the page from top to bottom."
            publicPath="/about"
            load={() => getSiteContent("about")}
            empty={empty}
            save={(d) => saveSiteContent("about", d)}
        >
            {({ data, setData }) => {
                const principal = data.principal ?? emptyPrincipal();
                const setPrincipal = (patch: Partial<PrincipalMessage>) => setData({ ...data, principal: { ...principal, ...patch } });
                return (
                    <>
                        <SectionCard
                            title="1. Introduction"
                            subtitle="One or two sentences under the page's big heading “A Legacy of Academic Excellence”."
                            where="About page, top"
                            state={data.intro ? "shown" : "default"}
                            help="Summarise the school in a breath: what kind of school, where, and for whom. Until filled in, a general line is shown."
                            example="A residential school in Hakimapada, Angul, giving children from Class IV to X a safe home and a strong education."
                        >
                            <TextArea value={data.intro ?? ""} onChange={(intro) => setData({ ...data, intro })} rows={2} maxLength={200} />
                        </SectionCard>

                        <SectionCard
                            title="2. Vision and mission"
                            subtitle="Two cards near the top of the page. Leave one blank to hide it."
                            where="About page, under the introduction"
                            state={data.vision || data.mission ? "shown" : "hidden"}
                            help={
                                <>
                                    <strong>Vision</strong> — what the school hopes to achieve in the long run.
                                    <br />
                                    <strong>Mission</strong> — how it works towards that every day. One to three sentences each.
                                </>
                            }
                            example={<>Vision “Every child leaves us confident, curious and kind.” · Mission “Through caring teachers, a disciplined residential life and close work with parents, we help each child do their best.”</>}
                        >
                            <div className="grid gap-4 md:grid-cols-2">
                                <Field label="Our vision" hint="1–3 sentences.">
                                    <TextArea value={data.vision ?? ""} onChange={(vision) => setData({ ...data, vision })} rows={4} maxLength={300} />
                                </Field>
                                <Field label="Our mission" hint="1–3 sentences.">
                                    <TextArea value={data.mission ?? ""} onChange={(mission) => setData({ ...data, mission })} rows={4} maxLength={300} />
                                </Field>
                            </div>
                        </SectionCard>

                        <SectionArrayEditor
                            title="3. Our journey (timeline)"
                            subtitle="Key moments in the school's history."
                            where="About page, timeline"
                            recommended={{ min: 3, max: 6 }}
                            noun="milestone"
                            itemTitle={(t) => (t.year ? `${t.year} — ${t.title}` : t.title)}
                            help="Real dates only, oldest first (use the arrows to reorder): founding, new buildings, first board batch, awards."
                            example={<>Year “2005” · Title “School founded” · Description “Started with Classes IV to VII and 60 students.”</>}
                            items={data.timeline}
                            onChange={(timeline) => setData({ ...data, timeline })}
                            newItem={() => ({ year: "", title: "", desc: "" })}
                            renderItem={(item, update) => (
                                <div className="grid gap-4 md:grid-cols-3">
                                    <Field label="Year">
                                        <TextInput value={item.year} onChange={(year) => update({ year })} placeholder="2005" maxLength={10} />
                                    </Field>
                                    <div className="md:col-span-2">
                                        <Field label="Title" hint="What happened, in a few words.">
                                            <TextInput value={item.title} onChange={(title) => update({ title })} placeholder="School founded" maxLength={50} />
                                        </Field>
                                    </div>
                                    <Field label="Description" hint="One sentence." full>
                                        <TextArea value={item.desc} onChange={(desc) => update({ desc })} rows={2} maxLength={200} />
                                    </Field>
                                </div>
                            )}
                        />

                        <SectionArrayEditor
                            title="4. Core values"
                            subtitle="The values the school lives by."
                            where="About page, values cards"
                            recommended={{ min: 3, max: 6 }}
                            noun="value"
                            itemTitle={(v) => v.title}
                            help="One word or short phrase each, with a sentence explaining what it means at your school."
                            example={<>Discipline · Respect · Curiosity · Service</>}
                            items={data.values}
                            onChange={(values) => setData({ ...data, values })}
                            newItem={() => ({ icon: "Target", title: "", desc: "" })}
                            renderItem={(item, update) => (
                                <div className="grid gap-4 md:grid-cols-2">
                                    <Field label="Value">
                                        <TextInput value={item.title} onChange={(title) => update({ title })} placeholder="Respect" maxLength={30} />
                                    </Field>
                                    <Field label="Icon">
                                        <IconPicker value={item.icon} onChange={(icon) => update({ icon })} />
                                    </Field>
                                    <Field label="What it means" hint="One sentence." full>
                                        <TextArea value={item.desc} onChange={(desc) => update({ desc })} rows={2} maxLength={160} />
                                    </Field>
                                </div>
                            )}
                        />

                        <SectionCard
                            title="5. Principal's message"
                            subtitle="A personal note from the principal, with a photo."
                            where="About page, dark band"
                            state={principal.name && principal.message ? "shown" : "hidden"}
                            help="Shown once both the name and the message are filled in. Write in the first person, about 80–120 words. A formal portrait photo works best."
                            example={<>“At Mahima Jyoti, every child is known and cared for. We believe in hard work, honesty and joy in learning…” — <em>[Name]</em>, Principal</>}
                        >
                            <div className="grid gap-4 md:grid-cols-2">
                                <Field label="Name">
                                    <TextInput value={principal.name} onChange={(name) => setPrincipal({ name })} maxLength={50} />
                                </Field>
                                <Field label="Title" hint="As it should appear under the name.">
                                    <TextInput value={principal.title} onChange={(title) => setPrincipal({ title })} placeholder="Principal" maxLength={50} />
                                </Field>
                                <Field label="Message" hint="About 80–120 words." full>
                                    <TextArea value={principal.message} onChange={(message) => setPrincipal({ message })} rows={6} maxLength={900} />
                                </Field>
                                <Field as="div" label="Photo" optional info="A formal portrait from the chest up, eye level, plain background.">
                                    <ImageField slot="principal" subpath="about" value={principal.photoUrl} onChange={(photoUrl) => setPrincipal({ photoUrl })} />
                                </Field>
                            </div>
                        </SectionCard>

                        <SectionArrayEditor
                            title="6. Facilities"
                            subtitle="The school's facilities — two cards per row, each with an optional photo."
                            where="About page, “Our Facilities”"
                            recommended={{ min: 4, max: 8 }}
                            noun="facility"
                            itemTitle={(f) => f.title}
                            help="An even number looks tidy (two per row). If you add photos, add one to every facility so the cards line up."
                            example={<>Library · Science lab · Computer room · Hostel · Dining hall · Playground</>}
                            items={data.infrastructure}
                            onChange={(infrastructure) => setData({ ...data, infrastructure })}
                            newItem={() => ({ icon: "Building2", title: "", desc: "", photoUrl: null })}
                            renderItem={(item, update) => (
                                <div className="grid gap-4 md:grid-cols-2">
                                    <Field label="Facility">
                                        <TextInput value={item.title} onChange={(title) => update({ title })} placeholder="Science lab" maxLength={40} />
                                    </Field>
                                    <Field label="Icon">
                                        <IconPicker value={item.icon} onChange={(icon) => update({ icon })} />
                                    </Field>
                                    <Field label="Description" hint="One sentence: what's there and how students use it." full>
                                        <TextArea value={item.desc} onChange={(desc) => update({ desc })} rows={2} maxLength={180} />
                                    </Field>
                                    <Field as="div" label="Photo" optional info="The place itself — tidy, well lit, taken from a corner to show the whole room.">
                                        <ImageField slot="infrastructure" subpath="about/infrastructure" value={item.photoUrl ?? null} onChange={(photoUrl) => update({ photoUrl })} />
                                    </Field>
                                </div>
                            )}
                        />
                    </>
                );
            }}
        </AdminFormShell>
    );
}
