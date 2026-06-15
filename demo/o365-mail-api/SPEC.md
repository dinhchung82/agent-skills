# Spec: O365 Mail Backend API

## Objective
REST API (Python) cho phép một người dùng đăng nhập tài khoản Office 365 của họ và
**đọc inbox** (liệt kê email + xem nội dung từng email). Đây là backend thuần — phần
mobile (React Native/Flutter) sẽ gọi API này, làm sau ở dự án riêng.

- **User:** người dùng O365 muốn xem inbox qua app mobile của họ.
- **Success:** đăng nhập an toàn (không lộ mật khẩu), liệt kê được email mới nhất,
  mở xem được nội dung một email; mọi endpoint có test.

## Tech Stack
- Python 3.11+
- FastAPI + Uvicorn
- `msal` (Microsoft Authentication Library) — OAuth2 device code flow
- `httpx` — gọi Microsoft Graph REST API
- pytest + respx (mock HTTP) cho testing — **không gọi Graph thật khi test**

## Authentication (quyết định quan trọng)
- **Phương án chọn: OAuth2 Device Code Flow** qua Microsoft Graph.
  - Người dùng đăng nhập trên trang Microsoft thật (user/pass + MFA tại đó).
  - App **không bao giờ nhận/lưu mật khẩu**, chỉ nhận access + refresh token.
  - Quyền (scope) tối thiểu: `Mail.Read` (chỉ đọc).
  - Cần một Azure AD App Registration → `client_id`, `tenant_id`.
- **KHÔNG dùng** username/password (ROPC): bị MFA chặn, Microsoft khuyến cáo bỏ,
  và lưu mật khẩu là rủi ro bảo mật.

## Commands
```
Cài:   pip install -r requirements.txt
Dev:   uvicorn app.main:app --reload
Test:  pytest -q          # dùng mock, không cần mạng/Azure
Lint:  ruff check .
Env:   AZURE_CLIENT_ID, AZURE_TENANT_ID  (đặt qua biến môi trường, KHÔNG hardcode)
```

## Project Structure
```
demo/o365-mail-api/
  app/
    __init__.py
    main.py        → FastAPI app + routes
    auth.py        → device code flow (msal), quản lý token
    graph.py       → wrapper gọi Microsoft Graph (list/get messages)
    models.py      → Pydantic response models (EmailSummary, EmailDetail)
  tests/
    test_auth.py      → mock flow lấy token
    test_messages.py  → mock Graph: list + get email
  requirements.txt
  SPEC.md
```

## API Contract
| Method | Path | Mô tả | Trả về |
|--------|------|-------|--------|
| POST   | `/auth/device`   | Bắt đầu device flow | `{user_code, verification_url, device_code}` |
| POST   | `/auth/token`    | Đổi device_code → token (sau khi user xác nhận) | `{status: "authorized"}` |
| GET    | `/messages`      | Liệt kê email inbox (?top=20) | `[{id, subject, from, received, is_read}]` |
| GET    | `/messages/{id}` | Nội dung 1 email | `{id, subject, from, received, body}` |

## Code Style
- Type hints đầy đủ; tách lớp: `auth` (token) / `graph` (gọi API) / `main` (routing).
- Token lưu an toàn (cache mã hoá hoặc session), không log token/PII ra console.

```python
async def list_messages(token: str, top: int = 20) -> list[EmailSummary]:
    """Gọi Graph /me/messages, trả danh sách tóm tắt email."""
    headers = {"Authorization": f"Bearer {token}"}
    params = {"$top": top, "$select": "id,subject,from,receivedDateTime,isRead"}
    resp = await client.get(f"{GRAPH}/me/messages", headers=headers, params=params)
    resp.raise_for_status()
    return [EmailSummary.from_graph(m) for m in resp.json()["value"]]
```

## Testing Strategy
- pytest; mock mọi lời gọi Graph bằng `respx` → test chạy offline, nhanh, ổn định.
- Mỗi endpoint: happy-path + 1 lỗi (token hết hạn → 401, email không tồn tại → 404).
- Không có credential thật trong test/repo.

## Boundaries
- **Always:** dùng device code flow; scope tối thiểu `Mail.Read`; đọc client_id/tenant_id từ env; chạy pytest trước commit.
- **Ask first:** thêm scope ghi (gửi/xoá email); thêm dependency; đổi cách lưu token.
- **Never:** lưu/log mật khẩu người dùng; commit token/secret/client_secret; gọi Graph thật trong unit test.

## Success Criteria
- [ ] Device flow trả `user_code` + link xác minh; đổi được sang token (mock).
- [ ] GET /messages trả danh sách email tóm tắt đúng cấu trúc.
- [ ] GET /messages/{id} trả nội dung; id sai → 404; token hết hạn → 401.
- [ ] `pytest` xanh toàn bộ, không gọi mạng thật.

## Open Questions
1. **Auth:** xác nhận dùng Device Code Flow (khuyến nghị) thay cho user/password? → cần bạn chốt.
2. Bạn đã có quyền tạo Azure AD App Registration để lấy `client_id`/`tenant_id` chưa?
3. Token lưu ở đâu giữa các request? (session in-memory cho demo, hay cache bền?)
4. Có cần phân trang / tìm kiếm email không (mặc định: chưa, chỉ 20 email mới nhất)?
