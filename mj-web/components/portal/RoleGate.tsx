"use client";

import { useAuth } from "./AuthContext";
import type { UserRole } from "@/domain/portal/types";

export function RoleGate({
    allow,
    children,
}: {
    allow: UserRole[];
    children: React.ReactNode;
}) {
    const { role } = useAuth();
    if (!role) return null;
    if (!allow.includes(role)) {
        return (
            <div className="p-8">
                <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    You don&apos;t have access to this section.
                </div>
            </div>
        );
    }
    return <>{children}</>;
}
