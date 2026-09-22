"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, StatusBadge } from "@/components/ui";
import type { ApiResult, AssignedSubmissionItem } from "@/types/shared";

export default function JudgeQueuePage() {
  const [items, setItems] = useState<AssignedSubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/judging/queue");
      const json = (await res.json()) as ApiResult<AssignedSubmissionItem[]>;
      if (!res.ok || !json.ok) {
        setError(!json.ok ? json.error : "Failed to load assigned queue.");
        return;
      }
      setItems(json.data);
    } catch {
      setError("Network error loading queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  return (
    <div className="min-h-screen bg-black px-4 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
              Judge Portal
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
              Assigned Submissions Queue
            </h1>
            <p className="mt-1 text-xs text-neutral-400">
              Submissions assigned to you. Unscored projects appear first.
            </p>
          </div>
          <Button variant="secondary" onClick={loadQueue} loading={loading}>
            Refresh Queue
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-sm text-neutral-500">Loading your queue...</div>
        ) : items.length === 0 ? (
          <Card padding="lg" variant="default" className="bg-neutral-950 border-white/15 text-center">
            <p className="text-sm text-neutral-400">No submissions currently assigned to your queue.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <Card
                key={item.assignment_id}
                padding="lg"
                variant="default"
                className="bg-neutral-950 border-white/15 transition hover:border-white/30"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold text-white">{item.project_title}</h2>
                      <StatusBadge
                        status={item.is_scored ? "good" : "attention"}
                        label={item.is_scored ? "Scored" : "Unscored"}
                      />
                      {item.has_pending_correction && (
                        <span className="rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono text-amber-400">
                          Correction Pending Review
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-xs text-neutral-400">Team: {item.team_name}</p>
                  </div>

                  <Link href={`/judge/queue/${item.submission_id}?eventId=${item.event_id}`}>
                    <Button variant={item.is_scored ? "secondary" : "primary"}>
                      {item.is_scored ? "View Score / Request Fix" : "Score Project →"}
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}