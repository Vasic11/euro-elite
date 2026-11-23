import { afterEach, describe, expect, it, vi } from "vitest";

import { runHealthChecks } from "./health";

const club = {
  code: "RED",
  name: "Crvena Zvezda",
  editorialName: "Crvena",
  images: null,
};
const side = { club, score: 80 };
const responses: Record<string, unknown> = {
  "/clubs/RED/people": [],
  "/clubs": { data: [club] },
  "/games/7/stats": { local: { players: [] }, road: { players: [] } },
  "/games": {
    data: [
      {
        gameCode: 7,
        round: 1,
        played: true,
        utcDate: "2026-10-01T18:00:00Z",
        local: side,
        road: side,
      },
    ],
  },
};

/** Lažni fetch: vraća odgovor po kraju putanje, ili 500 ako je putanja u `failing`. */
function stubFetch(failing: string[] = []) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: URL) => {
      const key = Object.keys(responses).find((k) => url.pathname.endsWith(k))!;
      if (failing.includes(key)) return new Response("error", { status: 500 });
      return Response.json(responses[key]);
    }),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("runHealthChecks", () => {
  it("proverava klubove, raspored, roster i box score", async () => {
    stubFetch();
    const checks = await runHealthChecks();
    expect(checks.map((c) => c.name)).toEqual([
      "clubs",
      "schedule",
      "roster RED",
      "box score 7",
    ]);
    expect(checks.every((c) => c.ok)).toBe(true);
  });

  it("prijavljuje endpoint koji ne radi", async () => {
    stubFetch(["/games"]);
    const checks = await runHealthChecks();
    const schedule = checks.find((c) => c.name === "schedule")!;
    expect(schedule.ok).toBe(false);
    expect(schedule.error).toContain("500");
  });

  it("prijavljuje promenjen oblik odgovora", async () => {
    stubFetch();
    responses["/clubs"] = { items: [club] }; // API je preimenovao "data" u "items"
    vi.spyOn(console, "error").mockImplementation(() => {});
    const checks = await runHealthChecks();
    expect(checks.find((c) => c.name === "clubs")?.ok).toBe(false);
    responses["/clubs"] = { data: [club] };
  });

  it("uzima box score najnovije utakmice, iako API vraća raspored od novijih ka starijim", async () => {
    const games = responses["/games"];
    responses["/games"] = {
      data: [
        {
          gameCode: 9,
          round: 2,
          played: true,
          utcDate: "2026-10-08T18:00:00Z",
          local: side,
          road: side,
        },
        {
          gameCode: 7,
          round: 1,
          played: true,
          utcDate: "2026-10-01T18:00:00Z",
          local: side,
          road: side,
        },
      ],
    };
    responses["/games/9/stats"] = { local: { players: [] }, road: { players: [] } };
    stubFetch();
    const checks = await runHealthChecks();
    expect(checks.at(-1)?.name).toBe("box score 9");
    responses["/games"] = games;
  });
});
