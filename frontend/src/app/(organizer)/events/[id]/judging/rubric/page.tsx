"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, Input, StatusBadge } from "@/components/ui";
import type { ApiResult, RubricCriterion } from "@/types/shared";

const EMPTY_ROW = (): RubricCriterion => ({
  title: "",
  description: "",
  max_score: 10,
  weight: 0,
});

export default function RubricBuilderPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [title, setTitle] = useState("Main Evaluation Rubric");
  const [criteria, setCriteria] = useState<RubricCriterion[]>([
    { title: "Technical Complexity", description: "", max_score: 10, weight: 30 },
    { title: "Innovation", description: "", max_score: 10, weight: 25 },
    { title: "Design / UX", description: "", max_score: 10, weight: 25 },
    { title: "Impact", description: "", max_score: 10, weight: 20 },
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const totalWeight = useMemo(
    () => criteria.reduce((s, c) => s + (Number(c.weight) || 0), 0),
    [criteria]
  );
  const isExactly100 = Math.abs(totalWeight - 100) < 0.001;
  // Functionally non-clickable unless exactly 100
  const canSave = isExactly100 && criteria.every((c) => c.title.trim() && Number(c.weight) > 0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/judging/rubric?eventId=${encodeURIComponent(eventId)}`);
      const json = (await res.json()) as ApiResult<{
        title?: string;
        criteria?: RubricCriterion[];
      } | null>;
      if (res.ok && json.ok && json.data) {
        if (json.data.title) setTitle(json.data.title);
        if (json.data.criteria?.length) setCriteria(json.data.criteria);
      }
    } catch {
      setError("Could not load existing rubric.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const updateRow = (index: number, patch: Partial<RubricCriterion>) => {
    setCriteria((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
    setSuccess(null);
  };

  const addRow = () => setCriteria((prev) => [...prev, EMPTY_ROW()]);
  const removeRow = (index: number) => {
    setCriteria((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleSave = async () => {
    // Hard UI gate — do not fire request if invalid
    if (!canSave) return;

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/judging/rubric", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, title, criteria }),
      });
      const json = (await res.json()) as ApiResult<unknown>;
      if (!res.ok || !json.ok) {
        setError(
          !json.ok
            ? json.error
            : "Server rejected the rubric. Weights must total exactly 100%."
        );
        return;
      }
      setSuccess("Rubric saved. Weights total 100%.");
      await load();
    } catch {
      setError("Network error while saving rubric.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--ihi-surface-50)] px-4 py-10 text-[var(--ihi-surface-900)] sm:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--ihi-surface-500)]">
              Judging · {eventId}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">Rubric builder</h1>
            <p className="mt-1 text-sm text-[var(--ihi-surface-600)]">
              Criteria weights must sum to exactly 100 (UI + API + DB).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/events/${eventId}/judging/assign`}>
              <Button type="button" variant="secondary">
                Judge assign
              </Button>
            </Link>
            <Button
              type="button"
              variant="primary"
              loading={saving}
              disabled={!canSave || saving}
              aria-disabled={!canSave || saving}
              onClick={handleSave}
            >
              Save rubric
            </Button>
          </div>
        </div>

        <Card padding="md" variant="default">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-medium text-[var(--ihi-surface-500)]">Running total</span>
              <p className="font-mono text-2xl font-semibold tabular-nums">
                {totalWeight}
                <span className="text-sm font-normal text-[var(--ihi-surface-500)]"> / 100</span>
              </p>
            </div>
            <StatusBadge
              status={isExactly100 ? "good" : "critical"}
              label={isExactly100 ? "Valid — 100%" : `Invalid — ${totalWeight}%`}
            />
          </div>
        </Card>

        {error && (
          <div role="alert" className="rounded-md border border-[var(--ihi-signal-stop)]/30 bg-[var(--ihi-signal-stop-bg)] px-4 py-3 text-sm text-[var(--ihi-signal-stop)]">
            {error}
          </div>
        )}
        {success && (
          <div role="status" className="rounded-md border border-[var(--ihi-signal-go)]/30 bg-[var(--ihi-signal-go-bg)] px-4 py-3 text-sm text-[var(--ihi-signal-go)]">
            {success}
          </div>
        )}

        <Card padding="md" variant="default">
          <Input label="Rubric title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </Card>

        {loading ? (
          <p className="text-sm text-[var(--ihi-surface-500)]">Loading…</p>
        ) : (
          <div className="space-y-4">
            {criteria.map((c, index) => (
              <Card key={index} padding="md" variant="default" className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ihi-surface-500)]">
                    Criterion {index + 1}
                  </p>
                  <Button type="button" size="sm" variant="ghost" onClick={() => removeRow(index)}>
                    Remove
                  </Button>
                </div>
                <Input
                  label="Name"
                  value={c.title}
                  onChange={(e) => updateRow(index, { title: e.target.value })}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Weight (%)"
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={c.weight}
                    onChange={(e) => updateRow(index, { weight: Number(e.target.value) })}
                  />
                  <Input
                    label="Scale (max score)"
                    type="number"
                    min={1}
                    value={c.max_score}
                    onChange={(e) => updateRow(index, { max_score: Number(e.target.value) })}
                  />
                </div>
                <Input
                  label="Description (optional)"
                  value={c.description || ""}
                  onChange={(e) => updateRow(index, { description: e.target.value })}
                />
              </Card>
            ))}
            <Button type="button" variant="secondary" onClick={addRow} className="w-full">
              + Add criterion
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}