import { describe, it, expect } from "vitest";
import { scoreLead, tierForPoints } from "@/lib/scoring";

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
  it("high investment alone is hot", () => {
    const r = scoreLead({ investmentRange: "over_1b", validPhone: false });
    expect(r.tier).toBe("hot");
    expect(r.points).toBeGreaterThanOrEqual(70);
  });

  it("valid phone adds points and can lift warm to hot", () => {
    const without = scoreLead({ investmentRange: "500m_1b", validPhone: false });
    const withPhone = scoreLead({ investmentRange: "500m_1b", validPhone: true });
    expect(withPhone.points).toBeGreaterThan(without.points);
    expect(without.tier).toBe("warm");
    expect(withPhone.tier).toBe("hot");
  });

  it("low investment is cold", () => {
    const r = scoreLead({ investmentRange: "under_100m", validPhone: false });
    expect(r.tier).toBe("cold");
  });

  it("unknown range scores 0 points (cold)", () => {
    const r = scoreLead({
      // @ts-expect-error testing unknown value at runtime
      investmentRange: "bogus",
      validPhone: false,
    });
    expect(r.points).toBe(0);
    expect(r.tier).toBe("cold");
  });
});
