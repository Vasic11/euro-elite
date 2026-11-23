import "server-only";

import { cache } from "react";

import type { BoxLine, GameBox, ScheduledGame } from "@/lib/stats/aggregate";

import { euroleagueFetch } from "./client";
import { COMPETITION_CODE, SEASON_CODE } from "./config";
import { mapLimit } from "./mapLimit";
import { toTeamSummary } from "./mappers";
import {
  boxScoreResponseSchema,
  scheduleResponseSchema,
  type BoxScoreDto,
} from "./schemas";

const seasonPath = `/competitions/${COMPETITION_CODE}/seasons/${SEASON_CODE}`;

/** Box score završene utakmice se praktično ne menja, pa ga keširamo dan, a ne sat. */
const FINISHED_GAME_REVALIDATE_SECONDS = 60 * 60 * 24;

/** Raspored cele sezone (odigrane i buduće utakmice). Osvežava se svakog sata. */
export const getSchedule = cache(async (): Promise<ScheduledGame[]> => {
  const data = await euroleagueFetch(`/v2${seasonPath}/games`, scheduleResponseSchema);
  return data.data.map((g) => ({
    gameCode: g.gameCode,
    round: g.round,
    date: g.utcDate,
    played: g.played,
    home: toTeamSummary(g.local.club),
    away: toTeamSummary(g.road.club),
    homeScore: g.local.score,
    awayScore: g.road.score,
  }));
});

function toLines(side: BoxScoreDto["local"], teamCode: string): BoxLine[] {
  return side.players.map(({ player, stats }) => ({
    playerCode: player.person.code,
    teamCode,
    started: stats.startFive ?? false,
    seconds: stats.timePlayed,
    points: stats.points,
    twoMade: stats.fieldGoalsMade2,
    twoAttempted: stats.fieldGoalsAttempted2,
    threeMade: stats.fieldGoalsMade3,
    threeAttempted: stats.fieldGoalsAttempted3,
    ftMade: stats.freeThrowsMade,
    ftAttempted: stats.freeThrowsAttempted,
    rebounds: stats.totalRebounds,
    assists: stats.assistances,
    steals: stats.steals,
    blocks: stats.blocksFavour,
    turnovers: stats.turnovers,
    pir: stats.valuation,
  }));
}

/**
 * Box score svake odigrane utakmice. Ovo je jedini izvor koji sigurno sadrži
 * svakog igrača koji je ušao u igru (endpoint sa prosecima neke izostavlja).
 *
 * Utakmica čiji box score ne može da se učita se preskače, a ne ruši ceo sajt.
 */
export const getBoxScores = cache(async (): Promise<GameBox[]> => {
  const played = (await getSchedule()).filter((g) => g.played);

  const boxes = await mapLimit(played, 8, async (game) => {
    try {
      const box = await euroleagueFetch(
        `/v3${seasonPath}/games/${game.gameCode}/stats`,
        boxScoreResponseSchema,
        {
          revalidate: FINISHED_GAME_REVALIDATE_SECONDS,
        },
      );
      return {
        gameCode: game.gameCode,
        lines: [
          ...toLines(box.local, game.home.code),
          ...toLines(box.road, game.away.code),
        ],
      };
    } catch (error) {
      console.error(`Box score for game ${game.gameCode} failed to load`, error);
      return null;
    }
  });

  return boxes.filter((b): b is GameBox => b !== null);
});
