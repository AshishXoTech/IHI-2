import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getMockStore,
  MOCK_USER_ID,
  MOCK_USER_NAME,
  USE_MOCKS,
} from "@/lib/mocks/teams";
import type { ApiResult, TeamChatMessage } from "@/types/shared";

type Ctx = { params: Promise<{ teamId: string }> };

/** GET /api/teams/[teamId]/messages */
export async function GET(_req: NextRequest, context: Ctx) {
  const { teamId } = await context.params;

  if (USE_MOCKS) {
    const store = getMockStore();
    return NextResponse.json({
      ok: true,
      data: store.messages[teamId] ?? [],
    } satisfies ApiResult<TeamChatMessage[]>);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("team_chat_messages")
    .select("id, team_id, user_id, body, created_at, reported")
    .eq("team_id", teamId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message } satisfies ApiResult<never>,
      { status: 500 }
    );
  }

  const mapped: TeamChatMessage[] = (data ?? []).map((m: any) => ({
    ...m,
    display_name: m.display_name ?? m.user_id.slice(0, 8),
  }));

  return NextResponse.json({
    ok: true,
    data: mapped,
  } satisfies ApiResult<TeamChatMessage[]>);
}

/** POST /api/teams/[teamId]/messages  { body } */
export async function POST(req: NextRequest, context: Ctx) {
  const { teamId } = await context.params;
  const payload = await req.json().catch(() => null);
  const text = String(payload?.body ?? "").trim();

  if (!text || text.length > 2000) {
    return NextResponse.json(
      {
        ok: false,
        error: "Message must be 1–2000 characters",
        code: "validation",
      } satisfies ApiResult<never>,
      { status: 400 }
    );
  }

  if (USE_MOCKS) {
    const store = getMockStore();
    const msg: TeamChatMessage = {
      id: `msg_${Date.now()}`,
      team_id: teamId,
      user_id: MOCK_USER_ID,
      display_name: MOCK_USER_NAME,
      body: text,
      created_at: new Date().toISOString(),
      reported: false,
    };
    const prev = store.messages[teamId] ?? [];
    store.setMessages({ ...store.messages, [teamId]: [...prev, msg] });
    return NextResponse.json({ ok: true, data: msg } satisfies ApiResult<TeamChatMessage>, {
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

  // Membership check
  const { data: membership } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json(
      { ok: false, error: "Not a team member", code: "forbidden" } satisfies ApiResult<never>,
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("team_chat_messages")
    .insert({
      team_id: teamId,
      user_id: user.id,
      body: text,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message } satisfies ApiResult<never>,
      { status: 500 }
    );
  }

  const msg: TeamChatMessage = {
    id: data.id,
    team_id: data.team_id,
    user_id: data.user_id,
    display_name: user.email?.split("@")[0] ?? "Member",
    body: data.body,
    created_at: data.created_at,
    reported: false,
  };

  return NextResponse.json({ ok: true, data: msg } satisfies ApiResult<TeamChatMessage>, {
    status: 201,
  });
}