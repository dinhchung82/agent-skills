from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_shorten_returns_code():
    resp = client.post("/shorten", json={"url": "https://example.com/page"})
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["short_code"]) == 7
    assert body["short_url"].endswith(body["short_code"])


def test_shorten_rejects_bad_url():
    resp = client.post("/shorten", json={"url": "not-a-url"})
    assert resp.status_code == 422


def test_shorten_then_redirect_target_resolvable():
    code = client.post("/shorten", json={"url": "https://example.com/x"}).json()[
        "short_code"
    ]
    # mã vừa tạo phải tra ngược được trong store dùng chung
    from app.main import store

    assert store.get_url(code) == "https://example.com/x"
