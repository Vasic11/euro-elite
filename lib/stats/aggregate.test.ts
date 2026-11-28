import { describe, expect, it } from "vitest";

import type { TeamSummary } from "@/lib/euroleague/types";

import {
  averagesFromLines,
  type CurrentClub,
  averagesFromTotals,
  type BoxLine,
  type GameBox,
  playersOutSince,
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
    expect(squads.get("RED")).toEqual({
      teamCode: "RED",
      gameDates: [games[0].date, games[1].date],
      lastSquad: ["a"],
    });
    expect(squads.get("ZAL")).toEqual({ teamCode: "ZAL", gameDates: [], lastSquad: [] });
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
  /** Everyone in the boxes is at the club of his last line, since the start of the season. */
  const missed = (
    boxes: GameBox[],
    schedule = games,
    current?: Map<string, CurrentClub>,
  ) => {
    const lines = boxes.flatMap((b) => b.lines);
    const clubs =
      current ??
      new Map(lines.map((l) => [l.playerCode, { teamCode: l.teamCode, since: null }]));
    return [
      ...playersWhoMissedLastGame(
        totalsFromLines(lines),
        teamSquads(schedule, boxes),
        clubs,
      ),
    ].sort();
  };

  it("označava stalnog člana sastava koji nije bio na poslednjoj utakmici", () => {
    const boxes: GameBox[] = [
      { gameCode: 1, lines: [line("starter", "RED"), line("hurt", "RED")] },
      { gameCode: 2, lines: [line("starter", "RED"), line("hurt", "RED")] },
      { gameCode: 3, lines: [line("starter", "RED")] },
    ];
    expect(missed(boxes)).toEqual(["hurt"]);
  });

  it("ne označava igrača sa kraja klupe koji je retko u sastavu", () => {
    // "bench" je bio u sastavu 1 od 3 utakmice (< polovine), pa ne dobija oznaku
    const boxes: GameBox[] = [
      { gameCode: 1, lines: [line("starter", "RED"), line("bench", "RED")] },
      { gameCode: 2, lines: [line("starter", "RED")] },
      { gameCode: 3, lines: [line("starter", "RED")] },
    ];
    expect(missed(boxes)).toEqual([]);
  });

  it("does not flag anyone on a team without a latest game", () => {
    const totals = totalsFromLines([line("a", "RED")]);
    const current = new Map([["a", { teamCode: "RED", since: null }]]);
    expect(
      playersWhoMissedLastGame(
        totals,
        [{ teamCode: "RED", gameDates: [], lastSquad: null }],
        current,
      ).size,
    ).toBe(0);
  });

  // Rounds 1-5 are on 1-5 Oct 2026 at 18:00 UTC.
  const oct = (day: number) => Date.UTC(2026, 9, day);

  it("ignores a former club after a transfer (Chris Silva, ULK → PAR)", () => {
    const schedule = [
      game(1, 1, "ULK", "BAR", 80, 70),
      game(2, 2, "ULK", "OLY", 80, 70),
      game(3, 3, "PAR", "RED", 80, 70),
      game(4, 4, "BAR", "ULK", 77, 83),
      game(5, 5, "DUB", "PAR", 71, 84),
    ];
    const boxes: GameBox[] = [
      { gameCode: 1, lines: [line("silva", "ULK")] },
      { gameCode: 2, lines: [line("silva", "ULK")] },
      { gameCode: 3, lines: [line("silva", "PAR"), line("regular", "PAR")] },
      { gameCode: 4, lines: [line("other", "ULK")] },
      { gameCode: 5, lines: [line("silva", "PAR")] },
    ];
    const current = new Map<string, CurrentClub>([
      // A regular at ULK (2 of 3 games) and missing from ULK's last game,
      // but he is at PAR now and was in PAR's last game.
      ["silva", { teamCode: "PAR", since: oct(3) }],
      // PAR's own regular who missed PAR's last game is still flagged.
      ["regular", { teamCode: "PAR", since: null }],
      ["other", { teamCode: "ULK", since: null }],
    ]);
    expect(missed(boxes, schedule, current)).toEqual(["regular"]);
  });

  it("counts a newcomer's threshold only from his contract start", () => {
    const schedule = [1, 2, 3, 4, 5].map((r) => game(r, r, "PAR", "RED", 80, 70));
    const boxes: GameBox[] = schedule.map((g) => ({
      gameCode: g.gameCode,
      // "new" joined before round 4, played it, and missed round 5.
      lines: g.round === 4 ? [line("new", "PAR"), line("x", "PAR")] : [line("x", "PAR")],
    }));
    const since = (date: number | null) =>
      new Map<string, CurrentClub>([
        ["new", { teamCode: "PAR", since: date }],
        ["x", { teamCode: "PAR", since: null }],
      ]);
    // In 1 of PAR's 2 games since he signed: a regular.
    expect(missed(boxes, schedule, since(oct(4)))).toEqual(["new"]);
    // Counted over the whole season (1 of 5) he would never be one.
    expect(missed(boxes, schedule, since(null))).toEqual([]);
  });

  it("does not flag a player signed after his club's last game", () => {
    const boxes: GameBox[] = [{ gameCode: 3, lines: [line("x", "RED")] }];
    const current = new Map<string, CurrentClub>([
      ["new", { teamCode: "RED", since: oct(10) }],
      ["x", { teamCode: "RED", since: null }],
    ]);
    // "new" has a totals row only if he was in a squad; give him one from earlier.
    const totals = totalsFromLines([
      line("new", "RED", { seconds: 0 }),
      line("x", "RED"),
    ]);
    expect(playersWhoMissedLastGame(totals, teamSquads(games, boxes), current).size).toBe(
      0,
    );
  });
});

