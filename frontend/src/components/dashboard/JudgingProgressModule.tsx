'use client';

import { Card } from '@/components/ui';
import type { JudgingProgress } from './types';

interface Props {
  data: JudgingProgress;
}

/**
 * PLACEHOLDER MODULE — Judging Progress
 *
 * This component is a clean drop-in slot.  The judging data shape is
 * owned by Dev A and has not yet been finalised.  The numbers rendered
 * below are MOCK and clearly labelled as such.
 *
 * Once the real `JudgingProgress` type lands in shared.ts and a data
 * source is wired, replace the mock data at the call-site in page.tsx
 * and remove the "Mock data" banner inside this component.
 */
export function JudgingProgressModule({ data }: Props) {
  const completionPercent =
    data.totalSubmissions > 0
      ? Math.round((data.scoredCount / data.totalSubmissions) * 100)
      : 0;

  return (
    <Card className="relative overflow-hidden p-5">
      {/* ── Mock banner ──────────────────────────────────────── */}
      <div
        className="absolute inset-x-0 top-0 flex items-center justify-center gap-1.5 bg-[var(--ihi-signal-warn-bg)] px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--ihi-signal-warn)]"
        role="status"
      >
        <span aria-hidden="true">⚠</span> Mock data — awaiting judging
        integration
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-[var(--ihi-surface-500)]">
          Judging Progress
        </p>

        <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-[var(--ihi-surface-900)]" style={{ fontFamily: "var(--font-mono)" }}>
          {completionPercent}%
        </p>
        <p className="mt-1 text-xs text-[var(--ihi-surface-400)]">
          {data.scoredCount} of {data.totalSubmissions} scored
        </p>

        {/* progress bar */}
        <div
          className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--ihi-surface-100)]"
          role="progressbar"
          aria-valuenow={completionPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Judging ${completionPercent}% complete (mock)`}
        >
          <div
            className="h-full rounded-full bg-[var(--ihi-signal-warn)] transition-all duration-500"
            style={{ width: `${completionPercent}%` }}
          />
        </div>

        <p className="mt-2 text-xs text-[var(--ihi-surface-400)]">
          {data.judgesActive} judge{data.judgesActive !== 1 ? 's' : ''} active
          {data.averageScore !== null &&
            ` · avg score ${data.averageScore.toFixed(1)}`}
        </p>
      </div>
    </Card>
  );
}
