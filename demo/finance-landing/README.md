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
- **Lead scoring:** điểm theo mức đầu tư + khung thời gian đầu tư → `hot` / `warm` /
  `cold`. Mọi lead hợp lệ đều được đẩy kèm điểm để sales tự ưu tiên.
- **Tuân thủ:** consent bắt buộc + disclaimer rủi ro; không log PII.
- **Song ngữ:** `/vi` và `/en` qua `next-intl`.

## Kết nối Google Sheet (T7)

Lead được gửi bằng `POST` JSON tới `SHEET_WEBHOOK_URL`. Cách dựng webhook bằng
Google Apps Script:

1. Tạo một **Google Sheet** mới. Hàng đầu đặt tiêu đề cột, ví dụ:
   `submittedAt | name | email | phone | investmentRange | timeframe | points | tier`
2. Trong Sheet: **Extensions → Apps Script**, dán đoạn sau:

   ```javascript
   function doPost(e) {
     const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
     const d = JSON.parse(e.postData.contents);
     sheet.appendRow([
       d.submittedAt, d.name, d.email, d.phone,
       d.investmentRange, d.timeframe, d.points, d.tier,
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

## Bảo mật & giới hạn

Đã xử lý (có test):

- **Validate đầy đủ ở server** — name/email/phone/consent **và** `investmentRange`,
  `timeframe` (whitelist); không tin client.
- **Không mất lead khi Sheet lỗi** — `pushLead` bọc try/catch, log (không kèm PII)
  và vẫn xác nhận cho người dùng.
- **Cap độ dài trường** — `name` ≤ 100, `email` ≤ 254, `phone` ≤ 20.
- **Time-trap ký HMAC từ server** (`lib/formToken.ts`) — token phát khi render trang,
  client **không giả mạo được** mốc thời gian; token hết hạn sau 30 phút.
- **Rate limit qua store cắm được** (`lib/rateLimit.ts`) — store in-memory mặc định có
  dọn rác chống phình bộ nhớ; prod chỉ cần `setRateLimitStore(redisStore)`.

Còn lại (phụ thuộc hạ tầng, làm khi deploy):

- **Đặt `FORM_SECRET`** là chuỗi ngẫu nhiên mạnh ở prod (mặc định dev không an toàn).
- **Rate limit dùng chung trên serverless** — cắm Redis/Upstash qua `setRateLimitStore`;
  store in-memory không chia sẻ trạng thái giữa các invocation/instance.
- **Key IP từ header tin cậy** — `x-forwarded-for` giả mạo được; trên Vercel nên dùng
  `request.ip` / header tin cậy của hạ tầng thay vì lấy trực tiếp từ request.

## Cấu trúc

```
app/[locale]/      → trang song ngữ (page + layout)
app/api/lead/      → API nhận submit (chặn bot, scoring, đẩy sheet)
components/         → LeadForm
lib/               → validation · scoring · rateLimit · sheet
messages/          → vi.json · en.json
tests/             → vitest (Google Sheet được mock)
```
