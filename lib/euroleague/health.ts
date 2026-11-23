import "server-only";

import type { z } from "zod";

import { euroleagueFetch } from "./client";
import { COMPETITION_CODE, SEASON_CODE } from "./config";
import {
  boxScoreResponseSchema,
  clubPeopleResponseSchema,
  clubsResponseSchema,
  scheduleResponseSchema,
} from "./schemas";

export type HealthCheck = { name: string; ok: boolean; ms: number; error?: string };

const seasonPath = `/competitions/${COMPETITION_CODE}/seasons/${SEASON_CODE}`;

/** Jedna provera: zahtev bez keša (revalidate 0) i Zod validacija, sa merenjem vremena. */
async function check<T extends z.ZodType>(
  name: string,
  path: string,
  schema: T,
): Promise<[HealthCheck, z.infer<T> | null]> {
  const start = Date.now();
  try {
    const data = await euroleagueFetch(path, schema, { revalidate: 0 });
    return [{ name, ok: true, ms: Date.now() - start }, data];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return [{ name, ok: false, ms: Date.now() - start, error: message }, null];
  }
}

/**
 * Proverava svaki EuroLeague endpoint koji sajt koristi: da li odgovara i da li
 * odgovor i dalje ima oblik koji očekujemo (Zod). Ako EuroLeague promeni API,
 * ovo je mesto gde ćemo to prvo videti.
 */
export async function runHealthChecks(): Promise<HealthCheck[]> {
  const [[clubsCheck, clubs], [scheduleCheck, schedule]] = await Promise.all([
    check("clubs", `/v2${seasonPath}/clubs`, clubsResponseSchema),
    check("schedule", `/v2${seasonPath}/games`, scheduleResponseSchema),
  ]);
  const checks = [clubsCheck, scheduleCheck];

  const firstClub = clubs?.data[0];
  if (firstClub) {
    const [rosterCheck] = await check(
      `roster ${firstClub.code}`,
      `/v2${seasonPath}/clubs/${firstClub.code}/people`,
      clubPeopleResponseSchema,
    );
    checks.push(rosterCheck);
  }

  const lastPlayed = schedule?.data.filter((g) => g.played).at(-1);
  if (lastPlayed) {
    const [boxCheck] = await check(
      `box score ${lastPlayed.gameCode}`,
      `/v3${seasonPath}/games/${lastPlayed.gameCode}/stats`,
      boxScoreResponseSchema,
    );
    checks.push(boxCheck);
  }

  return checks;
}
