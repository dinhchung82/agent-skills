# TODO — Finance Landing Page

Thứ tự đề xuất. Mỗi mục = 1 commit, chạy test trước khi commit.

- [ ] **T1** Scaffold Next.js + TS + Tailwind + Vitest + next-intl — `npm run dev`/`npm test`/`npm run lint` xanh
- [ ] 🚩 **CP-A** — dự án chạy + test mẫu xanh
- [ ] **T2** lib/validation (email, disposable, SĐT VN) — TDD đỏ→xanh
- [ ] **T3** lib/scoring (points + tier, test biên 39/40/69/70) — TDD đỏ→xanh
- [ ] **T4** API /api/lead (honeypot + time-trap + rateLimit + sheet mock) — bot loại, lead thật→score
- [ ] 🚩 **CP-B** — đường server hoàn chỉnh, test xanh
- [ ] **T5** LeadForm component (5 trường + honeypot + consent + time-trap) — RTL test
- [ ] **T6** Landing page + i18n VI/EN + disclaimer — `/vi` & `/en` render đúng
- [ ] 🚩 **CP-C** — trang chạy đầy đủ, review trước khi nối Sheet thật
- [ ] **T7** (tùy chọn) Google Sheet thật qua Apps Script webhook + env + README

## Mở (không chặn)
- [ ] Chốt các mốc "mức đầu tư" cho dropdown (ảnh hưởng bảng điểm scoring)
- [ ] Rate-limit prod: in-memory vs Redis
