"use client";

import { AdminFormShell } from "@/components/portal/admin/AdminFormShell";
import { Field, TextArea, TextInput } from "@/components/portal/admin/Help";
import { SectionCard, StringListEditor } from "@/components/portal/admin/SectionArrayEditor";
import { contactBlocks, looksLikeEmail, looksLikePhone, socialLinksFrom } from "@/lib/portal/contactLinks";
import { getSiteContent, saveSiteContent } from "@/lib/portal/content";
import type { ContactContent, ContactDetails, SocialProfiles } from "@/domain/portal/content-types";

const emptyDetails = (): ContactDetails => ({ address: "", phones: [""], whatsapp: "", emails: [""], officeHours: "" });
const emptySocial = (): SocialProfiles => ({ facebook: "", instagram: "", youtube: "", twitter: "", linkedin: "" });

const empty = (): ContactContent => ({
    details: emptyDetails(),
    social: emptySocial(),
    contactInfo: [],
    socialLinks: [],
    mapEmbedUrl: "",
    updatedAt: 0,
});

// The website shows contactInfo / socialLinks; build them from the fields here.
function withDerived(d: ContactContent): ContactContent {
    return {
        ...d,
        contactInfo: contactBlocks(d.details ?? emptyDetails()),
        socialLinks: socialLinksFrom(d.social ?? emptySocial()),
    };
}

