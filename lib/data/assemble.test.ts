import { describe, expect, it } from "vitest";

import { type BoxLine, totalsFromLines } from "@/lib/stats/aggregate";

import { buildCoaches, buildPlayers, latestActive } from "./assemble";
import type { RosterEntry } from "./types";

/** A box line of a player in RED's squad who did not get on the court. */
const boxLine = (playerCode: string): BoxLine => ({
  playerCode,
  teamCode: "RED",
  started: false,
  seconds: 0,
  points: 0,
  twoMade: 0,
  twoAttempted: 0,
  threeMade: 0,
  threeAttempted: 0,
  ftMade: 0,
  ftAttempted: 0,
  rebounds: 0,
  assists: 0,
  steals: 0,
  blocks: 0,
  turnovers: 0,
  pir: 0,
});

const club = (code: string) => ({ code, name: code, shortName: code, crestUrl: null });

const entry = (over: Partial<RosterEntry>): RosterEntry => ({
  role: "J",
  active: true,
  startDate: null,
  endDate: null,
  club: club("RED"),
  personCode: "P1",
  name: "Player One",
  jerseyNumber: null,
  position: null,
  country: null,
  heightCm: null,
  weightKg: null,
  birthDate: null,
  imageUrl: null,
  ...over,
});

describe("latestActive", () => {
  it("keeps the stint with the latest start date after a transfer", () => {
    const result = latestActive(
      [
        entry({ club: club("PAR"), startDate: Date.UTC(2026, 6, 1) }),
        entry({ club: club("RED"), startDate: Date.UTC(2026, 10, 1) }),
      ],
      "J",
    );
    expect(result.map((e) => e.club.code)).toEqual(["RED"]);
  });

  it("prefers a dated stint over one without a date", () => {
    const result = latestActive(
      [
        entry({ club: club("RED"), startDate: Date.UTC(2026, 6, 1) }),
        entry({ club: club("PAR") }),
      ],
      "J",
    );
    expect(result.map((e) => e.club.code)).toEqual(["RED"]);
  });

  it("skips inactive entries and other roles", () => {
    const result = latestActive(
      [entry({ active: false }), entry({ personCode: "C1", role: "E" })],
      "J",
    );
    expect(result).toEqual([]);
  });
});

describe("buildPlayers", () => {
  it("sorts players with equal PIR by name, whatever the input order", () => {
    const roster = [
      entry({ personCode: "B", name: "Zoran" }),
      entry({ personCode: "A", name: "Aleksa" }),
    ];
    const players = buildPlayers({ roster, totals: [], squads: [] });
    expect(players.map((p) => p.name)).toEqual(["Aleksa", "Zoran"]);
  });

  it("sets the previous club only after a transfer this season", () => {
    const roster = [
      entry({ personCode: "S", club: club("ULK"), active: false, startDate: 1 }),
      entry({ personCode: "S", club: club("PAR"), startDate: 2 }),
      entry({ personCode: "W", club: club("PAR"), startDate: 1 }),
    ];
    const players = buildPlayers({ roster, totals: [], squads: [] });
    const byCode = new Map(players.map((p) => [p.code, p]));
    expect(byCode.get("S")?.previousClub?.code).toBe("ULK");
    expect(byCode.get("W")?.previousClub).toBeNull();
  });

  it("shows a long absence as Out since, not also as a missed last game", () => {
    // W is in the squad for games 1-4 of 7, so he also counts as a regular
    // who missed the last game; only the Out since badge should remain.
    const dates = [1, 2, 3, 4, 5, 6, 7].map((d) => `2026-10-0${d}T18:00:00.000Z`);
    const totals = totalsFromLines([
      ...dates.slice(0, 4).map((date) => ({ ...boxLine("W"), date })),
      ...dates.map((date) => ({ ...boxLine("X"), date })),
    ]);
    const players = buildPlayers({
      roster: [entry({ personCode: "W" }), entry({ personCode: "X", name: "X" })],
      totals,
      squads: [{ teamCode: "RED", gameDates: dates, lastSquad: ["X"] }],
    });
    const willis = players.find((p) => p.code === "W");
    expect(willis).toMatchObject({ outSince: dates[4], missedLastGame: false });
  });
});

describe("buildCoaches", () => {
  it("maps the head coach to his club", () => {
    const coaches = buildCoaches([entry({ personCode: "C1", role: "E", name: "Coach" })]);
    expect(coaches.get("RED")).toEqual({ code: "C1", name: "Coach", imageUrl: null });
  });
});
