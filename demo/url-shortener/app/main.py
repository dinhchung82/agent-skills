from fastapi import FastAPI, Request

from app.models import ShortenRequest, ShortenResponse
from app.store import Store

app = FastAPI(title="URL Shortener (demo)")
store = Store("urls.db")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/shorten", response_model=ShortenResponse)
def shorten(payload: ShortenRequest, request: Request) -> ShortenResponse:
    code = store.save(str(payload.url))
    short_url = str(request.base_url).rstrip("/") + "/" + code
    return ShortenResponse(short_code=code, short_url=short_url)
