import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock lớp đẩy Google Sheet — không gọi mạng thật trong test.
vi.mock("@/lib/sheet", () => ({
  pushLead: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "@/app/api/lead/route";
import { pushLead } from "@/lib/sheet";
import { resetRateLimit } from "@/lib/rateLimit";

function buildReq(payload: Record<string, unknown>, ip = "1.2.3.4") {
  return new Request("http://localhost/api/lead", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(payload),
  });
}

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: "An Nguyen",
    email: "an@gmail.com",
    phone: "0912345678",
    investmentRange: "over_1b",
    consent: true,
    company_website: "", // honeypot để trống
    formLoadedAt: Date.now() - 3000, // điền đủ lâu
    ...overrides,
  };
}

beforeEach(() => {
  resetRateLimit();
  vi.mocked(pushLead).mockClear();
});

describe("POST /api/lead", () => {
  it("accepts a valid lead, returns score, pushes to sheet", async () => {
    const res = await POST(buildReq(validPayload()));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tier).toBe("hot");
    expect(typeof body.points).toBe("number");
    expect(pushLead).toHaveBeenCalledTimes(1);
  });

  it("rejects when honeypot is filled, does not push", async () => {
    const res = await POST(
      buildReq(validPayload({ company_website: "http://spam.example" })),
    );
    expect(res.status).toBe(400);
    expect(pushLead).not.toHaveBeenCalled();
  });

  it("rejects submissions that are too fast", async () => {
    const res = await POST(
      buildReq(validPayload({ formLoadedAt: Date.now() })),
    );
    expect(res.status).toBe(400);
    expect(pushLead).not.toHaveBeenCalled();
  });

  it("rejects disposable email", async () => {
    const res = await POST(
      buildReq(validPayload({ email: "x@mailinator.com" })),
    );
    expect(res.status).toBe(400);
    expect(pushLead).not.toHaveBeenCalled();
  });

  it("rejects invalid phone", async () => {
    const res = await POST(buildReq(validPayload({ phone: "123" })));
    expect(res.status).toBe(400);
  });

  it("rejects missing consent", async () => {
    const res = await POST(buildReq(validPayload({ consent: false })));
    expect(res.status).toBe(400);
    expect(pushLead).not.toHaveBeenCalled();
  });

  it("rejects an invalid/unknown investmentRange (C1)", async () => {
    const res = await POST(
      buildReq(validPayload({ investmentRange: "bogus" })),
    );
    expect(res.status).toBe(400);
    expect(pushLead).not.toHaveBeenCalled();
  });

  it("rejects a missing investmentRange (C1)", async () => {
    const res = await POST(
      buildReq(validPayload({ investmentRange: undefined })),
    );
    expect(res.status).toBe(400);
  });

  it("still confirms to the user if the sheet push fails (C2)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(pushLead).mockRejectedValueOnce(new Error("sheet down"));
    const res = await POST(buildReq(validPayload()));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("rate-limits after 5 submissions from same IP", async () => {
    const ip = "9.9.9.9";
    for (let i = 0; i < 5; i++) {
      const ok = await POST(buildReq(validPayload(), ip));
      expect(ok.status).toBe(200);
    }
    const blocked = await POST(buildReq(validPayload(), ip));
    expect(blocked.status).toBe(429);
  });
});
