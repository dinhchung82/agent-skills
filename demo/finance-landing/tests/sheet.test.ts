import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { pushLead, type LeadRecord } from "@/lib/sheet";

const lead: LeadRecord = {
  name: "An Nguyen",
  email: "an@gmail.com",
  phone: "0912345678",
  investmentRange: "over_1b",
  submittedAt: "2026-06-15T00:00:00.000Z",
  points: 90,
  tier: "hot",
};

const ORIGINAL = process.env.SHEET_WEBHOOK_URL;

afterEach(() => {
  process.env.SHEET_WEBHOOK_URL = ORIGINAL;
  vi.unstubAllGlobals();
});

describe("pushLead", () => {
  beforeEach(() => {
    process.env.SHEET_WEBHOOK_URL = "https://script.example/exec";
  });

  it("throws when webhook URL is not configured", async () => {
    delete process.env.SHEET_WEBHOOK_URL;
    await expect(pushLead(lead)).rejects.toThrow(/not configured/);
  });

  it("POSTs the lead as JSON to the webhook URL", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await pushLead(lead);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://script.example/exec");
    expect((init as RequestInit).method).toBe("POST");
    expect(JSON.parse((init as RequestInit).body as string)).toMatchObject({
      email: "an@gmail.com",
      tier: "hot",
      points: 90,
    });
  });

  it("throws when the webhook responds with an error status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 500 })),
    );
    await expect(pushLead(lead)).rejects.toThrow(/status 500/);
  });
});
