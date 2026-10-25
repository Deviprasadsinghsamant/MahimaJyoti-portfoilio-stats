"use client";

import { getIcon } from "@/lib/portal/iconRegistry";

/**
 * Renders a Lucide icon looked up by its registry name.
 * Safe against unknown / missing names — returns null in that case.
 * Use everywhere a portfolio page needs to display an admin-picked icon.
 */
export function DynIcon({
    name,
    className,
    fallback = null,
}: {
    name: string | null | undefined;
    className?: string;
    fallback?: React.ReactNode;
}) {
    const Icon = getIcon(name);
    if (!Icon) return <>{fallback}</>;
    return <Icon className={className} />;
}
