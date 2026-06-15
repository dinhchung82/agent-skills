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
 * POST lead dưới dạng JSON tới SHEET_WEBHOOK_URL.
 * Không log PII. Ném lỗi nếu thiếu cấu hình hoặc webhook trả lỗi.
 */
export async function pushLead(lead: LeadRecord): Promise<void> {
  const url = process.env.SHEET_WEBHOOK_URL;
  if (!url) {
    throw new Error("SHEET_WEBHOOK_URL is not configured");
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(lead),
  });
  if (!res.ok) {
    throw new Error(`Sheet webhook failed with status ${res.status}`);
  }
}
