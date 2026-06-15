# Spec: URL Shortener API (Demo)

## Objective
Một REST API rút gọn URL: nhận URL dài → trả về mã ngắn; truy cập mã ngắn →
redirect về URL gốc và đếm số lần click. Mục tiêu của bản demo là minh hoạ
luồng spec → plan → build (TDD) của agent-skills, không phải sản phẩm production.

- **User:** lập trình viên gọi API (hoặc người dùng cuối bấm link rút gọn).
- **Success:** tạo được link ngắn, redirect đúng, đếm click chính xác, có test phủ.

## Tech Stack
- Python 3.11+
- FastAPI (web framework) + Uvicorn (server)
- SQLite qua `sqlite3` chuẩn (không thêm ORM cho gọn)
- pytest + httpx (test client) cho testing

## Commands
```
Cài:   pip install -r requirements.txt
Dev:   uvicorn app.main:app --reload
Test:  pytest -q
Lint:  ruff check .
```

## Project Structure
```
demo/url-shortener/
  app/
    __init__.py
    main.py        → FastAPI app + routes
    store.py       → lớp lưu trữ (SQLite) + sinh mã ngắn
    models.py      → Pydantic request/response models
  tests/
    test_shorten.py   → test tạo short URL
    test_redirect.py  → test redirect + đếm click
  requirements.txt
  SPEC.md
```

## Code Style
- Type hints đầy đủ; hàm nhỏ, một nhiệm vụ.
- Tên rõ nghĩa, snake_case. Tách logic (store.py) khỏi routing (main.py).

```python
def create_short_code(length: int = 7) -> str:
    """Sinh mã base62 ngẫu nhiên, đảm bảo không trùng trong store."""
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))
```

## Testing Strategy
- pytest, test đặt trong `tests/`.
- Mỗi endpoint có test happy-path + 1 edge case (URL không hợp lệ, mã không tồn tại).
- Dùng SQLite in-memory cho test để chạy nhanh, độc lập.

## API Contract
| Method | Path        | Mô tả                         | Trả về |
|--------|-------------|-------------------------------|--------|
| POST   | `/shorten`  | Body `{"url": "..."}`         | `{"short_code","short_url"}` |
| GET    | `/{code}`   | Redirect tới URL gốc          | 307 redirect (hoặc 404) |
| GET    | `/stats/{code}` | Số click + URL gốc        | `{"url","clicks"}` |

## Boundaries
- **Always:** validate URL đầu vào; chạy `pytest` trước mỗi commit; mã ngắn không trùng.
- **Ask first:** thêm dependency mới ngoài danh sách; đổi schema DB; thêm endpoint mới.
- **Never:** commit secrets; xoá test để cho qua; redirect tới URL chưa validate (chống open-redirect cơ bản).

## Success Criteria
- [ ] POST /shorten trả mã 7 ký tự, lưu được mapping.
- [ ] GET /{code} redirect đúng URL gốc; mã sai → 404.
- [ ] GET /stats/{code} đếm đúng số lần click.
- [ ] `pytest` xanh toàn bộ; mỗi endpoint có ≥2 test.

## Open Questions
- Có cần custom alias (người dùng tự đặt mã) không? (mặc định: chưa)
- Có cần hết hạn link (TTL) không? (mặc định: chưa)
