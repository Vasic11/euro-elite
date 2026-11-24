import { timingSafeEqual } from "node:crypto";

import { runSync } from "@/lib/sync/run";

// Always run, never from cache: every call is a real sync.
export const dynamic = "force-dynamic";
// Vercel Hobby allows up to 300 s; the first full sync needs well under that.
export const maxDuration = 300;

/**
 * Constant-time comparison: a plain `===` returns faster the earlier the
 * strings differ, which in theory lets an attacker guess the secret byte by byte.
 */
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // not configured: refuse everyone
  const header = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/**
 * GET /api/cron/sync: copies the EuroLeague API into the database.
 * Called by Vercel Cron (vercel.json) with `Authorization: Bearer $CRON_SECRET`.
 * 200 for "ok" and "partial" (some box scores skipped, retried next run),
 * 500 if the sync failed.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await runSync();
  return Response.json(
    { ok: result.status !== "failed", ...result },
    { status: result.status === "failed" ? 500 : 200 },
  );
}
