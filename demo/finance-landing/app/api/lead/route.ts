import {
  isValidEmail,
  isDisposableEmail,
  isValidVNPhone,
} from "@/lib/validation";
import { scoreLead, type InvestmentRange } from "@/lib/scoring";
import { checkRateLimit } from "@/lib/rateLimit";
import { pushLead } from "@/lib/sheet";

const MIN_FILL_MS = 2000; // điền nhanh hơn 2s → nghi bot

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
    consent,
    company_website: honeypot,
    formLoadedAt,
  } = body as Record<string, unknown>;

  // 1) Honeypot: người thật để trống.
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return bad("bot_detected");
  }

  // 2) Time-trap: điền quá nhanh → bot.
  if (typeof formLoadedAt !== "number" || Date.now() - formLoadedAt < MIN_FILL_MS) {
    return bad("too_fast");
  }

  // 3) Rate limit theo IP.
  if (!checkRateLimit(clientIp(req))) {
    return Response.json(
      { ok: false, error: "rate_limited" },
      { status: 429 },
    );
  }

  // 4) Validate dữ liệu (server-side, không tin client).
  if (consent !== true) return bad("consent_required");
  if (typeof name !== "string" || name.trim().length < 2) return bad("invalid_name");
  if (typeof email !== "string" || !isValidEmail(email)) return bad("invalid_email");
  if (isDisposableEmail(email)) return bad("disposable_email");
  if (typeof phone !== "string" || !isValidVNPhone(phone)) return bad("invalid_phone");

  // 5) Chấm điểm.
  const score = scoreLead({
    investmentRange: investmentRange as InvestmentRange,
    validPhone: true,
  });

  // 6) Đẩy mọi lead hợp lệ kèm điểm sang Sheet.
  await pushLead({
    name: name.trim(),
    email: email.trim(),
    phone: phone.replace(/\s+/g, ""),
    investmentRange: String(investmentRange),
    submittedAt: new Date().toISOString(),
    ...score,
  });

  return Response.json({ ok: true, ...score }, { status: 200 });
}
