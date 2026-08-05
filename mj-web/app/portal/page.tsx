"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/portal/AuthContext";

export default function PortalIndex() {
    const { role, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading || !role) return;
        router.replace(`/portal/${role}`);
    }, [role, loading, router]);

    return (
        <div className="flex min-h-screen items-center justify-center text-sm text-neutral-500">
            Redirecting…
        </div>
    );
}
