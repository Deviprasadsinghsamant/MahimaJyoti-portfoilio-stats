"use client";

import { useState } from "react";
import { IMAGE_SPECS, MAX_PICK_BYTES, type ImageSlot } from "@/lib/portal/imageSpecs";
import { uploadSiteImage } from "@/lib/portal/upload";

interface Props {
    /** Which photo slot this is: sets the preview shape, the guidance and the upload size. */
    slot: ImageSlot;
    /** Storage subpath under `site/`, e.g. "faculty" or "gallery". */
    subpath: string;
    /** Current image URL, or null. */
    value: string | null;
    onChange: (url: string | null) => void;
    fallback?: React.ReactNode;
}

function kb(bytes: number) {
    return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

/**
 * Image upload field: shows current image (or fallback) in the shape the site
 * uses, the recommended size for this slot, and lets admin replace or clear it.
 * Photos are resized in the browser before uploading (see uploadSiteImage);
 * passes the resulting download URL up through onChange.
 */
export function ImageField({ slot, subpath, value, onChange, fallback }: Props) {
    const spec = IMAGE_SPECS[slot];
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [note, setNote] = useState<string | null>(null);

    async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (file.size > MAX_PICK_BYTES) {
            setError(`That file is ${kb(file.size)} — pick one under ${kb(MAX_PICK_BYTES)}.`);
            return;
        }
        setUploading(true);
        setError(null);
        setNote(null);
        try {
            const up = await uploadSiteImage(subpath, file, spec.maxEdge);
            onChange(up.url);
            const warnings: string[] = [];
            const [minW, minH] = spec.minimum;
            const longEdge = Math.max(up.originalWidth, up.originalHeight);
            const shortEdge = Math.min(up.originalWidth, up.originalHeight);
            if (longEdge < Math.max(minW, minH) || shortEdge < Math.min(minW, minH)) {
                warnings.push(`This photo is small (${up.originalWidth} × ${up.originalHeight}) and may look blurry; use at least ${minW} × ${minH}.`);
            }
            const [rw, rh] = spec.recommended;
            const want = rw / rh;
            const got = up.originalWidth / up.originalHeight;
            if (Math.abs(got - want) / want > 0.15) {
                warnings.push(`It isn't ${spec.ratio}, so the edges will be cropped — check the preview.`);
            }
            setNote(
                `Uploaded at ${up.width} × ${up.height}, ${kb(up.bytes)}. Save the page to publish it.` +
                    (warnings.length ? ` ${warnings.join(" ")}` : "")
            );
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
            <div className={`relative w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50 ${spec.aspectClass}`}>
                {value ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={value} alt="" className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        {fallback ?? <span className="text-xs text-slate-400">No image</span>}
                    </div>
                )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <label className="inline-block cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100">
                    {uploading ? "Uploading…" : value ? "Replace" : "Upload"}
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} className="hidden" disabled={uploading} />
                </label>
                {value && (
                    <button
                        type="button"
                        onClick={() => {
                            onChange(null);
                            setNote(null);
                        }}
                        className="text-xs text-red-700 hover:underline"
                    >
                        Remove
                    </button>
                )}
                <div className="ml-auto text-right text-[10px] leading-tight text-slate-500">
                    Best {spec.recommended[0]} × {spec.recommended[1]} px ({spec.ratio} {spec.orientation})
                    <br />
                    JPG / PNG / WebP · resized automatically
                </div>
            </div>
            <p className="text-[11px] text-slate-500">{spec.tip}</p>
            {note && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-800">{note}</div>}
            {error && <div className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-800">{error}</div>}
        </div>
    );
}
