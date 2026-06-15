# Plan: Finance Landing Page + Lead Filtering

Nguồn: `demo/finance-landing/SPEC.md`. Cắt **dọc** — mỗi task là một đường đi hoàn chỉnh,
chạy được + có test, không cắt ngang theo tầng.

## Dependency Graph
```
T1 Scaffold (Next.js+TS+Tailwind+Vitest+next-intl)
        │
        ├──> T2 lib/validation  (email, disposable, SĐT VN)   ─┐
        ├──> T3 lib/scoring     (points + tier)                ├──> T4 API /api/lead
        │                                                       │   (honeypot + time-trap +
        │                                                       │    rateLimit + sheet[mock])
        │                                                       │
        └──> T5 LeadForm component ─────────────────────────────┘
                        │
                        └──> T6 Landing page + i18n VI/EN (ghép form + disclaimer)
                                        │
                                        └──> T7 Google Sheet thật + env (tùy chọn)
```
- T2 và T3 độc lập nhau → có thể làm song song sau T1.
- T4 cần T2 + T3 (+ tạo lib/rateLimit, lib/sheet).
- T5 độc lập T2–T4 (gọi API qua fetch), nhưng nên có T4 để test end-to-end.

## Checkpoints
- **CP-A (sau T1):** dự án chạy `npm run dev` + `npm test` xanh → mới xây logic.
- **CP-B (sau T4):** đường server hoàn chỉnh (bot bị loại, lead thật → score) → mới ghép UI.
- **CP-C (sau T6):** trang chạy đầy đủ VI/EN, form submit thật vào mock → review trước khi nối Sheet thật.

---

## T1 — Scaffold dự án
**Mục tiêu:** khung Next.js (App Router) + TS + Tailwind + Vitest + next-intl chạy được.
**Acceptance:**
- `npm run dev` render trang trắng tối thiểu không lỗi.
- `npm test` chạy được 1 test mẫu (sanity) và xanh.
- `npm run lint` không lỗi.
**Verify:** chạy 3 lệnh trên.

## T2 — lib/validation (TDD)
**Mục tiêu:** hàm thuần validate email (định dạng), chặn email dùng-1-lần, SĐT VN.
**Acceptance:**
- `isValidEmail`, `isDisposableEmail`, `isValidVNPhone` có test đỏ→xanh.
- Chặn ít nhất: mailinator.com, 10minutemail.com, guerrillamail.com.
- SĐT VN: chấp nhận 0xxxxxxxxx / +84xxxxxxxxx; loại số sai độ dài.
**Verify:** `npm test lib/validation`.

## T3 — lib/scoring (TDD)
**Mục tiêu:** `scoreLead(answers)` → `{points, tier}` với tier hot/warm/cold.
**Acceptance:**
- Điểm theo mức đầu tư + cộng điểm khi SĐT hợp lệ.
- Ngưỡng: ≥70 hot, 40–69 warm, <40 cold (test biên 39/40/69/70).
**Verify:** `npm test lib/scoring`.

## T4 — API /api/lead (đường server hoàn chỉnh)
**Mục tiêu:** route nhận submit → chặn bot → validate → scoring → đẩy Sheet (mock).
Tạo thêm `lib/rateLimit.ts`, `lib/sheet.ts`.
**Acceptance:**
- Honeypot có giá trị → 400, KHÔNG gọi sheet.
- Thời gian điền < 2s → 400.
- Vượt rate limit (vd >5/IP/10ph) → 429.
- Email dùng-1-lần / SĐT sai → 400.
- Lead hợp lệ → 200, body có `{points, tier}`, `sheet.pushLead` được gọi 1 lần (mock).
- Thiếu consent → 400.
**Verify:** `npm test api-lead` (mock `lib/sheet`).

## T5 — LeadForm component
**Mục tiêu:** form 5 trường + honeypot ẩn + consent + time-trap, POST tới `/api/lead`.
**Acceptance:**
- Render 5 trường (tên, email, SĐT, mức đầu tư, consent) + field honeypot ẩn khỏi người dùng.
- Nút submit khoá khi chưa tick consent.
- Hiển thị trạng thái thành công / lỗi sau submit.
**Verify:** component test (RTL): honeypot ẩn, consent bắt buộc, submit gọi fetch đúng payload.

## T6 — Landing page + i18n VI/EN
**Mục tiêu:** ghép LeadForm vào trang `[locale]`, thêm disclaimer + chuyển VI/EN.
**Acceptance:**
- `/vi` và `/en` render đúng chuỗi từ `messages/vi.json` & `en.json`.
- Disclaimer rủi ro hiển thị gần form ở cả 2 ngôn ngữ.
- Chuyển ngôn ngữ đổi nội dung không reload mất dữ liệu form (chấp nhận reload nếu cần cho demo).
**Verify:** `npm run dev` mở `/vi` và `/en`; (tùy chọn) Playwright e2e submit 1 lead.

## T7 — Google Sheet thật + env (tùy chọn)
**Mục tiêu:** thay mock bằng đẩy thật qua Apps Script webhook đọc từ `SHEET_WEBHOOK_URL`.
**Acceptance:**
- `lib/sheet.ts` POST JSON tới `process.env.SHEET_WEBHOOK_URL`.
- Có hướng dẫn ngắn tạo Apps Script (README).
- Không commit URL thật; test vẫn mock.
**Verify:** submit thử → thấy 1 dòng mới trong Sheet (thủ công, ngoài CI).

---

## Ghi chú thực thi
- Mỗi task = 1 commit. Chạy test trước khi commit.
- Mock `lib/sheet` trong mọi unit/integration test — không gọi mạng thật.
- Đọc mọi secret từ env; không hardcode.
