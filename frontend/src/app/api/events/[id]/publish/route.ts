import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      slug,
      description,
      startsAt,
      endsAt,
      submissionDeadline,
      maxTeamSize,
      maxParticipants,
      customFields,
    } = body;

    // Server-side authoritative validation
    const missingFields: string[] = [];
    if (!name || typeof name !== "string" || !name.trim()) missingFields.push("name");
    if (!slug || typeof slug !== "string" || !slug.trim()) missingFields.push("slug");
    if (!startsAt) missingFields.push("startsAt");
    if (!endsAt) missingFields.push("endsAt");

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: `Missing required server fields: ${missingFields.join(", ")}`,
          code: "validation",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Upsert event row into Supabase
    const { data: event, error } = await supabase
      .from("events")
      .upsert(
        {
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          description: description?.trim() || null,
          status: "published",
          max_team_size: parseInt(maxTeamSize || "4", 10),
          max_participants: maxParticipants ? parseInt(maxParticipants, 10) : null,
          starts_at: new Date(startsAt).toISOString(),
          ends_at: new Date(endsAt).toISOString(),
          submission_deadline: submissionDeadline
            ? new Date(submissionDeadline).toISOString()
            : null,
          registration_fields: customFields || [],
        },
        { onConflict: "slug" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, code: "conflict" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, data: event });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Internal server error during publish", code: "validation" },
      { status: 500 }
    );
  }
}