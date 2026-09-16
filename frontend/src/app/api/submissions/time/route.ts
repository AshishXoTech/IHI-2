import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/submissions/time
 * Returns authoritative server time for the countdown timer.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    data: { server_time: new Date().toISOString() },
  });
}