/**
 * Detailed box-score math for the player stat tables (like euroleague.net):
 * season totals, per-game averages, shooting percentages and mm:ss minutes.
 * Pure functions, no API, DB or React.
 */
import type { TeamSummary } from "@/lib/euroleague/types";

import type { BoxLine } from "./aggregate";

/** A box line with every column the stat tables show. */
export type DetailedBoxLine = BoxLine & {
  offRebounds: number;
  defRebounds: number;
  blocksAgainst: number;
  foulsCommitted: number;
  foulsDrawn: number;
  plusMinus: number;
};

/** One game of one player, from his team's point of view. */
export type PlayerGameLine = {
  gameCode: number;
  round: number;
  /** ISO date of the game (UTC). */
  date: string;
  team: TeamSummary;
  opponent: TeamSummary;
  /** Three-letter TV code ("CZV"), short enough for the game log on a phone. */
  opponentTvCode: string;
  isHome: boolean;
  teamScore: number;
  opponentScore: number;
  won: boolean;
  line: DetailedBoxLine;
};

/** The columns that are summed and averaged. */
export const STAT_KEYS = [
  "seconds",
  "points",
  "twoMade",
  "twoAttempted",
  "threeMade",
  "threeAttempted",
  "ftMade",
  "ftAttempted",
  "offRebounds",
  "defRebounds",
  "rebounds",
  "assists",
  "steals",
  "turnovers",
  "blocks",
  "blocksAgainst",
  "foulsCommitted",
  "foulsDrawn",
  "plusMinus",
  "pir",
] as const satisfies readonly (keyof DetailedBoxLine)[];

export type StatKey = (typeof STAT_KEYS)[number];
export type StatValues = Record<StatKey, number>;
export type StatMode = "averages" | "totals";

/** One row of a stat table. Percentages always come from totals. */
export type StatRow = {
  mode: StatMode;
  /** Games played (seconds > 0). */
  games: number;
  /** Games started, among those played. */
  starts: number;
  values: StatValues;
  twoPct: number | null;
  threePct: number | null;
  ftPct: number | null;
};

const zeroValues = (): StatValues =>
  Object.fromEntries(STAT_KEYS.map((k) => [k, 0])) as StatValues;

/** Made / attempted in percent; null when there was no attempt (shown as "—"). */
export function shootingPct(made: number, attempted: number): number | null {
  return attempted > 0 ? (made / attempted) * 100 : null;
}

/**
 * Totals or per-game averages of the games the player actually played.
 * Lines with 0 seconds (in the squad, did not play) count for nothing.
 * Returns null when he has not played.
 */
export function statRow(lines: DetailedBoxLine[], mode: StatMode): StatRow | null {
  const played = lines.filter((l) => l.seconds > 0);
  if (played.length === 0) return null;

  const totals = zeroValues();
  for (const line of played) for (const key of STAT_KEYS) totals[key] += line[key];

  const values =
    mode === "totals"
      ? totals
      : (Object.fromEntries(
          STAT_KEYS.map((k) => [k, totals[k] / played.length]),
        ) as StatValues);

  return {
    mode,
    games: played.length,
    starts: played.filter((l) => l.started).length,
    values,
    // From summed makes and attempts, never an average of per-game percentages.
    twoPct: shootingPct(totals.twoMade, totals.twoAttempted),
    threePct: shootingPct(totals.threeMade, totals.threeAttempted),
    ftPct: shootingPct(totals.ftMade, totals.ftAttempted),
  };
}

/**
 * The season split by club, in the order he played for them, plus a total when
 * he played for more than one (a mid-season transfer), like euroleague.net.
 */
export function seasonRows(
  games: PlayerGameLine[],
  mode: StatMode,
): { team: TeamSummary | null; row: StatRow }[] {
  const byTeam = new Map<string, { team: TeamSummary; lines: DetailedBoxLine[] }>();
  for (const game of [...games].sort((a, b) => a.date.localeCompare(b.date))) {
    const entry = byTeam.get(game.team.code) ?? { team: game.team, lines: [] };
    entry.lines.push(game.line);
    byTeam.set(game.team.code, entry);
  }

  const rows: { team: TeamSummary | null; row: StatRow }[] = [];
  for (const { team, lines } of byTeam.values()) {
    const row = statRow(lines, mode);
    if (row) rows.push({ team, row });
  }
  if (rows.length > 1) {
    const total = statRow(
      games.map((g) => g.line),
      mode,
    );
    if (total) rows.push({ team: null, row: total });
  }
  return rows;
}

/** Seconds as "mm:ss" (minutes can go past 60 for season totals: "412:05"). */
export function formatMinutes(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  const mm = Math.floor(whole / 60);
  const ss = whole % 60;
  return `${mm}:${String(ss).padStart(2, "0")}`;
}
