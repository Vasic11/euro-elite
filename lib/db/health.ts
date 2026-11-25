import "server-only";

import { desc, eq } from "drizzle-orm";

import type { HealthCheck } from "@/lib/euroleague/health";

import { getDb } from "./client";
import { describeError } from "./errors";
import { syncRuns } from "./schema";

/** The site reads the database, so a sync older than this means stale pages. */
export const MAX_SYNC_AGE_HOURS = 36;

const HOUR_MS = 60 * 60 * 1000;

/**
 * Is the latest successful sync recent enough? Pure, so the rule is tested
 * without a database. 36 h = one missed nightly run is tolerated, two are not.
 */
export function syncFreshness(
  lastOkFinishedAt: Date | null,
  now: Date,
  maxHours = MAX_SYNC_AGE_HOURS,
): Omit<HealthCheck, "ms"> {
  if (!lastOkFinishedAt) {
    return { name: "sync", ok: false, error: "No successful sync yet" };
  }
  const hours = (now.getTime() - lastOkFinishedAt.getTime()) / HOUR_MS;
  if (hours > maxHours) {
    return {
      name: "sync",
      ok: false,
      error: `Last ok sync ${hours.toFixed(1)} h ago (limit ${maxHours} h)`,
    };
  }
  return { name: "sync", ok: true };
}

/** Health check of the database sync: latest `ok` row in `sync_runs`. */
export async function checkSync(now = new Date()): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const [last] = await getDb()
      .select({ finishedAt: syncRuns.finishedAt })
      .from(syncRuns)
      .where(eq(syncRuns.status, "ok"))
      .orderBy(desc(syncRuns.finishedAt))
      .limit(1);
    return { ...syncFreshness(last?.finishedAt ?? null, now), ms: Date.now() - start };
  } catch (error) {
    return {
      name: "sync",
      ok: false,
      ms: Date.now() - start,
      error: describeError(error),
    };
  }
}
