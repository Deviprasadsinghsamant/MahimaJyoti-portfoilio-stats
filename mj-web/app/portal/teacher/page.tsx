import Link from "next/link";
import { RoleGate } from "@/components/portal/RoleGate";
import { DashboardHeader } from "@/components/portal/DashboardHeader";
import { Card } from "@/components/portal/ui/Card";

export default function TeacherHome() {
    return (
        <RoleGate allow={["teacher"]}>
            <DashboardHeader
                title="Welcome back"
                subtitle="Mark attendance, upload syllabus, enter results, and manage your subjects."
            />
            <div className="grid gap-4 p-4 md:grid-cols-2 md:p-8">
                <Shortcut href="/portal/attendance" title="Mark attendance" desc="Roster with one-tap present/absent toggles." />
                <Shortcut href="/portal/results" title="Enter results" desc="Marks per student for unit test, midterm, or final." />
                <Shortcut href="/portal/syllabus" title="Upload syllabus" desc="Course timeline and weekly plan per subject." />
                <Shortcut href="/portal/subjects" title="Manage subjects" desc="Add subjects you teach. Delete only your own." />
            </div>
        </RoleGate>
    );
}

function Shortcut({ href, title, desc }: { href: string; title: string; desc: string }) {
    return (
        <Link href={href} className="group">
            <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="text-base font-semibold text-slate-900">{title}</div>
                <p className="mt-1 text-sm text-slate-600">{desc}</p>
            </Card>
        </Link>
    );
}
