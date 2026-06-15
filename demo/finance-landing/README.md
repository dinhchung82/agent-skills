# Finance Landing Page

Landing page **song ngữ (VI/EN)** cho công ty tài chính: thu thập lead, **chặn bot**
ở server, **chấm điểm lead**, rồi đẩy mọi lead hợp lệ (kèm điểm) sang **Google Sheet**.

Spec: [`SPEC.md`](./SPEC.md) · Kế hoạch: [`tasks/plan.md`](./tasks/plan.md)

## Chạy local

```bash
npm install
cp .env.example .env.local      # rồi điền SHEET_WEBHOOK_URL
npm run dev                     # http://localhost:3000 → redirect /vi
npm test                        # 35 test (mock Google Sheet, không gọi mạng)
npm run build
```

## Tính năng

- **Chặn bot (3 lớp, không CAPTCHA):** honeypot ẩn · time-trap (submit < 2s) ·
  rate limit theo IP (5 lần / 10 phút). Tất cả validate lại ở server.
- **Lead scoring:** điểm theo mức đầu tư + SĐT hợp lệ → `hot` / `warm` / `cold`.
  Mọi lead hợp lệ đều được đẩy kèm điểm để sales tự ưu tiên.
- **Tuân thủ:** consent bắt buộc + disclaimer rủi ro; không log PII.
- **Song ngữ:** `/vi` và `/en` qua `next-intl`.

## Kết nối Google Sheet (T7)

Lead được gửi bằng `POST` JSON tới `SHEET_WEBHOOK_URL`. Cách dựng webhook bằng
Google Apps Script:

1. Tạo một **Google Sheet** mới. Hàng đầu đặt tiêu đề cột, ví dụ:
   `submittedAt | name | email | phone | investmentRange | points | tier`
2. Trong Sheet: **Extensions → Apps Script**, dán đoạn sau:

   ```javascript
   function doPost(e) {
     const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
     const d = JSON.parse(e.postData.contents);
     sheet.appendRow([
       d.submittedAt, d.name, d.email, d.phone,
       d.investmentRange, d.points, d.tier,
     ]);
     return ContentService
       .createTextOutput(JSON.stringify({ ok: true }))
       .setMimeType(ContentService.MimeType.JSON);
   }
   ```

3. **Deploy → New deployment → Web app**
   - *Execute as:* Me
   - *Who has access:* Anyone
   - Copy **Web app URL**.
4. Dán URL vào `.env.local`:

   ```
   SHEET_WEBHOOK_URL=https://script.google.com/macros/s/XXXX/exec
   ```

5. Khởi động lại `npm run dev`, gửi thử form → kiểm tra một dòng mới xuất hiện
   trong Sheet.

> ⚠️ Apps Script "Anyone" nghĩa là endpoint công khai. Lead đã qua các lớp chặn bot
> ở `/api/lead` trước khi tới đây. Với prod, cân nhắc thêm token bí mật chia sẻ giữa
> app và Apps Script, và chuyển rate-limit sang Redis.

## Cấu trúc

```
app/[locale]/      → trang song ngữ (page + layout)
app/api/lead/      → API nhận submit (chặn bot, scoring, đẩy sheet)
components/         → LeadForm
lib/               → validation · scoring · rateLimit · sheet
messages/          → vi.json · en.json
tests/             → vitest (Google Sheet được mock)
```
