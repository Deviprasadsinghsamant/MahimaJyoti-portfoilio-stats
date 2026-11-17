// Privacy policy for the Mahima Jyoti app and the school portal. Google Play
// requires its URL in the store listing and a link inside the app. Keep it in
// step with what the app and portal actually collect (mj-app/, mj-func/).
import type { Metadata } from "next";
import { SchoolContact } from "@/components/privacy/SchoolContact";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "How the Mahima Jyoti app and the school portal handle students', parents' and staff members' information.",
};

const LAST_UPDATED = "15 November 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="space-y-3">
            <h2 className="text-xl font-heading font-bold text-navy-950">{title}</h2>
            {children}
        </section>
    );
}

function List({ items }: { items: React.ReactNode[] }) {
    return (
        <ul className="list-disc space-y-2 pl-5">
            {items.map((item, i) => (
                <li key={i}>{item}</li>
            ))}
        </ul>
    );
}

export default function PrivacyPage() {
    return (
        <>
            <section className="relative pt-32 pb-16 bg-navy-950 overflow-hidden">
                <div className="container-narrow mx-auto px-4 sm:px-6 relative">
                    <span className="inline-block px-4 py-1.5 rounded-full border border-gold-500/20 bg-gold-500/5 text-gold-400 text-xs font-semibold tracking-wider uppercase mb-6">
                        Privacy
                    </span>
                    <h1 className="text-4xl md:text-5xl font-heading font-bold text-white leading-tight">Privacy Policy</h1>
                    <p className="mt-6 text-lg text-ivory-400/70 max-w-2xl leading-relaxed">
                        How Mahima Jyoti Awasika Vidyapitha handles information in the Mahima Jyoti app and the school
                        portal.
                    </p>
                    <p className="mt-4 text-sm text-ivory-500/60">Last updated: {LAST_UPDATED}</p>
                </div>
            </section>

            <section className="section-padding bg-white">
                <div className="container-narrow mx-auto max-w-3xl space-y-10 text-[15px] leading-relaxed text-navy-800">
                    <Section title="Who we are">
                        <p>
                            Mahima Jyoti Awasika Vidyapitha (&ldquo;the school&rdquo;, &ldquo;we&rdquo;) runs the
                            <strong> Mahima Jyoti</strong> mobile app and the staff portal on this website. Parents use
                            the app to see their children&apos;s marks and attendance; teachers and school staff use the
                            app and the portal to record attendance and results. This policy explains what information
                            is involved, how it is used and who can see it.
                        </p>
                    </Section>

                    <Section title="Information the school keeps">
                        <p>These are the school&apos;s own records, entered by school staff:</p>
                        <List
                            items={[
                                <>
                                    <strong>Students:</strong> name, Student ID, class and section, roll number, gender,
                                    parent or guardian&apos;s name, the parent mobile numbers given to the school,
                                    admission year, exam marks and daily attendance.
                                </>,
                                <>
                                    <strong>Teachers and staff:</strong> name, mobile number (used as their login), role,
                                    and the classes and subjects they teach.
                                </>,
                            ]}
                        />
                    </Section>

                    <Section title="Information the app uses">
                        <List
                            items={[
                                <>
                                    <strong>Parent sign-in:</strong> you enter your child&apos;s Student ID and a mobile
                                    number. We check them against the school&apos;s records; if they match, the app
                                    downloads that child&apos;s profile, marks and attendance. No account is created.
                                </>,
                                <>
                                    <strong>Notifications:</strong> to send new marks and attendance to your phone, the app
                                    registers a notification token (an identifier from Google&apos;s Firebase Cloud
                                    Messaging) together with the children signed in on that phone.
                                </>,
                                <>
                                    <strong>Teacher sign-in:</strong> teachers sign in with the phone number and password
                                    the school gave them. Passwords are handled by Google Firebase Authentication; the
                                    school never sees them.
                                </>,
                                <>
                                    <strong>Stored on your phone:</strong> the marks and attendance of the children you
                                    added (parents), or the class and student lists (teachers). This stays on the phone and
                                    is deleted when you remove a child, sign out, or uninstall the app.
                                </>,
                                <>
                                    <strong>Security limits:</strong> wrong Student ID and mobile number attempts are
                                    counted for an hour to stop guessing, and a phone can download a child&apos;s full
                                    record once a day.
                                </>,
                            ]}
                        />
                        <p>
                            The app asks only for permission to show notifications. It does not use your location,
                            contacts, camera, microphone, photos or files, contains no advertising, and does not track you
                            across other apps or websites.
                        </p>
                    </Section>

                    <Section title="How the information is used">
                        <List
                            items={[
                                "To show parents their own children's marks and attendance.",
                                "To notify parents when marks are entered and when a child is marked absent.",
                                "To let teachers take their class's attendance and look up students' results for school work.",
                                "To let the school office manage records and see school-wide results.",
                            ]}
                        />
                        <p>We do not sell any information, and we do not use it for advertising or marketing.</p>
                    </Section>

                    <Section title="Who can see it">
                        <List
                            items={[
                                <>
                                    <strong>Parents</strong> see only the children whose Student ID and registered mobile
                                    number they entered.
                                </>,
                                <>
                                    <strong>Teachers and staff</strong> see student records for their school work. Marks
                                    are read-only in the app. A class teacher takes their own class&apos;s attendance;
                                    once saved, only the principal can correct it.
                                </>,
                                <>
                                    <strong>The principal and school office</strong> can see and manage all records.
                                </>,
                                <>
                                    <strong>Google Firebase</strong> stores and processes the data for the school as a
                                    service provider (database in Mumbai, India; sign-in; notifications). It does not use
                                    it for its own purposes.
                                </>,
                            ]}
                        />
                        <p>We do not share information with anyone else, except where the law requires it.</p>
                    </Section>

                    <Section title="Security">
                        <p>
                            All information travels over encrypted connections (HTTPS). Access is checked on the
                            school&apos;s servers by role — parent, teacher, or principal — not only inside the app.
                        </p>
                    </Section>

                    <Section title="How long we keep it">
                        <p>
                            Student and staff records are kept as part of the school&apos;s academic records for as long
                            as the school needs them. A phone&apos;s notification token is deleted when its last child is
                            removed, or automatically once Google reports that the app is no longer installed.
                        </p>
                    </Section>

                    <Section title="Your choices">
                        <List
                            items={[
                                "Remove a child from the app (on the child's screen). Their information is deleted from your phone and notifications for them stop.",
                                "Turn notifications off in your phone's settings at any time.",
                                "Ask the school office to correct a record, or to change or remove a mobile number — this also changes who can sign in for that child.",
                                "Ask the school office to delete information the school doesn't need to keep. Teachers can sign out of the app at any time.",
                            ]}
                        />
                    </Section>

                    <Section title="Children">
                        <p>
                            The app is meant for parents, guardians and school staff, not for children to use. Information
                            about students comes from the school&apos;s own records.
                        </p>
                    </Section>

                    <Section title="Changes to this policy">
                        <p>
                            If what we collect or how we use it changes, we will update this page and the date at the top.
                        </p>
                    </Section>

                    <Section title="Contact">
                        <p>For questions or requests about your information, contact the school office:</p>
                        <SchoolContact />
                    </Section>
                </div>
            </section>
        </>
    );
}
