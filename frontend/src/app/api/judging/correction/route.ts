import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApiResult, CorrectionRequest, CriterionScoreInput } from "@/types/shared";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, submissionId, originalScoreId, proposedCriteriaScores, reason } = body;

    if (!eventId || !submissionId || !originalScoreId || !Array.isArray(proposedCriteriaScores) || !reason) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields for correction request.", code: "validation" } satisfies ApiResult<never>,
        { status: 400 }
      );
    }

    if (typeof reason !== "string" || reason.trim().length < 20) {
      return NextResponse.json(
        {
          ok: false,
          error: "Correction reason must be at least 20 characters explaining why the score needs adjustment.",
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

    const proposedTotal = proposedCriteriaScores.reduce((acc: number, c: CriterionScoreInput) => {
      const percentage = c.score / c.max_score;
      return acc + percentage * (c.weight / 100) * 100;
    }, 0);

    const roundedProposedTotal = Math.round(proposedTotal * 100) / 100;

    const { data: requestRow, error: insertErr } = await supabase
      .from("correction_requests")
      .insert({
        event_id: eventId,
        submission_id: submissionId,
        judge_user_id: user.id,
        original_score_id: originalScoreId,
        proposed_criteria_scores: proposedCriteriaScores,
        proposed_total_score: roundedProposedTotal,
        reason: reason.trim(),
        status: "pending_organizer_review",
      })
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json(
        { ok: false, error: insertErr.message, code: "conflict" } satisfies ApiResult<never>,
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: requestRow as unknown as CorrectionRequest,
    } satisfies ApiResult<CorrectionRequest>);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to submit correction request.", code: "validation" } satisfies ApiResult<never>,
      { status: 500 }
    );
  }
}