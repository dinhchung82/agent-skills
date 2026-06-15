/**
 * Rate limit theo key (thường là IP).
 *
 * Mặc định dùng store in-memory cho demo. LƯU Ý: trên serverless (Vercel),
 * mỗi invocation có thể là instance mới nên store in-memory không chia sẻ
 * trạng thái — prod cần cắm một store dùng chung (Redis/Upstash) qua
 * `setRateLimitStore`.
 */

export interface RateLimitStore {
  /** Trả true nếu key còn quota (và ghi nhận lần này); false nếu vượt. */
  check(key: string, now: number): boolean;
  /** Xoá toàn bộ trạng thái (dùng cho test / reset). */
  reset(): void;
}

interface StoreOptions {
  limit: number;
  windowMs: number;
  maxKeys: number;
}

const DEFAULTS: StoreOptions = {
  limit: 5, // tối đa 5 submit
  windowMs: 10 * 60 * 1000, // trong 10 phút
  maxKeys: 10_000, // ngưỡng kích hoạt dọn rác
};

export class InMemoryRateLimitStore implements RateLimitStore {
  private hits = new Map<string, number[]>();
  private opts: StoreOptions;

  constructor(opts: Partial<StoreOptions> = {}) {
    this.opts = { ...DEFAULTS, ...opts };
  }

  check(key: string, now: number = Date.now()): boolean {
    // Dọn key hết hạn khi map phình quá ngưỡng → tránh rò rỉ bộ nhớ.
    if (this.hits.size > this.opts.maxKeys) this.sweep(now);

    const recent = (this.hits.get(key) ?? []).filter(
      (t) => now - t < this.opts.windowMs,
    );
    if (recent.length >= this.opts.limit) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }

  private sweep(now: number): void {
    for (const [key, timestamps] of this.hits) {
      const live = timestamps.filter((t) => now - t < this.opts.windowMs);
      if (live.length === 0) this.hits.delete(key);
      else this.hits.set(key, live);
    }
  }

  reset(): void {
    this.hits.clear();
  }

  get size(): number {
    return this.hits.size;
  }
}

let store: RateLimitStore = new InMemoryRateLimitStore();

/** Hoán store mặc định bằng triển khai khác (vd Redis) cho production. */
export function setRateLimitStore(next: RateLimitStore): void {
  store = next;
}

export function checkRateLimit(ip: string, now: number = Date.now()): boolean {
  return store.check(ip, now);
}

export function resetRateLimit(): void {
  store.reset();
}
