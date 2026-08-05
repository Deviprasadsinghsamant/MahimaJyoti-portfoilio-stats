import Link from "next/link";
import { RoleGate } from "@/components/portal/RoleGate";
import { DashboardHeader } from "@/components/portal/DashboardHeader";
import { Card } from "@/components/portal/ui/Card";

export default function AdminHome() {
    return (
        <RoleGate allow={["admin"]}>
            <DashboardHeader
                title="Welcome back"
                subtitle="Full access to students, staff, classes, results, and school-wide KPIs."
            />
            <div className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-3 md:p-8">
                <Shortcut
                    href="/portal/kpis"
                    title="KPIs & Analytics"
                    desc="Aggregated performance across teachers, classes, and subjects."
                    accent="from-blue-500 to-indigo-600"
                />
                <Shortcut
                    href="/portal/students"
                    title="Students"
                    desc="Add, edit, opt-out. See every student in every class."
                    accent="from-emerald-500 to-teal-600"
                />
                <Shortcut
                    href="/portal/attendance"
                    title="Attendance"
                    desc="Review or correct any class-day."
                    accent="from-amber-500 to-orange-600"
                />
                <Shortcut
                    href="/portal/results"
                    title="Results"
                    desc="Enter or edit marks per subject and exam."
                    accent="from-fuchsia-500 to-pink-600"
                />
                <Shortcut
                    href="/portal/syllabus"
                    title="Syllabus"
                    desc="Course structures uploaded by teachers."
                    accent="from-cyan-500 to-sky-600"
                />
                <Shortcut
                    href="/portal/promotion"
                    title="Annual Promotion"
                    desc="Advance every active student to the next grade in one atomic batch."
                    accent="from-violet-500 to-purple-600"
                />
            </div>
        </RoleGate>
    );
}

function Shortcut({ href, title, desc, accent }: { href: string; title: string; desc: string; accent: string }) {
    return (
        <Link href={href} className="group">
            <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
                <div className={`mb-3 h-1 w-10 rounded-full bg-gradient-to-r ${accent}`} />
                <div className="text-base font-semibold text-slate-900">{title}</div>
                <p className="mt-1 text-sm text-slate-600">{desc}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-blue-700 opacity-0 transition group-hover:opacity-100">
                    Open
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                </div>
            </Card>
        </Link>
    );
}
