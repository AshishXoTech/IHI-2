import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/dashboard/[eventId]
 *
 * Read-optimised aggregation endpoint for the Live Operations
 * Dashboard.  Uses `head: true` count queries so Supabase returns
 * only the count header — no row payloads — keeping this fast even
 * at 1,500+ registrations.
 *
 * All six queries run in parallel via Promise.all.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params;
  const supabase = await createClient();

  // ── Parallel count + meta queries ──────────────────────────────
  const [
    { count: regCount, error: regErr },
    { count: teamCount, error: teamErr },
    { count: soloCount, error: soloErr },
    { count: draftCount, error: draftErr },
    { count: finalCount, error: finalErr },
    { data: event, error: eventErr },
  ] = await Promise.all([
    // 1. Total registrations for this event
    supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId),

    // 2. Total teams
    supabase
      .from('teams')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId),

    // 3. Solo participants still looking for a team
    supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('team_id', null)
      .eq('status', 'confirmed'),

    // 4. Draft submissions
    supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'draft'),

    // 5. Final submissions
    supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'final'),

    // 6. Event metadata (single row, lightweight)
    supabase
      .from('events')
      .select('id, name, max_participants, submission_deadline')
      .eq('id', eventId)
      .single(),
  ]);

  // ── Error handling ─────────────────────────────────────────────
  if (eventErr) {
    return NextResponse.json(
      { error: 'Event not found', detail: eventErr.message },
      { status: 404 },
    );
  }

  // Log non-fatal count errors but don't fail the whole response —
  // a missing table shouldn't take down the entire dashboard.
  const counts = {
    reg: regCount ?? 0,
    teams: teamCount ?? 0,
    solo: soloCount ?? 0,
    drafts: draftCount ?? 0,
    finals: finalCount ?? 0,
  };

  if (regErr || teamErr || soloErr || draftErr || finalErr) {
    console.warn('[dashboard] partial count failure', {
      regErr,
      teamErr,
      soloErr,
      draftErr,
      finalErr,
    });
  }

  // ── Derived metrics ────────────────────────────────────────────
  const capacity = event.max_participants ?? null;
  const utilizationPercent =
    capacity !== null && capacity > 0
      ? Math.round((counts.reg / capacity) * 1000) / 10 // one decimal
      : null;

  const totalTeams = counts.teams;
  const completionPercent =
    totalTeams > 0
      ? Math.round((counts.finals / totalTeams) * 1000) / 10
      : 0;

  // ── Response ───────────────────────────────────────────────────
  return NextResponse.json({
    event: {
      id: event.id,
      name: event.name,
      maxParticipants: capacity,
      submissionDeadline: event.submission_deadline,
    },
    registration: {
      total: counts.reg,
      capacity,
      utilizationPercent,
    },
    teams: {
      totalTeams,
      soloLookingCount: counts.solo,
      totalParticipantsInTeams: counts.reg - counts.solo,
    },
    submissions: {
      draftCount: counts.drafts,
      finalCount: counts.finals,
      totalTeams,
      completionPercent,
    },
    serverTime: new Date().toISOString(),
  });
}