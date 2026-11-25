import { describe, expect, it } from "vitest";

import { describeError } from "./errors";
import { syncFreshness } from "./health";

const now = new Date("2026-11-25T12:00:00Z");
const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);

describe("syncFreshness", () => {
  it("fails when there is no successful sync", () => {
    expect(syncFreshness(null, now)).toMatchObject({ ok: false });
  });

  it("is ok for a sync 35 hours ago", () => {
    expect(syncFreshness(hoursAgo(35), now)).toEqual({ name: "sync", ok: true });
  });

  it("fails for a sync 37 hours ago and says how old it is", () => {
    const result = syncFreshness(hoursAgo(37), now);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("37.0 h");
  });
});

describe("describeError", () => {
  it("never returns a connection string", () => {
    const error = new Error(
      "connect failed: postgresql://user:pw@host/db?sslmode=require",
    );
    expect(describeError(error)).toBe("connect failed: [redacted]");
  });
});
