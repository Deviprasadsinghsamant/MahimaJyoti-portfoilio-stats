"use client";

import { useEffect, useState } from "react";
import { listClasses } from "@/lib/portal/data";
import type { SchoolClass } from "@/domain/portal/types";

interface Props {
    value: string | null;
    onChange: (classId: string) => void;
    onLoad?: (classes: SchoolClass[]) => void;
}

export function ClassSelector({ value, onChange, onLoad }: Props) {
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        listClasses().then((list) => {
            if (!mounted) return;
            const sorted = [...list].sort((a, b) => a.grade - b.grade || a.section.localeCompare(b.section));
            setClasses(sorted);
            setLoading(false);
            onLoad?.(sorted);
            if (!value && sorted.length > 0) onChange(sorted[0].id);
        });
        return () => {
            mounted = false;
        };
    }, [onChange, onLoad, value]);

    return (
        <select
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={loading}
            className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-neutral-900"
        >
            {loading && <option value="">Loading…</option>}
            {!loading && classes.length === 0 && <option value="">No classes</option>}
            {classes.map((c) => (
                <option key={c.id} value={c.id}>
                    {c.name}
                </option>
            ))}
        </select>
    );
}
