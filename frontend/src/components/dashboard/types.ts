/**
 * Local dashboard types.
 *
 * TODO(shared-contract): Promote DashboardSummary and JudgingProgress
 * into frontend/src/types/shared.ts once both devs agree on the shape.
 * Until then these live here so the dashboard compiles independently.
 */

// ── Aggregation payload returned by /api/dashboard/[eventId] ──────

export interface DashboardEventMeta {
    id: string;
    name: string;
    maxParticipants: number | null;
    submissionDeadline: string | null; // ISO-8601
}

export interface RegistrationHealth {
    total: number;
    capacity: number | null;
    utilizationPercent: number | null; // null when capacity is unbounded
}

export interface TeamFormationHealth {
    totalTeams: number;
    soloLookingCount: number;
    totalParticipantsInTeams: number;
}

export interface SubmissionStatus {
    draftCount: number;
    finalCount: number;
    totalTeams: number;
    completionPercent: number;
}

export interface DashboardSummary {
    event: DashboardEventMeta;
    registration: RegistrationHealth;
    teams: TeamFormationHealth;
    submissions: SubmissionStatus;
    serverTime: string; // ISO-8601, used to sync countdown timers
}

// ── Judging placeholder (owned by Dev A, shape TBD) ──────────────

export interface JudgingProgress {
    totalSubmissions: number;
    scoredCount: number;
    judgesActive: number;
    averageScore: number | null;
}

// ── Publish-readiness derived state ──────────────────────────────

export interface ReadinessCheck {
    label: string;
    passed: boolean;
    detail: string;
}
