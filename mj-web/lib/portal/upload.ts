import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { getFirebaseApp } from "@/lib/firebase";

export interface UploadedImage {
    url: string;
    path: string;
    // What was stored, after resizing.
    width: number;
    height: number;
    bytes: number;
    // The picked file's own size, before resizing.
    originalWidth: number;
    originalHeight: number;
}

const JPEG_QUALITY = 0.85;

/**
 * Scale a photo so its longest side is at most `maxEdge` and re-encode it as
 * JPEG — a 6 MB phone photo becomes a few hundred KB, which keeps the website
 * fast and Firebase Storage within its free allowance. Respects the photo's
 * EXIF rotation. Animated GIFs are left as they are.
 */
async function shrink(file: File, maxEdge: number): Promise<{ blob: Blob; width: number; height: number; originalWidth: number; originalHeight: number }> {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const { width: ow, height: oh } = bitmap;
    if (file.type === "image/gif") {
        bitmap.close();
        return { blob: file, width: ow, height: oh, originalWidth: ow, originalHeight: oh };
    }
    const scale = Math.min(1, maxEdge / Math.max(ow, oh));
    const width = Math.round(ow * scale);
    const height = Math.round(oh * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("This browser can't prepare images for upload.");
    // JPEG has no transparency: transparent areas become white, not black.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (!blob) throw new Error("Couldn't prepare the image for upload.");
    // Already small enough and smaller as-is: keep the original file.
    if (scale === 1 && file.size <= blob.size && file.type === "image/jpeg") {
        return { blob: file, width, height, originalWidth: ow, originalHeight: oh };
    }
    return { blob, width, height, originalWidth: ow, originalHeight: oh };
}

/**
 * Resize (to `maxEdge`) and upload an image to `site/{subpath}/{unique-filename}`
 * in Firebase Storage. Returns the download URL to persist on the document.
 *
 * Storage rules enforce admin-only writes and a max 8 MB image size.
 */
export async function uploadSiteImage(subpath: string, file: File, maxEdge = 1600): Promise<UploadedImage> {
    let prepared: Awaited<ReturnType<typeof shrink>>;
    try {
        prepared = await shrink(file, maxEdge);
    } catch {
        throw new Error("This file couldn't be read as a photo. Use a JPG, PNG or WebP image.");
    }
    const { blob } = prepared;
    if (blob.size > 8 * 1024 * 1024) throw new Error("The image is still over 8 MB after resizing. Try a smaller photo.");

    const storage = getStorage(getFirebaseApp());
    const ext = blob.type === "image/gif" ? "gif" : "jpg";
    const safeSubpath = subpath.replace(/[^a-z0-9/_-]/gi, "").replace(/^\/+|\/+$/g, "");
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `site/${safeSubpath}/${filename}`;
    const ref = storageRef(storage, path);
    await uploadBytes(ref, blob, { contentType: blob.type || "image/jpeg", cacheControl: "public, max-age=31536000, immutable" });
    const url = await getDownloadURL(ref);
    return {
        url,
        path,
        width: prepared.width,
        height: prepared.height,
        bytes: blob.size,
        originalWidth: prepared.originalWidth,
        originalHeight: prepared.originalHeight,
    };
}

/**
 * Best-effort delete of an image previously uploaded via uploadSiteImage.
 * Path is the value returned as `path` above (e.g. "site/faculty/1234-abc.jpg").
 * If the file doesn't exist any more (already deleted, migrated, etc.) it is silently ignored.
 */
export async function deleteSiteImage(path: string): Promise<void> {
    if (!path) return;
    const storage = getStorage(getFirebaseApp());
    try {
        await deleteObject(storageRef(storage, path));
    } catch {
        /* ignore — object may already be gone */
    }
}
