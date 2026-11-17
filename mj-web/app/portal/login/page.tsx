"use client";

import Image from "next/image";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithPhone } from "@/lib/auth";
import { useAuth } from "@/components/portal/AuthContext";

function LoginForm() {
    const router = useRouter();
    const params = useSearchParams();
    const { loading: authLoading } = useAuth();

    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const initialError = params.get("error") === "no-role"
        ? "Your account has no role assigned. Contact an admin."
        : null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const normalized = phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "")}`;
            await signInWithPhone(normalized, password);
            const redirect = params.get("redirect") ?? "/portal";
            router.replace(redirect);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Sign-in failed";
            setError(
                message.includes("auth/invalid-credential") || message.includes("auth/wrong-password")
                    ? "Invalid phone or password."
                    : message.includes("auth/user-not-found")
                        ? "No account for that phone number."
                        : "Sign-in failed. Try again."
            );
            setSubmitting(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-sm space-y-5 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm"
            >
                <div>
                    <Image
                        src="/logo.png"
                        alt="Mahima Jyoti Awasika Vidyapitha logo"
                        width={72}
                        height={72}
                        unoptimized
                        priority
                        className="mb-3 h-[72px] w-[72px]"
                    />
                    <h1 className="text-lg font-semibold text-neutral-900">MahimaJyoti Portal</h1>
                    <p className="mt-1 text-sm text-neutral-600">Sign in with your phone number.</p>
                </div>

                {(error ?? initialError) && (
                    <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                        {error ?? initialError}
                    </div>
                )}

                <label className="block text-sm">
                    <span className="mb-1 block text-neutral-700">Phone number</span>
                    <input
                        type="tel"
                        required
                        placeholder="+91 9000000001"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
                    />
                </label>

                <label className="block text-sm">
                    <span className="mb-1 block text-neutral-700">Password</span>
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
                    />
                </label>

                <button
                    type="submit"
                    disabled={submitting || authLoading}
                    className="w-full rounded bg-neutral-900 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                    {submitting ? "Signing in…" : "Sign in"}
                </button>
            </form>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="p-8 text-sm text-neutral-500">Loading…</div>}>
            <LoginForm />
        </Suspense>
    );
}
