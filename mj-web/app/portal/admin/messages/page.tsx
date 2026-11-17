"use client";

// Messages sent from the website's Contact page. Admins read them here and reply
// by phone, WhatsApp or email; replying marks a message as read.
import { useCallback, useEffect, useMemo, useState } from "react";
import { RoleGate } from "@/components/portal/RoleGate";
import { PageHeader } from "@/components/portal/PageHeader";
import { InfoTip } from "@/components/portal/admin/Help";
import { contactHref } from "@/lib/portal/contactLinks";
import { deleteMessage, listMessages, setMessageRead, subjectLabel, type ContactMessage } from "@/lib/portal/messages";

export default function MessagesPage() {
    return (
        <RoleGate allow={["admin"]}>
            <MessagesView />
        </RoleGate>
    );
}

function when(ms: number) {
    return new Date(ms).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function MessagesView() {
    const [messages, setMessages] = useState<ContactMessage[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<"unread" | "all">("unread");

    const refresh = useCallback(async () => {
        setError(null);
        try {
            setMessages(await listMessages());
        } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't load messages");
        }
    }, []);

    useEffect(() => {
        let alive = true;
        listMessages().then(
            (m) => alive && setMessages(m),
            (err) => alive && setError(err instanceof Error ? err.message : "Couldn't load messages")
        );
        return () => {
            alive = false;
        };
    }, []);

    const unread = useMemo(() => (messages ?? []).filter((m) => !m.read).length, [messages]);
    const shown = useMemo(() => (messages ?? []).filter((m) => filter === "all" || !m.read), [messages, filter]);

    async function markRead(m: ContactMessage, read: boolean) {
        if (m.read === read) return;
        setMessages((list) => list?.map((x) => (x.id === m.id ? { ...x, read } : x)) ?? null);
        try {
            await setMessageRead(m.id, read);
            window.dispatchEvent(new Event("mj:messages-changed"));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't update the message");
            refresh();
        }
    }

    async function remove(m: ContactMessage) {
        if (!confirm(`Delete the message from ${m.name}? This can't be undone.`)) return;
        try {
            await deleteMessage(m.id);
            setMessages((list) => list?.filter((x) => x.id !== m.id) ?? null);
            window.dispatchEvent(new Event("mj:messages-changed"));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't delete the message");
        }
    }

    return (
        <div>
            <PageHeader
                eyebrow="Website"
                title="Messages"
                subtitle="Messages sent from the “Send Us a Message” form on the website's Contact page."
                actions={
                    <button onClick={refresh} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                        Check for new messages
                    </button>
                }
            />

            <div className="space-y-4 p-4 md:p-8">
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-sm text-blue-950">
                    <span className="font-semibold">
                        {messages === null ? "Loading…" : unread === 0 ? "No unread messages" : `${unread} unread message${unread === 1 ? "" : "s"}`}
                    </span>
                    <InfoTip label="About messages">
                        <strong>Reply</strong> with the Call, WhatsApp or Email buttons under each message — replying marks it as read.
                        <br />
                        <strong>Mark as read</strong> once it&apos;s dealt with, so the unread count in the menu stays useful.
                        <br />
                        <strong>Delete</strong> spam or old messages. The newest 100 messages are listed here.
                        <br />
                        Visitors can send at most 5 messages an hour, and obvious bot messages are dropped automatically.
                    </InfoTip>
                </div>

                <div className="flex gap-2 text-sm">
                    {(["unread", "all"] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            aria-pressed={filter === f}
                            className={
                                "rounded-full px-3 py-1 " +
                                (filter === f ? "bg-blue-600 text-white" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100")
                            }
                        >
                            {f === "unread" ? `Unread (${unread})` : `All (${messages?.length ?? 0})`}
                        </button>
                    ))}
                </div>

                {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}

                {messages !== null && shown.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                        {filter === "unread"
                            ? "You're all caught up — no unread messages."
                            : "No messages yet. They appear here when someone uses the form on the website's Contact page."}
                    </div>
                )}

                <ul className="space-y-3">
                    {shown.map((m) => {
                        const call = m.phone ? contactHref("phone", m.phone) : null;
                        const whatsapp = m.phone ? contactHref("whatsapp", m.phone) : null;
                        const mail = m.email
                            ? `mailto:${m.email}?subject=${encodeURIComponent(`Re: your message to Mahima Jyoti Awasika Vidyapitha`)}`
                            : null;
                        return (
                            <li
                                key={m.id}
                                className={
                                    "rounded-xl border bg-white p-4 shadow-sm " + (m.read ? "border-slate-200" : "border-blue-300 ring-1 ring-blue-100")
                                }
                            >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            {!m.read && <span className="h-2 w-2 rounded-full bg-blue-600" aria-label="Unread" />}
                                            <span className="font-semibold text-slate-900">{m.name}</span>
                                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{subjectLabel(m.subject)}</span>
                                        </div>
                                        <div className="mt-0.5 text-xs text-slate-500">
                                            {when(m.createdAt)}
                                            {m.phone && ` · ${m.phone}`}
                                            {m.email && ` · ${m.email}`}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs">
                                        <button onClick={() => markRead(m, !m.read)} className="text-blue-700 hover:underline">
                                            {m.read ? "Mark as unread" : "Mark as read"}
                                        </button>
                                        <button onClick={() => remove(m)} className="text-red-700 hover:underline">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{m.message}</p>
                                <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                                    {call && (
                                        <a href={call} onClick={() => markRead(m, true)} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100">
                                            Call
                                        </a>
                                    )}
                                    {whatsapp && (
                                        <a
                                            href={whatsapp}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => markRead(m, true)}
                                            className="rounded-md border border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-50"
                                        >
                                            WhatsApp
                                        </a>
                                    )}
                                    {mail && (
                                        <a href={mail} onClick={() => markRead(m, true)} className="rounded-md border border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-800 hover:bg-blue-50">
                                            Email
                                        </a>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