export default function ContactAdmin() {
    return (
        <AdminFormShell<ContactContent>
            title="Contact details"
            subtitle="The school's address, phone, WhatsApp, email, office hours, social media and map. Shown on the Contact page, in the footer of every page, and in the privacy policy."
            publicPath="/contact"
            load={() => getSiteContent("contact")}
            empty={empty}
            save={(d) => saveSiteContent("contact", withDerived(d))}
        >
            {({ data, setData }) => {
                const details = data.details ?? emptyDetails();
                const social = data.social ?? emptySocial();
                const setDetails = (patch: Partial<ContactDetails>) => setData({ ...data, details: { ...details, ...patch } });
                const setSocial = (patch: Partial<SocialProfiles>) => setData({ ...data, social: { ...social, ...patch } });
                const badPhones = details.phones.filter((p) => p.trim() && !looksLikePhone(p));
                const badEmails = details.emails.filter((e) => e.trim() && !looksLikeEmail(e));
                const filled = contactBlocks(details).length > 0;
                return (
                    <>
                        <SectionCard
                            title="How to reach the school"
                            subtitle="Fill in what the school uses; anything left blank is simply not shown."
                            where="Contact page (cards at the top), the footer of every page, and the privacy policy"
                            state={filled ? "shown" : "hidden"}
                            help={
                                <>
                                    Each filled field becomes a card on the Contact page. On phones, visitors can <strong>tap</strong> a
                                    phone number to call, the WhatsApp number to open a chat, and the email to write a message.
                                    Use numbers that are answered during office hours.
                                </>
                            }
                        >
                            <div className="grid gap-5 md:grid-cols-2">
                                <Field
                                    label="School address"
                                    hint="One line per row: school name, village/area, district & PIN, state."
                                    info="Shown as written, line by line. Visitors also see the map below it on the Contact page."
                                    full
                                >
                                    <TextArea
                                        value={details.address}
                                        onChange={(address) => setDetails({ address })}
                                        rows={4}
                                        placeholder={"Mahima Jyoti Awasika Vidyapitha\nHakimapada, Angul\nOdisha – PIN code"}
                                    />
                                </Field>

                                <Field
                                    as="div"
                                    label="Phone numbers"
                                    hint="The office / reception numbers. 10-digit mobile, or landline with STD code, e.g. 06764-234567."
                                    info="Add one number per row (use “+ Add another number” for more). On phones it becomes a tap-to-call link."
                                >
                                    <StringListEditor
                                        items={details.phones}
                                        onChange={(phones) => setDetails({ phones })}
                                        placeholder="98765 43210"
                                        addLabel="+ Add another number"
                                    />
                                    {badPhones.length > 0 && (
                                        <p className="mt-1 text-[11px] text-amber-700">Check: {badPhones.join(", ")} doesn&apos;t look like a full phone number.</p>
                                    )}
                                </Field>

                                <Field
                                    label="WhatsApp number"
                                    optional
                                    hint="A number that answers on WhatsApp. Visitors tap it to start a chat."
                                    info="Use a 10-digit mobile number. The website opens WhatsApp with this number (wa.me link). Leave blank if the school doesn't use WhatsApp for enquiries."
                                >
                                    <TextInput type="tel" value={details.whatsapp} onChange={(whatsapp) => setDetails({ whatsapp })} placeholder="98765 43210" />
                                    {details.whatsapp.trim() && !looksLikePhone(details.whatsapp) && (
                                        <span className="mt-1 block text-[11px] text-amber-700">This doesn&apos;t look like a full mobile number.</span>
                                    )}
                                </Field>

                                <Field
                                    as="div"
                                    label="Email addresses"
                                    hint="The school's official email — checked regularly. Add a second one (e.g. for admissions) if needed."
                                >
                                    <StringListEditor
                                        items={details.emails}
                                        onChange={(emails) => setDetails({ emails })}
                                        placeholder="office@school.example"
                                        addLabel="+ Add another email"
                                    />
                                    {badEmails.length > 0 && (
                                        <p className="mt-1 text-[11px] text-amber-700">Check: {badEmails.join(", ")} doesn&apos;t look like an email address.</p>
                                    )}
                                </Field>

                                <Field
                                    label="Office hours"
                                    optional
                                    hint="When parents can call or visit. One line per row."
                                >
                                    <TextArea
                                        value={details.officeHours}
                                        onChange={(officeHours) => setDetails({ officeHours })}
                                        rows={2}
                                        placeholder={"Mon – Sat: 9:00 am – 4:00 pm\nSunday: closed"}
                                    />
                                </Field>
                            </div>
                        </SectionCard>

                        <SectionCard
                            title="Social media"
                            subtitle="Paste the full link to each page the school has. Leave the rest blank — only filled ones show."
                            where="Footer of every page and the Contact page (as round buttons)"
                            state={socialLinksFrom(social).length ? "shown" : "hidden"}
                            help={
                                <>
                                    Open the school&apos;s page in a browser and copy the address from the top bar — it should start with
                                    <code className="mx-1">https://</code>. Example: <code>https://www.facebook.com/YourSchoolPage</code>.
                                </>
                            }
                        >
                            <div className="grid gap-4 md:grid-cols-2">
                                <Field label="Facebook page" optional>
                                    <TextInput type="url" value={social.facebook} onChange={(facebook) => setSocial({ facebook })} placeholder="https://www.facebook.com/…" />
                                </Field>
                                <Field label="Instagram" optional>
                                    <TextInput type="url" value={social.instagram} onChange={(instagram) => setSocial({ instagram })} placeholder="https://www.instagram.com/…" />
                                </Field>
                                <Field label="YouTube channel" optional>
                                    <TextInput type="url" value={social.youtube} onChange={(youtube) => setSocial({ youtube })} placeholder="https://www.youtube.com/@…" />
                                </Field>
                                <Field label="X (Twitter)" optional>
                                    <TextInput type="url" value={social.twitter} onChange={(twitter) => setSocial({ twitter })} placeholder="https://x.com/…" />
                                </Field>
                                <Field label="LinkedIn" optional>
                                    <TextInput type="url" value={social.linkedin} onChange={(linkedin) => setSocial({ linkedin })} placeholder="https://www.linkedin.com/…" />
                                </Field>
                            </div>
                        </SectionCard>

                        <SectionCard
                            title="Map"
                            subtitle="A Google map with the school's location."
                            where="Contact page, beside the address"
                            state={data.mapEmbedUrl ? "shown" : "hidden"}
                            help={
                                <ol className="list-decimal space-y-1 pl-4">
                                    <li>Open Google Maps on a computer and search for the school.</li>
                                    <li>Click <strong>Share</strong>, then the <strong>Embed a map</strong> tab.</li>
                                    <li>Click <strong>Copy HTML</strong> and paste it in the box below.</li>
                                </ol>
                            }
                        >
                            <Field
                                label="Google Maps embed"
                                hint="Paste what Google gives you under Share → Embed a map → Copy HTML. Only the map link is kept."
                                full
                            >
                                <TextInput
                                    value={data.mapEmbedUrl}
                                    // Pasting Google's whole <iframe …> snippet keeps just its src link.
                                    onChange={(raw) => {
                                        const src = raw.match(/src=["']([^"']+)["']/)?.[1];
                                        setData({ ...data, mapEmbedUrl: (src ?? raw).trim() });
                                    }}
                                    placeholder="<iframe src=&quot;https://www.google.com/maps/embed?pb=…"
                                />
                            </Field>
                            {data.mapEmbedUrl && !data.mapEmbedUrl.startsWith("https://www.google.com/maps/embed") && (
                                <p className="mt-2 text-[11px] text-amber-700">
                                    This isn&apos;t an embed link — use Share → <strong>Embed a map</strong>, not the normal map link.
                                </p>
                            )}
                            {data.mapEmbedUrl.startsWith("https://www.google.com/maps/embed") && (
                                <iframe
                                    src={data.mapEmbedUrl}
                                    title="Map preview"
                                    className="mt-3 h-56 w-full rounded-lg border border-slate-200"
                                    loading="lazy"
                                />
                            )}
                        </SectionCard>
                    </>
                );
            }}
        </AdminFormShell>
    );
}
