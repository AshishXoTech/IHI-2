import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getMockStore,
  MOCK_USER_ID,
  USE_MOCKS,
} from "@/lib/mocks/teams";
import type { ApiResult } from "@/types/shared";

/**
 * POST /api/teams/[teamId]/leave
 * Lead reassignment is handled by the DB trigger Dev A installs
 * (see Schema Request). This route only deletes the membership row.
 */

type Ctx = { params: Promise<{ teamId: string }> };

export async function POST(_req: NextRequest, context: Ctx) {
  const { teamId } = await context.params;

  if (USE_MOCKS) {
    const store = getMockStore();
    const list = store.members[teamId] ?? [];
    const me = list.find((m) => m.user_id === MOCK_USER_ID);
    if (!me) {
      return NextResponse.json(
        { ok: false, error: "Not a member", code: "not_found" } satisfies ApiResult<never>,
        { status: 404 }
      );
    }

    let remaining = list.filter((m) => m.user_id !== MOCK_USER_ID);

    // Mock lead reassignment
    if (me.role === "lead" && remaining.length > 0) {
      remaining = remaining
        .sort((a, b) => a.joined_at.localeCompare(b.joined_at))
        .map((m, i) => (i === 0 ? { ...m, role: "lead" as const } : m));
      const newLead = remaining[0];
      store.setTeams(
        store.teams.map((t) =>
          t.id === teamId
            ? {
                ...t,
                lead_user_id: newLead.user_id,
                member_count: remaining.length,
                status: remaining.length >= t.max_members ? t.status : "forming",
              }
            : t
        )
      );
      store.setMembers({ ...store.members, [teamId]: remaining });
    } else if (remaining.length === 0) {
      // dissolve empty team
      store.setTeams(store.teams.filter((t) => t.id !== teamId));
      const { [teamId]: _, ...rest } = store.members;
      store.setMembers(rest);
    } else {
      store.setTeams(
        store.teams.map((t) =>
          t.id === teamId
            ? {
                ...t,
                member_count: remaining.length,
                status:
                  remaining.length < t.max_members && t.status === "full"
                    ? "forming"
                    : t.status,
              }
            : t
        )
      );
      store.setMembers({ ...store.members, [teamId]: remaining });
    }

    return NextResponse.json({ ok: true, data: { left: true } });
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

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message } satisfies ApiResult<never>,
      { status: 500 }
    );
  }

  // Trigger handles lead reassignment + empty-team cleanup.
  // Heal status if team dropped below capacity:
  const { count } = await supabase
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .eq("team_id", teamId);

  if ((count ?? 0) > 0) {
    const { data: team } = await supabase
      .from("teams")
      .select("max_members, status")
      .eq("id", teamId)
      .maybeSingle();

    if (team && team.status === "full" && (count ?? 0) < team.max_members) {
      await supabase
        .from("teams")
        .update({ status: "forming" })
        .eq("id", teamId);
    }
  }

  return NextResponse.json({ ok: true, data: { left: true } });
}