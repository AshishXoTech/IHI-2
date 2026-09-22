"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Card,
  StatusBadge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from "@/components/ui";
import type { ApiResult, ResultsSummary } from "@/types/shared";

export default function EventResultsPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [summary, setSummary] = useState<ResultsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(eventId)}/results`);
      const json = (await res.json()) as ApiResult<ResultsSummary>;
      if (!res.ok || !json.ok) {
        setError(!json.ok ? json.error : "Failed to load results.");
        setSummary(null);
        return;
      }
      setSummary(json.data);
    } catch {
      setError("Network error loading results.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePublish = async () => {
    // Structural gate: never call API if not publishable
    if (!summary?.is_publishable) return;

    setPublishing(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(eventId)}/results`, {
        method: "POST",
      });
      const json = (await res.json()) as ApiResult<unknown>;
      if (!res.ok || !json.ok) {
        setError(!json.ok ? json.error : "Publish failed.");
        return;
      }
      setSuccess("Results published. Event status is now results_published.");
      await load();
    } catch {
      setError("Network error publishing results.");
    } finally {
      setPublishing(false);
    }
  };

  const canPublish = Boolean(summary?.is_publishable) && !publishing;
  const alreadyPublished = summary?.event_status === "results_published";

  return (
    <div className="min-h-screen bg-[var(--ihi-surface-50)] px-4 py-10 text-[var(--ihi-surface-900)] sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--ihi-surface-500)]">
              Organizer · Results
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {summary?.event_name || "Event results"}
            </h1>
            <p className="mt-1 text-sm text-[var(--ihi-surface-600)]">
              Rankings computed server-side from immutable scores (rubric weights).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/events/${eventId}/audit-log`}>
              <Button type="button" variant="secondary">
                Audit log
              </Button>
            </Link>
            <Link href={`/events/${eventId}/judging/rubric`}>
              <Button type="button" variant="secondary">
                Rubric
              </Button>
            </Link>
            <Button type="button" variant="secondary" onClick={load} loading={loading}>
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-md border border-[var(--ihi-signal-stop)]/30 bg-[var(--ihi-signal-stop-bg)] px-4 py-3 text-sm text-[var(--ihi-signal-stop)]"
          >
            {error}
          </div>
        )}
        {success && (
          <div
            role="status"
            className="rounded-md border border-[var(--ihi-signal-go)]/30 bg-[var(--ihi-signal-go-bg)] px-4 py-3 text-sm text-[var(--ihi-signal-go)]"
          >
            {success}
          </div>
        )}

        {/* Completion gate + Publish */}
        <Card padding="md" variant="default">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--ihi-surface-500)]">
                Scoring completion
              </p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
                {summary?.completion_percentage ?? 0}%
                <span className="ml-2 text-sm font-normal text-[var(--ihi-surface-500)]">
                  ({summary?.total_scored_submissions ?? 0}/
                  {summary?.total_submissions ?? 0} submissions with ≥1 score)
                </span>
              </p>
              <div className="mt-2">
                <StatusBadge
                  status={summary?.is_publishable ? "good" : "attention"}
                  label={
                    alreadyPublished
                      ? "Results already published"
                      : summary?.is_publishable
                        ? "Ready to publish"
                        : "Blocked — incomplete scoring"
                  }
                />
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              loading={publishing}
              disabled={!canPublish || alreadyPublished}
              aria-disabled={!canPublish || alreadyPublished}
              onClick={handlePublish}
              title={
                alreadyPublished
                  ? "Already published"
                  : !summary?.is_publishable
                    ? "Disabled until every submission has at least one score"
                    : "Publish results"
              }
            >
              {alreadyPublished ? "Published" : "Publish Results"}
            </Button>
          </div>
          {!summary?.is_publishable && !alreadyPublished && (
            <p className="mt-3 text-xs text-[var(--ihi-surface-500)]">
              Publish is structurally disabled until completion reaches 100% (every
              submission has at least one judge score). The server re-checks this gate
              on publish — the button alone is not the security boundary.
            </p>
          )}
        </Card>

        <Card padding="none" variant="default">
          {loading ? (
            <div className="px-4 py-12 text-center text-sm text-[var(--ihi-surface-500)]">
              Computing rankings on server…
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Scores</TableHead>
                  <TableHead>Weighted avg</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!summary?.rankings?.length ? (
                  <TableEmpty colSpan={5} message="No submissions to rank." />
                ) : (
                  summary.rankings.map((r) => (
                    <TableRow key={r.submission_id}>
                      <TableCell className="font-mono font-semibold">#{r.rank}</TableCell>
                      <TableCell className="font-medium">{r.project_title}</TableCell>
                      <TableCell className="text-sm text-[var(--ihi-surface-600)]">
                        {r.team_name}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.score_count}</TableCell>
                      <TableCell className="font-mono font-semibold">
                        {r.final_average_score}%
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}