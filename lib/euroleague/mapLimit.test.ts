import { describe, expect, it } from "vitest";

import { mapLimit } from "./mapLimit";

describe("mapLimit", () => {
  it("čuva redosled i ne prelazi limit", async () => {
    let running = 0;
    let maxRunning = 0;
    const result = await mapLimit([1, 2, 3, 4, 5, 6], 2, async (n) => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      await new Promise((r) => setTimeout(r, 5));
      running--;
      return n * 10;
    });
    expect(result).toEqual([10, 20, 30, 40, 50, 60]);
    expect(maxRunning).toBe(2);
  });
});
