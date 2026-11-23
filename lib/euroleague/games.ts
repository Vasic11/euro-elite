import "server-only";

import { euroleagueFetch } from "./client";
import { COMPETITION_CODE, SEASON_CODE } from "./config";
import { toTeamSummary } from "./mappers";
import { playerGamesResponseSchema, type PlayerGame } from "./schemas";
import type { GameLogEntry } from "./types";

function toGameLogEntry({ game, stats, playerClubCode }: PlayerGame): GameLogEntry {
  // Utakmicu gledamo iz ugla igračevog tima: da li je bio domaćin i ko je protivnik.
  const isHome = game.local.club.code === playerClubCode;
  const own = isHome ? game.local : game.road;
  const other = isHome ? game.road : game.local;

  return {
    gameCode: game.gameCode,
    round: game.round,
    date: game.utcDate,
    opponent: toTeamSummary(other.club),
    isHome,
    teamScore: own.score,
    opponentScore: other.score,
    won: own.score > other.score,
    started: stats.startFive ?? false,
    minutes: stats.timePlayed / 60,
    points: stats.points,
    rebounds: stats.totalRebounds,
    assists: stats.assistances,
    steals: stats.steals,
    blocks: stats.blocksFavour,
    turnovers: stats.turnovers,
    pir: stats.valuation,
  };
}

/**
 * Sve utakmice koje je igrač odigrao ove sezone, po kolima (od prvog ka poslednjem).
 * Utakmice na kojima nije ulazio u igru (0 sekundi) ne računamo kao odigrane.
 */
export async function getPlayerGameLog(playerCode: string): Promise<GameLogEntry[]> {
  const data = await euroleagueFetch(
    `/v2/competitions/${COMPETITION_CODE}/seasons/${SEASON_CODE}/people/${encodeURIComponent(playerCode)}/stats`,
    playerGamesResponseSchema,
  );

  return data.games
    .filter((g) => g.stats.timePlayed > 0)
    .map(toGameLogEntry)
    .sort((a, b) => a.round - b.round);
}
