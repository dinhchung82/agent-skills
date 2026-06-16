/** Đẩy lead sang Google Sheet qua Apps Script webhook. */

import type { LeadScore } from "./scoring";

export interface LeadRecord extends LeadScore {
  name: string;
  email: string;
  phone: string;
  investmentRange: string;
  timeframe: string;
  submittedAt: string;
}

/**
 * Vô hiệu hoá CSV/formula injection: nếu giá trị bắt đầu bằng ký tự kích hoạt
 * công thức (= + - @ tab CR LF), thêm dấu nháy đơn ở đầu để Sheets coi là text.
 */
export function sanitizeCell(value: string): string {
  return /^[=+\-@\t\r\n]/.test(value) ? `'${value}` : value;
}

/**
 * POST lead dưới dạng JSON tới SHEET_WEBHOOK_URL.
 * Không log PII. Ném lỗi nếu thiếu cấu hình hoặc webhook trả lỗi.
 */
export async function pushLead(lead: LeadRecord): Promise<void> {
  const url = process.env.SHEET_WEBHOOK_URL;
  if (!url) {
    throw new Error("SHEET_WEBHOOK_URL is not configured");
  }
  // Làm sạch trường free-text trước khi ghi vào bảng tính.
  const safe: LeadRecord = {
    ...lead,
    name: sanitizeCell(lead.name),
    email: sanitizeCell(lead.email),
    phone: sanitizeCell(lead.phone),
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(safe),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) {
    throw new Error(`Sheet webhook failed with status ${res.status}`);
  }
}
