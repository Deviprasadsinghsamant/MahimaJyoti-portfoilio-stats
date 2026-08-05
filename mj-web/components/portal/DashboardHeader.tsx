"use client";

import { useAuth } from "./AuthContext";

export function DashboardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
    const { portalUser, role } = useAuth();
    return (
        <div className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 px-4 py-8 text-white md:px-8 md:py-10">
            <div className="pointer-events-none absolute inset-0 opacity-20">
                <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white blur-3xl" />
                <div className="absolute -bottom-32 -left-16 h-64 w-64 rounded-full bg-white blur-3xl" />
            </div>
            <div className="relative">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-blue-100">
                    {role} Dashboard
                </div>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
                {subtitle && <p className="mt-2 max-w-2xl text-sm text-blue-100">{subtitle}</p>}
                {portalUser && (
                    <p className="mt-4 text-xs text-blue-200">
                        Signed in as <span className="font-medium text-white">{portalUser.displayName}</span> · {portalUser.phone}
                    </p>
                )}
            </div>
        </div>
    );
}
