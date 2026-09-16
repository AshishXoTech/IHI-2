'use client';

import { StatusBadge } from '@/components/ui';
import { MetricCard } from './MetricCard';
import type { RegistrationHealth } from './types';

interface Props {
  data: RegistrationHealth;
}

function healthStatus(
  utilization: number | null,
): 'good' | 'attention' | 'critical' {
  if (utilization === null) return 'good'; // unbounded capacity
  if (utilization >= 95) return 'critical';
  if (utilization >= 80) return 'attention';
  return 'good';
}

export function RegistrationHealthModule({ data }: Props) {
  const status = healthStatus(data.utilizationPercent);

  const capacityLabel =
    data.capacity !== null
      ? `${data.total} / ${data.capacity}`
      : `${data.total} registered`;

  return (
    <MetricCard
      label="Registration Health"
      value={data.total}
      subtitle={
        data.utilizationPercent !== null
          ? `${data.utilizationPercent.toFixed(1)}% capacity`
          : 'No capacity cap set'
      }
      indicator={<StatusBadge status={status} label={status} />}
    >
      {/* progress bar — only when capacity is bounded */}
      {data.capacity !== null && (
        <div
          className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--ihi-surface-200)]"
          role="progressbar"
          aria-valuenow={data.total}
          aria-valuemin={0}
          aria-valuemax={data.capacity}
          aria-label={`Registration: ${capacityLabel}`}
        >
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${Math.min(data.utilizationPercent ?? 0, 100)}%`,
              backgroundColor:
                status === 'critical'
                  ? 'var(--ihi-signal-stop)'
                  : status === 'attention'
                    ? 'var(--ihi-signal-warn)'
                    : 'var(--ihi-signal-go)',
            }}
          />
        </div>
      )}
      <p className="mt-1.5 text-xs tabular-nums text-[var(--ihi-surface-400)]">
        {capacityLabel}
      </p>
    </MetricCard>
  );
}
