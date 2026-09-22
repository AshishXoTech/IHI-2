import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApiResult, CriterionScoreInput, Score } from "@/types/shared";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, submissionId, criteriaScores } = body;

    if (!eventId || !submissionId || !Array.isArray(criteriaScores) || criteriaScores.length === 0) {
      return NextResponse.json(
        { ok: false, error: "eventId, submissionId, and criteriaScores are required.", code: "validation" } satisfies ApiResult<never>,
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "You must be signed in to submit scores.", code: "unauthorized" } satisfies ApiResult<never>,
        { status: 401 }
      );
    }

    for (const c of criteriaScores as CriterionScoreInput[]) {
      if (typeof c.score !== "number" || c.score < 0 || c.score > c.max_score) {
        return NextResponse.json(
          {
            ok: false,
            error: `Invalid score for "${c.title}". Must be between 0 and ${c.max_score}.`,
            code: "validation",
          } satisfies ApiResult<never>,
          { status: 400 }
        );
      }
    }

    const totalScore = criteriaScores.reduce((acc: number, c: CriterionScoreInput) => {
      const percentage = c.score / c.max_score;
      const weightedContribution = percentage * (c.weight / 100) * 100;
      return acc + weightedContribution;
    }, 0);

    const roundedTotal = Math.round(totalScore * 100) / 100;

    // INSERT-ONLY into public.scores
    const { data: score, error: insertErr } = await supabase
      .from("scores")
      .insert({
        event_id: eventId,
        submission_id: submissionId,
        judge_user_id: user.id,
        criteria_scores: criteriaScores,
        total_score: roundedTotal,
      })
      .select()
      .single();

    if (insertErr) {
      if (insertErr.code === "23505") {
        return NextResponse.json(
          {
            ok: false,
            error: "You have already submitted a score for this project. Use the Correction Request flow to request changes.",
            code: "conflict",
          } satisfies ApiResult<never>,
          { status: 400 }
        );
      }
      return NextResponse.json(
        { ok: false, error: insertErr.message, code: "conflict" } satisfies ApiResult<never>,
        { status: 500 }
      );
    }

    await supabase
      .from("judge_assignments")
      .update({ status: "completed" })
      .eq("submission_id", submissionId)
      .eq("judge_user_id", user.id);

    return NextResponse.json({ ok: true, data: score as unknown as Score } satisfies ApiResult<Score>);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Internal server error submitting score.", code: "validation" } satisfies ApiResult<never>,
      { status: 500 }
    );
  }
}