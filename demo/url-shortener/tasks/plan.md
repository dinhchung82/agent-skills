# Plan: URL Shortener API

Thứ tự theo phụ thuộc — mỗi task có acceptance + cách verify + file đụng.

- [x] **Task 1: Scaffold dự án**
  - Acceptance: `requirements.txt`, `app/__init__.py`, app FastAPI rỗng chạy được.
  - Verify: `uvicorn app.main:app` khởi động không lỗi; `pytest` chạy (0 test).
  - Files: `requirements.txt`, `app/__init__.py`, `app/main.py`

- [x] **Task 2: Sinh mã ngắn + lớp lưu trữ** *(phụ thuộc: Task 1)*
  - Acceptance: `create_short_code()` trả 7 ký tự base62; `Store.save/get` hoạt động trên SQLite in-memory; mã không trùng.
  - Verify: `pytest tests/test_store.py`
  - Files: `app/store.py`, `tests/test_store.py`

- [x] **Task 3: Endpoint POST /shorten** *(phụ thuộc: Task 2)*
  - Acceptance: nhận `{"url"}` hợp lệ → trả `{"short_code","short_url"}`; URL sai → 422.
  - Verify: `pytest tests/test_shorten.py`
  - Files: `app/models.py`, `app/main.py`, `tests/test_shorten.py`

- [ ] **Task 4: Endpoint GET /{code} redirect + đếm click** *(phụ thuộc: Task 3)*
  - Acceptance: mã đúng → 307 redirect URL gốc, click +1; mã sai → 404.
  - Verify: `pytest tests/test_redirect.py`
  - Files: `app/main.py`, `app/store.py`, `tests/test_redirect.py`

- [ ] **Task 5: Endpoint GET /stats/{code}** *(phụ thuộc: Task 4)*
  - Acceptance: trả `{"url","clicks"}` đúng; mã sai → 404.
  - Verify: `pytest tests/test_stats.py`
  - Files: `app/main.py`, `tests/test_stats.py`
