"use client";

import { createElement } from "react";
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
    const icon = getIcon(name);
    if (!icon) return <>{fallback}</>;
    // createElement: the icon is a fixed component from the registry, picked by name.
    return createElement(icon, { className });
}
