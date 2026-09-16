import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const supabase = await createClient();
  const [{ count: regCount }, { count: teamCount }, { count: soloCount }, { count: draftCount }, { count: finalCount }, { data: event, error: eventErr }] = await Promise.all([
    supabase.from("registrations").select("*", { count: "exact", head: true }).eq("event_id", eventId),
    supabase.from("teams").select("*", { count: "exact", head: true }).eq("event_id", eventId),
    supabase.from("registrations").select("*", { count: "exact", head: true }).eq("event_id", eventId).is("team_id", null).eq("status", "confirmed"),
    supabase.from("submissions").select("*", { count: "exact", head: true }).eq("event_id", eventId).eq("status", "draft"),
    supabase.from("submissions").select("*", { count: "exact", head: true }).eq("event_id", eventId).eq("status", "final"),
    supabase.from("events").select("id, name, max_participants, submission_deadline").eq("id", eventId).single(),
  ]);
  if (eventErr || !event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const counts = { reg: regCount ?? 0, teams: teamCount ?? 0, solo: soloCount ?? 0, drafts: draftCount ?? 0, finals: finalCount ?? 0 };
  const capacity = event.max_participants ?? null;
  const utilizationPercent = capacity !== null && capacity > 0 ? Math.round((counts.reg / capacity) * 1000) / 10 : null;
  const completionPercent = counts.teams > 0 ? Math.round((counts.finals / counts.teams) * 1000) / 10 : 0;
  return NextResponse.json({
    event: { id: event.id, name: event.name, maxParticipants: capacity, submissionDeadline: event.submission_deadline },
    registration: { total: counts.reg, capacity, utilizationPercent },
    teams: { totalTeams: counts.teams, soloLookingCount: counts.solo, totalParticipantsInTeams: counts.reg - counts.solo },
    submissions: { draftCount: counts.drafts, finalCount: counts.finals, totalTeams: counts.teams, completionPercent },
    serverTime: new Date().toISOString(),
  });
}
