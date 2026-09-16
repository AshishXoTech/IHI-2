'use client';

import { StatusBadge } from '@/components/ui';
import { MetricCard } from './MetricCard';
import type { TeamFormationHealth } from './types';

interface Props {
  data: TeamFormationHealth;
}

function healthStatus(
  soloCount: number,
  totalTeams: number,
): 'good' | 'attention' | 'critical' {
  if (totalTeams === 0 && soloCount > 0) return 'critical';
  if (soloCount > 20) return 'attention';
  if (soloCount > 5) return 'attention';
  return 'good';
}

export function TeamFormationHealthModule({ data }: Props) {
  const status = healthStatus(data.soloLookingCount, data.totalTeams);

  return (
    <MetricCard
      label="Team Formation"
      value={data.totalTeams}
      subtitle={`${data.totalParticipantsInTeams} participants in teams`}
      indicator={<StatusBadge status={status} label={status} />}
    >
      {data.soloLookingCount > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-md border border-[var(--ihi-signal-warn)]/30 bg-[var(--ihi-signal-warn-bg)] px-3 py-2">
          <span className="text-sm font-medium text-[var(--ihi-signal-warn)]">
            {data.soloLookingCount}
          </span>
          <span className="text-xs text-[var(--ihi-surface-500)]">
            participant{data.soloLookingCount !== 1 ? 's' : ''} still looking
            for a team
          </span>
        </div>
      )}
    </MetricCard>
  );
}
