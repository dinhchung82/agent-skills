/** Rate limit in-memory đơn giản theo IP (demo). Prod nên dùng Redis/edge. */

const LIMIT = 5; // số submit tối đa
const WINDOW_MS = 10 * 60 * 1000; // trong 10 phút

const hits = new Map<string, number[]>();

/** Trả true nếu IP còn quota (và ghi nhận lần này); false nếu vượt giới hạn. */
export function checkRateLimit(ip: string, now: number = Date.now()): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) {
    hits.set(ip, recent);
    return false;
  }
  recent.push(now);
  hits.set(ip, recent);
  return true;
}

/** Dùng trong test để xoá trạng thái giữa các case. */
export function resetRateLimit(): void {
  hits.clear();
}
