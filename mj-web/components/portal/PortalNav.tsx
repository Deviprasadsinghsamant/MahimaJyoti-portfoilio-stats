"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import type { UserRole } from "@/domain/portal/types";

interface NavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
    roles: UserRole[];
    section: "primary" | "admin" | "content";
}

// Simple stroke icons — no external deps.
const Icon = {
    home: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12l9-8 9 8" /><path d="M5 10v10h14V10" />
        </svg>
    ),
    calendar: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" />
        </svg>
    ),
    users: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    book: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h12a4 4 0 0 1 4 4v12a2 2 0 0 0-2-2H4z" /><path d="M4 4v14" />
        </svg>
    ),
    award: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="6" /><path d="M8.21 13.89L7 22l5-3 5 3-1.21-8.11" />
        </svg>
    ),
    file: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
        </svg>
    ),
    stepUp: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17l5-5 5 5" /><path d="M12 12V4" />
        </svg>
    ),
    chart: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" /><path d="M7 15l4-4 4 4 5-6" />
        </svg>
    ),
    image: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="M21 15l-5-5L5 21" />
        </svg>
    ),
    userPlus: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" />
        </svg>
    ),
    grid: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
    ),
};

const NAV: NavItem[] = [
    { href: "/portal/admin", label: "Overview", icon: Icon.home, roles: ["admin"], section: "primary" },
    { href: "/portal/teacher", label: "Overview", icon: Icon.home, roles: ["teacher"], section: "primary" },
    { href: "/portal/staff", label: "Overview", icon: Icon.home, roles: ["staff"], section: "primary" },
    { href: "/portal/attendance", label: "Attendance", icon: Icon.calendar, roles: ["admin", "teacher", "staff"], section: "primary" },
    { href: "/portal/students", label: "Students", icon: Icon.users, roles: ["admin", "teacher", "staff"], section: "primary" },
    { href: "/portal/subjects", label: "Subjects", icon: Icon.book, roles: ["admin", "teacher", "staff"], section: "primary" },
    { href: "/portal/results", label: "Results", icon: Icon.award, roles: ["admin", "teacher", "staff"], section: "primary" },
    { href: "/portal/syllabus", label: "Syllabus", icon: Icon.file, roles: ["admin", "teacher"], section: "primary" },
    { href: "/portal/admin/staff", label: "Staff & Teachers", icon: Icon.userPlus, roles: ["admin"], section: "admin" },
    { href: "/portal/admin/classes", label: "Classes & Sections", icon: Icon.grid, roles: ["admin"], section: "admin" },
    { href: "/portal/promotion", label: "Annual Promotion", icon: Icon.stepUp, roles: ["admin"], section: "admin" },
    { href: "/portal/kpis", label: "KPIs & Analytics", icon: Icon.chart, roles: ["admin"], section: "admin" },
    { href: "/portal/admin/content/home", label: "Home page", icon: Icon.home, roles: ["admin"], section: "content" },
    { href: "/portal/admin/content/about", label: "About page", icon: Icon.file, roles: ["admin"], section: "content" },
    { href: "/portal/admin/content/academics", label: "Academics page", icon: Icon.book, roles: ["admin"], section: "content" },
    { href: "/portal/admin/content/admissions", label: "Admissions page", icon: Icon.stepUp, roles: ["admin"], section: "content" },
    { href: "/portal/admin/content/faculty", label: "Faculty profiles", icon: Icon.image, roles: ["admin"], section: "content" },
    { href: "/portal/admin/content/gallery", label: "Gallery", icon: Icon.image, roles: ["admin"], section: "content" },
    { href: "/portal/admin/content/contact", label: "Contact page", icon: Icon.calendar, roles: ["admin"], section: "content" },
];

const ROLE_TONE: Record<UserRole, string> = {
    admin: "bg-blue-100 text-blue-800",
    teacher: "bg-emerald-100 text-emerald-800",
    staff: "bg-amber-100 text-amber-800",
};

export function PortalNav() {
    const { portalUser, role, signOut } = useAuth();
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    if (!role) return null;

    const items = NAV.filter((item) => item.roles.includes(role));
    const primary = items.filter((i) => i.section === "primary");
    const admin = items.filter((i) => i.section === "admin");
    const content = items.filter((i) => i.section === "content");

    const initials = (portalUser?.displayName ?? "?")
        .split(/\s+/)
        .slice(0, 2)
        .map((s) => s[0])
        .join("")
        .toUpperCase();

    return (
        <>
            {/* Mobile top bar */}
            <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
                <button
                    onClick={() => setOpen(true)}
                    aria-label="Open navigation"
                    className="rounded-lg p-2 text-slate-700 hover:bg-slate-100"
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 5h14M3 10h14M3 15h14" />
                    </svg>
                </button>
                <BrandMark compact />
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${ROLE_TONE[role]}`}>
                    {initials}
                </div>
            </div>

            {open && (
                <div
                    onClick={() => setOpen(false)}
                    className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
                />
            )}

            <aside
                className={
                    "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0 " +
                    (open ? "translate-x-0" : "-translate-x-full md:translate-x-0")
                }
            >
                <div className="flex items-center justify-between px-5 py-5">
                    <BrandMark />
                    <button
                        onClick={() => setOpen(false)}
                        aria-label="Close navigation"
                        className="rounded p-1 text-slate-500 hover:bg-slate-100 md:hidden"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 3l10 10M13 3L3 13" />
                        </svg>
                    </button>
                </div>

                <div className="mx-3 mb-4 rounded-lg bg-slate-50 px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ${ROLE_TONE[role]}`}>
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-slate-900">
                                {portalUser?.displayName ?? "—"}
                            </div>
                            <div className="text-[11px] uppercase tracking-wider text-slate-500">
                                {role}
                            </div>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto px-3">
                    <NavGroup items={primary} pathname={pathname} />
                    {admin.length > 0 && (
                        <>
                            <div className="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                Admin
                            </div>
                            <NavGroup items={admin} pathname={pathname} />
                        </>
                    )}
                    {content.length > 0 && (
                        <>
                            <div className="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                Portfolio Content
                            </div>
                            <NavGroup items={content} pathname={pathname} />
                        </>
                    )}
                </nav>

                <button
                    onClick={() => signOut()}
                    className="mx-3 mb-3 flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-100"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" />
                    </svg>
                    Sign out
                </button>
            </aside>
        </>
    );
}

function NavGroup({ items, pathname }: { items: NavItem[]; pathname: string }) {
    return (
        <div className="space-y-0.5">
            {items.map((item) => {
                const active = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={
                            "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors md:py-2 " +
                            (active
                                ? "bg-blue-50 font-medium text-blue-800 ring-1 ring-blue-100"
                                : "text-slate-700 hover:bg-slate-100")
                        }
                    >
                        <span className={active ? "text-blue-700" : "text-slate-500 group-hover:text-slate-700"}>{item.icon}</span>
                        <span>{item.label}</span>
                    </Link>
                );
            })}
        </div>
    );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-bold text-white shadow-sm">
                MJ
            </div>
            {!compact && (
                <div className="leading-tight">
                    <div className="text-sm font-semibold text-slate-900">MahimaJyoti</div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-500">Portal</div>
                </div>
            )}
        </div>
    );
}
