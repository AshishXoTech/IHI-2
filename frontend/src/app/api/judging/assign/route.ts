import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApiResult } from "@/types/shared";

const IS_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveEventId(supabase: Awaited<ReturnType<typeof createClient>>, eventKey: string) {
  let query = supabase.from("events").select("id");
  if (IS_UUID.test(eventKey)) {
    query = query.or(`id.eq.${eventKey},slug.eq.${eventKey}`);
  } else {
    query = query.eq("slug", eventKey);
  }
  const { data } = await query.maybeSingle();
  return data?.id ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const eventId = request.nextUrl.searchParams.get("eventId");
    if (!eventId) {
      return NextResponse.json(
        { ok: false, error: "eventId is required.", code: "validation" } satisfies ApiResult<never>,
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "You must be signed in.", code: "unauthorized" } satisfies ApiResult<never>,
        { status: 401 }
      );
    }

    const resolved = await resolveEventId(supabase, eventId);
    if (!resolved) {
      return NextResponse.json(
        { ok: false, error: "Event not found.", code: "not_found" } satisfies ApiResult<never>,
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from("judge_assignments")
      .select("id, event_id, judge_user_id, submission_id, status, created_at")
      .eq("event_id", resolved)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, code: "validation" } satisfies ApiResult<never>,
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, data: data ?? [] } satisfies ApiResult<unknown>);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to load assignments.", code: "validation" } satisfies ApiResult<never>,
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const eventId = body?.eventId as string | undefined;
    if (!eventId) {
      return NextResponse.json(
        { ok: false, error: "eventId is required.", code: "validation" } satisfies ApiResult<never>,
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "You must be signed in.", code: "unauthorized" } satisfies ApiResult<never>,
        { status: 401 }
      );
    }

    const resolved = await resolveEventId(supabase, eventId);
    if (!resolved) {
      return NextResponse.json(
        { ok: false, error: "Event not found.", code: "not_found" } satisfies ApiResult<never>,
        { status: 404 }
      );
    }

    const { data: invites } = await supabase
      .from("judge_invites")
      .select("email")
      .eq("event_id", resolved)
      .neq("status", "revoked");

    const inviteEmails = (invites ?? []).map((i) => i.email.toLowerCase());
    if (inviteEmails.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invite at least one judge before auto-assign.",
          code: "validation",
        } satisfies ApiResult<never>,
        { status: 400 }
      );
    }

    const { data: roleJudges } = await supabase
      .from("role_assignments")
      .select("user_id")
      .eq("role", "judge");

    let judgeIds = [...new Set((roleJudges ?? []).map((r) => r.user_id))];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email")
      .in("email", inviteEmails);

    if (profiles && profiles.length > 0) {
      judgeIds = [...new Set(profiles.map((p) => p.id))];
    }

    if (judgeIds.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No judge user accounts found yet. Invited judges must sign up / click magic link first.",
          code: "validation",
        } satisfies ApiResult<never>,
        { status: 400 }
      );
    }

    const { data: submissions, error: subErr } = await supabase
      .from("submissions")
      .select("id")
      .eq("event_id", resolved)
      .order("created_at", { ascending: true });

    if (subErr || !submissions || submissions.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "No submissions found for this event to assign.",
          code: "validation",
        } satisfies ApiResult<never>,
        { status: 400 }
      );
    }

    await supabase.from("judge_assignments").delete().eq("event_id", resolved);

    const assignmentRows = submissions.map((s, index) => ({
      event_id: resolved,
      submission_id: s.id,
      judge_user_id: judgeIds[index % judgeIds.length],
      status: "assigned" as const,
    }));

    const { data: created, error: aErr } = await supabase
      .from("judge_assignments")
      .insert(assignmentRows)
      .select();

    if (aErr) {
      return NextResponse.json(
        { ok: false, error: aErr.message, code: "conflict" } satisfies ApiResult<never>,
        { status: 500 }
      );
    }

    const perJudge: Record<string, number> = {};
    for (const row of created ?? []) {
      perJudge[row.judge_user_id] = (perJudge[row.judge_user_id] || 0) + 1;
    }

    return NextResponse.json({
      ok: true,
      data: {
        assignmentCount: created?.length ?? 0,
        judgeCount: judgeIds.length,
        submissionCount: submissions.length,
        perJudge,
        assignments: created,
      },
    } satisfies ApiResult<unknown>);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Auto-assign failed.", code: "validation" } satisfies ApiResult<never>,
      { status: 500 }
    );
  }
}