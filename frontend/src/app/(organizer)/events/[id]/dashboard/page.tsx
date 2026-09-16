"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { RegistrationHealthModule } from "@/components/dashboard/RegistrationHealthModule";
import { TeamFormationHealthModule } from "@/components/dashboard/TeamFormationHealthModule";
import { SubmissionStatusModule } from "@/components/dashboard/SubmissionStatusModule";
import { JudgingProgressModule } from "@/components/dashboard/JudgingProgressModule";
import { PublishReadinessGate } from "@/components/dashboard/PublishReadinessGate";
import type {
    DashboardSummary,
    JudgingProgress,
    ReadinessCheck,
} from "@/components/dashboard/types";

// ── Mock data (used when NEXT_PUBLIC_USE_TEAM_MOCKS=true) ────────

const MOCK_SUMMARY: DashboardSummary = {
    event: {
        id: "mock-event-1",
        name: "IHI Demo Hackathon",
        maxParticipants: 500,
        submissionDeadline: new Date(
            Date.now() + 4 * 3600 * 1000,
        ).toISOString(),
    },
    registration: { total: 387, capacity: 500, utilizationPercent: 77.4 },
    teams: {
        totalTeams: 82,
        soloLookingCount: 12,
        totalParticipantsInTeams: 375,
    },
    submissions: {
        draftCount: 19,
        finalCount: 54,
        totalTeams: 82,
        completionPercent: 65.9,
    },
    serverTime: new Date().toISOString(),
};

const MOCK_JUDGING: JudgingProgress = {
    totalSubmissions: 54,
    scoredCount: 21,
    judgesActive: 6,
    averageScore: 7.3,
};

// ── Helpers ──────────────────────────────────────────────────────

function buildReadinessChecks(
    summary: DashboardSummary,
    judging: JudgingProgress,
): ReadinessCheck[] {
    const regOk =
        summary.registration.capacity === null ||
        (summary.registration.utilizationPercent ?? 0) >= 50;

    const teamsOk = summary.teams.soloLookingCount === 0;

    const subsOk =
        summary.submissions.totalTeams > 0 &&
        summary.submissions.completionPercent >= 95;

    const judgingOk =
        judging.totalSubmissions > 0 &&
        judging.scoredCount >= judging.totalSubmissions;

    return [
        {
            label: "Registration threshold met",
            passed: regOk,
            detail: regOk
                ? "Sufficient registrations recorded"
                : "Below 50% capacity",
        },
        {
            label: "All participants teamed",
            passed: teamsOk,
            detail: teamsOk
                ? "No solo participants remaining"
                : `${summary.teams.soloLookingCount} still looking`,
        },
        {
            label: "Submissions closed & complete",
            passed: subsOk,
            detail: subsOk
                ? `${summary.submissions.completionPercent}% finalized`
                : `${summary.submissions.completionPercent}% finalized — need ≥95%`,
        },
        {
            label: "Judging complete",
            passed: judgingOk,
            detail: judgingOk
                ? "All submissions scored"
                : `${judging.scoredCount}/${judging.totalSubmissions} scored (mock)`,
        },
    ];
}

// ── Page Component ───────────────────────────────────────────────

