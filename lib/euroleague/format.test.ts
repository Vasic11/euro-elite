import { describe, expect, it } from "vitest";

import {
  formatDayMonth,
  formatGameDate,
  formatPersonName,
  normalizeForSearch,
  splitName,
} from "./format";

describe("formatPersonName", () => {
  it('pretvara "PREZIME, IME" u "Ime Prezime"', () => {
    expect(formatPersonName("DE COLO, NANDO")).toBe("Nando De Colo");
  });

  it("zadržava srpska slova i crtice", () => {
    expect(formatPersonName("PETRUŠEV, FILIP")).toBe("Filip Petrušev");
    expect(formatPersonName("HAYES-DAVIS, NIGEL")).toBe("Nigel Hayes-Davis");
  });
});

describe("normalizeForSearch", () => {
  it("uklanja kvačice", () => {
    expect(normalizeForSearch("Petrušev")).toBe("petrusev");
  });

  it('"đ" se poklapa i sa "dj" i sa "d"', () => {
    const name = normalizeForSearch("Đorđević");
    expect(name).toBe(normalizeForSearch("djordjevic"));
    expect(name).toBe(normalizeForSearch("dordevic"));
  });
});

describe("splitName", () => {
  it("prva reč je ime, ostalo prezime", () => {
    expect(splitName("Sasha Vezenkov")).toEqual({ first: "Sasha", last: "Vezenkov" });
    expect(splitName("Nando De Colo")).toEqual({ first: "Nando", last: "De Colo" });
  });

  it("jedno ime ide u prezime", () => {
    expect(splitName("Neymar")).toEqual({ first: "", last: "Neymar" });
  });
});

describe("formatGameDate", () => {
  it("prikazuje beogradsko vreme", () => {
    // 18:00 UTC u novembru je 19:00 u Beogradu (UTC+1)
    expect(formatGameDate("2026-11-24T18:00:00Z")).toBe("Tue 24 Nov, 19:00");
  });

  it('writes September as "Sep", not "Sept"', () => {
    // 18:00 UTC in September is 20:00 in Belgrade (UTC+2)
    expect(formatGameDate("2026-09-29T18:00:00Z")).toBe("Tue 29 Sep, 20:00");
  });
});

describe("formatDayMonth", () => {
  it("uses a three-letter month in Belgrade time", () => {
    expect(formatDayMonth("2026-09-29T18:00:00Z")).toBe("29 Sep");
    // 23:30 UTC on 30 Sep is already 1 Oct in Belgrade
    expect(formatDayMonth("2026-09-30T23:30:00Z")).toBe("1 Oct");
  });
});
