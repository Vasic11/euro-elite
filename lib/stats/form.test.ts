import { describe, expect, it } from "vitest";

import { computeForm, trendFor } from "./form";

describe("computeForm", () => {
  it("uzima samo poslednjih N utakmica", () => {
    // prosek poslednje 3: (10 + 20 + 30) / 3 = 20
    const form = computeForm([0, 0, 10, 20, 30], 3, 12);
    expect(form?.games).toBe(3);
    expect(form?.formPir).toBe(20);
    expect(form?.delta).toBe(8);
  });

  it("radi i kad je odigrano manje utakmica od prozora", () => {
    const form = computeForm([10, 14], 5, 12);
    expect(form?.games).toBe(2);
    expect(form?.formPir).toBe(12);
  });

  it("vraća null ako igrač nije igrao", () => {
    expect(computeForm([], 5, 0)).toBeNull();
  });
});

describe("trendFor", () => {
  it("koristi 15% proseka kao prag kad je prosek veliki", () => {
    // prosek 20 -> prag 3
    expect(trendFor(3, 20)).toBe("up");
    expect(trendFor(2.9, 20)).toBe("steady");
    expect(trendFor(-3, 20)).toBe("down");
  });

  it("koristi minimum 1.5 kad je prosek mali", () => {
    // prosek 4 -> 15% je 0.6, ali važi minimum 1.5
    expect(trendFor(1, 4)).toBe("steady");
    expect(trendFor(1.5, 4)).toBe("up");
  });
});
