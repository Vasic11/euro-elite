import { describe, expect, it } from "vitest";

import { toTeamSummary } from "./mappers";

const club = (code: string, editorialName: string) => ({
  code,
  name: `${editorialName} Full Name`,
  editorialName,
  abbreviatedName: null,
  tvCode: null,
  images: null,
});

describe("toTeamSummary", () => {
  it("zamenjuje previše skraćeno ime iz API-ja", () => {
    expect(toTeamSummary(club("RED", "Crvena")).shortName).toBe("Crvena Zvezda");
  });

  it("za nepoznat klub koristi ime iz API-ja", () => {
    expect(toTeamSummary(club("NEW", "Newcomers")).shortName).toBe("Newcomers");
  });
});
