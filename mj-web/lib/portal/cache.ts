// Tiny in-memory memoization for read-heavy, rarely-changing collections.
// Complements Firestore's persistent local cache: this saves the IndexedDB
// hop too. Values live for the lifetime of the tab / until invalidate() is called.

const TTL_MS = 5 * 60 * 1000; // 5 minutes — safety net for very long sessions.

interface Entry<T> {
    value: T;
    expiresAt: number;
    pending?: Promise<T>;
}

const store = new Map<string, Entry<unknown>>();

export async function memo<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const hit = store.get(key) as Entry<T> | undefined;
    if (hit && hit.expiresAt > now && !hit.pending) return hit.value;
    if (hit?.pending) return hit.pending;

    const pending = loader().then((value) => {
        store.set(key, { value, expiresAt: Date.now() + TTL_MS });
        return value;
    });
    store.set(key, { value: hit?.value as T, expiresAt: 0, pending });
    return pending;
}

// Invalidate keys that start with `prefix` — call after a mutation.
export function invalidate(prefix: string) {
    for (const k of Array.from(store.keys())) {
        if (k.startsWith(prefix)) store.delete(k);
    }
}

export function clearMemoCache() {
    store.clear();
}
