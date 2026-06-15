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
});
