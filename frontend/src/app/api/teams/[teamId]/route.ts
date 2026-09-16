import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMockStore, USE_MOCKS } from "@/lib/mocks/teams";
import type { ApiResult, Team, TeamMember } from "@/types/shared";

type Ctx = { params: Promise<{ teamId: string }> };

/** GET /api/teams/[teamId] — team + members */
export async function GET(_req: NextRequest, context: Ctx) {
  const { teamId } = await context.params;

  if (USE_MOCKS) {
    const store = getMockStore();
    const team = store.teams.find((t) => t.id === teamId);
    if (!team) {
      return NextResponse.json(
        { ok: false, error: "Not found", code: "not_found" } satisfies ApiResult<never>,
        { status: 404 }
      );
    }
    return NextResponse.json({
      ok: true,
      data: { team, members: store.members[teamId] ?? [] },
    } satisfies ApiResult<{ team: Team; members: TeamMember[] }>);
  }

  const supabase = await createClient();
  const { data: team, error } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .maybeSingle();

  if (error || !team) {
    return NextResponse.json(
      { ok: false, error: "Not found", code: "not_found" } satisfies ApiResult<never>,
      { status: 404 }
    );
  }

  const { data: members } = await supabase
    .from("team_members")
    .select("id, team_id, user_id, role, joined_at")
    .eq("team_id", teamId)
    .order("joined_at", { ascending: true });

  // Display names: join profiles if Dev A has a profiles table; else fallback
  const mapped: TeamMember[] = (members ?? []).map((m: any) => ({
    id: m.id,
    team_id: m.team_id,
    user_id: m.user_id,
    role: m.role,
    display_name: m.display_name ?? m.user_id.slice(0, 8),
    skills: m.skills ?? [],
    joined_at: m.joined_at,
  }));

  const result: Team = {
    ...team,
    skills_wanted: team.skills_wanted ?? [],
    member_count: mapped.length,
  };

  return NextResponse.json({
    ok: true,
    data: { team: result, members: mapped },
  } satisfies ApiResult<{ team: Team; members: TeamMember[] }>);
}