'use client';

import { useState, useEffect } from 'react';
import { StatusBadge } from '@/components/ui';
import { MetricCard } from './MetricCard';
import type { SubmissionStatus } from './types';

interface Props {
  data: SubmissionStatus;
  /** ISO-8601 deadline from the event record */
  deadline: string | null;
  /** ISO-8601 server clock from the aggregation endpoint */
  serverTime: string;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Deadline passed';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function healthStatus(
  completionPercent: number,
  deadlinePassed: boolean,
): 'good' | 'attention' | 'critical' {
  if (deadlinePassed && completionPercent < 100) return 'critical';
  if (completionPercent >= 90) return 'good';
  if (completionPercent >= 60) return 'attention';
  return 'critical';
}

export function SubmissionStatusModule({
  data,
  deadline,
  serverTime,
}: Props) {
  // ── Countdown synced to server clock ──────────────────────────
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!deadline) return;

    // Sync to server clock on mount: compute offset between server
    // and local, then apply it so the countdown is server-accurate.
    const serverNow = new Date(serverTime).getTime();
    const localNow = Date.now();
    const offset = serverNow - localNow;

    const compute = () => {
      const diff = new Date(deadline).getTime() - (Date.now() + offset);
      setRemaining(diff);
    };

    compute();
    const interval = setInterval(compute, 1000);
    return () => clearInterval(interval);
  }, [deadline, serverTime]);

  const deadlinePassed = remaining !== null && remaining <= 0;
  const status = healthStatus(data.completionPercent, deadlinePassed);

  return (
    <MetricCard
      label="Submissions"
      value={`${data.finalCount} / ${data.totalTeams}`}
      subtitle={`${data.completionPercent.toFixed(0)}% finalized`}
      indicator={<StatusBadge status={status} label={status} />}
    >
      {/* countdown */}
      {deadline && (
        <p
          className={`mt-3 font-mono text-lg tabular-nums ${
            deadlinePassed
              ? 'text-[var(--ihi-signal-stop)]'
              : 'text-[var(--ihi-surface-900)]'
          }`}
          aria-live="polite"
          aria-label={
            deadlinePassed
              ? 'Submission deadline has passed'
              : `Time remaining: ${formatCountdown(remaining ?? 0)}`
          }
        >
          {deadlinePassed ? 'CLOSED' : formatCountdown(remaining ?? 0)}
        </p>
      )}

      {/* draft callout */}
      {data.draftCount > 0 && (
        <p className="mt-1 text-xs text-[var(--ihi-surface-400)]">
          {data.draftCount} draft{data.draftCount !== 1 ? 's' : ''} in progress
        </p>
      )}
    </MetricCard>
  );
}
