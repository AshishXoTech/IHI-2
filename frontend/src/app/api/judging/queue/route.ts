import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApiResult, AssignedSubmissionItem, Score } from "@/types/shared";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required.", code: "unauthorized" } satisfies ApiResult<never>,
        { status: 401 }
      );
    }

    // 1. Fetch assignments for this logged-in judge ONLY
    const { data: assignments, error: asgErr } = await supabase
      .from("judge_assignments")
      .select("id, event_id, submission_id, status")
      .eq("judge_user_id", user.id);

    if (asgErr) {
      return NextResponse.json(
        { ok: false, error: asgErr.message, code: "validation" } satisfies ApiResult<never>,
        { status: 500 }
      );
    }

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({ ok: true, data: [] } satisfies ApiResult<AssignedSubmissionItem[]>);
    }

    const submissionIds = assignments
      .map((a) => a.submission_id)
      .filter((id): id is string => Boolean(id));

    // 2. Fetch submission details
    const { data: submissions } = await supabase
      .from("submissions")
      .select("id, fields, teams(name)")
      .in("id", submissionIds);

    const submissionMap = new Map(
      (submissions || []).map((s: any) => [
        s.id,
        {
          project_title: s.fields?.title || s.fields?.project_title || "Untitled Project",
          team_name: s.teams?.name || "Team",
        },
      ])
    );

    // 3. Fetch existing scores for this judge
    const { data: scores } = await supabase
      .from("scores")
      .select("*")
      .eq("judge_user_id", user.id)
      .in("submission_id", submissionIds);

    const scoreMap = new Map<string, Score>((scores || []).map((s: any) => [s.submission_id, s as Score]));

    // 4. Fetch pending correction requests for this judge
    const { data: corrections } = await supabase
      .from("correction_requests")
      .select("submission_id")
      .eq("judge_user_id", user.id)
      .eq("status", "pending_organizer_review")
      .in("submission_id", submissionIds);

    const pendingCorrectionSet = new Set((corrections || []).map((c: any) => c.submission_id));

    // Construct response items
    const items: AssignedSubmissionItem[] = assignments.map((a) => {
      const subId = a.submission_id || "";
      const subMeta = submissionMap.get(subId);
      const existingScore = scoreMap.get(subId) || null;

      return {
        assignment_id: a.id,
        submission_id: subId,
        event_id: a.event_id,
        status: a.status as "assigned" | "in_progress" | "completed",
        project_title: subMeta?.project_title || "Project Handoff",
        team_name: subMeta?.team_name || "Assigned Team",
        is_scored: Boolean(existingScore),
        score: existingScore,
        has_pending_correction: pendingCorrectionSet.has(subId),
      };
    });

    // Unscored-first sorting
    items.sort((a, b) => Number(a.is_scored) - Number(b.is_scored));

    return NextResponse.json({ ok: true, data: items } satisfies ApiResult<AssignedSubmissionItem[]>);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to load judge queue.", code: "validation" } satisfies ApiResult<never>,
      { status: 500 }
    );
  }
}