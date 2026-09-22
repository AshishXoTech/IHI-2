import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Registration, RegistrationStatus, ApiResult } from "@/types/shared";

const ALLOWED_STATUSES: RegistrationStatus[] = [
  "pending",
  "approved",
  "rejected",
  "waitlisted",
  "withdrawn",
];

/**
 * GET /api/events/[id]/registrations?status=pending
 * Lists registrations for an event. Optional status filter.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const statusParam = request.nextUrl.searchParams.get("status");

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const body: ApiResult<never> = {
        ok: false,
        error: "You must be signed in to view registrations.",
        code: "unauthorized",
      };
      return NextResponse.json(body, { status: 401 });
    }

    // Resolve event by id or slug
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id")
      .or(`id.eq.${eventId},slug.eq.${eventId}`)
      .maybeSingle();

    if (eventError || !event) {
      const body: ApiResult<never> = {
        ok: false,
        error: "Event not found.",
        code: "not_found",
      };
      return NextResponse.json(body, { status: 404 });
    }

    let query = supabase
      .from("registrations")
      .select("id, event_id, user_id, status, display_name, skills, created_at")
      .eq("event_id", event.id)
      .order("created_at", { ascending: false });

    if (statusParam && statusParam !== "all") {
      if (!ALLOWED_STATUSES.includes(statusParam as RegistrationStatus)) {
        const body: ApiResult<never> = {
          ok: false,
          error: `Invalid status filter: ${statusParam}`,
          code: "validation",
        };
        return NextResponse.json(body, { status: 400 });
      }
      query = query.eq("status", statusParam);
    }

    const { data, error } = await query;

    if (error) {
      const body: ApiResult<never> = {
        ok: false,
        error: error.message,
        code: "validation",
      };
      return NextResponse.json(body, { status: 500 });
    }

    const body: ApiResult<Registration[]> = {
      ok: true,
      data: (data ?? []) as Registration[],
    };
    return NextResponse.json(body);
  } catch {
    const body: ApiResult<never> = {
      ok: false,
      error: "Internal server error listing registrations.",
      code: "validation",
    };
    return NextResponse.json(body, { status: 500 });
  }
}

/**
 * PATCH /api/events/[id]/registrations
 * Body: { registrationId: string, status: RegistrationStatus }
 * Status-only update (no notifications in Phase 3).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const bodyJson = await request.json();
    const registrationId = bodyJson?.registrationId as string | undefined;
    const nextStatus = bodyJson?.status as RegistrationStatus | undefined;

    if (!registrationId || typeof registrationId !== "string") {
      const body: ApiResult<never> = {
        ok: false,
        error: "registrationId is required.",
        code: "validation",
      };
      return NextResponse.json(body, { status: 400 });
    }

    if (!nextStatus || !ALLOWED_STATUSES.includes(nextStatus)) {
      const body: ApiResult<never> = {
        ok: false,
        error: `status must be one of: ${ALLOWED_STATUSES.join(", ")}`,
        code: "validation",
      };
      return NextResponse.json(body, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const body: ApiResult<never> = {
        ok: false,
        error: "You must be signed in to update registrations.",
        code: "unauthorized",
      };
      return NextResponse.json(body, { status: 401 });
    }

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id")
      .or(`id.eq.${eventId},slug.eq.${eventId}`)
      .maybeSingle();

    if (eventError || !event) {
      const body: ApiResult<never> = {
        ok: false,
        error: "Event not found.",
        code: "not_found",
      };
      return NextResponse.json(body, { status: 404 });
    }

    // Ensure registration belongs to this event, then update status only
    const { data: updated, error: updateError } = await supabase
      .from("registrations")
      .update({ status: nextStatus })
      .eq("id", registrationId)
      .eq("event_id", event.id)
      .select("id, event_id, user_id, status, display_name, skills, created_at")
      .maybeSingle();

    if (updateError) {
      const body: ApiResult<never> = {
        ok: false,
        error: updateError.message,
        code: "conflict",
      };
      return NextResponse.json(body, { status: 500 });
    }

    if (!updated) {
      const body: ApiResult<never> = {
        ok: false,
        error: "Registration not found for this event.",
        code: "not_found",
      };
      return NextResponse.json(body, { status: 404 });
    }

    const body: ApiResult<Registration> = {
      ok: true,
      data: updated as Registration,
    };
    return NextResponse.json(body);
  } catch {
    const body: ApiResult<never> = {
      ok: false,
      error: "Internal server error updating registration.",
      code: "validation",
    };
    return NextResponse.json(body, { status: 500 });
  }
}