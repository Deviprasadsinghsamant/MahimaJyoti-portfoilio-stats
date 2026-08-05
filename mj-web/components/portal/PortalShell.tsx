"use client";

import { usePathname } from "next/navigation";
import { PortalNav } from "./PortalNav";
import { useAuth } from "./AuthContext";

export function PortalShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { firebaseUser } = useAuth();

    const isLogin = pathname === "/portal/login";

    if (isLogin || !firebaseUser) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-slate-50 md:flex">
            <PortalNav />
            {/*
                Mobile: body scrolls naturally, main is a normal block. Sticky
                headers inside pages then anchor to the viewport (top-14 clears
                the fixed top bar).
                Desktop: main is the scroll container so the sidebar stays fixed
                while content scrolls.
            */}
            <main className="flex-1 pt-14 md:h-screen md:overflow-y-auto md:pt-0">{children}</main>
        </div>
    );
}
