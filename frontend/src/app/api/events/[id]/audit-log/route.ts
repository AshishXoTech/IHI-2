import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApiResult, AuditLogItem } from "@/types/shared";

const IS_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventKey } = await params;
    const entityType = request.nextUrl.searchParams.get("entity_type");

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

    let eq = supabase.from("events").select("id");
    if (IS_UUID.test(eventKey)) {
      eq = eq.or(`id.eq.${eventKey},slug.eq.${eventKey}`);
    } else {
      eq = eq.eq("slug", eventKey);
    }
    const { data: event } = await eq.maybeSingle();
    if (!event) {
      return NextResponse.json(
        { ok: false, error: "Event not found.", code: "not_found" } satisfies ApiResult<never>,
        { status: 404 }
      );
    }

    let q = supabase
      .from("audit_log")
      .select(
        "id, event_id, actor_id, action, entity_type, entity_id, payload, created_at"
      )
      .eq("event_id", event.id)
      .order("created_at", { ascending: false });

    if (entityType && entityType !== "all") {
      q = q.eq("entity_type", entityType);
    }

    const { data, error } = await q;
    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, code: "validation" } satisfies ApiResult<never>,
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: (data || []) as AuditLogItem[],
    } satisfies ApiResult<AuditLogItem[]>);
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to load audit log.",
        code: "validation",
      } satisfies ApiResult<never>,
      { status: 500 }
    );
  }
}