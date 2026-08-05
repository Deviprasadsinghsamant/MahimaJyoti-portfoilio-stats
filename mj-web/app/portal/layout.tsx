import type { Metadata } from "next";
import { AuthProvider } from "@/components/portal/AuthContext";
import { PortalGuard } from "@/components/portal/PortalGuard";
import { PortalShell } from "@/components/portal/PortalShell";

export const metadata: Metadata = {
    title: "Portal | MahimaJyoti",
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <PortalGuard>
                <PortalShell>{children}</PortalShell>
            </PortalGuard>
        </AuthProvider>
    );
}
