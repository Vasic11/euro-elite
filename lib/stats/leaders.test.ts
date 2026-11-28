import { describe, expect, it } from "vitest";

import type { Player, SeasonAverages } from "@/lib/euroleague/types";

import { leadersFor } from "./leaders";

function player(code: string, games: number, points: number): Player {
  const averages: SeasonAverages = {
    games,
    minutes: 25,
    points,
    rebounds: 0,
    assists: 0,
    steals: 0,
    blocks: 0,
    turnovers: 0,
    pir: 0,
    fieldGoalPct: 0,
    threePointPct: 0,
    freeThrowPct: 0,
  };
  return {
    code,
    name: code,
    jerseyNumber: null,
    position: null,
    country: null,
    heightCm: null,
    weightKg: null,
    birthDate: null,
    imageUrl: null,
    team: { code: "T", name: "T", shortName: "T", crestUrl: null },
    averages,
    missedLastGame: false,
    previousClub: null,
    outSince: null,
  };
}

describe("leadersFor", () => {
  it("sortira po kategoriji", () => {
    const leaders = leadersFor(
      [player("a", 10, 12), player("b", 10, 20), player("c", 10, 15)],
      "points",
    );
    expect(leaders.map((p) => p.code)).toEqual(["b", "c", "a"]);
  });

  it("preskače igrače sa premalo utakmica", () => {
    // najviše utakmica je 10, pa je minimum 5: "x" sa 2 utakmice ne ulazi iako ima 30 poena
    const leaders = leadersFor([player("x", 2, 30), player("a", 10, 12)], "points");
    expect(leaders.map((p) => p.code)).toEqual(["a"]);
  });

  it("preskače igrače bez odigranih utakmica", () => {
    const noGames = { ...player("n", 0, 0), averages: null };
    expect(
      leadersFor([noGames, player("a", 4, 10)], "points").map((p) => p.code),
    ).toEqual(["a"]);
  });
});
