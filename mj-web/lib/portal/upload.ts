import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { getFirebaseApp } from "@/lib/firebase";

/**
 * Upload an image to `site/{subpath}/{unique-filename}` in Firebase Storage.
 * Returns the download URL to persist on the document.
 *
 * Storage rules enforce admin-only writes and a max 8 MB image size.
 */
export async function uploadSiteImage(
    subpath: string,
    file: File
): Promise<{ url: string; path: string }> {
    const storage = getStorage(getFirebaseApp());
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const safeSubpath = subpath.replace(/[^a-z0-9/_-]/gi, "").replace(/^\/+|\/+$/g, "");
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `site/${safeSubpath}/${filename}`;
    const ref = storageRef(storage, path);
    await uploadBytes(ref, file, { contentType: file.type });
    const url = await getDownloadURL(ref);
    return { url, path };
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
