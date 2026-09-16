import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMockStore, USE_MOCKS } from "@/lib/mocks/teams";
import type { ApiResult, SoloParticipant } from "@/types/shared";

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
      const { solo } = getMockStore();
      const filtered: SoloParticipant[] = solo.filter(
        (s: SoloParticipant) => s.event_id === eventId || true
      );
      return NextResponse.json({
        ok: true,
        data: filtered,
      } satisfies ApiResult<SoloParticipant[]>);
    }

    const supabase = await createClient();

    const { data: regs, error } = await supabase
      .from("registrations")
      .select("id, user_id, display_name, skills, created_at, bio")
      .eq("event_id", eventId)
      .eq("status", "approved");

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message } satisfies ApiResult<never>,
        { status: 500 }
      );
    }

    const { data: members } = await supabase
      .from("team_members")
      .select("user_id, teams!inner(event_id)")
      .eq("teams.event_id", eventId);

    const taken = new Set((members ?? []).map((m: any) => m.user_id));

    const soloList: SoloParticipant[] = (regs ?? [])
      .filter((r: any) => !taken.has(r.user_id))
      .map((r: any) => ({
        user_id: r.user_id,
        event_id: eventId,
        registration_id: r.id,
        display_name: r.display_name ?? "Participant",
        skills: r.skills ?? [],
        bio: r.bio ?? null,
        looking_since: r.created_at,
      }));

    return NextResponse.json({
      ok: true,
      data: soloList,
    } satisfies ApiResult<SoloParticipant[]>);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Internal server error" } satisfies ApiResult<never>,
      { status: 500 }
    );
  }
}
