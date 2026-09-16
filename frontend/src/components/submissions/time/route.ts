import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/submissions/time
 * Returns the authoritative server time.
 * Bypasses local client clocks which can be manipulated or wrong.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    data: { server_time: new Date().toISOString() },
  });
}