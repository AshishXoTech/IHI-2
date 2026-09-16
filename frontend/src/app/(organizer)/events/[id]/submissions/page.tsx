"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty, StatusBadge, Button, Card } from "@/components/ui";
import { CountdownTimer } from "@/components/submissions/CountdownTimer";
import { MOCK_DEADLINE } from "@/lib/mocks/submissions";
import type { Submission } from "@/components/submissions/types";
import type { Team } from "@/types/shared";

export default function OrganizerSubmissionsPage() {
  const params = useParams();
  const eventId = String(params.id);

  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, sRes] = await Promise.all([
        fetch(`/api/teams?event_id=${eventId}`),
        fetch(`/api/submissions?event_id=${eventId}`)
      ]);

      if (tRes.ok) {
        const tJson = await tRes.json().catch(() => null);
        if (tJson?.ok) setTeams(tJson.data);
      }
      
      if (sRes.ok) {
        const sJson = await sRes.json().catch(() => null);
        if (sJson?.ok) {
          const map: Record<string, Submission> = {};
          sJson.data.forEach((s: Submission) => { map[s.team_id] = s; });
          setSubmissions(map);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const totalTeams = teams.length;
  const submittedCount = Object.values(submissions).filter(s => !s.is_draft).length;
  const draftCount = Object.values(submissions).filter(s => s.is_draft).length;
  const missingCount = totalTeams - submittedCount - draftCount;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Submissions</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">Track project submissions in real time.</p>
        </div>
        <div className="flex items-center gap-3">
          <CountdownTimer deadlineIso={MOCK_DEADLINE} />
          <Button variant="secondary" size="sm" onClick={load}>Refresh</Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Card padding="md">
          <p className="text-xs text-[var(--text-muted)]">Total Teams</p>
          <p className="text-2xl font-semibold tabular-nums mt-1">{totalTeams}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-[var(--text-muted)]">Final Submitted</p>
          <p className="text-2xl font-semibold text-[var(--signal-good)] tabular-nums mt-1">{submittedCount}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-[var(--text-muted)]">Drafts Saved</p>
          <p className="text-2xl font-semibold text-[var(--signal-attention)] tabular-nums mt-1">{draftCount}</p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-[var(--text-muted)]">Missing</p>
          <p className="text-2xl font-semibold tabular-nums mt-1">{missingCount}</p>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Submission Status</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Repo</TableHead>
              <TableHead>Last Saved</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableEmpty message="Loading..." colSpan={4} />
            ) : teams.length === 0 ? (
              <TableEmpty message="No teams registered." colSpan={4} />
            ) : (
              teams.map((t) => {
                const sub = submissions[t.id];
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>
                      {!sub ? (
                        <span className="text-xs text-[var(--text-muted)]">Missing</span>
                      ) : sub.is_draft ? (
                        <StatusBadge status="attention" label="Draft" />
                      ) : (
                        <StatusBadge status="good" label="Submitted" />
                      )}
                    </TableCell>
                    <TableCell>
                      {sub?.repo_url ? (
                        <a href={sub.repo_url} target="_blank" rel="noreferrer" className="text-xs text-[var(--accent-text)] hover:underline">
                          View Repo
                        </a>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-[var(--text-muted)]">
                        {sub?.updated_at ? new Date(sub.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}