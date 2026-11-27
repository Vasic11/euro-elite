import "server-only";

import { cache } from "react";

import { getPlayerGamesFromDb } from "@/lib/db/queries";
import type { GameLogEntry } from "@/lib/euroleague/types";
import { gameLogFor } from "@/lib/stats/aggregate";
import type { PlayerGameLine } from "@/lib/stats/boxScore";

import { getSeason } from "./season";

/**
 * Every game the player played this season, by round. Built from the same box
 * scores as the averages, so the numbers always agree.
 */
export async function getPlayerGameLog(playerCode: string): Promise<GameLogEntry[]> {
  const { schedule, boxes } = await getSeason();
  return gameLogFor(playerCode, schedule, boxes);
}

/**
 * Every game of the player with all box score columns, oldest first, for the
 * stat tables. Includes 0-second games (in the squad, did not play); the stat
 * functions skip them. React's `cache` lets both tables on the profile share
 * one read.
 */
export const getPlayerGames = cache(
  async (playerCode: string): Promise<PlayerGameLine[]> => {
    const games = await getPlayerGamesFromDb(playerCode);
    return games.toSorted((a, b) => a.date.localeCompare(b.date));
  },
);
