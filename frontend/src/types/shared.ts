/**
 * IHI Shared Type Contract
 * ─────────────────────────────────────────────────────────────
 * RULE: Any change to this file is a 2-minute conversation with
 * the other developer. Do not edit solo.
 *
 * Dev B (Experience) owns: Team*, SoloParticipant, TeamChat*
 * Dev A (Trust/Data) owns: Event, Registration, Rubric, Score,
 *                          Auth/role types — add below when ready.
 * ─────────────────────────────────────────────────────────────
 */

// ── Identity (minimal — Dev A will expand) ──────────────────

export type UserRole = "organizer" | "participant" | "judge";

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string | null;
}

// ── Event lifecycle (both need this — lock early) ───────────

export type EventStatus =
  | "draft"
  | "published"
  | "registration_open"
  | "team_formation"
  | "live"
  | "submission_open"
  | "submission_closed"
  | "judging"
  | "results_published";

export interface Event {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  status: EventStatus;
  max_team_size: number;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at: string;
}

// ── Registration (Dev A owns the module; shape needed by Teams) ─

export type RegistrationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "waitlisted"
  | "withdrawn";

export interface Registration {
  id: string;
  event_id: string;
  user_id: string;
  status: RegistrationStatus;
  display_name: string;
  skills: string[];
  created_at: string;
}

// ── Team Formation (Dev B owns) ─────────────────────────────

export type TeamStatus = "forming" | "full" | "locked";

export interface Team {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  skills_wanted: string[];
  track: string | null;
  max_members: number;
  status: TeamStatus;
  lead_user_id: string;
  member_count: number; // denormalized for list views; source of truth is team_members count
  created_at: string;
}

export type TeamMemberRole = "lead" | "member";

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamMemberRole;
  display_name: string;
  skills: string[];
  joined_at: string;
}

export type JoinRequestStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "auto_rejected_full";

export interface TeamJoinRequest {
  id: string;
  team_id: string;
  requester_user_id: string;
  requester_display_name: string;
  requester_skills: string[];
  status: JoinRequestStatus;
  message: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface TeamChatMessage {
  id: string;
  team_id: string;
  user_id: string;
  display_name: string;
  body: string;
  created_at: string;
  reported: boolean;
}

export interface SoloParticipant {
  user_id: string;
  event_id: string;
  registration_id: string;
  display_name: string;
  skills: string[];
  bio: string | null;
  looking_since: string;
}

// ── API response envelopes ──────────────────────────────────

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: string;
  code?:
    | "team_full"
    | "already_on_team"
    | "duplicate_name"
    | "not_found"
    | "unauthorized"
    | "forbidden"
    | "validation"
    | "conflict";
}

export type ApiResult<T> = ApiSuccess<T> | ApiError;

// ── Join RPC result (matches Postgres join_team function) ───

export interface JoinTeamResult {
  success: boolean;
  reason?: "team_full" | "already_on_team" | "team_locked" | "not_found";
  member_count?: number;
  team_status?: TeamStatus;
}