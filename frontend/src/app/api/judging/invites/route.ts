import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApiResult } from "@/types/shared";

const IS_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

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
      .from("judge_invites")
      .select("id, event_id, email, status, created_at")
      .eq("event_id", resolved)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, code: "validation" } satisfies ApiResult<never>,
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, data: data ?? [] } satisfies ApiResult<unknown>);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to load invites.", code: "validation" } satisfies ApiResult<never>,
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const eventId = body?.eventId as string | undefined;
    const emailsRaw = body?.emails as string[] | undefined;

    if (!eventId || !Array.isArray(emailsRaw) || emailsRaw.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "eventId and a non-empty emails array are required.",
          code: "validation",
        } satisfies ApiResult<never>,
        { status: 400 }
      );
    }

    const emails = [...new Set(emailsRaw.map(normalizeEmail).filter(Boolean))];
    const emailOk = emails.every((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    if (!emailOk) {
      return NextResponse.json(
        { ok: false, error: "One or more emails are invalid.", code: "validation" } satisfies ApiResult<never>,
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

    const inviteRows = emails.map((email) => ({
      event_id: resolved,
      email,
      invited_by: user.id,
      status: "pending" as const,
    }));

    const { data: invites, error: invErr } = await supabase
      .from("judge_invites")
      .upsert(inviteRows, { onConflict: "event_id,email" })
      .select();

    if (invErr) {
      return NextResponse.json(
        { ok: false, error: invErr.message, code: "conflict" } satisfies ApiResult<never>,
        { status: 500 }
      );
    }

    const origin = request.nextUrl.origin;
    const magicResults: { email: string; magicLinkSent: boolean; note?: string }[] = [];

    for (const email of emails) {
      let magicLinkSent = false;
      let note: string | undefined;

      try {
        const { error: otpErr } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${origin}/auth/callback?next=/judge/queue`,
            shouldCreateUser: true,
          },
        });
        if (otpErr) {
          note = otpErr.message;
        } else {
          magicLinkSent = true;
        }
      } catch {
        note = "Could not send magic link (invite row still saved).";
      }

      magicResults.push({ email, magicLinkSent, note });
    }

    return NextResponse.json({
      ok: true,
      data: { invites: invites ?? [], magicResults },
    } satisfies ApiResult<unknown>);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to create invites.", code: "validation" } satisfies ApiResult<never>,
      { status: 500 }
    );
  }
}