import { describe, expect, it } from "vitest";

import { buildCoaches, buildPlayers, latestActive } from "./assemble";
import type { RosterEntry } from "./types";

const club = (code: string) => ({ code, name: code, shortName: code, crestUrl: null });

const entry = (over: Partial<RosterEntry>): RosterEntry => ({
  role: "J",
  active: true,
  startDate: null,
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
});

describe("buildCoaches", () => {
  it("maps the head coach to his club", () => {
    const coaches = buildCoaches([entry({ personCode: "C1", role: "E", name: "Coach" })]);
    expect(coaches.get("RED")).toEqual({ code: "C1", name: "Coach", imageUrl: null });
  });
});
