import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApiResult, RubricCriterion } from "@/types/shared";

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

    const { data: rubric } = await supabase
      .from("rubrics")
      .select("*, criteria:rubric_criteria(*)")
      .eq("event_id", resolved)
      .maybeSingle();

    return NextResponse.json({ ok: true, data: rubric } satisfies ApiResult<unknown>);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to load rubric.", code: "validation" } satisfies ApiResult<never>,
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const eventId = body?.eventId as string | undefined;
    const title = (body?.title as string | undefined) || "Main Evaluation Rubric";
    const criteria = body?.criteria as RubricCriterion[] | undefined;

    if (!eventId) {
      return NextResponse.json(
        { ok: false, error: "eventId is required.", code: "validation" } satisfies ApiResult<never>,
        { status: 400 }
      );
    }
    if (!Array.isArray(criteria) || criteria.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Add at least one criterion before saving.",
          code: "validation",
        } satisfies ApiResult<never>,
        { status: 400 }
      );
    }

    for (const c of criteria) {
      if (!c.title?.trim()) {
        return NextResponse.json(
          { ok: false, error: "Every criterion needs a name.", code: "validation" } satisfies ApiResult<never>,
          { status: 400 }
        );
      }
      if (!(Number(c.weight) > 0) || !(Number(c.max_score) > 0)) {
        return NextResponse.json(
          {
            ok: false,
            error: "Each criterion needs weight > 0 and max score > 0.",
            code: "validation",
          } satisfies ApiResult<never>,
          { status: 400 }
        );
      }
    }

    const totalWeight = criteria.reduce((sum, c) => sum + Number(c.weight || 0), 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      return NextResponse.json(
        {
          ok: false,
          error: `Criteria weights must sum to exactly 100%. Current total: ${totalWeight}%.`,
          code: "validation",
        } satisfies ApiResult<never>,
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

    const { data: rubric, error: rubricErr } = await supabase
      .from("rubrics")
      .upsert({ event_id: resolved, title: title.trim(), updated_at: new Date().toISOString() }, { onConflict: "event_id" })
      .select()
      .single();

    if (rubricErr || !rubric) {
      return NextResponse.json(
        {
          ok: false,
          error: rubricErr?.message || "Could not save rubric.",
          code: "conflict",
        } satisfies ApiResult<never>,
        { status: 500 }
      );
    }

    await supabase.from("rubric_criteria").delete().eq("rubric_id", rubric.id);

    const rows = criteria.map((c, idx) => ({
      rubric_id: rubric.id,
      title: c.title.trim(),
      description: c.description?.trim() || null,
      max_score: Number(c.max_score) || 10,
      weight: Number(c.weight),
      order_index: idx,
    }));

    const { data: inserted, error: critErr } = await supabase
      .from("rubric_criteria")
      .insert(rows)
      .select();

    if (critErr) {
      return NextResponse.json(
        {
          ok: false,
          error: critErr.message,
          code: "validation",
        } satisfies ApiResult<never>,
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: { ...rubric, criteria: inserted },
    } satisfies ApiResult<unknown>);
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Unexpected error saving rubric.",
        code: "validation",
      } satisfies ApiResult<never>,
      { status: 500 }
    );
  }
}