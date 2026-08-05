"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";

const PUBLIC_PORTAL_ROUTES = ["/portal/login"];

export function PortalGuard({ children }: { children: React.ReactNode }) {
    const { firebaseUser, role, loading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    const isPublic = PUBLIC_PORTAL_ROUTES.includes(pathname);

    useEffect(() => {
        if (loading) return;
        if (!firebaseUser && !isPublic) {
            router.replace(`/portal/login?redirect=${encodeURIComponent(pathname)}`);
        } else if (firebaseUser && isPublic) {
            router.replace("/portal");
        } else if (firebaseUser && !role) {
            router.replace("/portal/login?error=no-role");
        }
    }, [firebaseUser, role, loading, isPublic, pathname, router]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center text-sm text-neutral-500">
                Loading…
            </div>
        );
    }

    if (!firebaseUser && !isPublic) return null;
    if (firebaseUser && isPublic) return null;

    return <>{children}</>;
}
