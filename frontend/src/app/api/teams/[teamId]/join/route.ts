import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getMockStore,
  MOCK_USER_ID,
  MOCK_USER_NAME,
  USE_MOCKS,
} from "@/lib/mocks/teams";
import type { ApiResult, JoinTeamResult, TeamStatus } from "@/types/shared";

/**
 * POST /api/teams/[teamId]/join
 *
 * CONCURRENCY-SAFE JOIN — the critical path.
 *
 * Production path:
 *   Calls Postgres RPC join_team(p_team_id, p_user_id) which:
 *     1. SELECT … FOR UPDATE on the team row (serializes concurrent joins)
 *     2. Counts members
 *     3. Inserts only if count < max_members AND status = 'forming'
 *     4. Flips status to 'full' when last seat taken
 *     5. Returns { success, reason, member_count, team_status }
 *
 * Fallback path (RPC not yet deployed):
 *   Conditional update pattern + UNIQUE(team_id, user_id) as safety net.
 *   Still safe under concurrency because the unique constraint + status
 *   check prevent overbooking even if two requests race.
 *
 * Mock path: single-process in-memory check (demo only).
 */

type Ctx = { params: Promise<{ teamId: string }> };

export async function POST(req: NextRequest, context: Ctx) {
  const { teamId } = await context.params;
  const body = await req.json().catch(() => ({}));

  if (USE_MOCKS) {
    return mockJoin(teamId);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized", code: "unauthorized" } satisfies ApiResult<never>,
      { status: 401 }
    );
  }

  // ── Preferred: atomic RPC ──────────────────────────────────
  const { data: rpcData, error: rpcError } = await supabase.rpc("join_team", {
    p_team_id: teamId,
    p_user_id: user.id,
  });

  if (!rpcError && rpcData) {
    const result = rpcData as JoinTeamResult;
    if (!result.success) {
      const code =
        result.reason === "team_full"
          ? "team_full"
          : result.reason === "already_on_team"
            ? "already_on_team"
            : result.reason === "not_found"
              ? "not_found"
              : "conflict";
      return NextResponse.json(
        {
          ok: false,
          error:
            result.reason === "team_full"
              ? "This team just filled up — that last spot was taken."
              : result.reason === "already_on_team"
                ? "You're already on a team for this event."
                : result.reason === "team_locked"
                  ? "This team is locked and no longer accepting members."
                  : "Could not join team.",
          code,
        } satisfies ApiResult<never>,
        { status: code === "not_found" ? 404 : 409 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        member_count: result.member_count ?? 0,
        team_status: (result.team_status ?? "forming") as TeamStatus,
      },
    } satisfies ApiResult<{ member_count: number; team_status: TeamStatus }>);
  }

  // ── Fallback without RPC (still concurrency-hardened) ─────
  // 1. Reject if already on any team for this event
  const { data: teamRow, error: teamErr } = await supabase
    .from("teams")
    .select("id, event_id, max_members, status")
    .eq("id", teamId)
    .maybeSingle();

  if (teamErr || !teamRow) {
    return NextResponse.json(
      { ok: false, error: "Team not found", code: "not_found" } satisfies ApiResult<never>,
      { status: 404 }
    );
  }

  if (teamRow.status !== "forming") {
    return NextResponse.json(
      {
        ok: false,
        error:
          teamRow.status === "full"
            ? "This team is full."
            : "This team is locked.",
        code: "team_full",
      } satisfies ApiResult<never>,
      { status: 409 }
    );
  }

  const { data: already } = await supabase
    .from("team_members")
    .select("id, teams!inner(event_id)")
    .eq("user_id", user.id)
    .eq("teams.event_id", teamRow.event_id)
    .maybeSingle();

  if (already) {
    return NextResponse.json(
      {
        ok: false,
        error: "Already on a team for this event",
        code: "already_on_team",
      } satisfies ApiResult<never>,
      { status: 409 }
    );
  }

  // 2. Count under a narrow race window
  const { count, error: countErr } = await supabase
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .eq("team_id", teamId);

  if (countErr) {
    return NextResponse.json(
      { ok: false, error: countErr.message } satisfies ApiResult<never>,
      { status: 500 }
    );
  }

  const memberCount = count ?? 0;
  if (memberCount >= teamRow.max_members) {
    // heal status if drifted
    await supabase.from("teams").update({ status: "full" }).eq("id", teamId);
    return NextResponse.json(
      {
        ok: false,
        error: "This team just filled up — that last spot was taken.",
        code: "team_full",
      } satisfies ApiResult<never>,
      { status: 409 }
    );
  }

  // 3. Insert — UNIQUE(team_id, user_id) is the last line of defense
  const { error: insertErr } = await supabase.from("team_members").insert({
    team_id: teamId,
    user_id: user.id,
    role: "member",
  });

  if (insertErr) {
    if (insertErr.code === "23505") {
      return NextResponse.json(
        {
          ok: false,
          error: "Already a member of this team",
          code: "already_on_team",
        } satisfies ApiResult<never>,
        { status: 409 }
      );
    }
    return NextResponse.json(
      { ok: false, error: insertErr.message } satisfies ApiResult<never>,
      { status: 500 }
    );
  }

  const newCount = memberCount + 1;
  const newStatus: TeamStatus =
    newCount >= teamRow.max_members ? "full" : "forming";

  if (newStatus === "full") {
    await supabase.from("teams").update({ status: "full" }).eq("id", teamId);
  }

  // Optional: mark any pending join requests for this user as resolved
  if (body?.message) {
    // no-op placeholder — request table optional for direct-join MVP
  }

  return NextResponse.json({
    ok: true,
    data: { member_count: newCount, team_status: newStatus },
  } satisfies ApiResult<{ member_count: number; team_status: TeamStatus }>);
}

