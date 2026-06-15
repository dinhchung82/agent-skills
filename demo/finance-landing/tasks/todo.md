# TODO — Finance Landing Page

Thứ tự đề xuất. Mỗi mục = 1 commit, chạy test trước khi commit.

- [x] **T1** Scaffold Next.js + TS + Tailwind + Vitest + next-intl — `npm run dev`/`npm test`/`npm run lint` xanh
- [x] 🚩 **CP-A** — dự án chạy + test mẫu xanh
- [x] **T2** lib/validation (email, disposable, SĐT VN) — TDD đỏ→xanh
- [x] **T3** lib/scoring (points + tier, test biên 39/40/69/70) — TDD đỏ→xanh
- [x] **T4** API /api/lead (honeypot + time-trap + rateLimit + sheet mock) — bot loại, lead thật→score
- [x] 🚩 **CP-B** — đường server hoàn chỉnh, test xanh
- [x] **T5** LeadForm component (5 trường + honeypot + consent + time-trap) — RTL test
- [x] **T6** Landing page + i18n VI/EN + disclaimer — `/vi` & `/en` render đúng
- [x] 🚩 **CP-C** — trang chạy đầy đủ (dừng tại đây theo yêu cầu)
- [x] **T7** Google Sheet thật qua Apps Script webhook + env + README + test pushLead

## Mở (không chặn)
- [ ] Chốt các mốc "mức đầu tư" cho dropdown (ảnh hưởng bảng điểm scoring)
- [ ] Rate-limit prod: in-memory vs Redis
