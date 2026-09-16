import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMockStore, USE_MOCKS } from "@/lib/mocks/teams";
import type { ApiResult } from "@/types/shared";

type Ctx = { params: Promise<{ teamId: string; messageId: string }> };

/** POST /api/teams/[teamId]/messages/[messageId]/report */
export async function POST(_req: NextRequest, context: Ctx) {
  const { teamId, messageId } = await context.params;

  if (USE_MOCKS) {
    const store = getMockStore();
    const list = (store.messages[teamId] ?? []).map((m) =>
      m.id === messageId ? { ...m, reported: true } : m
    );
    store.setMessages({ ...store.messages, [teamId]: list });
    return NextResponse.json({ ok: true, data: { reported: true } });
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
    .from("team_chat_messages")
    .update({
      reported: true,
      reported_by: user.id,
      reported_at: new Date().toISOString(),
    })
    .eq("id", messageId)
    .eq("team_id", teamId);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message } satisfies ApiResult<never>,
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, data: { reported: true } });
}