import { describe, expect, it } from "vitest";

import type { TeamSummary } from "@/lib/euroleague/types";

import {
  averagesFromLines,
  averagesFromTotals,
  type BoxLine,
  type GameBox,
  playersWhoMissedLastGame,
  type ScheduledGame,
  squadsFrom,
  teamRecord,
  teamSquads,
  totalsFromLines,
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

describe("totalsFromLines", () => {
  it("counts 0-second games as squad games but not in the sums", () => {
    const [t] = totalsFromLines([
      line("a", "T", { pir: 10 }),
      line("a", "T", { seconds: 0, pir: -1 }),
    ]);
    expect(t).toMatchObject({ squadGames: 2, games: 1, seconds: 1200, pir: 10 });
  });

  it("keeps one row per club after a transfer", () => {
    const totals = totalsFromLines([
      line("a", "PAR"),
      line("a", "RED"),
      line("a", "RED"),
    ]);
    expect(totals.map((t) => [t.teamCode, t.games])).toEqual([
      ["PAR", 1],
      ["RED", 2],
    ]);
  });
});

describe("averagesFromTotals", () => {
  it("averages a transferred player over all his clubs", () => {
    const totals = totalsFromLines([
      line("a", "PAR", { pir: 30 }),
      line("a", "RED", { pir: 0 }),
      line("a", "RED", { pir: 0 }),
    ]);
    expect(averagesFromTotals(totals)).toMatchObject({ games: 3, pir: 10 });
  });
});

describe("teamSquads", () => {
  it("uzima sastav sa poslednje odigrane utakmice tima", () => {
    const games = [game(1, 1, "RED", "ZAL", 80, 70), game(2, 2, "PAR", "RED", 75, 85)];
    const boxes: GameBox[] = [
      { gameCode: 1, lines: [line("a", "RED"), line("b", "RED")] },
      { gameCode: 2, lines: [line("a", "RED"), line("x", "PAR")] },
    ];
    const squads = new Map(teamSquads(games, boxes).map((s) => [s.teamCode, s]));
    expect(squads.get("RED")).toEqual({ teamCode: "RED", games: 2, lastSquad: ["a"] });
    expect(squads.get("ZAL")).toEqual({ teamCode: "ZAL", games: 0, lastSquad: [] });
  });

  it("ignores lines of games that are not a team's latest", () => {
    const games = [game(1, 1, "RED", "ZAL", 80, 70), game(2, 2, "RED", "PAR", 75, 85)];
    const squads = squadsFrom(
      games,
      [
        { gameCode: 1, teamCode: "RED" },
        { gameCode: 2, teamCode: "RED" },
      ],
      [
        { gameCode: 1, teamCode: "RED", playerCode: "old" },
        { gameCode: 2, teamCode: "RED", playerCode: "new" },
      ],
    );
    expect(squads.find((s) => s.teamCode === "RED")?.lastSquad).toEqual(["new"]);
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

describe("playersWhoMissedLastGame", () => {
  const games = [
    game(1, 1, "RED", "ZAL", 80, 70),
    game(2, 2, "PAR", "RED", 75, 85),
    game(3, 3, "RED", "OLY", 90, 80),
  ];
  const missed = (boxes: GameBox[]) =>
    playersWhoMissedLastGame(
      totalsFromLines(boxes.flatMap((b) => b.lines)),
      teamSquads(games, boxes),
    );

  it("označava stalnog člana sastava koji nije bio na poslednjoj utakmici", () => {
    const boxes: GameBox[] = [
      { gameCode: 1, lines: [line("starter", "RED"), line("hurt", "RED")] },
      { gameCode: 2, lines: [line("starter", "RED"), line("hurt", "RED")] },
      { gameCode: 3, lines: [line("starter", "RED")] },
    ];
    expect([...missed(boxes)]).toEqual(["hurt"]);
  });

  it("ne označava igrača sa kraja klupe koji je retko u sastavu", () => {
    // "bench" je bio u sastavu 1 od 3 utakmice (< polovine), pa ne dobija oznaku
    const boxes: GameBox[] = [
      { gameCode: 1, lines: [line("starter", "RED"), line("bench", "RED")] },
      { gameCode: 2, lines: [line("starter", "RED")] },
      { gameCode: 3, lines: [line("starter", "RED")] },
    ];
    expect(missed(boxes).size).toBe(0);
  });

  it("does not flag anyone on a team without a latest game", () => {
    const totals = totalsFromLines([line("a", "RED")]);
    expect(
      playersWhoMissedLastGame(totals, [{ teamCode: "RED", games: 1, lastSquad: null }])
        .size,
    ).toBe(0);
  });
});
