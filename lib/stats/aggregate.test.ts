import { describe, expect, it } from "vitest";

import type { TeamSummary } from "@/lib/euroleague/types";

import {
  averagesFromLines,
  type BoxLine,
  gameLogFor,
  type GameBox,
  lastGameSquads,
  type ScheduledGame,
  teamRecord,
} from "./aggregate";

const team = (code: string): TeamSummary => ({
  code,
  name: code,
  shortName: code,
  crestUrl: null,
});

function line(
  playerCode: string,
  teamCode: string,
  over: Partial<BoxLine> = {},
): BoxLine {
  return {
    playerCode,
    teamCode,
    started: false,
    seconds: 1200,
    points: 10,
    twoMade: 3,
    twoAttempted: 6,
    threeMade: 1,
    threeAttempted: 4,
    ftMade: 1,
    ftAttempted: 2,
    rebounds: 4,
    assists: 2,
    steals: 1,
    blocks: 0,
    turnovers: 1,
    pir: 12,
    ...over,
  };
}

function game(
  gameCode: number,
  round: number,
  home: string,
  away: string,
  homeScore: number,
  awayScore: number,
): ScheduledGame {
  return {
    gameCode,
    round,
    date: `2026-10-${String(round).padStart(2, "0")}T18:00:00Z`,
    played: true,
    home: team(home),
    away: team(away),
    homeScore,
    awayScore,
  };
}

describe("averagesFromLines", () => {
  it("ne računa utakmice sa 0 minuta", () => {
    const avg = averagesFromLines([
      line("a", "T", { pir: 10 }),
      line("a", "T", { pir: 20 }),
      line("a", "T", { seconds: 0, pir: 0 }),
    ]);
    expect(avg?.games).toBe(2);
    expect(avg?.pir).toBe(15);
  });

  it("procente računa iz ukupnih pogodaka", () => {
    // 1/1 i 0/9 za tri: ukupno 1/10 = 10%, a ne prosek (100% + 0%) / 2 = 50%
    const avg = averagesFromLines([
      line("a", "T", { threeMade: 1, threeAttempted: 1 }),
      line("a", "T", { threeMade: 0, threeAttempted: 9 }),
    ]);
    expect(avg?.threePointPct).toBeCloseTo(10);
  });

  it("vraća null ako igrač nije ušao u igru", () => {
    expect(averagesFromLines([line("a", "T", { seconds: 0 })])).toBeNull();
  });
});

describe("gameLogFor", () => {
  it("gleda utakmicu iz ugla igračevog tima", () => {
    const games = [game(1, 1, "ZAL", "RED", 80, 90)];
    const boxes: GameBox[] = [{ gameCode: 1, lines: [line("p", "RED", { pir: 18 })] }];
    const [entry] = gameLogFor("p", games, boxes);
    expect(entry.isHome).toBe(false);
    expect(entry.opponent.code).toBe("ZAL");
    expect(entry.teamScore).toBe(90);
    expect(entry.won).toBe(true);
    expect(entry.pir).toBe(18);
  });
});

describe("lastGameSquads", () => {
  it("uzima sastav sa poslednje odigrane utakmice tima", () => {
    const games = [game(1, 1, "RED", "ZAL", 80, 70), game(2, 2, "PAR", "RED", 75, 85)];
    const boxes: GameBox[] = [
      { gameCode: 1, lines: [line("a", "RED"), line("b", "RED")] },
      { gameCode: 2, lines: [line("a", "RED"), line("x", "PAR")] },
    ];
    const squads = lastGameSquads(games, boxes);
    expect([...squads.get("RED")!]).toEqual(["a"]); // "b" je propustio kolo 2
    expect([...squads.get("ZAL")!]).toEqual([]);
  });
});

describe("teamRecord", () => {
  it("broji pobede i poraze kod kuće i u gostima", () => {
    const games = [
      game(1, 1, "RED", "ZAL", 80, 70),
      game(2, 2, "PAR", "RED", 90, 85),
      game(3, 3, "OLY", "RED", 60, 70),
    ];
    expect(teamRecord("RED", games)).toEqual({ wins: 2, losses: 1 });
  });
});
