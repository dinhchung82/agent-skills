/**
 * Time-token ký HMAC + nonce single-use, phát từ server khi render form.
 *
 * - Thay cho `formLoadedAt` do client gửi → client không giả mạo mốc thời gian.
 * - Mỗi token mang một nonce ngẫu nhiên; sau khi submit thành công, nonce bị
 *   đánh dấu đã dùng → không thể replay token để gửi hàng loạt.
 *
 * LƯU Ý: nonce store mặc định là in-memory (giống rate limit) nên KHÔNG chia sẻ
 * giữa các instance serverless — prod cần cắm store dùng chung qua
 * `setNonceStore` (vd Redis/Upstash) để single-use có hiệu lực toàn cục.
 */
import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";

const MIN_FILL_MS = 2000; // điền nhanh hơn 2s → nghi bot
const MAX_AGE_MS = 30 * 60 * 1000; // token sống tối đa 30 phút

export type TokenResult =
  | "ok"
  | "malformed"
  | "bad_signature"
  | "too_fast"
  | "expired"
  | "replayed";

export interface NonceStore {
  isUsed(nonce: string, now: number): boolean;
  markUsed(nonce: string, now: number, ttlMs: number): void;
  reset(): void;
}

export class InMemoryNonceStore implements NonceStore {
  private used = new Map<string, number>(); // nonce -> expiresAt
  private maxKeys: number;

  constructor(maxKeys = 10_000) {
    this.maxKeys = maxKeys;
  }

  isUsed(nonce: string, now: number): boolean {
    const exp = this.used.get(nonce);
    return exp !== undefined && exp > now;
  }

  markUsed(nonce: string, now: number, ttlMs: number): void {
    if (this.used.size > this.maxKeys) this.sweep(now);
    this.used.set(nonce, now + ttlMs);
  }

  private sweep(now: number): void {
    for (const [key, exp] of this.used) if (exp <= now) this.used.delete(key);
  }

  reset(): void {
    this.used.clear();
  }
}

let nonceStore: NonceStore = new InMemoryNonceStore();

/** Hoán nonce store mặc định (vd Redis) cho production. */
export function setNonceStore(next: NonceStore): void {
  nonceStore = next;
}

/** Reset store mặc định (dùng cho test). */
export function resetNonceStore(): void {
  nonceStore.reset();
}

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

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function issueFormToken(now: number = Date.now()): string {
  const nonce = randomUUID();
  const payload = `${now}.${nonce}`;
  return `${payload}.${sign(payload)}`;
}

interface ParsedToken {
  ts: number;
  nonce: string;
  sig: string;
}

function parse(token: unknown): ParsedToken | null {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [tsStr, nonce, sig] = parts;
  const ts = Number(tsStr);
  if (!Number.isFinite(ts) || nonce.length === 0 || sig.length === 0) {
    return null;
  }
  return { ts, nonce, sig };
}

/**
 * Kiểm tra token: định dạng, chữ ký, tuổi, và nonce chưa bị dùng.
 * KHÔNG tiêu thụ nonce — gọi `consumeFormToken` sau khi submit thành công.
 */
export function verifyFormToken(
  token: unknown,
  now: number = Date.now(),
): TokenResult {
  const parsed = parse(token);
  if (!parsed) return "malformed";

  const expected = sign(`${parsed.ts}.${parsed.nonce}`);
  const a = Buffer.from(parsed.sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return "bad_signature";

  const age = now - parsed.ts;
  if (age < MIN_FILL_MS) return "too_fast";
  if (age > MAX_AGE_MS) return "expired";
  if (nonceStore.isUsed(parsed.nonce, now)) return "replayed";
  return "ok";
}

/** Đánh dấu token đã dùng (gọi sau khi lead được xử lý thành công). */
export function consumeFormToken(token: unknown, now: number = Date.now()): void {
  const parsed = parse(token);
  if (parsed) nonceStore.markUsed(parsed.nonce, now, MAX_AGE_MS);
}
