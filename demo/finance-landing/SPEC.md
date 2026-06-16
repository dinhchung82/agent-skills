# Spec: Finance Landing Page + Lead Filtering

## Objective
Một landing page **song ngữ (VI/EN)** cho công ty tài chính nhằm thu thập lead qua
form tư vấn, **chặn bot/spam** ở server, **chấm điểm lead**, rồi đẩy **mọi lead hợp lệ
(kèm điểm)** sang **Google Sheet** để sales theo dõi.

- **User:** khách truy cập quan tâm dịch vụ tài chính (để lại thông tin tư vấn).
- **Người hưởng lợi:** đội sales — nhận lead đã lọc bot + có điểm để ưu tiên.
- **Success:** form gửi được lead hợp lệ vào Google Sheet; bot/spam bị loại ở server;
  mỗi lead có điểm (hot/warm/cold); có disclaimer + consent; chuyển VI/EN được.

## Tech Stack
- Next.js 14+ (App Router) + TypeScript + React
- Tailwind CSS cho UI
- `next-intl` cho song ngữ VI/EN
- API Route (`app/api/lead/route.ts`) xử lý submit phía server
- Đẩy lead sang **Google Sheet qua Apps Script webhook** (`fetch` POST JSON)
- Rate-limit in-memory (demo) / Redis (prod)
- Vitest + React Testing Library (unit/component); Playwright (e2e, tùy chọn)

## Bot Protection (3 lớp, không CAPTCHA)
1. **Honeypot:** field ẩn (vd `company_website`) — người thật bỏ trống; bot điền → loại.
2. **Time-trap:** đo thời gian từ lúc load form đến submit; < 2 giây → nghi bot.
3. **Rate limiting:** giới hạn N submit / IP / khoảng thời gian (vd 5 / 10 phút).
4. **Server validation:** mọi kiểm tra lặp lại ở server — không tin client.

## Lead Quality (lọc + chấm điểm)
- **Validate liên hệ:** email đúng định dạng + **chặn email dùng-1-lần** (mailinator,
  10minutemail...); SĐT đúng định dạng VN.
- **Câu hỏi gạn lọc:** mức đầu tư dự kiến + khung thời gian đầu tư (trường trong form).
- **Lead scoring (server):** cộng điểm theo mức đầu tư + khung thời gian → phân loại:
  - `hot` (≥70), `warm` (40–69), `cold` (<40).
- **Đích đẩy:** MỌI lead vượt được lớp chặn bot đều đẩy sang Google Sheet, **kèm `points`
  và `tier`** để sales tự ưu tiên (không lọc theo ngưỡng).

## Form Fields (6 trường)
| Trường | Bắt buộc | Ghi chú |
|--------|----------|---------|
| Họ tên | ✅ | |
| Email | ✅ | validate + chặn email dùng-1-lần |
| Số điện thoại | ✅ | định dạng VN |
| Mức đầu tư dự kiến | ✅ | dropdown → dùng cho scoring |
| Khung thời gian đầu tư | ✅ | dropdown → dùng cho scoring (càng sớm càng nóng) |
| Consent (đồng ý liên hệ) | ✅ | checkbox, không tick → không submit |
| `company_website` | (ẩn) | honeypot, người thật để trống |

## Compliance (công ty tài chính)
- Checkbox **consent** bắt buộc (đồng ý được liên hệ + xử lý dữ liệu) trước khi submit.
- **Disclaimer** rủi ro đầu tư hiển thị gần form (cả VI lẫn EN).
- Không log dữ liệu cá nhân (PII) ra console; dữ liệu truyền qua HTTPS.

## Commands
```
Cài:   npm install
Dev:   npm run dev
Build: npm run build
Test:  npm test            # vitest
E2E:   npm run test:e2e    # playwright (tùy chọn)
Lint:  npm run lint
Env:   SHEET_WEBHOOK_URL   (URL Apps Script của Google Sheet — đặt qua .env.local, KHÔNG hardcode)
```

## Project Structure
```
demo/finance-landing/
  app/
    [locale]/page.tsx     → landing page + form (song ngữ)
    api/lead/route.ts     → nhận submit, chặn bot, scoring, đẩy Sheet
  components/
    LeadForm.tsx          → form (honeypot, mức đầu tư, consent)
  lib/
    validation.ts         → validate email/SĐT, chặn email dùng-1-lần
    scoring.ts            → tính điểm lead
    rateLimit.ts          → giới hạn theo IP
    sheet.ts              → đẩy lead sang Google Sheet webhook
  messages/
    vi.json / en.json     → chuỗi dịch (next-intl)
  tests/
    scoring.test.ts
    validation.test.ts
    api-lead.test.ts
  SPEC.md
```

## Code Style
- TypeScript strict; tách logic thuần (`lib/`) khỏi UI và route để dễ test.
- Hàm thuần, không side-effect ẩn; tên rõ nghĩa.

```ts
export function scoreLead(answers: LeadAnswers): LeadScore {
  const points =
    (INVESTMENT_POINTS[answers.investmentRange] ?? 0) +
    (TIMEFRAME_POINTS[answers.timeframe] ?? 0);
  const tier = points >= 70 ? "hot" : points >= 40 ? "warm" : "cold";
  return { points, tier };
}
```

## Testing Strategy
- Vitest cho `lib/` (scoring, validation, rate-limit) — pure functions, phủ kỹ.
- Component test cho `LeadForm` (honeypot ẩn, consent bắt buộc).
- API route test: bot bị loại (honeypot điền/submit quá nhanh/vượt rate limit) → 400;
  lead thật → 200 + `{points, tier}`.
- Không gọi Google Sheet thật trong test — mock `sheet.ts`.

## Boundaries
- **Always:** validate lại ở server; consent bắt buộc; đọc SHEET_WEBHOOK_URL từ env; chạy test trước commit.
- **Ask first:** thêm CAPTCHA bên thứ ba; đổi cách tính điểm; thêm trường thu thập PII mới; đổi đích lead khỏi Google Sheet.
- **Never:** tin dữ liệu client mà không validate; log PII; commit SHEET_WEBHOOK_URL/secret; đẩy lead khi thiếu consent.

## Success Criteria
- [ ] Submit honeypot có giá trị → bị từ chối (400), không đẩy Sheet.
- [ ] Submit < 2s hoặc vượt rate limit → bị từ chối.
- [ ] Email dùng-1-lần → bị từ chối; email/SĐT hợp lệ → chấp nhận.
- [ ] Lead hợp lệ nhận `points` + `tier` đúng và được đẩy sang Sheet kèm điểm.
- [ ] Thiếu consent → không submit được.
- [ ] Chuyển VI/EN hiển thị đúng chuỗi dịch.
- [ ] `npm test` xanh; Google Sheet webhook được mock trong test.

## Resolved Decisions
- Tech: **Next.js**; chặn bot: honeypot + time-trap + rate limit + server validation (không CAPTCHA).
- Lead chất lượng: validate liên hệ + mức đầu tư → scoring; **đẩy hết lead hợp lệ kèm điểm**.
- Đích lead: **Google Sheet** qua Apps Script webhook.
- Form: 6 trường (tên, email, SĐT, mức đầu tư, khung thời gian, consent) + honeypot ẩn.
- Ngôn ngữ: **song ngữ VI/EN** (next-intl).

## Open Questions (còn lại)
1. Các mốc "mức đầu tư" trong dropdown là gì? (vd: <100tr / 100–500tr / 500tr–1 tỷ / >1 tỷ) — ảnh hưởng bảng điểm.
2. Rate-limit cho prod: dùng Redis hay edge? (demo dùng in-memory — quyết sau khi deploy).
