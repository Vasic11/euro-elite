import "server-only";

import { cache } from "react";

import { getPlayerGamesFromDb } from "@/lib/db/queries";
import type { GameLogEntry } from "@/lib/euroleague/types";
import { gameLogFromGames, type PlayerGameLine } from "@/lib/stats/boxScore";

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

/**
 * Every game the player played this season, by round, for the form section.
 * Reads the same per-player cache entry as the stat tables (React's `cache`
 * shares one read per render), not the season entry.
 */
export async function getPlayerGameLog(playerCode: string): Promise<GameLogEntry[]> {
  return gameLogFromGames(await getPlayerGames(playerCode));
}
