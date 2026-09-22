"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, Input, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from "@/components/ui";
import type { ApiResult, JudgeInvite } from "@/types/shared";

export default function JudgeAssignPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [emailText, setEmailText] = useState("");
  const [invites, setInvites] = useState<JudgeInvite[]>([]);
  const [assignments, setAssignments] = useState<
    { id: string; judge_user_id: string; submission_id: string | null; status: string }[]
  >([]);
  const [assignSummary, setAssignSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [invRes, asgRes] = await Promise.all([
        fetch(`/api/judging/invites?eventId=${encodeURIComponent(eventId)}`),
        fetch(`/api/judging/assign?eventId=${encodeURIComponent(eventId)}`),
      ]);
      const invJson = (await invRes.json()) as ApiResult<JudgeInvite[]>;
      const asgJson = (await asgRes.json()) as ApiResult<typeof assignments>;
      if (invRes.ok && invJson.ok) setInvites(invJson.data);
      if (asgRes.ok && asgJson.ok) setAssignments(asgJson.data as typeof assignments);
    } catch {
      setError("Failed to load invites/assignments.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleInvite = async () => {
    const emails = emailText
      .split(/[\n,;]+/)
      .map((e) => e.trim())
      .filter(Boolean);
    if (emails.length === 0) {
      setError("Enter at least one judge email.");
      return;
    }
    setInviting(true);
    setError(null);
    try {
      const res = await fetch("/api/judging/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, emails }),
      });
      const json = (await res.json()) as ApiResult<{ magicResults?: { email: string; magicLinkSent: boolean; note?: string }[] }>;
      if (!res.ok || !json.ok) {
        setError(!json.ok ? json.error : "Invite failed.");
        return;
      }
      setEmailText("");
      const notes = (json.data.magicResults || [])
        .map((m) => `${m.email}: ${m.magicLinkSent ? "magic link sent" : m.note || "saved only"}`)
        .join(" · ");
      setAssignSummary(notes || "Invites saved.");
      await load();
    } catch {
      setError("Network error sending invites.");
    } finally {
      setInviting(false);
    }
  };

  const handleAutoAssign = async () => {
    setAssigning(true);
    setError(null);
    setAssignSummary(null);
    try {
      const res = await fetch("/api/judging/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      const json = (await res.json()) as ApiResult<{
        assignmentCount: number;
        judgeCount: number;
        submissionCount: number;
        perJudge: Record<string, number>;
      }>;
      if (!res.ok || !json.ok) {
        setError(!json.ok ? json.error : "Assign failed.");
        return;
      }
      const per = Object.entries(json.data.perJudge)
        .map(([id, n]) => `${id.slice(0, 8)}… → ${n} submission(s)`)
        .join(" | ");
      setAssignSummary(
        `Assigned ${json.data.assignmentCount} submission(s) across ${json.data.judgeCount} judge(s). ${per}`
      );
      await load();
    } catch {
      setError("Network error during auto-assign.");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--ihi-surface-50)] px-4 py-10 text-[var(--ihi-surface-900)] sm:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--ihi-surface-500)]">
              Judging · {eventId}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">Judges & assignment</h1>
            <p className="mt-1 text-sm text-[var(--ihi-surface-600)]">
              Invite by email, then round-robin auto-assign submissions (MVP).
            </p>
          </div>
          <Link href={`/events/${eventId}/judging/rubric`}>
            <Button type="button" variant="secondary">
              Rubric builder
            </Button>
          </Link>
        </div>

        {error && (
          <div role="alert" className="rounded-md border border-[var(--ihi-signal-stop)]/30 bg-[var(--ihi-signal-stop-bg)] px-4 py-3 text-sm text-[var(--ihi-signal-stop)]">
            {error}
          </div>
        )}
        {assignSummary && (
          <div role="status" className="rounded-md border border-[var(--ihi-signal-go)]/30 bg-[var(--ihi-signal-go-bg)] px-4 py-3 text-sm text-[var(--ihi-signal-go)]">
            {assignSummary}
          </div>
        )}

        <Card padding="md" variant="default" className="space-y-3">
          <h2 className="text-sm font-semibold">Invite judges</h2>
          <p className="text-xs text-[var(--ihi-surface-500)]">
            One email per line, or comma-separated. Saves invite rows and attempts magic-link OTP.
          </p>
          <textarea
            className="min-h-[100px] w-full rounded-[var(--radius-md)] border border-[var(--ihi-surface-200)] bg-[var(--ihi-surface-0)] px-3 py-2 text-sm"
            placeholder={"judge1@example.com\njudge2@example.com\njudge3@example.com"}
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
          />
          <Button type="button" variant="primary" loading={inviting} onClick={handleInvite}>
            Send invites
          </Button>
        </Card>

        <Card padding="none" variant="default">
          <div className="border-b border-[var(--ihi-surface-200)] px-4 py-3 text-sm font-semibold">
            Invited judges
          </div>
          {loading ? (
            <p className="p-4 text-sm text-[var(--ihi-surface-500)]">Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invited</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.length === 0 ? (
                  <TableEmpty colSpan={3} message="No invites yet." />
                ) : (
                  invites.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>{inv.email}</TableCell>
                      <TableCell>{inv.status}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {new Date(inv.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card padding="md" variant="default" className="space-y-3">
          <h2 className="text-sm font-semibold">Auto-assign (round-robin)</h2>
          <p className="text-xs text-[var(--ihi-surface-500)]">
            Distributes all event submissions evenly across judges who have accounts. Replaces
            previous assignments for this event. No COI / track matching.
          </p>
          <Button type="button" variant="primary" loading={assigning} onClick={handleAutoAssign}>
            Run auto-assign
          </Button>
        </Card>

        <Card padding="none" variant="default">
          <div className="border-b border-[var(--ihi-surface-200)] px-4 py-3 text-sm font-semibold">
            Current assignments ({assignments.length})
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judge user</TableHead>
                <TableHead>Submission</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.length === 0 ? (
                <TableEmpty colSpan={3} message="No assignments yet." />
              ) : (
                assignments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.judge_user_id}</TableCell>
                    <TableCell className="font-mono text-xs">{a.submission_id}</TableCell>
                    <TableCell>{a.status}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}