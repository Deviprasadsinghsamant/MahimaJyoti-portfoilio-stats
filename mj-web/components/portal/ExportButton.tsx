"use client";

import { useState } from "react";

/** "Export to Excel": runs `onExport` (which builds and saves the file) with a busy state. */
export function ExportButton({
    onExport,
    disabled = false,
    label = "Export to Excel",
}: {
    onExport: () => Promise<void>;
    disabled?: boolean;
    label?: string;
}) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function run() {
        setBusy(true);
        setError(null);
        try {
            await onExport();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Export failed");
        } finally {
            setBusy(false);
        }
    }

    return (
        <span className="inline-flex items-center gap-2">
            <button
                type="button"
                onClick={run}
                disabled={disabled || busy}
                className="inline-flex items-center gap-1.5 rounded border border-emerald-600 bg-white px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
            >
                <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                    <path d="M4 2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.4a2 2 0 0 0-.6-1.4l-3.4-3.4A2 2 0 0 0 12.6 2H4Zm2.3 6.3a1 1 0 0 1 1.4 0L10 10.6l2.3-2.3a1 1 0 1 1 1.4 1.4L11.4 12l2.3 2.3a1 1 0 0 1-1.4 1.4L10 13.4l-2.3 2.3a1 1 0 0 1-1.4-1.4L8.6 12 6.3 9.7a1 1 0 0 1 0-1.4Z" />
                </svg>
                {busy ? "Exporting…" : label}
            </button>
            {error && <span className="text-xs text-red-700">{error}</span>}
        </span>
    );
}
