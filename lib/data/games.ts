import "server-only";

import type { GameLogEntry } from "@/lib/euroleague/types";
import { gameLogFor } from "@/lib/stats/aggregate";

import { getSeason } from "./season";

/**
 * Every game the player played this season, by round. Built from the same box
 * scores as the averages, so the numbers always agree.
 */
export async function getPlayerGameLog(playerCode: string): Promise<GameLogEntry[]> {
  const { schedule, boxes } = await getSeason();
  return gameLogFor(playerCode, schedule, boxes);
}
