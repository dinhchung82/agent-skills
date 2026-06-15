import { describe, it, expect } from "vitest";
import { issueFormToken, verifyFormToken } from "@/lib/formToken";

const T0 = 1_700_000_000_000;

describe("formToken", () => {
  it("issues a token that verifies after enough time", () => {
    const token = issueFormToken(T0);
    expect(verifyFormToken(token, T0 + 3000)).toBe("ok");
  });

  it("rejects submissions that are too fast", () => {
    const token = issueFormToken(T0);
    expect(verifyFormToken(token, T0 + 500)).toBe("too_fast");
  });

  it("rejects an expired token", () => {
    const token = issueFormToken(T0);
    expect(verifyFormToken(token, T0 + 31 * 60 * 1000)).toBe("expired");
  });

  it("rejects a tampered timestamp (client cannot forge time)", () => {
    const token = issueFormToken(T0);
    const forged = `${T0 - 5000}.${token.split(".")[1]}`;
    expect(verifyFormToken(forged, T0 + 3000)).toBe("bad_signature");
  });

  it("rejects a tampered signature", () => {
    const token = issueFormToken(T0);
    const [ts] = token.split(".");
    expect(verifyFormToken(`${ts}.deadbeef`, T0 + 3000)).toBe("bad_signature");
  });

  it("rejects malformed input", () => {
    expect(verifyFormToken("nope", T0)).toBe("malformed");
    expect(verifyFormToken(undefined, T0)).toBe("malformed");
  });

  it("fails closed in production without FORM_SECRET (B2)", () => {
    const prevEnv = process.env.NODE_ENV;
    const prevSecret = process.env.FORM_SECRET;
    try {
      // @ts-expect-error overriding readonly for the test
      process.env.NODE_ENV = "production";
      delete process.env.FORM_SECRET;
      expect(() => issueFormToken(T0)).toThrow(/FORM_SECRET/);
    } finally {
      // @ts-expect-error restoring
      process.env.NODE_ENV = prevEnv;
      if (prevSecret === undefined) delete process.env.FORM_SECRET;
      else process.env.FORM_SECRET = prevSecret;
    }
  });
});
