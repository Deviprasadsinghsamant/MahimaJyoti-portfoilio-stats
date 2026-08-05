import Link from "next/link";
import { RoleGate } from "@/components/portal/RoleGate";
import { DashboardHeader } from "@/components/portal/DashboardHeader";
import { Card } from "@/components/portal/ui/Card";

export default function StaffHome() {
    return (
        <RoleGate allow={["staff"]}>
            <DashboardHeader
                title="Welcome back"
                subtitle="Mark attendance, add subjects, and upload results."
            />
            <div className="grid gap-4 p-4 md:grid-cols-2 md:p-8">
                <Shortcut href="/portal/attendance" title="Mark attendance" desc="Pick a class + date, tap through the roster." />
                <Shortcut href="/portal/results" title="Upload results" desc="Record marks per student across exams." />
                <Shortcut href="/portal/subjects" title="Add subjects" desc="Create subject records assigned to a teacher." />
                <Shortcut href="/portal/students" title="Students" desc="Read-only roster of every class." />
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
