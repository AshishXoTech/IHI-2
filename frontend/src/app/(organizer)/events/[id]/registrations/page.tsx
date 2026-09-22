"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import type { Registration, RegistrationStatus, ApiResult } from "@/types/shared";

type FilterKey = "all" | RegistrationStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Confirmed" },
  { key: "waitlisted", label: "Waitlisted" },
  { key: "rejected", label: "Rejected" },
];

function statusToBadge(status: RegistrationStatus): {
  status: "good" | "attention" | "critical";
  label: string;
} {
  switch (status) {
    case "approved":
      return { status: "good", label: "Confirmed" };
    case "pending":
      return { status: "attention", label: "Pending" };
    case "waitlisted":
      return { status: "attention", label: "Waitlisted" };
    case "rejected":
      return { status: "critical", label: "Rejected" };
    case "withdrawn":
      return { status: "critical", label: "Withdrawn" };
    default:
      return { status: "attention", label: status };
  }
}

function escapeCsvCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * CLIENT-SIDE ONLY CSV export.
 * Limitation: exports only rows currently loaded in memory for this page.
 * If pagination is added later, unloaded pages will NOT appear unless we
 * add a dedicated server export endpoint.
 */
function downloadRegistrationsCsv(rows: Registration[], eventKey: string) {
  const header = ["id", "display_name", "status", "skills", "user_id", "created_at"];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        escapeCsvCell(r.id),
        escapeCsvCell(r.display_name),
        escapeCsvCell(r.status),
        escapeCsvCell((r.skills ?? []).join("; ")),
        escapeCsvCell(r.user_id),
        escapeCsvCell(r.created_at),
      ].join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `registrations-${eventKey}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function EventRegistrationsPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [rows, setRows] = useState<Registration[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/registrations`);
      const json = (await res.json()) as ApiResult<Registration[]>;
      if (!res.ok || !json.ok) {
        setError(!json.ok ? json.error : "Failed to load registrations.");
        setRows([]);
        return;
      }
      setRows(json.data);
    } catch {
      setError("Network error loading registrations.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = {
      all: rows.length,
      pending: 0,
      approved: 0,
      waitlisted: 0,
      rejected: 0,
      withdrawn: 0,
    };
    for (const r of rows) {
      if (r.status in c) c[r.status as FilterKey] += 1;
    }
    return c;
  }, [rows]);

  const visible = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => r.status === filter);
  }, [rows, filter]);

  const updateStatus = async (registrationId: string, status: RegistrationStatus) => {
    setActionId(registrationId);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/registrations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, status }),
      });
      const json = (await res.json()) as ApiResult<Registration>;
      if (!res.ok || !json.ok) {
        setError(!json.ok ? json.error : "Failed to update status.");
        return;
      }
      setRows((prev) => prev.map((r) => (r.id === json.data.id ? json.data : r)));
    } catch {
      setError("Network error updating registration.");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--ihi-surface-50)] px-4 py-10 text-[var(--ihi-surface-900)] sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--ihi-surface-500)]">
              Organizer · Event {eventId}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Registrations
            </h1>
            <p className="mt-1 text-sm text-[var(--ihi-surface-600)]">
              Review applicants, filter by status, approve or reject, export CSV.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/events/${eventId}`}>
              <Button variant="secondary" type="button">
                Public page
              </Button>
            </Link>
            <Button
              variant="secondary"
              type="button"
              onClick={() => downloadRegistrationsCsv(visible, eventId)}
              disabled={visible.length === 0}
            >
              Export CSV
            </Button>
            <Button variant="primary" type="button" onClick={load} loading={loading}>
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-[var(--radius-md)] border border-[var(--ihi-signal-stop)]/30 bg-[var(--ihi-signal-stop-bg)] px-4 py-3 text-sm text-[var(--ihi-signal-stop)]"
          >
            {error}
          </div>
        )}

        {/* Status filter chips + live counts */}
        <Card padding="md" variant="default">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const active = filter === f.key;
              const count = counts[f.key] ?? 0;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={[
                    "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    "border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ihi-brand-500)]",
                    active
                      ? "border-[var(--ihi-brand-600)] bg-[var(--ihi-brand-600)] text-white"
                      : "border-[var(--ihi-surface-200)] bg-[var(--ihi-surface-0)] text-[var(--ihi-surface-700)] hover:border-[var(--ihi-surface-300)]",
                  ].join(" ")}
                >
                  {f.label}
                  <span
                    className={[
                      "rounded-full px-1.5 py-0.5 font-mono text-[10px]",
                      active ? "bg-white/20 text-white" : "bg-[var(--ihi-surface-100)] text-[var(--ihi-surface-600)]",
                    ].join(" ")}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card padding="none" variant="default">
          {loading ? (
            <div className="px-4 py-16 text-center text-sm text-[var(--ihi-surface-500)]">
              Loading registrations…
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participant</TableHead>
                  <TableHead>Skills</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.length === 0 ? (
                  <TableEmpty colSpan={5} message="No registrations match this filter." />
                ) : (
                  visible.map((r) => {
                    const badge = statusToBadge(r.status);
                    const busy = actionId === r.id;
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="font-medium text-[var(--ihi-surface-900)]">
                            {r.display_name}
                          </div>
                          <div className="mt-0.5 font-mono text-[10px] text-[var(--ihi-surface-500)]">
                            {r.user_id.slice(0, 8)}…
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-[var(--ihi-surface-600)]">
                            {(r.skills ?? []).length ? r.skills.join(", ") : "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={badge.status} label={badge.label} />
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs text-[var(--ihi-surface-600)]">
                            {r.created_at
                              ? new Date(r.created_at).toLocaleString()
                              : "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="primary"
                              loading={busy}
                              disabled={busy || r.status === "approved"}
                              onClick={() => updateStatus(r.id, "approved")}
                            >
                              Approve
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              loading={busy}
                              disabled={busy || r.status === "rejected"}
                              onClick={() => updateStatus(r.id, "rejected")}
                            >
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </Card>

        <p className="text-xs text-[var(--ihi-surface-500)]">
          Export CSV is client-side only: it downloads the{" "}
          <strong>currently visible / loaded</strong> rows ({visible.length} row
          {visible.length === 1 ? "" : "s"} with the active filter). It does not
          hit a separate export API.
        </p>
      </div>
    </div>
  );
}