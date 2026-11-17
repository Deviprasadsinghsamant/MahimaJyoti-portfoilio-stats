"use client";

import { AdminFormShell } from "@/components/portal/admin/AdminFormShell";
import { Field, TextArea, TextInput } from "@/components/portal/admin/Help";
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

// A typical admission journey, shown as a picture of what to write.
const SAMPLE_FLOW = ["Enquiry & campus visit", "Collect the form", "Submit with documents", "Entrance test / interaction", "Fee payment & confirmation"];

function SampleFlow() {
    return (
        <span className="mt-1 flex flex-wrap items-center gap-1.5">
            {SAMPLE_FLOW.map((step, i) => (
                <span key={step} className="inline-flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-white px-2 py-0.5">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">{i + 1}</span>
                        {step}
                    </span>
                    {i < SAMPLE_FLOW.length - 1 && <span aria-hidden>→</span>}
                </span>
            ))}
        </span>
    );
}

export default function AdmissionsAdmin() {
    return (
        <AdminFormShell<AdmissionsContent>
            title="Admissions page"
            subtitle="How a family gets a child admitted: the steps, who is eligible, and the fees."
            publicPath="/admissions"
            load={() => getSiteContent("admissions")}
            empty={empty}
            save={(d) => saveSiteContent("admissions", d)}
        >
            {({ data, setData }) => (
                <>
                    <SectionArrayEditor
                        title="1. Admission process (steps)"
                        subtitle="The steps a family follows, in order, from first enquiry to confirmed admission."
                        where="Admissions page, “Admission Process” — numbered cards"
                        recommended={{ min: 4, max: 5 }}
                        noun="step"
                        itemTitle={(s) => s.title}
                        help={
                            <>
                                4 or 5 steps is ideal — fewer feels vague, more feels complicated. Give each a short title (2–4 words)
                                and one sentence saying what the family does and when. Steps are numbered automatically in the order
                                listed; use the arrows to reorder.
                            </>
                        }
                        example={
                            <>
                                a typical flow —
                                <SampleFlow />
                            </>
                        }
                        items={data.steps}
                        onChange={(steps) => setData({ ...data, steps: steps.map((s, i) => ({ ...s, step: i + 1 })) })}
                        newItem={() => ({ step: data.steps.length + 1, icon: "FileText", title: "", desc: "" })}
                        renderItem={(item, update) => (
                            <div className="grid gap-4 md:grid-cols-2">
                                <Field label="Step title" hint="2–4 words, e.g. “Submit with documents”.">
                                    <TextInput value={item.title} onChange={(title) => update({ title })} placeholder="Submit with documents" maxLength={30} />
                                </Field>
                                <Field label="Icon">
                                    <IconPicker value={item.icon} onChange={(icon) => update({ icon })} />
                                </Field>
                                <Field label="What the family does" hint="One sentence — what, where and when." full>
                                    <TextArea
                                        value={item.desc}
                                        onChange={(desc) => update({ desc })}
                                        rows={2}
                                        maxLength={160}
                                        placeholder="Return the filled form at the school office with the documents listed below, before 31 March."
                                    />
                                </Field>
                            </div>
                        )}
                    />

                    <SectionArrayEditor
                        title="2. Who can apply (eligibility)"
                        subtitle="One card per entry class or class group, listing age, documents and any test."
                        where="Admissions page, “Eligibility Criteria”"
                        recommended={{ min: 2, max: 4 }}
                        noun="class group"
                        itemTitle={(e) => e.program}
                        help={
                            <>
                                Think of the classes children join at — e.g. <em>Class IV</em>, <em>Class VI</em>, <em>Class IX</em> — and
                                list what each needs, one requirement per line: age limit, previous report card, transfer
                                certificate, birth certificate, Aadhaar, photos, entrance test.
                            </>
                        }
                        example={<>Class IV entry → “Age 9 or above on 1 June”, “Class III report card”, “Transfer certificate”, “Birth certificate”, “Aadhaar card (copy)”, “2 passport photos”</>}
                        items={data.eligibility}
                        onChange={(eligibility) => setData({ ...data, eligibility })}
                        newItem={() => ({ icon: "BookOpen", program: "", requirements: [] })}
                        renderItem={(item, update) => (
                            <div className="grid gap-4 md:grid-cols-2">
                                <Field label="Class or class group" hint="e.g. “Class IV entry” or “Class VI – VIII”.">
                                    <TextInput value={item.program} onChange={(program) => update({ program })} placeholder="Class IV entry" maxLength={40} />
                                </Field>
                                <Field label="Icon">
                                    <IconPicker value={item.icon} onChange={(icon) => update({ icon })} />
                                </Field>
                                <Field as="div" label="Requirements" hint="One per line — age, documents, test." full>
                                    <StringListEditor
                                        items={item.requirements}
                                        onChange={(requirements) => update({ requirements })}
                                        placeholder="Birth certificate (copy)"
                                        addLabel="+ Add requirement"
                                    />
                                </Field>
                            </div>
                        )}
                    />

                    <SectionArrayEditor
                        title="3. Fees"
                        subtitle="One row per class group with the yearly fee."
                        where="Admissions page, fee table (with a note that fees are indicative)"
                        recommended={{ min: 2, max: 5 }}
                        noun="fee row"
                        itemTitle={(f) => (f.range ? `${f.label} — ${f.range}` : f.label)}
                        help="Write what the amount covers if it differs between rows (tuition, hostel, meals). Update every session — out-of-date fees cause confusion."
                        example={<>“Class IV – V (tuition + hostel)” → “₹ … per year” · “Class IX – X (tuition + hostel)” → “₹ … – ₹ … per year”</>}
                        items={data.feeHighlights}
                        onChange={(feeHighlights) => setData({ ...data, feeHighlights })}
                        newItem={() => ({ label: "", range: "" })}
                        renderItem={(item, update) => (
                            <div className="grid gap-4 md:grid-cols-2">
                                <Field label="Classes" hint="And what's included, if useful.">
                                    <TextInput value={item.label} onChange={(label) => update({ label })} placeholder="Class IV – V (tuition + hostel)" maxLength={50} />
                                </Field>
                                <Field label="Fee" hint="Amount or range, per year.">
                                    <TextInput value={item.range} onChange={(range) => update({ range })} placeholder="₹ 30,000 per year" maxLength={40} />
                                </Field>
                            </div>
                        )}
                    />
                </>
            )}
        </AdminFormShell>
    );
}
