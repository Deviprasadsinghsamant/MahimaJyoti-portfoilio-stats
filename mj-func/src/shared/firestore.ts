// Shared Firestore Utilities
// ──────────────────────────

import * as admin from "firebase-admin";

export const db = admin.firestore();

/**
 * Get a typed document from Firestore.
 */
export async function getDoc<T>(
    collection: string,
    docId: string
): Promise<T | null> {
    const snap = await db.collection(collection).doc(docId).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() } as T;
}

/**
 * Get all documents from a collection with optional filters.
 */
export async function getDocs<T>(
    collection: string,
    filters?: { field: string; op: FirebaseFirestore.WhereFilterOp; value: unknown }[]
): Promise<T[]> {
    let query: FirebaseFirestore.Query = db.collection(collection);

    if (filters) {
        for (const filter of filters) {
            query = query.where(filter.field, filter.op, filter.value);
        }
    }

    const snap = await query.get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T);
}

/**
 * Create or update a document.
 */
export async function setDoc(
    collection: string,
    docId: string,
    data: Record<string, unknown>,
    merge = true
): Promise<void> {
    await db.collection(collection).doc(docId).set(data, { merge });
}

/**
 * Delete a document.
 */
export async function deleteDoc(
    collection: string,
    docId: string
): Promise<void> {
    await db.collection(collection).doc(docId).delete();
}
