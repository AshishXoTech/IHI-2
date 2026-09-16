'use client';

import { Card, StatusBadge } from '@/components/ui';
import type { ReadinessCheck } from './types';

interface Props {
  checks: ReadinessCheck[];
}

/**
 * Publish-Readiness Gate
 *
 * Renders a checklist of conditions that must all pass before the
 * organizer can safely publish final results.  Currently evaluates
 * against registration / team / submission data (real) and judging
 * data (mock).  The gate turns green only when every check passes.
 */
export function PublishReadinessGate({ checks }: Props) {
  const allPassed = checks.every((c) => c.passed);
  const passedCount = checks.filter((c) => c.passed).length;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-[var(--ihi-surface-500)]">
            Publish Readiness
          </p>
          <p className="mt-1 text-xs text-[var(--ihi-surface-400)]">
            {passedCount} / {checks.length} gates passed
          </p>
        </div>
        <StatusBadge
          status={allPassed ? 'good' : 'critical'}
          label={allPassed ? 'Ready' : 'Blocked'}
        />
      </div>

      <ul className="mt-4 space-y-2.5" role="list">
        {checks.map((check) => (
          <li key={check.label} className="flex items-start gap-2.5">
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                check.passed
                  ? 'bg-[var(--ihi-signal-go-bg)] text-[var(--ihi-signal-go)]'
                  : 'bg-[var(--ihi-signal-stop-bg)] text-[var(--ihi-signal-stop)]'
              }`}
              aria-hidden="true"
            >
              {check.passed ? '✓' : '✗'}
            </span>
            <div>
              <p
                className={`text-sm font-medium ${
                  check.passed
                    ? 'text-[var(--ihi-surface-900)]'
                    : 'text-[var(--ihi-signal-stop)]'
                }`}
              >
                {check.label}
              </p>
              <p className="text-xs text-[var(--ihi-surface-400)]">
                {check.detail}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
