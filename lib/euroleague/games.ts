import "server-only";

import { gameLogFor } from "@/lib/stats/aggregate";

import { getBoxScores, getSchedule } from "./season";
import type { GameLogEntry } from "./types";

/**
 * Sve utakmice koje je igrač odigrao ove sezone, po kolima.
 * Računa se iz istih box score-ova kao i proseci, pa se brojke uvek slažu.
 */
export async function getPlayerGameLog(playerCode: string): Promise<GameLogEntry[]> {
  const [schedule, boxes] = await Promise.all([getSchedule(), getBoxScores()]);
  return gameLogFor(playerCode, schedule, boxes);
}
