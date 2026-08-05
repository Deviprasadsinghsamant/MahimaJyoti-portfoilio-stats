"use client";

import { useEffect, useState } from "react";
import { RoleGate } from "@/components/portal/RoleGate";
import {
    planPromotion,
    runPromotion,
    type PromotionPlan,
} from "@/lib/portal/data";

export default function PromotionPage() {
    return (
        <RoleGate allow={["admin"]}>
            <PromotionView />
        </RoleGate>
    );
}

function PromotionView() {
    const [plan, setPlan] = useState<PromotionPlan | null>(null);
    const [loading, setLoading] = useState(false);
    const [running, setRunning] = useState(false);
    const [graduateTop, setGraduateTop] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{ promoted: number; graduated: number } | null>(null);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            setPlan(await planPromotion());
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to plan");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    async function handleRun() {
        if (!plan) return;
        const total = plan.moves.reduce((n, m) => n + (m.toClassId || graduateTop ? m.studentCount : 0), 0);
        if (!confirm(`This will update ${total} student records. Continue?`)) return;
        setRunning(true);
        setError(null);
        setResult(null);
        try {
            const r = await runPromotion(plan, graduateTop);
            setResult(r);
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Promotion failed");
        } finally {
            setRunning(false);
        }
    }

    const totalPromoted = plan?.moves.reduce((n, m) => (m.toClassId ? n + m.studentCount : n), 0) ?? 0;
    const strandedCount = plan?.moves.reduce((n, m) => (!m.toClassId ? n + m.studentCount : n), 0) ?? 0;

    return (
        <div>
            <div className="border-b border-neutral-200 bg-white px-4 py-4 md:px-8">
                <h1 className="text-lg font-semibold text-neutral-900">Annual Promotion</h1>
                <p className="mt-1 text-sm text-neutral-600">
                    Advance every active student to the next grade at the end of an academic year.
                    Run once when a new session starts.
                </p>
            </div>

            <div className="p-4 md:p-8">
                {error && (
                    <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                        {error}
                    </div>
                )}
                {result && (
                    <div className="mb-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                        Done. {result.promoted} promoted{result.graduated > 0 ? `, ${result.graduated} graduated (marked inactive)` : ""}.
                    </div>
                )}

                {loading ? (
                    <div className="text-sm text-neutral-500">Analysing classes…</div>
                ) : !plan ? null : (
                    <>
                        <div className="mb-4 overflow-hidden rounded border border-neutral-200 bg-white">
                            <table className="min-w-full text-sm">
                                <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
                                    <tr>
                                        <th className="px-4 py-3">From</th>
                                        <th className="px-4 py-3">To</th>
                                        <th className="px-4 py-3">Active students</th>
                                        <th className="px-4 py-3">Effect</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {plan.moves.map((m) => (
                                        <tr key={m.fromClassId} className="border-t border-neutral-100">
                                            <td className="px-4 py-2 font-medium text-neutral-900">{m.fromClassName}</td>
                                            <td className="px-4 py-2 text-neutral-700">
                                                {m.toClassName ?? <span className="text-amber-700">no next class</span>}
                                            </td>
                                            <td className="px-4 py-2 text-neutral-700">{m.studentCount}</td>
                                            <td className="px-4 py-2 text-xs text-neutral-600">
                                                {m.toClassId
                                                    ? "will be moved"
                                                    : graduateTop
                                                        ? "will be graduated (marked inactive)"
                                                        : "will be left in place"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mb-4 rounded border border-neutral-200 bg-white p-4 text-sm text-neutral-700">
                            <div>
                                <strong>{totalPromoted}</strong> students will move up a grade.
                            </div>
                            {strandedCount > 0 && (
                                <div className="mt-2">
                                    <strong>{strandedCount}</strong> students are in the highest grade with no next class.
                                    <label className="mt-2 flex items-center gap-2 text-xs text-neutral-700">
                                        <input
                                            type="checkbox"
                                            checked={graduateTop}
                                            onChange={(e) => setGraduateTop(e.target.checked)}
                                        />
                                        Graduate them (mark inactive)
                                    </label>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleRun}
                            disabled={running || totalPromoted + (graduateTop ? strandedCount : 0) === 0}
                            className="rounded bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
                        >
                            {running ? "Promoting…" : "Run promotion"}
                        </button>
                        <p className="mt-2 text-xs text-neutral-500">
                            This uses a Firestore batch write — either all changes apply or none.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
