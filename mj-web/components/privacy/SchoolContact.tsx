"use client";

import { useEffect, useState } from "react";
import { getSiteContent } from "@/lib/portal/content";
import type { ContactBlock } from "@/domain/portal/content-types";

/** The school's contact details as entered under Admin → Contact page; the address alone until then. */
export function SchoolContact() {
    const [blocks, setBlocks] = useState<ContactBlock[]>([]);

    useEffect(() => {
        getSiteContent("contact")
            .then((d) => setBlocks(d?.contactInfo ?? []))
            .catch(() => setBlocks([]));
    }, []);

    return (
        <div className="rounded-2xl border border-gray-100 bg-ivory-50 p-6 text-sm leading-relaxed text-navy-900">
            <p className="font-semibold">Mahima Jyoti Awasika Vidyapitha</p>
            <p className="text-muted">Hakimapada, Angul, Odisha, India</p>
            {blocks.map((b, i) => (
                <div key={i} className="mt-3">
                    <p className="font-semibold">{b.title}</p>
                    {b.lines.map((line, j) => (
                        <p key={j} className="text-muted">
                            {line}
                        </p>
                    ))}
                </div>
            ))}
            {blocks.length === 0 && <p className="mt-3 text-muted">Or speak to the school office in person.</p>}
        </div>
    );
}
