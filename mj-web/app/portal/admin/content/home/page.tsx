"use client";

import { AdminFormShell } from "@/components/portal/admin/AdminFormShell";
import { ColorPresetPicker } from "@/components/portal/admin/ColorPresetPicker";
import { Field, TextArea, TextInput } from "@/components/portal/admin/Help";
import { ImageField } from "@/components/portal/admin/ImageField";
import { SectionArrayEditor, SectionCard, StringListEditor } from "@/components/portal/admin/SectionArrayEditor";
import { IconPicker } from "@/components/portal/admin/IconPicker";
import { getSiteContent, saveSiteContent } from "@/lib/portal/content";
import { COLOR_PRESETS } from "@/lib/portal/colorPresets";
import type { HomeContent, HomeCta, HomeHero, WhyChooseUs } from "@/domain/portal/content-types";

const emptyHero = (): HomeHero => ({ badge: "", titleLine1: "", titleLine2: "", intro: "", photoUrl: null });
const emptyWhy = (): WhyChooseUs => ({
    titleLine1: "",
    titleLine2: "",
    text: "",
    points: [],
    photoUrl: null,
    badgeValue: "",
    badgeLabel: "",
});
const emptyCta = (): HomeCta => ({ title: "", text: "" });

const emptyHome = (): HomeContent => ({
    hero: emptyHero(),
    stats: [],
    whyChooseUs: emptyWhy(),
    cta: emptyCta(),
    academicPathways: [],
    highlights: [],
    notices: [],
    testimonials: [],
    updatedAt: 0,
});

