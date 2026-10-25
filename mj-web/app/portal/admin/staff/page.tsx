"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RoleGate } from "@/components/portal/RoleGate";
import { PageHeader } from "@/components/portal/PageHeader";
import { Badge } from "@/components/portal/ui/Badge";
import { listClasses, listStaff, listSubjects, sortClasses } from "@/lib/portal/data";
import {
    MIN_PASSWORD_LENGTH,
    assignmentsFor,
    createStaffAccount,
    generatePassword,
    normalizeSubjectName,
    saveTeachingAssignments,
    subjectKey,
    updateStaffAccount,
    type StaffRole,
    type UpdateStaffInput,
} from "@/lib/portal/staff";
import type { PortalUser, SchoolClass, Subject } from "@/domain/portal/types";

export default function StaffAdminPage() {
    return (
        <RoleGate allow={["admin"]}>
            <StaffAdminView />
        </RoleGate>
    );
}

interface Directory {
    staff: PortalUser[];
    // Sorted by grade, then section.
    classes: SchoolClass[];
    subjects: Subject[];
}

type RoleFilter = "all" | StaffRole;
type DialogState = { mode: "create"; role: StaffRole } | { mode: "edit"; user: PortalUser };

const ROLE_LABEL: Record<StaffRole, string> = { teacher: "Teacher", staff: "Staff" };

