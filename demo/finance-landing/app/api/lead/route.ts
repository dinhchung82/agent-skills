import {
  isValidEmail,
  isDisposableEmail,
  isValidVNPhone,
} from "@/lib/validation";
import { scoreLead, isInvestmentRange, isTimeframe } from "@/lib/scoring";
import { checkRateLimit } from "@/lib/rateLimit";
import { verifyFormToken } from "@/lib/formToken";
import { pushLead } from "@/lib/sheet";

// Giới hạn độ dài trường để chống lạm dụng / payload phình to.
const MAX = { name: 100, email: 254, phone: 20 } as const;

function bad(reason: string) {
  return Response.json({ ok: false, error: reason }, { status: 400 });
}

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("invalid_json");
  }

  const {
    name,
    email,
    phone,
    investmentRange,
    timeframe,
    consent,
    company_website: honeypot,
    formToken,
  } = body as Record<string, unknown>;

  // 1) Honeypot: người thật để trống (bắt cả giá trị non-string do bot gửi).
  if (honeypot != null && String(honeypot).trim() !== "") {
    return bad("bot_detected");
  }

  // 2) Time-trap: token ký từ server (client không giả mạo được mốc thời gian).
  const tokenResult = verifyFormToken(formToken);
  if (tokenResult !== "ok") return bad(tokenResult);

  // 3) Rate limit theo IP.
  if (!checkRateLimit(clientIp(req))) {
    return Response.json(
      { ok: false, error: "rate_limited" },
      { status: 429 },
    );
  }

  // 4) Validate dữ liệu (server-side, không tin client).
  if (consent !== true) return bad("consent_required");
  if (typeof name !== "string" || name.trim().length < 2 || name.length > MAX.name)
    return bad("invalid_name");
  if (typeof email !== "string" || email.length > MAX.email || !isValidEmail(email))
    return bad("invalid_email");
  if (isDisposableEmail(email)) return bad("disposable_email");
  if (typeof phone !== "string" || phone.length > MAX.phone || !isValidVNPhone(phone))
    return bad("invalid_phone");
  if (!isInvestmentRange(investmentRange)) return bad("invalid_investment_range");
  if (!isTimeframe(timeframe)) return bad("invalid_timeframe");

  // 5) Chấm điểm.
  const score = scoreLead({ investmentRange, timeframe });

  // 6) Đẩy mọi lead hợp lệ kèm điểm sang Sheet. Không để lead thất lạc nếu
  //    Sheet tạm lỗi: log (không kèm PII) và vẫn xác nhận cho người dùng.
  try {
    await pushLead({
      name: name.trim(),
      email: email.trim(),
      phone: phone.replace(/\s+/g, ""),
      investmentRange,
      timeframe,
      submittedAt: new Date().toISOString(),
      ...score,
    });
  } catch (err) {
    console.error("lead sheet push failed:", (err as Error).message);
  }

  return Response.json({ ok: true, ...score }, { status: 200 });
}