export default function HomeAdmin() {
    return (
        <AdminFormShell<HomeContent>
            title="Home page"
            subtitle="The front page of the website — sections below are in the same order as on the page."
            publicPath="/"
            load={() => getSiteContent("home")}
            empty={emptyHome}
            save={(d) => saveSiteContent("home", d)}
        >
            {({ data, setData }) => {
                const hero = data.hero ?? emptyHero();
                const why = data.whyChooseUs ?? emptyWhy();
                const cta = data.cta ?? emptyCta();
                const setHero = (patch: Partial<HomeHero>) => setData({ ...data, hero: { ...hero, ...patch } });
                const setWhy = (patch: Partial<WhyChooseUs>) => setData({ ...data, whyChooseUs: { ...why, ...patch } });
                const setCta = (patch: Partial<HomeCta>) => setData({ ...data, cta: { ...cta, ...patch } });
                const whyShown = !!(why.titleLine1 || why.titleLine2 || why.text || why.points.length);
                return (
                    <>
                        <SectionCard
                            title="1. Banner"
                            subtitle="The big heading at the very top — the first thing every visitor sees."
                            where="Home page, top of the screen"
                            state={hero.titleLine1 || hero.intro ? "shown" : "default"}
                            help={
                                <>
                                    Keep it short: a two-line heading and one or two sentences about the school. The photo goes
                                    <strong> behind</strong> the text, darkened, so pick a calm, wide photo. Until you fill this
                                    in, a general welcome line is shown.
                                </>
                            }
                            example={<>Badge “Admissions Open 2027-28” · Heading “Nurturing Minds,” / “Shaping Futures” · Introduction “A residential school in Angul, Odisha, for Classes IV to X.”</>}
                        >
                            <div className="grid gap-4 md:grid-cols-2">
                                <Field label="Badge" optional hint="A short announcement in a small pill above the heading. Leave blank to hide." full>
                                    <TextInput value={hero.badge} onChange={(badge) => setHero({ badge })} placeholder="Admissions Open 2027-28" maxLength={40} />
                                </Field>
                                <Field label="Heading — first line" hint="Large white text.">
                                    <TextInput value={hero.titleLine1} onChange={(titleLine1) => setHero({ titleLine1 })} placeholder="Nurturing Minds," maxLength={30} />
                                </Field>
                                <Field label="Heading — second line" hint="Large gold text under the first line.">
                                    <TextInput value={hero.titleLine2} onChange={(titleLine2) => setHero({ titleLine2 })} placeholder="Shaping Futures" maxLength={30} />
                                </Field>
                                <Field label="Introduction" hint="One or two sentences: who the school is and for whom." full>
                                    <TextArea value={hero.intro} onChange={(intro) => setHero({ intro })} rows={2} maxLength={180} placeholder="A residential school in Angul, Odisha, for Classes IV to X." />
                                </Field>
                                <Field as="div" label="Background photo" optional full info="A wide (landscape) photo of the campus or an assembly. Keep the main subject in the centre — phones crop the sides.">
                                    <ImageField slot="hero" subpath="home" value={hero.photoUrl} onChange={(photoUrl) => setHero({ photoUrl })} />
                                </Field>
                            </div>
                        </SectionCard>

                        <SectionArrayEditor
                            title="2. Highlight badges"
                            subtitle="Small icon + text tiles under the banner buttons — quick facts about the school."
                            where="Home page, bottom of the banner"
                            recommended={{ min: 3, max: 4 }}
                            noun="badge"
                            itemTitle={(h) => h.text}
                            help="Two to four words each. Four fill one neat row on a computer (2 × 2 on phones)."
                            example={<>Residential campus · Classes IV – X · Experienced teachers · Library &amp; science lab</>}
                            items={data.highlights}
                            onChange={(highlights) => setData({ ...data, highlights })}
                            newItem={() => ({ icon: "Star", text: "" })}
                            renderItem={(item, update) => (
                                <div className="grid gap-4 md:grid-cols-2">
                                    <Field label="Icon" hint="A small picture before the text.">
                                        <IconPicker value={item.icon} onChange={(icon) => update({ icon })} />
                                    </Field>
                                    <Field label="Text" hint="2–4 words.">
                                        <TextInput value={item.text} onChange={(text) => update({ text })} placeholder="Residential campus" maxLength={30} />
                                    </Field>
                                </div>
                            )}
                        />

                        <SectionArrayEditor
                            title="3. Academic pathways"
                            subtitle="One card for each stage of schooling the school offers."
                            where="Home page, “Academic Pathways” — three cards in a row"
                            recommended={{ min: 3, max: 3 }}
                            noun="card"
                            itemTitle={(p) => p.title}
                            help={
                                <>
                                    Each card links to the Academics page. Use the same stages as the Academics page programs. A photo is
                                    optional — if you add one, add one to every card so the row looks even.
                                </>
                            }
                            example={<>Primary — “Class IV – V” · Upper Primary — “Class VI – VIII” · Secondary — “Class IX – X · BSE Odisha”</>}
                            items={data.academicPathways}
                            onChange={(academicPathways) => setData({ ...data, academicPathways })}
                            newItem={() => ({
                                icon: "BookOpen",
                                title: "",
                                subtitle: "",
                                description: "",
                                gradient: COLOR_PRESETS[0].gradient,
                                glow: COLOR_PRESETS[0].glow,
                                href: "/academics",
                                photoUrl: null,
                            })}
                            renderItem={(item, update) => (
                                <div className="grid gap-4 md:grid-cols-2">
                                    <Field label="Title" hint="The stage, e.g. Upper Primary.">
                                        <TextInput value={item.title} onChange={(title) => update({ title })} placeholder="Upper Primary" maxLength={30} />
                                    </Field>
                                    <Field label="Classes" hint="Which classes (and board), shown in gold under the title.">
                                        <TextInput value={item.subtitle} onChange={(subtitle) => update({ subtitle })} placeholder="Class VI – VIII" maxLength={40} />
                                    </Field>
                                    <Field label="Description" hint="One or two sentences about this stage." full>
                                        <TextArea value={item.description} onChange={(description) => update({ description })} rows={2} maxLength={200} />
                                    </Field>
                                    <Field label="Icon">
                                        <IconPicker value={item.icon} onChange={(icon) => update({ icon })} />
                                    </Field>
                                    <Field
                                        label="Opens page"
                                        hint="Usually /academics. Add #slug to jump to that program, e.g. /academics#upper-primary."
                                    >
                                        <TextInput value={item.href} onChange={(href) => update({ href })} placeholder="/academics" />
                                    </Field>
                                    <Field as="div" label="Colour" hint="Colour of the card's icon and top stripe." full>
                                        <ColorPresetPicker gradient={item.gradient} onChange={(p) => update({ gradient: p.gradient, glow: p.glow })} />
                                    </Field>
                                    <Field as="div" label="Photo" optional full info="Students of this stage in class. Use the same style of photo on all three cards.">
                                        <ImageField slot="pathway" subpath="home/pathways" value={item.photoUrl ?? null} onChange={(photoUrl) => update({ photoUrl })} />
                                    </Field>
                                </div>
                            )}
                        />

                        <SectionArrayEditor
                            title="4. Numbers strip"
                            subtitle="Big counting numbers on a dark band — real figures about the school."
                            where="Home page, dark band under the pathway cards"
                            recommended={{ min: 3, max: 4 }}
                            noun="number"
                            itemTitle={(s) => (s.label ? `${s.value}${s.suffix} ${s.label}` : "")}
                            help="Use exact, current figures and update them each session. Four fill one row."
                            example={<>311 → Students · 18 → Teachers · 11 → Class sections · 7 → Classes (IV – X)</>}
                            items={data.stats ?? []}
                            onChange={(stats) => setData({ ...data, stats })}
                            newItem={() => ({ value: 0, suffix: "", label: "" })}
                            renderItem={(item, update) => (
                                <div className="grid gap-4 md:grid-cols-3">
                                    <Field label="Number">
                                        <input
                                            type="number"
                                            min={0}
                                            value={item.value}
                                            onChange={(e) => update({ value: Math.max(0, Number(e.target.value) || 0) })}
                                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </Field>
                                    <Field label="After the number" optional hint="e.g. + or %">
                                        <TextInput value={item.suffix} onChange={(suffix) => update({ suffix })} placeholder="+" maxLength={3} />
                                    </Field>
                                    <Field label="Label" hint="What it counts.">
                                        <TextInput value={item.label} onChange={(label) => update({ label })} placeholder="Students" maxLength={24} />
                                    </Field>
                                </div>
                            )}
                        />

                        <SectionCard
                            title="5. Why choose us"
                            subtitle="What makes the school special — a short paragraph and bullet points beside a photo."
                            where="Home page, under the numbers"
                            state={whyShown ? "shown" : "hidden"}
                            help="Be specific and honest: facilities, care, results. 4–6 points of one line each. The badge over the photo is optional — use it only for a real achievement."
                            example={<>Heading “A Home for Learning” / “and Growing” · Points: “Round-the-clock care on a residential campus”, “Experienced, caring teachers”, “Regular tests with feedback to parents”, “Library, science lab and playground”</>}
                        >
                            <div className="grid gap-4 md:grid-cols-2">
                                <Field label="Heading — first line">
                                    <TextInput value={why.titleLine1} onChange={(titleLine1) => setWhy({ titleLine1 })} placeholder="A Home for Learning" maxLength={30} />
                                </Field>
                                <Field label="Heading — second line" hint="Shown in gold.">
                                    <TextInput value={why.titleLine2} onChange={(titleLine2) => setWhy({ titleLine2 })} placeholder="and Growing" maxLength={30} />
                                </Field>
                                <Field label="Paragraph" hint="Two or three sentences." full>
                                    <TextArea value={why.text} onChange={(text) => setWhy({ text })} rows={3} maxLength={300} />
                                </Field>
                                <Field as="div" label="Bullet points" hint="4–6 points, one line each." full>
                                    <StringListEditor items={why.points} onChange={(points) => setWhy({ points })} placeholder="Experienced, caring teachers" addLabel="+ Add point" />
                                </Field>
                                <Field as="div" label="Photo" full info="Students learning — a classroom, lab, library or activity.">
                                    <ImageField slot="whyChoose" subpath="home" value={why.photoUrl} onChange={(photoUrl) => setWhy({ photoUrl })} />
                                </Field>
                                <Field label="Badge on photo — big text" optional hint="e.g. 100%. Leave blank to hide the badge.">
                                    <TextInput value={why.badgeValue} onChange={(badgeValue) => setWhy({ badgeValue })} placeholder="100%" maxLength={8} />
                                </Field>
                                <Field label="Badge — small text" optional hint="What the big text means.">
                                    <TextInput value={why.badgeLabel} onChange={(badgeLabel) => setWhy({ badgeLabel })} placeholder="Class X pass rate 2026" maxLength={30} />
                                </Field>
                            </div>
                        </SectionCard>

                        <SectionArrayEditor
                            title="6. Notice board"
                            subtitle="Short announcements: exams, holidays, admissions, events."
                            where="Home page, “Notices & Events”"
                            recommended={{ min: 3, max: 6 }}
                            noun="notice"
                            itemTitle={(n) => n.title}
                            help={
                                <>
                                    All notices are shown in the order listed — put the newest first (use the arrows) and delete old
                                    ones. To attach a circular (PDF): upload it to Google Drive, set sharing to “Anyone with the link”, and
                                    paste that link in <em>Link</em>.
                                </>
                            }
                            example={<>Date “20 Nov 2026” · Tag “Exams” · Notice “Half-yearly examinations begin on 1 December”</>}
                            items={data.notices}
                            onChange={(notices) => setData({ ...data, notices })}
                            newItem={() => ({ date: "", title: "", tag: "Notice", link: "" })}
                            renderItem={(item, update) => (
                                <div className="grid gap-4 md:grid-cols-3">
                                    <Field label="Date" hint="As you'd write it.">
                                        <TextInput value={item.date} onChange={(date) => update({ date })} placeholder="20 Nov 2026" maxLength={20} />
                                    </Field>
                                    <Field label="Tag" hint="One word: Exams, Holiday, Admissions, Event, Result.">
                                        <TextInput value={item.tag} onChange={(tag) => update({ tag })} placeholder="Exams" maxLength={15} />
                                    </Field>
                                    <Field label="Link" optional hint="A page (/admissions) or a full web address.">
                                        <TextInput value={item.link ?? ""} onChange={(link) => update({ link })} placeholder="https://…" />
                                    </Field>
                                    <Field label="Notice" hint="One clear sentence." full>
                                        <TextInput value={item.title} onChange={(title) => update({ title })} placeholder="Half-yearly examinations begin on 1 December" maxLength={100} />
                                    </Field>
                                </div>
                            )}
                        />

                        <SectionArrayEditor
                            title="7. Testimonials"
                            subtitle="Short, genuine words from parents, students or alumni."
                            where="Home page, “Voices of Our Community” — three per row"
                            recommended={{ min: 3, max: 6 }}
                            noun="testimonial"
                            itemTitle={(t) => t.name}
                            help="Only publish with the person's permission. 3 or 6 look best (full rows). A photo is optional — shown as a small circle."
                            example={<>“My daughter has grown so much more confident here. The teachers know every child by name.” — Parent, Class VIII</>}
                            items={data.testimonials}
                            onChange={(testimonials) => setData({ ...data, testimonials })}
                            newItem={() => ({ name: "", role: "", quote: "", photoUrl: null })}
                            renderItem={(item, update) => (
                                <div className="grid gap-4 md:grid-cols-2">
                                    <Field label="Name">
                                        <TextInput value={item.name} onChange={(name) => update({ name })} maxLength={40} />
                                    </Field>
                                    <Field label="Who they are" hint="e.g. Parent, Class VIII · Alumnus, batch of 2020">
                                        <TextInput value={item.role} onChange={(role) => update({ role })} placeholder="Parent, Class VIII" maxLength={40} />
                                    </Field>
                                    <Field label="Quote" hint="2–4 sentences, in their own words." full>
                                        <TextArea value={item.quote} onChange={(quote) => update({ quote })} rows={3} maxLength={300} />
                                    </Field>
                                    <Field as="div" label="Photo" optional>
                                        <ImageField slot="testimonial" subpath="home/testimonials" value={item.photoUrl ?? null} onChange={(photoUrl) => update({ photoUrl })} />
                                    </Field>
                                </div>
                            )}
                        />

                        <SectionCard
                            title="8. Closing banner"
                            subtitle="The dark band at the bottom with “Apply Now” and “Contact Us” buttons."
                            where="Home page, bottom (above the footer)"
                            state={cta.title || cta.text ? "shown" : "default"}
                            help="An invitation to get in touch. Until filled in, a general invitation is shown."
                            example={<>Heading “Admissions open for 2027-28” · Text “Visit the school office or call us to know more.”</>}
                        >
                            <div className="grid gap-4 md:grid-cols-2">
                                <Field label="Heading">
                                    <TextInput value={cta.title} onChange={(title) => setCta({ title })} placeholder="Admissions open for 2027-28" maxLength={50} />
                                </Field>
                                <Field label="Text" hint="One sentence.">
                                    <TextInput value={cta.text} onChange={(text) => setCta({ text })} placeholder="Visit the school office or call us to know more." maxLength={140} />
                                </Field>
                            </div>
                        </SectionCard>
                    </>
                );
            }}
        </AdminFormShell>
    );
}
