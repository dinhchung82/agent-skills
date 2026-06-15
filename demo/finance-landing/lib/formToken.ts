/**
 * Time-token ký HMAC, phát từ server khi render form.
 * Thay cho `formLoadedAt` do client gửi — client không thể giả mạo mốc thời gian.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

const MIN_FILL_MS = 2000; // điền nhanh hơn 2s → nghi bot
const MAX_AGE_MS = 30 * 60 * 1000; // token sống tối đa 30 phút

export type TokenResult =
  | "ok"
  | "malformed"
  | "bad_signature"
  | "too_fast"
  | "expired";

function secret(): string {
  const s = process.env.FORM_SECRET;
  if (process.env.NODE_ENV === "production") {
    // Fail-closed: không cho prod chạy với secret công khai.
    if (!s || s.length < 32) {
      throw new Error(
        "FORM_SECRET must be set to at least 32 characters in production",
      );
    }
    return s;
  }
  // Dev/test fallback để chạy ngay (KHÔNG an toàn cho production).
  return s ?? "dev-insecure-form-secret";
}

function sign(ts: number): string {
  return createHmac("sha256", secret()).update(String(ts)).digest("hex");
}

export function issueFormToken(now: number = Date.now()): string {
  return `${now}.${sign(now)}`;
}

export function verifyFormToken(
  token: unknown,
  now: number = Date.now(),
): TokenResult {
  if (typeof token !== "string") return "malformed";
  const dot = token.indexOf(".");
  if (dot === -1) return "malformed";

  const ts = Number(token.slice(0, dot));
  const sig = token.slice(dot + 1);
  if (!Number.isFinite(ts) || sig.length === 0) return "malformed";

  const expected = sign(ts);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return "bad_signature";

  const age = now - ts;
  if (age < MIN_FILL_MS) return "too_fast";
  if (age > MAX_AGE_MS) return "expired";
  return "ok";
}