function StaffAdminView() {
    const [dir, setDir] = useState<Directory | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
    const [showInactive, setShowInactive] = useState(false);
    const [dialog, setDialog] = useState<DialogState | null>(null);
    const [busyUid, setBusyUid] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        try {
            const [staff, classes, subjects] = await Promise.all([listStaff(), listClasses(), listSubjects()]);
            setDir({ staff, classes: sortClasses(classes), subjects });
        } catch (err) {
            setError(errorText(err, "Failed to load staff"));
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const rows = useMemo(() => {
        if (!dir) return [];
        return dir.staff
            .filter((u) => (roleFilter === "all" || u.role === roleFilter) && (showInactive || u.isActive))
            .sort(
                (a, b) =>
                    (a.role === b.role ? 0 : a.role === "teacher" ? -1 : 1) ||
                    a.displayName.localeCompare(b.displayName)
            );
    }, [dir, roleFilter, showInactive]);

    // Subjects nobody active is teaching — unassigned, or still on a deactivated account.
    const subjectsWithoutTeacher = useMemo(() => {
        if (!dir) return [];
        const active = new Set(dir.staff.filter((u) => u.isActive).map((u) => u.uid));
        const classOrder = new Map(dir.classes.map((c, i) => [c.id, i]));
        return dir.subjects
            .filter((s) => classOrder.has(s.classId) && (!s.teacherId || !active.has(s.teacherId)))
            .sort((a, b) => classOrder.get(a.classId)! - classOrder.get(b.classId)! || a.name.localeCompare(b.name));
    }, [dir]);

    async function toggleActive(user: PortalUser) {
        if (!dir) return;
        const assigned =
            dir.classes.filter((c) => c.classTeacherId === user.uid).length +
            dir.subjects.filter((s) => s.teacherId === user.uid).length;
        const prompt = user.isActive
            ? `Deactivate ${user.displayName}? They won't be able to sign in.` +
              (assigned > 0
                  ? ` Their ${assigned} class and subject assignment${assigned === 1 ? "" : "s"} stay until you reassign them.`
                  : "")
            : `Reactivate ${user.displayName}? They can sign in again with their existing password.`;
        if (!confirm(prompt)) return;
        setBusyUid(user.uid);
        setError(null);
        setMessage(null);
        try {
            await updateStaffAccount({ uid: user.uid, isActive: !user.isActive });
            setMessage(`${user.displayName} ${user.isActive ? "deactivated" : "reactivated"}.`);
            await refresh();
        } catch (err) {
            setError(errorText(err, "Couldn't update the account"));
        } finally {
            setBusyUid(null);
        }
    }

    const teacherCount = dir?.staff.filter((u) => u.isActive && u.role === "teacher").length ?? 0;
    const staffCount = dir?.staff.filter((u) => u.isActive && u.role === "staff").length ?? 0;

    return (
        <div>
            <PageHeader
                eyebrow="Admin"
                title="Staff & Teachers"
                subtitle="Create portal logins and set which classes and subjects each person teaches."
                actions={
                    <>
                        <button
                            onClick={() => setDialog({ mode: "create", role: "teacher" })}
                            disabled={!dir}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            + Add teacher
                        </button>
                        <button
                            onClick={() => setDialog({ mode: "create", role: "staff" })}
                            disabled={!dir}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-100 disabled:opacity-50"
                        >
                            + Add staff
                        </button>
                    </>
                }
            />

            <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:px-8">
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
                    {(["all", "teacher", "staff"] as RoleFilter[]).map((f) => (
                        <button
                            key={f}
                            onClick={() => setRoleFilter(f)}
                            className={
                                "rounded-md px-3 py-1 font-medium " +
                                (roleFilter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900")
                            }
                        >
                            {f === "all" ? "All" : f === "teacher" ? "Teachers" : "Staff"}
                        </button>
                    ))}
                </div>
                <span className="text-xs text-slate-500">
                    {teacherCount} active teacher{teacherCount === 1 ? "" : "s"} · {staffCount} active staff
                </span>
                <label className="ml-auto flex items-center gap-2 text-xs text-slate-600">
                    <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
                    Show deactivated
                </label>
            </div>

            <div className="space-y-4 p-4 md:p-8">
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
                )}
                {message && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</div>
                )}

                {subjectsWithoutTeacher.length > 0 && dir && (
                    <details className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                        <summary className="cursor-pointer">
                            {subjectsWithoutTeacher.length} subject{subjectsWithoutTeacher.length === 1 ? " has" : "s have"} no active teacher.
                        </summary>
                        <ul className="mt-2 space-y-0.5 text-xs">
                            {subjectsWithoutTeacher.map((s) => (
                                <li key={s.id}>
                                    {dir.classes.find((c) => c.id === s.classId)?.name} · {s.name}
                                    {s.teacherId && (
                                        <span className="text-amber-700">
                                            {" "}(assigned to deactivated {dir.staff.find((u) => u.uid === s.teacherId)?.displayName ?? "user"})
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </details>
                )}

                {!dir ? (
                    !error && <div className="text-sm text-slate-500">Loading…</div>
                ) : rows.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                        No {roleFilter === "all" ? "teachers or staff" : roleFilter === "teacher" ? "teachers" : "staff"} yet.
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Role</th>
                                    <th className="px-4 py-3">Class teacher of</th>
                                    <th className="px-4 py-3">Teaches</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rows.map((u) => (
                                    <StaffRow
                                        key={u.uid}
                                        user={u}
                                        dir={dir}
                                        busy={busyUid === u.uid}
                                        onEdit={() => setDialog({ mode: "edit", user: u })}
                                        onToggleActive={() => toggleActive(u)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {dialog && dir && (
                <StaffDialog
                    state={dialog}
                    dir={dir}
                    onClose={() => {
                        setDialog(null);
                        refresh();
                    }}
                    onSaved={(text) => {
                        setDialog(null);
                        setError(null);
                        setMessage(text);
                        refresh();
                    }}
                />
            )}
        </div>
    );
}

function StaffRow({
    user,
    dir,
    busy,
    onEdit,
    onToggleActive,
}: {
    user: PortalUser;
    dir: Directory;
    busy: boolean;
    onEdit: () => void;
    onToggleActive: () => void;
}) {
    const classTeacherOf = dir.classes.filter((c) => c.classTeacherId === user.uid);
    const teaching = dir.classes
        .map((c) => ({
            cls: c,
            names: dir.subjects
                .filter((s) => s.teacherId === user.uid && s.classId === c.id)
                .map((s) => s.name)
                .sort((a, b) => a.localeCompare(b)),
        }))
        .filter((g) => g.names.length > 0);
    const hasAssignments = classTeacherOf.length > 0 || teaching.length > 0;

    return (
        <tr className={user.isActive ? "" : "bg-slate-50/60"}>
            <td className="px-4 py-3 align-top">
                <div className="font-medium text-slate-900">{user.displayName}</div>
                <div className="text-xs text-slate-500 tabular-nums">{user.phone}</div>
            </td>
            <td className="px-4 py-3 align-top">
                <Badge tone={user.role === "teacher" ? "positive" : "warning"} size="sm">
                    {ROLE_LABEL[user.role as StaffRole] ?? user.role}
                </Badge>
            </td>
            <td className="px-4 py-3 align-top text-slate-700">
                {classTeacherOf.length === 0 ? (
                    <span className="text-slate-400">—</span>
                ) : (
                    <div className="flex flex-wrap gap-1">
                        {classTeacherOf.map((c) => (
                            <Badge key={c.id} tone="brand" size="sm">{c.name}</Badge>
                        ))}
                    </div>
                )}
            </td>
            <td className="px-4 py-3 align-top text-slate-700">
                {teaching.length === 0 ? (
                    <span className="text-slate-400">—</span>
                ) : (
                    <ul className="space-y-0.5 text-xs">
                        {teaching.map((g) => (
                            <li key={g.cls.id}>
                                <span className="font-medium text-slate-900">{g.cls.name}:</span> {g.names.join(", ")}
                            </li>
                        ))}
                    </ul>
                )}
            </td>
            <td className="px-4 py-3 align-top">
                {user.isActive ? (
                    <Badge tone="positive" size="sm">Active</Badge>
                ) : (
                    <div className="space-y-1">
                        <Badge tone="neutral" size="sm">Deactivated</Badge>
                        {hasAssignments && <div className="text-[11px] text-amber-700">Reassign their classes and subjects.</div>}
                    </div>
                )}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right align-top">
                <button onClick={onEdit} className="text-xs font-medium text-blue-700 hover:underline">
                    Edit
                </button>
                <button
                    onClick={onToggleActive}
                    disabled={busy}
                    className={
                        "ml-3 text-xs hover:underline disabled:opacity-50 " +
                        (user.isActive ? "text-red-700" : "text-slate-700")
                    }
                >
                    {busy ? "…" : user.isActive ? "Deactivate" : "Reactivate"}
                </button>
            </td>
        </tr>
    );
}

// ── add / edit dialog ──────────────────────────────

interface RowDraft {
    classId: string;
    subjectName: string;
    // true while typing a subject name that isn't picked from the class's list.
    isNew: boolean;
}

const NEW_SUBJECT = "__new__";

function StaffDialog({
    state,
    dir,
    onClose,
    onSaved,
}: {
    state: DialogState;
    dir: Directory;
    onClose: () => void;
    onSaved: (message: string) => void;
}) {
    const original = state.mode === "edit" ? state.user : null;

    // Set once the account exists — from the start when editing, after the
    // first successful create otherwise (so a retry doesn't create it twice).
    const [account, setAccount] = useState<PortalUser | null>(original);
    const [displayName, setDisplayName] = useState(original?.displayName ?? "");
    const [phone, setPhone] = useState(original?.phone ?? "");
    const [role, setRole] = useState<StaffRole>(
        state.mode === "edit" ? (state.user.role as StaffRole) : state.role
    );
    const [password, setPassword] = useState(() => (state.mode === "create" ? generatePassword() : ""));
    const [createdPassword, setCreatedPassword] = useState<string | null>(null);

    const [classTeacherOf, setClassTeacherOf] = useState<string[]>(() =>
        original ? assignmentsFor(original.uid, dir.classes, dir.subjects).classTeacherOf : []
    );
    const [rows, setRows] = useState<RowDraft[]>(() =>
        original
            ? assignmentsFor(original.uid, dir.classes, dir.subjects).subjects.map((a) => ({
                  classId: a.classId,
                  subjectName: a.subjectName,
                  isNew: false,
              }))
            : []
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const uid = account?.uid ?? null;
    const isCreate = state.mode === "create";

    const nameByUid = useMemo(() => new Map(dir.staff.map((u) => [u.uid, u.displayName])), [dir]);
    const nameOf = (id: string) => nameByUid.get(id) ?? "an admin";
    const classById = useMemo(() => new Map(dir.classes.map((c) => [c.id, c])), [dir]);

    const gradeGroups = useMemo(() => {
        const groups = new Map<number, SchoolClass[]>();
        for (const c of dir.classes) groups.set(c.grade, [...(groups.get(c.grade) ?? []), c]);
        return Array.from(groups.entries());
    }, [dir]);

    // One entry per (class, subject name) — what the class's subject picker lists.
    const subjectsByClass = useMemo(() => {
        const map = new Map<string, Subject[]>();
        const seen = new Set<string>();
        for (const s of [...dir.subjects].sort((a, b) => a.name.localeCompare(b.name))) {
            const key = subjectKey(s.classId, s.name);
            if (seen.has(key)) continue;
            seen.add(key);
            map.set(s.classId, [...(map.get(s.classId) ?? []), s]);
        }
        return map;
    }, [dir]);

    // Same matching rule as saveTeachingAssignments: prefer the doc already theirs.
    const existingByKey = useMemo(() => {
        const map = new Map<string, Subject>();
        for (const s of dir.subjects) {
            const key = subjectKey(s.classId, s.name);
            if (!map.has(key) || (uid && s.teacherId === uid)) map.set(key, s);
        }
        return map;
    }, [dir, uid]);

    const allSubjectNames = useMemo(
        () =>
            Array.from(new Set(dir.subjects.map((s) => normalizeSubjectName(s.name)))).sort((a, b) =>
                a.localeCompare(b)
            ),
        [dir]
    );

    const rowKeys = rows.map((r) =>
        r.classId && normalizeSubjectName(r.subjectName) ? subjectKey(r.classId, r.subjectName) : null
    );
    const duplicateKeys = new Set(rowKeys.filter((k, i) => k && rowKeys.indexOf(k) !== i));

    function updateRow(index: number, patch: Partial<RowDraft>) {
        setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
    }

    function changeRowClass(index: number, classId: string) {
        const row = rows[index];
        if (row.isNew) {
            updateRow(index, { classId });
            return;
        }
        // Keep the subject if the new class has one with the same name.
        const match = row.subjectName ? existingByKey.get(subjectKey(classId, row.subjectName)) : undefined;
        updateRow(index, { classId, subjectName: match?.name ?? "" });
    }

    function addRow() {
        setRows((prev) => [...prev, { classId: prev[prev.length - 1]?.classId ?? "", subjectName: "", isNew: false }]);
    }

    function removeRow(index: number) {
        setRows((prev) => prev.filter((_, i) => i !== index));
    }

    function toggleClassTeacher(classId: string) {
        setClassTeacherOf((prev) => (prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]));
    }

    function describeRow(row: RowDraft, key: string | null): { tone: "muted" | "warn" | "new" | "error"; text: string } | null {
        if (!row.classId) return { tone: "muted", text: "Pick the class and section." };
        if (!key) return { tone: "muted", text: row.isNew ? "Type the subject name." : "Pick a subject." };
        if (duplicateKeys.has(key)) return { tone: "error", text: "This subject is listed twice for the same class." };
        const existing = existingByKey.get(key);
        const className = classById.get(row.classId)?.name ?? "this class";
        if (!existing) return { tone: "new", text: `New subject — it will be added to ${className}.` };
        if (!existing.teacherId) return { tone: "muted", text: `${existing.name} in ${className} has no teacher yet.` };
        if (existing.teacherId === uid) return null;
        return {
            tone: "warn",
            text: `${existing.name} in ${className} is taught by ${nameOf(existing.teacherId)} — it will move to ${displayName.trim() || "this person"}.`,
        };
    }

    const classTeacherReplacements = classTeacherOf
        .map((id) => classById.get(id))
        .filter((c): c is SchoolClass => !!c && !!c.classTeacherId && c.classTeacherId !== uid);

    function validate(): string | null {
        if (!displayName.trim()) return "Enter their full name.";
        if (!phone.trim()) return "Enter their phone number.";
        if (!account && password.length < MIN_PASSWORD_LENGTH) {
            return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
        }
        if (account && password && password.length < MIN_PASSWORD_LENGTH) {
            return `New password must be at least ${MIN_PASSWORD_LENGTH} characters, or leave it empty.`;
        }
        for (const row of rows) {
            if (!row.classId || !normalizeSubjectName(row.subjectName)) {
                return "Every subject row needs a class and a subject. Remove empty rows.";
            }
        }
        if (duplicateKeys.size > 0) return "A subject is listed twice for the same class.";
        return null;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const problem = validate();
        if (problem) {
            setError(problem);
            return;
        }
        setSaving(true);
        setError(null);

        let profile = account;
        let newPassword: string | null = null;
        try {
            if (!profile) {
                profile = await createStaffAccount({ displayName, phone, role, password });
                newPassword = password;
                setCreatedPassword(password);
                setPassword("");
            } else {
                const patch: UpdateStaffInput = { uid: profile.uid };
                if (displayName.trim() !== profile.displayName) patch.displayName = displayName;
                if (phone.trim() !== profile.phone) patch.phone = phone;
                if (role !== profile.role) patch.role = role;
                if (password) {
                    patch.password = password;
                    newPassword = password;
                }
                if (Object.keys(patch).length > 1) profile = await updateStaffAccount(patch);
                setPassword("");
            }
            setAccount(profile);
        } catch (err) {
            setError(errorText(err, "Couldn't save the account"));
            setSaving(false);
            return;
        }

        try {
            await saveTeachingAssignments(profile.uid, {
                classTeacherOf,
                subjects: rows.map((r) => ({ classId: r.classId, subjectName: r.subjectName })),
            });
        } catch (err) {
            const reason = errorText(err, "Couldn't save assignments");
            setError(
                isCreate
                    ? `The account was created, but its class and subject assignments weren't saved: ${reason} Press Save to try again.`
                    : reason
            );
            setSaving(false);
            return;
        }

        const sharePassword = newPassword ?? (isCreate ? createdPassword : null);
        onSaved(
            isCreate
                ? `Created ${profile.displayName}. They sign in with ${profile.phone}` +
                      (sharePassword ? ` and password ${sharePassword}` : "") +
                      ". Share these with them — the password isn't shown again."
                : `Saved ${profile.displayName}.` +
                      (sharePassword ? ` New password: ${sharePassword} — share it with them; it isn't shown again.` : "")
        );
    }

    const roleChanged = !!original && role !== original.role;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
            <form onSubmit={handleSubmit} className="my-8 w-full max-w-2xl space-y-6 rounded-xl bg-white p-6 shadow-xl">
                <div>
                    <h2 className="text-base font-semibold text-slate-900">
                        {isCreate && !account
                            ? role === "teacher"
                                ? "Add teacher"
                                : "Add staff member"
                            : `Edit ${account?.displayName ?? displayName}`}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                        {isCreate && !account
                            ? "Creates their portal login. They sign in with this phone number and password."
                            : "Changes to the login apply immediately. Assignments update the class and subject records."}
                    </p>
                </div>

                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{error}</div>
                )}

                {/* Account */}
                <section className="space-y-3">
                    <SectionHeading title="Login" />
                    <div className="grid gap-3 md:grid-cols-2">
                        <Field label="Full name">
                            <input
                                required
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className={inputCls}
                                placeholder="e.g. Suman Behera"
                            />
                        </Field>
                        <Field label="Phone number">
                            <input
                                required
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className={inputCls}
                                placeholder="10-digit mobile, or +91…"
                            />
                        </Field>
                        {/* Not a <label>: clicking its text would press the first button. */}
                        <div className="text-xs font-medium text-slate-700">
                            <span className="mb-1 block">Role</span>
                            <div className="inline-flex rounded-md border border-slate-300 p-0.5">
                                {(["teacher", "staff"] as StaffRole[]).map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setRole(r)}
                                        aria-pressed={role === r}
                                        className={
                                            "rounded px-3 py-1.5 text-sm " +
                                            (role === r ? "bg-blue-600 font-medium text-white" : "text-slate-700 hover:bg-slate-100")
                                        }
                                    >
                                        {ROLE_LABEL[r]}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <Field label={account ? "New password (optional)" : "Password"}>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={inputCls + " font-mono"}
                                    placeholder={account ? "Leave empty to keep current" : ""}
                                />
                                <button
                                    type="button"
                                    onClick={() => setPassword(generatePassword())}
                                    className="shrink-0 rounded-md border border-slate-300 px-2.5 text-xs text-slate-700 hover:bg-slate-100"
                                >
                                    Generate
                                </button>
                            </div>
                        </Field>
                    </div>
                    {account && (roleChanged || password) && (
                        <p className="text-xs text-amber-700">
                            Changing the {roleChanged && password ? "role and password" : roleChanged ? "role" : "password"} signs
                            them out; they&apos;ll need to sign in again.
                        </p>
                    )}
                </section>

                {/* Class teacher */}
                <section className="space-y-3">
                    <SectionHeading
                        title="Class teacher of"
                        hint="Optional. The class teacher is the person in charge of a section. Each section has at most one."
                    />
                    {dir.classes.length === 0 ? (
                        <NoClasses />
                    ) : (
                        <div className="space-y-2">
                            {gradeGroups.map(([grade, classes]) => (
                                <div key={grade} className="flex flex-wrap items-center gap-2">
                                    <span className="w-16 shrink-0 text-xs text-slate-500">Grade {grade}</span>
                                    {classes.map((c) => {
                                        const selected = classTeacherOf.includes(c.id);
                                        return (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => toggleClassTeacher(c.id)}
                                                aria-pressed={selected}
                                                title={
                                                    c.classTeacherId
                                                        ? `Class teacher: ${c.classTeacherId === uid ? "this person" : nameOf(c.classTeacherId)}`
                                                        : "No class teacher"
                                                }
                                                className={
                                                    "rounded-full border px-3 py-1 text-xs " +
                                                    (selected
                                                        ? "border-blue-500 bg-blue-50 font-medium text-blue-800"
                                                        : "border-slate-300 text-slate-700 hover:bg-slate-100")
                                                }
                                            >
                                                {c.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                            {classTeacherReplacements.map((c) => (
                                <p key={c.id} className="text-xs text-amber-700">
                                    Replaces {nameOf(c.classTeacherId!)} as class teacher of {c.name}.
                                </p>
                            ))}
                        </div>
                    )}
                </section>

                {/* Subjects */}
                <section className="space-y-3">
                    <SectionHeading
                        title={`Subjects they teach${rows.length ? ` (${rows.length})` : ""}`}
                        hint={
                            role === "staff"
                                ? "Optional — leave empty for non-teaching staff. One row per subject per class and section."
                                : "One row per subject per class and section, e.g. Mathematics in 7-A and Mathematics in 7-B."
                        }
                    />
                    {dir.classes.length === 0 ? (
                        <NoClasses />
                    ) : (
                        <>
                            {rows.map((row, i) => {
                                const hint = describeRow(row, rowKeys[i]);
                                const options = subjectsByClass.get(row.classId) ?? [];
                                return (
                                    <div key={i} className="rounded-lg border border-slate-200 p-3">
                                        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] md:items-center">
                                            <select
                                                value={row.classId}
                                                onChange={(e) => changeRowClass(i, e.target.value)}
                                                className={inputCls}
                                                aria-label="Class and section"
                                            >
                                                <option value="">Class & section…</option>
                                                {gradeGroups.map(([grade, classes]) => (
                                                    <optgroup key={grade} label={`Grade ${grade}`}>
                                                        {classes.map((c) => (
                                                            <option key={c.id} value={c.id}>{c.name}</option>
                                                        ))}
                                                    </optgroup>
                                                ))}
                                            </select>
                                            {row.isNew ? (
                                                <div className="flex gap-2">
                                                    <input
                                                        list="staff-subject-names"
                                                        value={row.subjectName}
                                                        onChange={(e) => updateRow(i, { subjectName: e.target.value })}
                                                        className={inputCls}
                                                        placeholder="New subject name"
                                                        aria-label="Subject name"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => updateRow(i, { isNew: false, subjectName: "" })}
                                                        className="shrink-0 rounded-md border border-slate-300 px-2.5 text-xs text-slate-700 hover:bg-slate-100"
                                                    >
                                                        List
                                                    </button>
                                                </div>
                                            ) : (
                                                <select
                                                    value={row.subjectName}
                                                    disabled={!row.classId}
                                                    onChange={(e) =>
                                                        e.target.value === NEW_SUBJECT
                                                            ? updateRow(i, { isNew: true, subjectName: "" })
                                                            : updateRow(i, { subjectName: e.target.value })
                                                    }
                                                    className={inputCls + " disabled:bg-slate-50"}
                                                    aria-label="Subject"
                                                >
                                                    <option value="">{row.classId ? "Subject…" : "Pick a class first"}</option>
                                                    {options.map((s) => (
                                                        <option key={s.id} value={s.name}>
                                                            {s.name} —{" "}
                                                            {!s.teacherId ? "no teacher" : s.teacherId === uid ? "this person" : nameOf(s.teacherId)}
                                                        </option>
                                                    ))}
                                                    <option value={NEW_SUBJECT}>+ New subject…</option>
                                                </select>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeRow(i)}
                                                className="justify-self-start text-xs text-red-700 hover:underline md:justify-self-end"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        {hint && (
                                            <p
                                                className={
                                                    "mt-2 text-xs " +
                                                    (hint.tone === "error"
                                                        ? "text-red-700"
                                                        : hint.tone === "warn"
                                                          ? "text-amber-700"
                                                          : hint.tone === "new"
                                                            ? "text-blue-700"
                                                            : "text-slate-500")
                                                }
                                            >
                                                {hint.text}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                            <datalist id="staff-subject-names">
                                {allSubjectNames.map((n) => (
                                    <option key={n} value={n} />
                                ))}
                            </datalist>
                            <button
                                type="button"
                                onClick={addRow}
                                className="rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                                + Add subject
                            </button>
                        </>
                    )}
                </section>

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="rounded-md px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                    >
                        {account && isCreate ? "Close" : "Cancel"}
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {saving ? "Saving…" : isCreate && !account ? "Create account" : "Save"}
                    </button>
                </div>
            </form>
        </div>
    );
}

function SectionHeading({ title, hint }: { title: string; hint?: string }) {
    return (
        <div className="border-b border-slate-100 pb-1.5">
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
        </div>
    );
}

function NoClasses() {
    return (
        <p className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-500">
            No classes yet.{" "}
            <Link href="/portal/admin/classes" className="font-medium text-blue-700 hover:underline">
                Add classes and sections
            </Link>{" "}
            first.
        </p>
    );
}

const inputCls = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block text-xs font-medium text-slate-700">
            <span className="mb-1 block">{label}</span>
            {children}
        </label>
    );
}

function errorText(err: unknown, fallback: string) {
    return err instanceof Error ? err.message : fallback;
}
