import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getMockStore,
  MOCK_EVENT_ID,
  MOCK_USER_ID,
  MOCK_USER_NAME,
  USE_MOCKS,
} from "@/lib/mocks/teams";
import type { Team, ApiResult } from "@/types/shared";

export async function GET(req: NextRequest) {
  try {
    const eventId = req.nextUrl.searchParams.get("event_id");
    if (!eventId) {
      return NextResponse.json(
        { ok: false, error: "event_id is required", code: "validation" } satisfies ApiResult<never>,
        { status: 400 }
      );
    }

    if (USE_MOCKS) {
      const { teams } = getMockStore();
      const data = teams.filter(
        (t) => t.event_id === eventId || eventId === MOCK_EVENT_ID
      );
      return NextResponse.json({ ok: true, data } satisfies ApiResult<Team[]>);
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("teams")
      .select(
        "id, event_id, name, description, skills_wanted, track, max_members, status, lead_user_id, created_at, team_members(count)"
      )
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message } satisfies ApiResult<never>,
        { status: 500 }
      );
    }

    const mapped: Team[] = (data ?? []).map((row: any) => ({
      id: row.id,
      event_id: row.event_id,
      name: row.name,
      description: row.description,
      skills_wanted: row.skills_wanted ?? [],
      track: row.track,
      max_members: row.max_members,
      status: row.status,
      lead_user_id: row.lead_user_id,
      member_count: row.team_members?.[0]?.count ?? 0,
      created_at: row.created_at,
    }));

    return NextResponse.json({ ok: true, data: mapped } satisfies ApiResult<Team[]>);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Internal server error" } satisfies ApiResult<never>,
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.event_id || !body?.name?.trim()) {
      return NextResponse.json(
        {
          ok: false,
          error: "event_id and name are required",
          code: "validation",
        } satisfies ApiResult<never>,
        { status: 400 }
      );
    }

    const name = String(body.name).trim();
    if (name.length > 48) {
      return NextResponse.json(
        { ok: false, error: "Name too long", code: "validation" } satisfies ApiResult<never>,
        { status: 400 }
      );
    }

    const maxMembers = Number(body.max_members ?? 4);
    if (maxMembers < 1 || maxMembers > 10) {
      return NextResponse.json(
        {
          ok: false,
          error: "max_members must be between 1 and 10",
          code: "validation",
        } satisfies ApiResult<never>,
        { status: 400 }
      );
    }

    if (USE_MOCKS) {
      const store = getMockStore();
      const onTeam = Object.values(store.members).some((list) =>
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
      if (
        store.teams.some(
          (t) =>
            t.event_id === (body.event_id || MOCK_EVENT_ID) &&
            t.name.toLowerCase() === name.toLowerCase()
        )
      ) {
        return NextResponse.json(
          {
            ok: false,
            error: "Duplicate team name",
            code: "duplicate_name",
          } satisfies ApiResult<never>,
          { status: 409 }
        );
      }

      const id = `t_${Date.now()}`;
      const team: Team = {
        id,
        event_id: body.event_id || MOCK_EVENT_ID,
        name,
        description: body.description ?? null,
        skills_wanted: body.skills_wanted ?? [],
        track: body.track ?? null,
        max_members: maxMembers,
        status: "forming",
        lead_user_id: MOCK_USER_ID,
        member_count: 1,
        created_at: new Date().toISOString(),
      };
      store.setTeams([...store.teams, team]);
      store.setMembers({
        ...store.members,
        [id]: [
          {
            id: `m_${Date.now()}`,
            team_id: id,
            user_id: MOCK_USER_ID,
            role: "lead",
            display_name: MOCK_USER_NAME,
            skills: [],
            joined_at: team.created_at,
          },
        ],
      });
      store.setSolo(store.solo.filter((s) => s.user_id !== MOCK_USER_ID));

      return NextResponse.json({ ok: true, data: team } satisfies ApiResult<Team>, {
        status: 201,
      });
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

    const { data: existing } = await supabase
      .from("team_members")
      .select("id, teams!inner(event_id)")
      .eq("user_id", user.id)
      .eq("teams.event_id", body.event_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          ok: false,
          error: "Already on a team for this event",
          code: "already_on_team",
        } satisfies ApiResult<never>,
        { status: 409 }
      );
    }

    const { data: team, error } = await supabase
      .from("teams")
      .insert({
        event_id: body.event_id,
        name,
        description: body.description ?? null,
        skills_wanted: body.skills_wanted ?? [],
        track: body.track ?? null,
        max_members: maxMembers,
        status: "forming",
        lead_user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          {
            ok: false,
            error: "A team with this name already exists",
            code: "duplicate_name",
          } satisfies ApiResult<never>,
          { status: 409 }
        );
      }
      return NextResponse.json(
        { ok: false, error: error.message } satisfies ApiResult<never>,
        { status: 500 }
      );
    }

    const { error: memErr } = await supabase.from("team_members").insert({
      team_id: team.id,
      user_id: user.id,
      role: "lead",
    });

    if (memErr) {
      await supabase.from("teams").delete().eq("id", team.id);
      return NextResponse.json(
        { ok: false, error: memErr.message } satisfies ApiResult<never>,
        { status: 500 }
      );
    }

    const result: Team = {
      ...team,
      skills_wanted: team.skills_wanted ?? [],
      member_count: 1,
    };

    return NextResponse.json({ ok: true, data: result } satisfies ApiResult<Team>, {
      status: 201,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Internal server error" } satisfies ApiResult<never>,
      { status: 500 }
    );
  }
}
