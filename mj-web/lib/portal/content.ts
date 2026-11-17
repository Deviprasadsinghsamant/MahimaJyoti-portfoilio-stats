import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    setDoc,
    updateDoc,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { withTokenRetry } from "@/lib/auth";
import { memo, invalidate } from "./cache";
import type {
    FacultyMember,
    GalleryItem,
    SiteContentByPage,
    SiteContentPageId,
} from "@/domain/portal/content-types";

function db() {
    return getFirebaseDb();
}

// ─── Faculty ────────────────────────────────────────

export async function listFacultyPublic(): Promise<FacultyMember[]> {
    // Public reads bypass the memo — the portfolio wants live data.
    // Ordering: by `order` ascending, then name.
    const snap = await getDocs(query(collection(db(), "faculty"), orderBy("order")));
    return snap.docs
        .map((d) => d.data() as FacultyMember)
        .filter((f) => f.isActive)
        .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export async function listFacultyAdmin(): Promise<FacultyMember[]> {
    // Admin view — includes inactive so they can toggle visibility.
    return memo("faculty:admin", async () => {
        const snap = await getDocs(collection(db(), "faculty"));
        return snap.docs
            .map((d) => d.data() as FacultyMember)
            .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    });
}

export async function createFacultyMember(
    input: Omit<FacultyMember, "id" | "createdAt" | "updatedAt">
): Promise<FacultyMember> {
    return withTokenRetry(async () => {
        const ref = doc(collection(db(), "faculty"));
        const now = Date.now();
        const member: FacultyMember = { ...input, id: ref.id, createdAt: now, updatedAt: now };
        await setDoc(ref, member);
        invalidate("faculty:");
        return member;
    });
}

export async function updateFacultyMember(
    id: string,
    patch: Partial<Omit<FacultyMember, "id" | "createdAt">>
): Promise<void> {
    await withTokenRetry(async () => {
        await updateDoc(doc(db(), "faculty", id), { ...patch, updatedAt: Date.now() });
        invalidate("faculty:");
    });
}

export async function deleteFacultyMember(id: string): Promise<void> {
    await withTokenRetry(async () => {
        await deleteDoc(doc(db(), "faculty", id));
        invalidate("faculty:");
    });
}

// ─── Gallery ─────────────────────────────────────────

export async function listGalleryPublic(): Promise<GalleryItem[]> {
    const snap = await getDocs(query(collection(db(), "galleryItems"), orderBy("order")));
    return snap.docs
        .map((d) => d.data() as GalleryItem)
        .filter((i) => i.isActive)
        .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export async function listGalleryAdmin(): Promise<GalleryItem[]> {
    return memo("gallery:admin", async () => {
        const snap = await getDocs(collection(db(), "galleryItems"));
        return snap.docs
            .map((d) => d.data() as GalleryItem)
            .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
    });
}

export async function createGalleryItem(
    input: Omit<GalleryItem, "id" | "createdAt" | "updatedAt">
): Promise<GalleryItem> {
    return withTokenRetry(async () => {
        const ref = doc(collection(db(), "galleryItems"));
        const now = Date.now();
        const item: GalleryItem = { ...input, id: ref.id, createdAt: now, updatedAt: now };
        await setDoc(ref, item);
        invalidate("gallery:");
        return item;
    });
}

export async function updateGalleryItem(
    id: string,
    patch: Partial<Omit<GalleryItem, "id" | "createdAt">>
): Promise<void> {
    await withTokenRetry(async () => {
        await updateDoc(doc(db(), "galleryItems", id), { ...patch, updatedAt: Date.now() });
        invalidate("gallery:");
    });
}

export async function deleteGalleryItem(id: string): Promise<void> {
    await withTokenRetry(async () => {
        await deleteDoc(doc(db(), "galleryItems", id));
        invalidate("gallery:");
    });
}

// ─── Site content (single doc per page) ──────────────

// Memoised for a few minutes: the footer and the page itself can ask for the
// same document, and moving between pages shouldn't re-read it every time.
export async function getSiteContent<K extends SiteContentPageId>(
    pageId: K
): Promise<SiteContentByPage[K] | null> {
    return memo(`site:${pageId}`, async () => {
        const snap = await getDoc(doc(db(), "siteContent", pageId));
        if (!snap.exists()) return null;
        return snap.data() as SiteContentByPage[K];
    });
}

export async function saveSiteContent<K extends SiteContentPageId>(
    pageId: K,
    content: SiteContentByPage[K]
): Promise<void> {
    await withTokenRetry(async () => {
        // JSON round trip drops unset optional fields — Firestore rejects `undefined`.
        await setDoc(doc(db(), "siteContent", pageId), {
            ...JSON.parse(JSON.stringify(content)),
            updatedAt: Date.now(),
        });
        invalidate(`site:${pageId}`);
    });
}
