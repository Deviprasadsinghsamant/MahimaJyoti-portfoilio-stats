"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function PortfolioHeader() {
    const pathname = usePathname();
    if (pathname.startsWith("/portal")) return null;
    return <Header />;
}

export function PortfolioFooter() {
    const pathname = usePathname();
    if (pathname.startsWith("/portal")) return null;
    return <Footer />;
}
