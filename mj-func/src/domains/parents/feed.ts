// Parents Domain — change feed
// ────────────────────────────
// Every change a parent's phone should get (a result written or deleted, the
// student's profile, a day of attendance) bumps parentFeeds/{studentId}.version
// and is logged with that version. Each push message carries the version too.
//
// Pushes are the fast path, but a phone can miss one: switched off for weeks,
// the app force-stopped (common with battery savers), a token that changed while
// the app was closed. The phone keeps the version its data reflects; when it
// sees a gap, or when the app is opened, parentSync compares versions and sends
// only what changed since — a couple of reads when nothing did. So new marks
// always reach the phone without a full re-download.

import { db } from "../../shared/firestore";

export type FeedKind = "result" | "student" | "attendance";

export interface FeedEntry {
    v: number;
    kind: FeedKind;
    // The result id, the attendance date, or "" for the profile.
    id: string;
}

export interface Feed {
    version: number;
    // The latest changes, oldest first. A phone further behind gets the full record.
    log: FeedEntry[];
    updatedAt: number;
}

export const FEED_LOG_SIZE = 100;

export function feedRef(studentId: string) {
    return db.collection("parentFeeds").doc(studentId);
}

const EMPTY: Feed = { version: 0, log: [], updatedAt: 0 };

export function asFeed(data: FirebaseFirestore.DocumentData | undefined): Feed {
    if (!data || typeof data.version !== "number") return EMPTY;
    return { version: data.version, log: Array.isArray(data.log) ? (data.log as FeedEntry[]) : [], updatedAt: data.updatedAt ?? 0 };
}

/** The feed after recording these changes (each gets the next version). */
export function nextFeed(feed: Feed, changes: { kind: FeedKind; id: string }[], now: number): Feed {
    let version = feed.version;
    const added = changes.map((c) => ({ v: ++version, kind: c.kind, id: c.id }));
    return { version, log: [...feed.log, ...added].slice(-FEED_LOG_SIZE), updatedAt: now };
}

/** Record one change for a student. Returns the new version, to send with the push. */
export async function bumpFeed(studentId: string, kind: FeedKind, id: string): Promise<number> {
    const ref = feedRef(studentId);
    return db.runTransaction(async (tx) => {
        const next = nextFeed(asFeed((await tx.get(ref)).data()), [{ kind, id }], Date.now());
        tx.set(ref, next);
        return next.version;
    });
}

export async function readFeeds(studentIds: string[]): Promise<Map<string, Feed>> {
    if (studentIds.length === 0) return new Map();
    const docs = await db.getAll(...studentIds.map(feedRef));
    return new Map(docs.map((d) => [d.id, asFeed(d.data())]));
}

/** The changes after `have`, or null if the log no longer reaches back that far. */
export function changesSince(feed: Feed, have: number): FeedEntry[] | null {
    if (have >= feed.version) return [];
    const oldest = feed.log[0]?.v;
    if (oldest === undefined || oldest > have + 1) return null;
    return feed.log.filter((e) => e.v > have);
}
