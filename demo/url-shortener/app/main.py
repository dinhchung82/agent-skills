from fastapi import FastAPI

app = FastAPI(title="URL Shortener (demo)")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
