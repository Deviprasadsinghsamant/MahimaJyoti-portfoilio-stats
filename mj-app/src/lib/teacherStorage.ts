// The teacher side's data on the phone: the downloaded class and student lists,
// the registers this phone knows about, finished registers waiting for internet,
// marking drafts, and students the teacher has opened. Signing out clears it all.

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AttendanceRecord, AttendanceStatus, Register, TeacherStudentDetail, TeacherSync } from "./types";

const PREFIX = "mj:teacher:";
const KEY = `${PREFIX}v1`;
const STUDENT_PREFIX = `${PREFIX}student:`;
const DRAFT_PREFIX = `${PREFIX}draft:`;

// A finished register saved on the phone because there was no internet.
export interface PendingSave {
    classId: string;
    date: string;
    records: AttendanceRecord[];
    baseUpdatedAt: number | null;
    queuedAt: number;
}

export interface TeacherState {
    uid: string;
    sync: TeacherSync | null;
    // By registerKey(): from the last download and this teacher's own saves.
    registers: Record<string, Register>;
    pending: Record<string, PendingSave>;
    // Saves that couldn't go through after all, to tell the teacher about once.
    notices: string[];
}

export interface CachedStudent {
    detail: TeacherStudentDetail;
    fetchedAt: number;
}

export function registerKey(classId: string, date: string): string {
    return `${classId}_${date}`;
}

export function emptyState(uid: string): TeacherState {
    return { uid, sync: null, registers: {}, pending: {}, notices: [] };
}

export async function loadTeacherState(): Promise<TeacherState | null> {
    try {
        const raw = await AsyncStorage.getItem(KEY);
        return raw ? (JSON.parse(raw) as TeacherState) : null;
    } catch {
        return null;
    }
}

type Listener = (state: TeacherState | null) => void;
const listeners = new Set<Listener>();

export function subscribeTeacher(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

// One read-modify-write at a time, like the parent side's storage.
let queue: Promise<unknown> = Promise.resolve();

export function updateTeacherState(change: (state: TeacherState | null) => TeacherState | null): Promise<TeacherState | null> {
    const run = queue.then(async () => {
        const next = change(await loadTeacherState());
        if (next) await AsyncStorage.setItem(KEY, JSON.stringify(next));
        else await AsyncStorage.removeItem(KEY);
        listeners.forEach((l) => l(next));
        return next;
    });
    queue = run.catch(() => undefined);
    return run;
}

/** Remove everything the teacher side stored (sign-out). */
export async function clearTeacherData(): Promise<void> {
    await updateTeacherState(() => null);
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX));
    if (keys.length) await AsyncStorage.multiRemove(keys);
}

export async function loadCachedStudent(studentId: string): Promise<CachedStudent | null> {
    try {
        const raw = await AsyncStorage.getItem(STUDENT_PREFIX + studentId);
        return raw ? (JSON.parse(raw) as CachedStudent) : null;
    } catch {
        return null;
    }
}

export async function saveCachedStudent(studentId: string, cached: CachedStudent): Promise<void> {
    await AsyncStorage.setItem(STUDENT_PREFIX + studentId, JSON.stringify(cached)).catch(() => undefined);
}

// Marks in progress, so leaving the register screen (or a phone call) loses nothing.
export async function loadDraft(key: string): Promise<Record<string, AttendanceStatus> | null> {
    try {
        const raw = await AsyncStorage.getItem(DRAFT_PREFIX + key);
        return raw ? (JSON.parse(raw) as Record<string, AttendanceStatus>) : null;
    } catch {
        return null;
    }
}

export function saveDraft(key: string, marks: Record<string, AttendanceStatus>): void {
    AsyncStorage.setItem(DRAFT_PREFIX + key, JSON.stringify(marks)).catch(() => undefined);
}

export function clearDraft(key: string): void {
    AsyncStorage.removeItem(DRAFT_PREFIX + key).catch(() => undefined);
}
