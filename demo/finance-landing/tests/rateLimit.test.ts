import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  resetRateLimit,
  setRateLimitStore,
  InMemoryRateLimitStore,
  type RateLimitStore,
} from "@/lib/rateLimit";

beforeEach(() => {
  // Khôi phục store mặc định giữa các test.
  setRateLimitStore(new InMemoryRateLimitStore());
  resetRateLimit();
});

describe("checkRateLimit (default in-memory)", () => {
  it("allows up to the limit then blocks", () => {
    const ip = "1.1.1.1";
    for (let i = 0; i < 5; i++) expect(checkRateLimit(ip)).toBe(true);
    expect(checkRateLimit(ip)).toBe(false);
  });

  it("frees quota after the window passes", () => {
    const ip = "2.2.2.2";
    const t0 = 1_000_000;
    for (let i = 0; i < 5; i++) checkRateLimit(ip, t0);
    expect(checkRateLimit(ip, t0)).toBe(false);
    // 11 phút sau → cửa sổ trôi qua.
    expect(checkRateLimit(ip, t0 + 11 * 60 * 1000)).toBe(true);
  });
});

describe("InMemoryRateLimitStore memory bound", () => {
  it("sweeps stale keys instead of growing unbounded", () => {
    const store = new InMemoryRateLimitStore({
      limit: 5,
      windowMs: 1000,
      maxKeys: 2,
    });
    const t0 = 0;
    // Tạo 3 key ở t0 (vượt maxKeys=2).
    store.check("a", t0);
    store.check("b", t0);
    store.check("c", t0);
    // Sau khi cửa sổ trôi qua, một check mới phải dọn các key cũ.
    store.check("d", t0 + 5000);
    expect(store.size).toBeLessThanOrEqual(2);
  });
});

describe("setRateLimitStore (pluggable for prod Redis)", () => {
  it("delegates to the injected store", () => {
    const calls: string[] = [];
    const fake: RateLimitStore = {
      check: (key) => {
        calls.push(key);
        return false;
      },
      reset: () => calls.push("reset"),
    };
    setRateLimitStore(fake);
    expect(checkRateLimit("9.9.9.9")).toBe(false);
    resetRateLimit();
    expect(calls).toEqual(["9.9.9.9", "reset"]);
  });
});
