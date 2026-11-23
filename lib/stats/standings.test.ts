import { describe, expect, it } from "vitest";

import type { TeamSummary } from "@/lib/euroleague/types";

import type { ScheduledGame } from "./aggregate";
import { computeStandings, nextRound, teamGames } from "./standings";

const team = (code: string): TeamSummary => ({
  code,
  name: code,
  shortName: code,
  crestUrl: null,
});
let n = 0;
function game(
  round: number,
  home: string,
  away: string,
  hs: number,
  as: number,
  played = true,
): ScheduledGame {
  n++;
  return {
    gameCode: n,
    round,
    date: `2026-10-${String(round).padStart(2, "0")}T18:${String(n % 60).padStart(2, "0")}:00Z`,
    played,
    home: team(home),
    away: team(away),
    homeScore: played ? hs : 0,
    awayScore: played ? as : 0,
  };
}

describe("computeStandings", () => {
  it("ređa po pobedama, pa po koš-razlici", () => {
    const games = [
      game(1, "A", "B", 80, 70), // A +10
      game(1, "C", "D", 90, 60), // C +30
      game(2, "B", "C", 75, 70), // B pobedi C
      game(2, "D", "A", 60, 80), // A pobedi D
    ];
    const table = computeStandings(games);
    // B i C imaju po 1-1, a C ima bolju koš-razliku (+25 prema -5), pa je ispred
    expect(table.map((r) => r.team.code)).toEqual(["A", "C", "B", "D"]);
    expect(table[0]).toMatchObject({
      played: 2,
      wins: 2,
      losses: 0,
      pointsFor: 160,
      pointsAgainst: 130,
    });
  });

  it("kod istog broja pobeda bolja koš-razlika ide ispred", () => {
    const games = [game(1, "X", "Y", 100, 60), game(1, "Z", "W", 81, 80)];
    const table = computeStandings(games);
    expect(table.map((r) => r.team.code)).toEqual(["X", "Z", "W", "Y"]);
  });

  it("pamti poslednjih 5 rezultata", () => {
    const games = Array.from({ length: 6 }, (_, i) =>
      game(i + 1, "A", "B", i % 2 ? 70 : 80, 75),
    );
    const a = computeStandings(games).find((r) => r.team.code === "A")!;
    expect(a.lastFive).toEqual(["L", "W", "L", "W", "L"]);
  });

  it("uključuje timove koji još nisu igrali", () => {
    const table = computeStandings([game(1, "A", "B", 0, 0, false)]);
    expect(table).toHaveLength(2);
    expect(table[0].played).toBe(0);
  });
});

describe("teamGames i nextRound", () => {
  it("deli utakmice tima na rezultate i naredne", () => {
    const games = [
      game(1, "A", "B", 80, 70),
      game(2, "C", "A", 0, 0, false),
      game(3, "A", "D", 0, 0, false),
    ];
    const { results, upcoming } = teamGames("A", games);
    expect(results).toHaveLength(1);
    expect(upcoming.map((g) => g.round)).toEqual([2, 3]);
    expect(nextRound(games).map((g) => g.round)).toEqual([2]);
  });
});
