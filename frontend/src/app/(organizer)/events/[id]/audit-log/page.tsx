"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from "@/components/ui";
import type { ApiResult, AuditLogItem } from "@/types/shared";

const ENTITY_FILTERS = [
  "all",
  "score",
  "correction_request",
  "event",
  "registration",
] as const;

export default function AuditLogPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [filter, setFilter] = useState<(typeof ENTITY_FILTERS)[number]>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q =
        filter === "all" ? "" : `?entity_type=${encodeURIComponent(filter)}`;
      const res = await fetch(
        `/api/events/${encodeURIComponent(eventId)}/audit-log${q}`
      );
      const json = (await res.json()) as ApiResult<AuditLogItem[]>;
      if (!res.ok || !json.ok) {
        setError(!json.ok ? json.error : "Failed to load audit log.");
        setLogs([]);
        return;
      }
      setLogs(json.data);
    } catch {
      setError("Network error loading audit log.");
    } finally {
      setLoading(false);
    }
  }, [eventId, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    // Client display only — source of truth is server list for active filter
    return { shown: logs.length };
  }, [logs]);

  return (
    <div className="min-h-screen bg-[var(--ihi-surface-50)] px-4 py-10 text-[var(--ihi-surface-900)] sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--ihi-surface-500)]">
              Organizer · Read-only permanent record
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
            <p className="mt-1 text-sm text-[var(--ihi-surface-600)]">
              Newest first. No write actions on this screen.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/events/${eventId}/results`}>
              <Button type="button" variant="secondary">
                Results
              </Button>
            </Link>
            <Button type="button" variant="primary" onClick={load} loading={loading}>
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

        <Card padding="md" variant="default">
          <div className="flex flex-wrap gap-2">
            {ENTITY_FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={[
                  "rounded-full border px-3 py-1.5 text-xs font-medium",
                  filter === f
                    ? "border-[var(--ihi-brand-600)] bg-[var(--ihi-brand-600)] text-white"
                    : "border-[var(--ihi-surface-200)] bg-[var(--ihi-surface-0)] text-[var(--ihi-surface-700)]",
                ].join(" ")}
              >
                {f}
              </button>
            ))}
          </div>
          <p className="mt-2 font-mono text-[10px] text-[var(--ihi-surface-500)]">
            Showing {counts.shown} row(s)
          </p>
        </Card>

        <Card padding="none" variant="default">
          {loading ? (
            <div className="px-4 py-12 text-center text-sm text-[var(--ihi-surface-500)]">
              Loading audit log…
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Payload</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableEmpty colSpan={5} message="No audit entries for this filter." />
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs text-[var(--ihi-surface-600)]">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold">
                        {log.action}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.entity_type}
                        {log.entity_id ? (
                          <span className="text-[var(--ihi-surface-400)]">
                            {" "}
                            · {log.entity_id.slice(0, 8)}…
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-[var(--ihi-surface-500)]">
                        {log.actor_id ? `${log.actor_id.slice(0, 8)}…` : "—"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate font-mono text-[10px] text-[var(--ihi-surface-500)]">
                        {JSON.stringify(log.payload)}
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