export default function DashboardPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: eventId } = use(params);
    const useMocks = process.env.NEXT_PUBLIC_USE_TEAM_MOCKS === "true";

    const [summary, setSummary] = useState<DashboardSummary | null>(
        useMocks ? MOCK_SUMMARY : null,
    );
    const [judging] = useState<JudgingProgress>(MOCK_JUDGING);
    const [loading, setLoading] = useState(!useMocks);
    const [error, setError] = useState<string | null>(null);
    const [liveIndicator, setLiveIndicator] = useState(false);

    // Debounce ref for Realtime re-fetches
    const reFetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Data fetch ─────────────────────────────────────────────────
    const fetchSummary = useCallback(async () => {
        if (useMocks) return;
        try {
            const res = await fetch(`/api/dashboard/${eventId}`, {
                cache: "no-store",
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: DashboardSummary = await res.json();
            setSummary(data);
            setError(null);
        } catch (err) {
            console.error("[dashboard] fetch error", err);
            setError("Unable to load dashboard data");
        } finally {
            setLoading(false);
        }
    }, [eventId, useMocks]);

    // Initial load
    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    // ── Supabase Realtime subscriptions ────────────────────────────
    useEffect(() => {
        if (useMocks) return;

        const supabase = createClient();
        const channel = supabase.channel(`dashboard-live-${eventId}`);

        const debouncedRefetch = () => {
            if (reFetchTimer.current) clearTimeout(reFetchTimer.current);
            reFetchTimer.current = setTimeout(() => {
                fetchSummary();
                // Brief "live" indicator flash
                setLiveIndicator(true);
                setTimeout(() => setLiveIndicator(false), 1500);
            }, 400); // 400ms debounce to batch rapid changes
        };

        channel
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "registrations",
                    filter: `event_id=eq.${eventId}`,
                },
                debouncedRefetch,
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "teams",
                    filter: `event_id=eq.${eventId}`,
                },
                debouncedRefetch,
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "submissions",
                    filter: `event_id=eq.${eventId}`,
                },
                debouncedRefetch,
            )
            .subscribe((status) => {
                if (status === "SUBSCRIBED") {
                    console.log("[dashboard] Realtime subscribed");
                }
            });

        return () => {
            supabase.removeChannel(channel);
            if (reFetchTimer.current) clearTimeout(reFetchTimer.current);
        };
    }, [eventId, useMocks, fetchSummary]);

    // ── Render ─────────────────────────────────────────────────────

    if (loading) {
        return (
            <div
                data-register="tower"
                className="flex min-h-screen items-center justify-center bg-[var(--ihi-surface-0)]"
            >
                <p className="text-sm text-[var(--ihi-surface-400)]">
                    Loading dashboard…
                </p>
            </div>
        );
    }

    if (error || !summary) {
        return (
            <div
                data-register="tower"
                className="flex min-h-screen items-center justify-center bg-[var(--ihi-surface-0)]"
            >
                <p className="text-sm text-[var(--ihi-signal-stop)]">
                    {error ?? "No data available"}
                </p>
            </div>
        );
    }

    const checks = buildReadinessChecks(summary, judging);

    return (
        <div
            data-register="tower"
            className="min-h-screen bg-[var(--ihi-surface-0)] text-[var(--ihi-surface-900)]"
        >
            {/* ── Header ──────────────────────────────────────────── */}
            <header className="sticky top-0 z-20 border-b border-[var(--ihi-surface-200)] bg-[var(--ihi-surface-0)]/95 backdrop-blur-sm">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                            {summary.event.name}
                        </h1>
                        <p className="text-xs text-[var(--ihi-surface-400)]">
                            Live Operations Dashboard
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* live indicator */}
                        <div
                            className="flex items-center gap-1.5"
                            role="status"
                        >
                            <span
                                className={`inline-block h-2 w-2 rounded-full transition-opacity duration-300 ${
                                    liveIndicator
                                        ? "bg-[var(--ihi-signal-go)] opacity-100"
                                        : "bg-[var(--ihi-signal-go)] opacity-40"
                                }`}
                                aria-hidden="true"
                            />
                            <span className="text-xs font-medium text-[var(--ihi-surface-400)]">
                                {useMocks ? "Mock mode" : "Live"}
                            </span>
                        </div>

                        {/* manual refresh */}
                        <button
                            onClick={() => fetchSummary()}
                            className="rounded-md border border-[var(--ihi-surface-200)] px-3 py-1.5 text-xs font-medium text-[var(--ihi-surface-500)] hover:bg-[var(--ihi-surface-100)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ihi-brand-500)]"
                            aria-label="Refresh dashboard data"
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Grid ────────────────────────────────────────────── */}
            <main className="mx-auto max-w-7xl px-6 py-8">
                <div className="grid gap-5 lg:grid-cols-3">
                    {/* Row 1 — three primary health modules */}
                    <RegistrationHealthModule data={summary.registration} />
                    <TeamFormationHealthModule data={summary.teams} />
                    <SubmissionStatusModule
                        data={summary.submissions}
                        deadline={summary.event.submissionDeadline}
                        serverTime={summary.serverTime}
                    />

                    {/* Row 2 — judging + readiness gate (span wider) */}
                    <div className="lg:col-span-1">
                        <JudgingProgressModule data={judging} />
                    </div>
                    <div className="lg:col-span-2">
                        <PublishReadinessGate checks={checks} />
                    </div>
                </div>
            </main>
        </div>
    );
}