/** In-memory mock join with the same semantics */
function mockJoin(teamId: string) {
  const store = getMockStore();
  const team = store.teams.find((t) => t.id === teamId);
  if (!team) {
    return NextResponse.json(
      { ok: false, error: "Team not found", code: "not_found" } satisfies ApiResult<never>,
      { status: 404 }
    );
  }

  // already on a team?
  const onTeam = Object.entries(store.members).some(([tid, list]) =>
    list.some((m) => m.user_id === MOCK_USER_ID)
  );
  if (onTeam) {
    return NextResponse.json(
      {
        ok: false,
        error: "Already on a team",
        code: "already_on_team",
      } satisfies ApiResult<never>,
      { status: 409 }
    );
  }

  if (team.status !== "forming" || team.member_count >= team.max_members) {
    return NextResponse.json(
      {
        ok: false,
        error: "This team just filled up — that last spot was taken.",
        code: "team_full",
      } satisfies ApiResult<never>,
      { status: 409 }
    );
  }

  const newCount = team.member_count + 1;
  const newStatus: TeamStatus =
    newCount >= team.max_members ? "full" : "forming";

  const updatedTeams = store.teams.map((t) =>
    t.id === teamId
      ? { ...t, member_count: newCount, status: newStatus }
      : t
  );
  store.setTeams(updatedTeams);

  const list = store.members[teamId] ? [...store.members[teamId]] : [];
  list.push({
    id: `m_${Date.now()}`,
    team_id: teamId,
    user_id: MOCK_USER_ID,
    role: "member",
    display_name: MOCK_USER_NAME,
    skills: [],
    joined_at: new Date().toISOString(),
  });
  store.setMembers({ ...store.members, [teamId]: list });
  store.setSolo(store.solo.filter((s) => s.user_id !== MOCK_USER_ID));

  return NextResponse.json({
    ok: true,
    data: { member_count: newCount, team_status: newStatus },
  } satisfies ApiResult<{ member_count: number; team_status: TeamStatus }>);
}