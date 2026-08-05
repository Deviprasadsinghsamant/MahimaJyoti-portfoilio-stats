// Next.js Proxy (was Middleware)
// ─────────────────────────────
// Route protection based on authentication state.
// In production, this would verify Firebase session cookies.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedRoutes = ["/admin", "/staff"];

// Routes that should redirect if already authenticated
const authRoutes = ["/login"];


export default function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check for session cookie (set by Firebase Auth on login)
    const session = request.cookies.get("__session")?.value;

    // Protect dashboard routes
    if (protectedRoutes.some((route) => pathname.startsWith(route))) {
        if (!session) {
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("redirect", pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    // Redirect authenticated users away from login
    if (authRoutes.some((route) => pathname.startsWith(route))) {
        if (session) {
            return NextResponse.redirect(new URL("/admin", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/staff/:path*", "/login"],
};
