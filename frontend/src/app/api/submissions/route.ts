import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { USE_MOCKS, MOCK_EVENT_ID } from "@/lib/mocks/teams";
import { getMockSubmissionsStore, MOCK_DEADLINE } from "@/lib/mocks/submissions";
import type { Submission, SubmissionPayload } from "@/components/submissions/types";
import type { ApiResult } from "@/types/shared";

/**
 * GET /api/submissions?event_id=...&team_id=...
 */
export async function GET(req: NextRequest) {
  try {
    const eventId = req.nextUrl.searchParams.get("event_id");
    const teamId = req.nextUrl.searchParams.get("team_id");

    if (USE_MOCKS) {
      const { submissions } = getMockSubmissionsStore();
      let filtered = submissions;
      if (eventId) filtered = filtered.filter((s) => s.event_id === eventId);
      if (teamId) filtered = filtered.filter((s) => s.team_id === teamId);
      return NextResponse.json({ ok: true, data: filtered } satisfies ApiResult<Submission[]>);
    }

    const supabase = await createClient();
    let query = supabase.from("submissions").select("*");
    if (eventId) query = query.eq("event_id", eventId);
    if (teamId) query = query.eq("team_id", teamId);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ ok: true, data } satisfies ApiResult<Submission[]>);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" } satisfies ApiResult<never>,
      { status: 500 }
    );
  }
}

/**
 * POST /api/submissions
 * Upserts a submission. Critically: enforces deadline server-side.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.team_id || !body?.event_id) {
      return NextResponse.json(
        { ok: false, error: "team_id and event_id required", code: "validation" } satisfies ApiResult<never>,
        { status: 400 }
      );
    }

    const payload: SubmissionPayload = {
      repo_url: body.repo_url?.trim() || null,
      demo_url: body.demo_url?.trim() || null,
      description: body.description?.trim() || null,
      is_draft: body.is_draft ?? true,
    };

    // --- DEADLINE ENFORCEMENT ---
    const serverNow = Date.now();
    let deadlineStr = MOCK_DEADLINE;

    if (!USE_MOCKS) {
      const supabase = await createClient();
      const { data: eventRow } = await supabase
        .from("events")
        .select("ends_at")
        .eq("id", body.event_id)
        .single();
      
      if (eventRow?.ends_at) deadlineStr = eventRow.ends_at;
    }

    const deadlineMs = new Date(deadlineStr).getTime();
    if (serverNow >= deadlineMs) {
      return NextResponse.json(
        { ok: false, error: "The submission deadline has passed. Modifications are locked.", code: "forbidden" } satisfies ApiResult<never>,
        { status: 403 }
      );
    }

    // --- UPSERT LOGIC ---
    if (USE_MOCKS) {
      const store = getMockSubmissionsStore();
      const existingIdx = store.submissions.findIndex((s) => s.team_id === body.team_id);
      
      const newSub: Submission = {
        id: existingIdx >= 0 ? store.submissions[existingIdx].id : `sub_${Date.now()}`,
        event_id: body.event_id || MOCK_EVENT_ID,
        team_id: body.team_id,
        ...payload,
        excluded_from_gallery: false,
        updated_at: new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        store.submissions[existingIdx] = newSub;
      } else {
        store.setSubmissions([...store.submissions, newSub]);
      }

      return NextResponse.json({ ok: true, data: newSub } satisfies ApiResult<Submission>);
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("submissions")
      .upsert({
        event_id: body.event_id,
        team_id: body.team_id,
        repo_url: payload.repo_url,
        demo_url: payload.demo_url,
        description: payload.description,
        is_draft: payload.is_draft,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'team_id' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, data } satisfies ApiResult<Submission>);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" } satisfies ApiResult<never>,
      { status: 500 }
    );
  }
}