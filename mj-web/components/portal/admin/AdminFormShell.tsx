"use client";

import { useEffect, useState } from "react";
import { RoleGate } from "@/components/portal/RoleGate";
import { PageHeader } from "@/components/portal/PageHeader";

interface Props<T> {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    load: () => Promise<T | null>;
    empty: () => T;
    save: (data: T) => Promise<void>;
    children: (state: { data: T; setData: (data: T) => void }) => React.ReactNode;
}

/**
 * Skeleton for single-doc content editors (home / about / academics / etc.).
 * Handles fetch, dirty state, save button, status messages, and admin gate.
 */
export function AdminFormShell<T>({
    eyebrow, title, subtitle, load, empty, save, children,
}: Props<T>) {
    return (
        <RoleGate allow={["admin"]}>
            <Inner eyebrow={eyebrow} title={title} subtitle={subtitle} load={load} empty={empty} save={save}>
                {children}
            </Inner>
        </RoleGate>
    );
}

function Inner<T>({ eyebrow, title, subtitle, load, empty, save, children }: Props<T>) {
    const [data, setData] = useState<T | null>(null);
    const [initial, setInitial] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const existing = await load();
                const seed = existing ?? empty();
                setData(seed);
                setInitial(JSON.stringify(seed));
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load");
            } finally {
                setLoading(false);
            }
        })();
    }, [load, empty]);

    const dirty = data !== null && JSON.stringify(data) !== initial;

    async function handleSave() {
        if (!data) return;
        setSaving(true);
        setError(null);
        setMessage(null);
        try {
            await save(data);
            setInitial(JSON.stringify(data));
            setMessage("Saved. Public page updated.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Save failed");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div>
            <PageHeader
                eyebrow={eyebrow ?? "Portfolio content"}
                title={title}
                subtitle={subtitle}
                actions={
                    <button
                        onClick={handleSave}
                        disabled={saving || !dirty}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
                    </button>
                }
            />

            <div className="space-y-6 p-4 md:p-8">
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
                )}
                {message && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</div>
                )}
                {loading || !data ? (
                    <div className="text-sm text-slate-500">Loading…</div>
                ) : (
                    children({ data, setData })
                )}
            </div>
        </div>
    );
}
