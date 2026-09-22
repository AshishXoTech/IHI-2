import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApiResult, ResultsSummary, SubmissionResultItem } from "@/types/shared";

const IS_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventKey: string
) {
  let q = supabase.from("events").select("id, name, status, slug");
  if (IS_UUID.test(eventKey)) {
    q = q.or(`id.eq.${eventKey},slug.eq.${eventKey}`);
  } else {
    q = q.eq("slug", eventKey);
  }
  const { data } = await q.maybeSingle();
  return data;
}

/**
 * Weighted total from one score row.
 * Prefer stored total_score (Phase 5 already weighted).
 * Fallback: recompute from criteria_scores JSON (server-side only).
 */
function rowWeightedTotal(row: {
  total_score?: number | null;
  criteria_scores?: Array<{
    score: number;
    max_score: number;
    weight: number;
  }> | null;
}): number {
  if (typeof row.total_score === "number" && !Number.isNaN(row.total_score)) {
    return Number(row.total_score);
  }
  const crit = row.criteria_scores || [];
  if (!crit.length) return 0;
  const sum = crit.reduce((acc, c) => {
    const max = Number(c.max_score) || 1;
    const score = Number(c.score) || 0;
    const weight = Number(c.weight) || 0;
    return acc + (score / max) * weight;
  }, 0);
  return Math.round(sum * 100) / 100;
}

/** GET — server-only aggregation. Never send raw score math to client for ranking. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventKey } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          error: "Authentication required.",
          code: "unauthorized",
        } satisfies ApiResult<never>,
        { status: 401 }
      );
    }

    const event = await resolveEvent(supabase, eventKey);
    if (!event) {
      return NextResponse.json(
        { ok: false, error: "Event not found.", code: "not_found" } satisfies ApiResult<never>,
        { status: 404 }
      );
    }

    const { data: submissions, error: subErr } = await supabase
      .from("submissions")
      .select("id, fields, teams(name)")
      .eq("event_id", event.id);

    if (subErr) {
      return NextResponse.json(
        { ok: false, error: subErr.message, code: "validation" } satisfies ApiResult<never>,
        { status: 500 }
      );
    }

    const subList = submissions || [];

    const { data: scoreRows, error: scoreErr } = await supabase
      .from("scores")
      .select("submission_id, total_score, criteria_scores")
      .eq("event_id", event.id);

    if (scoreErr) {
      return NextResponse.json(
        { ok: false, error: scoreErr.message, code: "validation" } satisfies ApiResult<never>,
        { status: 500 }
      );
    }

    const bySub = new Map<string, number[]>();
    for (const row of scoreRows || []) {
      const w = rowWeightedTotal(row as any);
      const arr = bySub.get(row.submission_id) || [];
      arr.push(w);
      bySub.set(row.submission_id, arr);
    }

    const rankings: SubmissionResultItem[] = subList.map((sub: any) => {
      const vals = bySub.get(sub.id) || [];
      const scoreCount = vals.length;
      const final_average_score =
        scoreCount === 0
          ? 0
          : Math.round(
              (vals.reduce((a, b) => a + b, 0) / scoreCount) * 100
            ) / 100;

      return {
        submission_id: sub.id,
        project_title:
          sub.fields?.title ||
          sub.fields?.project_title ||
          "Untitled Project",
        team_name: sub.teams?.name || "Team",
        score_count: scoreCount,
        final_average_score,
        rank: 0,
      };
    });

    // Simple sort: score DESC, then submission_id ASC (stable ties — no fancy tie-break)
    rankings.sort((a, b) => {
      if (b.final_average_score !== a.final_average_score) {
        return b.final_average_score - a.final_average_score;
      }
      return a.submission_id.localeCompare(b.submission_id);
    });

    // Competition rank: 1,2,2,4 style when scores equal
    let i = 0;
    while (i < rankings.length) {
      let j = i + 1;
      while (
        j < rankings.length &&
        rankings[j].final_average_score === rankings[i].final_average_score
      ) {
        j++;
      }
      const rank = i + 1;
      for (let k = i; k < j; k++) rankings[k].rank = rank;
      i = j;
    }

    const total = rankings.length;
    const scored = rankings.filter((r) => r.score_count > 0).length;
    const completion_percentage =
      total === 0 ? 100 : Math.round((scored / total) * 1000) / 10;
    const is_publishable = total > 0 && scored >= total;

    const summary: ResultsSummary = {
      event_id: event.id,
      event_name: event.name,
      event_status: event.status,
      total_submissions: total,
      total_scored_submissions: scored,
      completion_percentage,
      is_publishable,
      rankings,
    };

    return NextResponse.json({
      ok: true,
      data: summary,
    } satisfies ApiResult<ResultsSummary>);
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to aggregate results.",
        code: "validation",
      } satisfies ApiResult<never>,
      { status: 500 }
    );
  }
}

/**
 * POST — Publish results.
 * Server re-checks completion gate. Does NOT trust client.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventKey } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          error: "Authentication required.",
          code: "unauthorized",
        } satisfies ApiResult<never>,
        { status: 401 }
      );
    }

    const event = await resolveEvent(supabase, eventKey);
    if (!event) {
      return NextResponse.json(
        { ok: false, error: "Event not found.", code: "not_found" } satisfies ApiResult<never>,
        { status: 404 }
      );
    }

    // Recompute gate server-side
    const { data: submissions } = await supabase
      .from("submissions")
      .select("id")
      .eq("event_id", event.id);

    const { data: scores } = await supabase
      .from("scores")
      .select("submission_id")
      .eq("event_id", event.id);

    const subIds = (submissions || []).map((s) => s.id);
    const scoredSet = new Set((scores || []).map((s) => s.submission_id));
    const allScored =
      subIds.length > 0 && subIds.every((id) => scoredSet.has(id));

    if (!allScored) {
      const scoredCount = subIds.filter((id) => scoredSet.has(id)).length;
      return NextResponse.json(
        {
          ok: false,
          error: `Cannot publish: only ${scoredCount}/${subIds.length} submissions have scores. Every submission needs at least one score.`,
          code: "validation",
        } satisfies ApiResult<never>,
        { status: 400 }
      );
    }

    const { data: updated, error: upErr } = await supabase
      .from("events")
      .update({ status: "results_published" })
      .eq("id", event.id)
      .select()
      .single();

    if (upErr) {
      return NextResponse.json(
        { ok: false, error: upErr.message, code: "conflict" } satisfies ApiResult<never>,
        { status: 500 }
      );
    }

    await supabase.from("audit_log").insert({
      event_id: event.id,
      actor_id: user.id,
      action: "RESULTS_PUBLISHED",
      entity_type: "event",
      entity_id: event.id,
      payload: {
        previous_status: event.status,
        new_status: "results_published",
        submission_count: subIds.length,
      },
    });

    return NextResponse.json({
      ok: true,
      data: updated,
    } satisfies ApiResult<unknown>);
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to publish results.",
        code: "validation",
      } satisfies ApiResult<never>,
      { status: 500 }
    );
  }
}