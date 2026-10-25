"use client";

import { useState } from "react";
import { uploadSiteImage } from "@/lib/portal/upload";

interface Props {
    /** Storage subpath under `site/`, e.g. "faculty" or "gallery". */
    subpath: string;
    /** Current image URL, or null. */
    value: string | null;
    onChange: (url: string | null) => void;
    fallback?: React.ReactNode;
    aspect?: string; // e.g. "aspect-[4/3]"
}

/**
 * Image upload field: shows current image (or fallback), lets admin replace
 * or clear it. Uploads to Firebase Storage on file pick; passes the resulting
 * download URL up through onChange.
 */
export function ImageField({ subpath, value, onChange, fallback, aspect = "aspect-[4/3]" }: Props) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (file.size > 8 * 1024 * 1024) {
            setError("Image must be under 8 MB.");
            return;
        }
        setUploading(true);
        setError(null);
        try {
            const { url } = await uploadSiteImage(subpath, file);
            onChange(url);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Upload failed";
            setError(
                msg.includes("storage/unauthorized")
                    ? "Upload denied. Enable Firebase Storage and deploy storage.rules."
                    : msg
            );
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="space-y-2">
            <div className={`relative w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50 ${aspect}`}>
                {value ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={value} alt="" className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        {fallback ?? <span className="text-xs text-slate-400">No image</span>}
                    </div>
                )}
            </div>
            <div className="flex items-center gap-3">
                <label className="inline-block cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100">
                    {uploading ? "Uploading…" : value ? "Replace" : "Upload"}
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onFile} className="hidden" disabled={uploading} />
                </label>
                {value && (
                    <button
                        type="button"
                        onClick={() => onChange(null)}
                        className="text-xs text-red-700 hover:underline"
                    >
                        Remove
                    </button>
                )}
                <div className="ml-auto text-[10px] text-slate-500">JPG/PNG/WEBP · ≤ 8&nbsp;MB</div>
            </div>
            {error && <div className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-800">{error}</div>}
        </div>
    );
}
