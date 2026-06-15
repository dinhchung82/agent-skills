import { describe, it, expect } from "vitest";
import { scoreLead, tierForPoints, isTimeframe } from "@/lib/scoring";

describe("tierForPoints (boundaries)", () => {
  it("39 -> cold, 40 -> warm", () => {
    expect(tierForPoints(39)).toBe("cold");
    expect(tierForPoints(40)).toBe("warm");
  });

  it("69 -> warm, 70 -> hot", () => {
    expect(tierForPoints(69)).toBe("warm");
    expect(tierForPoints(70)).toBe("hot");
  });
});

describe("scoreLead", () => {
  it("big amount + soon is hot", () => {
    const r = scoreLead({ investmentRange: "over_1b", timeframe: "within_1m" });
    expect(r.points).toBe(90);
    expect(r.tier).toBe("hot");
  });

  it("timeframe changes the tier (not a flat bonus)", () => {
    const soon = scoreLead({ investmentRange: "500m_1b", timeframe: "within_1m" });
    const later = scoreLead({ investmentRange: "500m_1b", timeframe: "over_6m" });
    expect(soon.points).toBeGreaterThan(later.points);
    expect(soon.tier).toBe("hot"); // 45 + 30 = 75
    expect(later.tier).toBe("warm"); // 45 + 0 = 45
  });

  it("small amount + far out is cold", () => {
    const r = scoreLead({ investmentRange: "under_100m", timeframe: "over_6m" });
    expect(r.points).toBe(10);
    expect(r.tier).toBe("cold");
  });

  it("unknown values score 0 (cold)", () => {
    const r = scoreLead({
      // @ts-expect-error testing unknown value at runtime
      investmentRange: "bogus",
      // @ts-expect-error testing unknown value at runtime
      timeframe: "bogus",
    });
    expect(r.points).toBe(0);
    expect(r.tier).toBe("cold");
  });
});

describe("isTimeframe", () => {
  it("accepts known values, rejects others", () => {
    expect(isTimeframe("within_1m")).toBe(true);
    expect(isTimeframe("over_6m")).toBe(true);
    expect(isTimeframe("someday")).toBe(false);
    expect(isTimeframe(undefined)).toBe(false);
  });
});
