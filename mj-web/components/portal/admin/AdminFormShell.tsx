"use client";

import { useEffect, useState } from "react";
import { RoleGate } from "@/components/portal/RoleGate";
import { PageHeader } from "@/components/portal/PageHeader";

interface Props<T> {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    // The public page this edits, for the "View on website" link.
    publicPath?: string;
    load: () => Promise<T | null>;
    empty: () => T;
    save: (data: T) => Promise<void>;
    children: (state: { data: T; setData: (data: T) => void }) => React.ReactNode;
}

/**
 * Skeleton for single-doc content editors (home / about / academics / etc.).
 * Handles fetch, dirty state, save button (also in a sticky bar while there are
 * unsaved changes), status messages, a leave-page warning, and admin gate.
 */
export function AdminFormShell<T>(props: Props<T>) {
    return (
        <RoleGate allow={["admin"]}>
            <Inner {...props} />
        </RoleGate>
    );
}

function Inner<T>({ eyebrow, title, subtitle, publicPath, load, empty, save, children }: Props<T>) {
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
                const seed = existing ? { ...empty(), ...existing } : empty();
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

    // Closing the tab or reloading with unsaved changes asks first.
    useEffect(() => {
        if (!dirty) return;
        const warn = (e: BeforeUnloadEvent) => {
            e.preventDefault();
        };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [dirty]);

    async function handleSave() {
        if (!data) return;
        setSaving(true);
        setError(null);
        setMessage(null);
        try {
            await save(data);
            setInitial(JSON.stringify(data));
            setMessage("Saved — the website is updated.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Save failed");
        } finally {
            setSaving(false);
        }
    }

    const saveButton = (
        <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
            {saving ? "Saving…" : dirty ? "Save changes" : "All changes saved"}
        </button>
    );

    return (
        <div className="pb-20">
            <PageHeader
                eyebrow={eyebrow ?? "Website content"}
                title={title}
                subtitle={subtitle}
                actions={
                    <>
                        {publicPath && (
                            <a
                                href={publicPath}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                            >
                                View on website ↗
                            </a>
                        )}
                        {saveButton}
                    </>
                }
            />

            <div className="space-y-6 p-4 md:p-8">
                <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-sm text-blue-950">
                    <p className="font-semibold">How this page works</p>
                    <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-[13px] leading-relaxed">
                        <li>Fill in the sections below, top to bottom — they match the website page in order.</li>
                        <li>
                            Tap the <span className="mx-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border border-blue-300 bg-white font-serif text-[10px] font-bold italic">i</span>
                            next to any heading for what to write, how many to add, and photo sizes.
                        </li>
                        <li>Photos: upload any size — they are resized automatically. The box under each photo says the best size.</li>
                        <li>
                            Click <strong>Save changes</strong> when done — the website updates at once. Sections left empty are hidden on the website.
                        </li>
                    </ol>
                </div>

                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
                )}
                {message && !dirty && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</div>
                )}
                {loading || !data ? (
                    <div className="text-sm text-slate-500">Loading…</div>
                ) : (
                    children({ data, setData })
                )}
            </div>

            {dirty && (
                <div className="fixed inset-x-0 bottom-0 z-30 border-t border-amber-200 bg-amber-50/95 px-4 py-3 shadow-lg backdrop-blur md:left-64">
                    <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
                        <span className="text-sm font-medium text-amber-900">You have unsaved changes.</span>
                        {saveButton}
                    </div>
                </div>
            )}
        </div>
    );
}