describe("playersOutSince", () => {
  // PAR plays rounds 1-6 (1-6 Oct 2026, 18:00 UTC).
  const schedule = [1, 2, 3, 4, 5, 6].map((r) => game(r, r, "PAR", "RED", 80, 70));
  const date = (round: number) => schedule[round - 1].date;

  /** `rounds[p]` = the rounds player p was in PAR's squad; "x" plays every game. */
  const outSince = (
    rounds: Record<string, number[]>,
    current?: Map<string, CurrentClub>,
    games = schedule,
  ) => {
    const all = { x: games.map((g) => g.round), ...rounds };
    const boxes: GameBox[] = games.map((g) => ({
      gameCode: g.gameCode,
      lines: Object.entries(all)
        .filter(([, r]) => r.includes(g.round))
        .map(([p]) => line(p, "PAR")),
    }));
    const dated = boxes.flatMap((b) =>
      b.lines.map((l) => ({ ...l, date: games[b.gameCode - 1].date })),
    );
    const clubs =
      current ??
      new Map(Object.keys(all).map((p) => [p, { teamCode: "PAR", since: null }]));
    return playersOutSince(totalsFromLines(dated), teamSquads(games, boxes), clubs);
  };

  it("flags 3 missed games in a row with the date of the first one", () => {
    expect(outSince({ hurt: [1, 2, 3] }).get("hurt")).toBe(date(4));
  });

  it("does not flag only 2 missed games", () => {
    expect(outSince({ hurt: [1, 2, 3, 4] }).has("hurt")).toBe(false);
  });

  it("clears the flag once he is back in the squad", () => {
    expect(outSince({ back: [1, 2, 6] }).has("back")).toBe(false);
  });

  it("flags a player seen once at the start, then never again (Derek Willis)", () => {
    expect(outSince({ willis: [1] }).get("willis")).toBe(date(2));
  });

  it("does not flag a player who was not a regular before the absence", () => {
    // In 1 of PAR's first 3 games: a bench player, not an injury.
    expect(outSince({ bench: [3] }).has("bench")).toBe(false);
  });

  it("does not flag a player never in his current club's squad", () => {
    const current = new Map<string, CurrentClub>([
      ["x", { teamCode: "PAR", since: null }],
      ["ghost", { teamCode: "PAR", since: null }],
    ]);
    expect(outSince({}, current).has("ghost")).toBe(false);
  });

  it("ignores a former club after a transfer", () => {
    // He left PAR after round 1 and has not played for RED yet.
    const current = new Map<string, CurrentClub>([
      ["x", { teamCode: "PAR", since: null }],
      ["moved", { teamCode: "RED", since: Date.UTC(2026, 9, 2) }],
    ]);
    expect(outSince({ moved: [1] }, current).has("moved")).toBe(false);
  });

  it("counts the regular threshold from the contract start", () => {
    // Signed before round 3, in the squad for round 3, out for rounds 4-6.
    const current = new Map<string, CurrentClub>([
      ["x", { teamCode: "PAR", since: null }],
      ["new", { teamCode: "PAR", since: Date.UTC(2026, 9, 3) }],
    ]);
    expect(outSince({ new: [3] }, current).get("new")).toBe(date(4));
  });
});
