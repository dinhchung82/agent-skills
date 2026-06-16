# Deploy lên Render

App là Next.js chạy **server thường trú** (`next start`). Trên Render chạy 1 instance,
nên rate limit + nonce single-use (in-memory) **hoạt động đúng mà không cần Redis** —
miễn là **không** bật autoscale/nhiều replica.

## Cách A — Dashboard (khuyến nghị)

1. [dashboard.render.com](https://dashboard.render.com) → **New** → **Web Service**.
2. Kết nối GitHub, chọn repo `dinhchung82/agent-skills`, branch muốn deploy.
3. Điền cấu hình:
   | Trường | Giá trị |
   |---|---|
   | **Root Directory** | `demo/finance-landing` ⬅️ *dễ quên nhất* |
   | **Runtime** | Node |
   | **Build Command** | `npm install && npm run build` |
   | **Start Command** | `npm start` |
   | **Health Check Path** | `/vi` |
4. **Environment Variables:**
   | Key | Value |
   |---|---|
   | `FORM_SECRET` | chuỗi ngẫu nhiên ≥32 ký tự → `openssl rand -hex 32` |
   | `SHEET_WEBHOOK_URL` | URL `…/exec` của Google Apps Script (xem README) |
   | `NODE_ENV` | `production` |

   > Thiếu `FORM_SECRET` (hoặc < 32 ký tự) → app **fail-closed**, trang lỗi. Đây là cố ý.
5. Chọn plan (**Free** ngủ khi không dùng → request đầu chậm ~30s; **Starter** luôn bật).
6. **Create Web Service** → đợi build → mở URL, `/` tự redirect `/vi`.

## Cách B — Blueprint (render.yaml)

Render Blueprint chỉ tự nhận `render.yaml` ở **gốc repo**. File `render.yaml` ở đây dùng
khi app là repo riêng, hoặc làm tài liệu cấu hình. Với repo hiện tại (app trong thư mục
con), dùng Cách A cho nhanh.

## Sau khi deploy — kiểm tra

- Gửi thử 1 lead → kiểm tra dòng mới trong Google Sheet.
- Đổi `/vi` ↔ `/en` xem song ngữ.
- Lỗi submit → xem **Logs** trên Render (thường do thiếu env).

## Lưu ý vận hành

- **Đừng bật nhiều instance/autoscale** trừ khi đã cắm Redis qua `setRateLimitStore`
  và `setNonceStore` — nếu không, chống replay + rate limit sẽ hỏng (state không chia sẻ).
- **IP cho rate limit:** Render đặt `x-forwarded-for` qua proxy; giá trị trái cùng có thể
  bị client giả mạo. Muốn chặt hơn, lấy IP từ proxy tin cậy của Render.
- **Vá dependencies (B4):** nâng `next`/`next-intl` (CVE SSRF/open-redirect) theo lịch,
  thêm `npm audit --audit-level=high` vào CI.
- **Rotate `FORM_SECRET`** sẽ vô hiệu mọi form token đang lưu hành (dùng khi nghi lạm dụng).
