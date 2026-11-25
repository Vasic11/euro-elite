import { describe, expect, it } from "vitest";

import { teamSummary } from "./mappers";

const club = (code: string, editorialName: string) => ({
  code,
  name: `${editorialName} Full Name`,
  editorialName,
  abbreviatedName: null,
  crestUrl: null,
});

describe("teamSummary", () => {
  it("zamenjuje previše skraćeno ime iz API-ja", () => {
    expect(teamSummary(club("RED", "Crvena")).shortName).toBe("Crvena Zvezda");
  });

  it("za nepoznat klub koristi ime iz API-ja", () => {
    expect(teamSummary(club("NEW", "Newcomers")).shortName).toBe("Newcomers");
  });
});
