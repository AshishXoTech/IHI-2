/**
 * IHI Shared Type Contract
 * ─────────────────────────────────────────────────────────────
 * RULE: Any change to this file is a 2-minute conversation with
 * the other developer. Do not edit solo.
 * ─────────────────────────────────────────────────────────────
 */

// ── Identity ────────────────────────────────────────────────

export type UserRole = "organizer" | "participant" | "judge" | "admin";

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string | null;
}

// ── Event Lifecycle ─────────────────────────────────────────

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
  max_participants?: number | null;
  submission_deadline?: string | null;
  registration_fields?: any;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at: string;
}

// ── Registration ────────────────────────────────────────────

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

// ── Team Formation ──────────────────────────────────────────

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
  member_count: number;
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

// ── Judging & Scoring (Phase 4) ─────────────────────────────

export interface RubricCriterion {
  id?: string;
  rubric_id?: string;
  title: string;
  description?: string | null;
  max_score: number;
  weight: number;
  order_index?: number;
}

export interface Rubric {
  id: string;
  event_id: string;
  title: string;
  criteria: RubricCriterion[];
  created_at: string;
}

export interface JudgeInvite {
  id: string;
  event_id: string;
  email: string;
  status: "pending" | "accepted" | "revoked";
  created_at: string;
}

export interface JudgeAssignment {
  id: string;
  event_id: string;
  judge_user_id: string;
  submission_id: string | null;
  status: "assigned" | "in_progress" | "completed";
  created_at: string;
}

// ── API Envelopes ───────────────────────────────────────────

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

export interface JoinTeamResult {
  success: boolean;
  reason?: "team_full" | "already_on_team" | "team_locked" | "not_found";
  member_count?: number;
  team_status?: TeamStatus;
}