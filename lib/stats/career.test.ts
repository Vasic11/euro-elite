import { describe, expect, it } from "vitest";

import { parseApiDate } from "@/lib/sync/rows";

import { careerStints, formatStintDate, type Stint } from "./career";

const club = (code: string) => ({ code, name: code, shortName: code, crestUrl: null });

/** Zoneless API string -> epoch ms, the same way the sync stores it. */
const at = (value: string) => parseApiDate(value)!.getTime();

const stint = (code: string, over: Partial<Stint> = {}): Stint => ({
  role: "J",
  active: true,
  startDate: null,
  endDate: null,
  club: club(code),
  ...over,
});

// Chris Silva 2026-27, as the API sends it.
const ulk = stint("ULK", {
  active: false,
  startDate: at("2026-08-12T07:49:43.15"),
  endDate: at("2026-11-16T14:38:36.156"),
});
const par = stint("PAR", {
  startDate: at("2026-11-16T14:40:15.331"),
  endDate: at("2027-06-30T00:00:00"),
});

describe("careerStints", () => {
  it("orders clubs by start date, whatever the input order (ULK → PAR)", () => {
    const career = careerStints([par, ulk]);
    expect(career.map((s) => s.club.code)).toEqual(["ULK", "PAR"]);
  });

  it("marks only the active contract as current, with no end", () => {
    const [former, now] = careerStints([ulk, par]);
    expect(former).toMatchObject({ current: false, to: ulk.endDate });
    expect(now).toMatchObject({ current: true, from: par.startDate, to: null });
  });

  it("is empty with one club, even across several contracts", () => {
    expect(careerStints([par])).toEqual([]);
    expect(
      careerStints([
        stint("PAR", { active: false, startDate: at("2026-08-01T00:00:00") }),
        stint("PAR", { startDate: at("2026-12-01T00:00:00") }),
      ]),
    ).toEqual([]);
  });

  it("merges back-to-back contracts with the same club", () => {
    const career = careerStints([
      stint("ULK", { active: false, startDate: at("2026-08-01T00:00:00") }),
      stint("ULK", {
        active: false,
        startDate: at("2026-10-01T00:00:00"),
        endDate: at("2026-11-01T00:00:00"),
      }),
      stint("PAR", { startDate: at("2026-11-02T00:00:00") }),
    ]);
    expect(career).toHaveLength(2);
    expect(career[0]).toMatchObject({
      from: at("2026-08-01T00:00:00"),
      to: at("2026-11-01T00:00:00"),
    });
  });

  it("puts a contract without a start date first", () => {
    const career = careerStints([par, stint("ULK", { active: false })]);
    expect(career.map((s) => s.club.code)).toEqual(["ULK", "PAR"]);
  });

  it("ends a former club on the next club's start when its end is missing or later", () => {
    const next = at("2026-11-16T14:40:15.331");
    expect(careerStints([{ ...ulk, endDate: null }, par])[0].to).toBe(next);
    // Some old contracts keep the season end as their end date.
    expect(
      careerStints([{ ...ulk, endDate: at("2027-06-30T00:00:00") }, par])[0].to,
    ).toBe(next);
  });

  it("ignores coach contracts", () => {
    expect(careerStints([par, { ...ulk, role: "E" }])).toEqual([]);
  });
});

describe("formatStintDate", () => {
  it("keeps the day of a zoneless date late in the evening", () => {
    // 23:30 with no zone is stored as UTC; in Belgrade it would already be the 17th.
    expect(formatStintDate(at("2026-11-16T23:30:00"))).toBe("16 Nov 2026");
  });

  it('writes September as "Sep", not "Sept"', () => {
    expect(formatStintDate(at("2026-09-04T13:10:29.86"))).toBe("4 Sep 2026");
  });

  it("keeps the day of a midnight contract end", () => {
    expect(formatStintDate(at("2027-06-30T00:00:00"))).toBe("30 Jun 2027");
  });
});
