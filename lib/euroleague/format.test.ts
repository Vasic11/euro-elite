import { describe, expect, it } from "vitest";

import { formatPersonName, normalizeForSearch } from "./format";

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
