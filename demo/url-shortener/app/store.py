import secrets
import sqlite3
import string

_ALPHABET = string.ascii_letters + string.digits


def create_short_code(length: int = 7) -> str:
    """Sinh mã base62 ngẫu nhiên."""
    return "".join(secrets.choice(_ALPHABET) for _ in range(length))


class Store:
    """Lưu mapping code → url trên SQLite, kèm bộ đếm click."""

    def __init__(self, path: str = "urls.db") -> None:
        self._conn = sqlite3.connect(path)
        self._conn.execute(
            "CREATE TABLE IF NOT EXISTS urls ("
            "  code TEXT PRIMARY KEY,"
            "  url TEXT NOT NULL,"
            "  clicks INTEGER NOT NULL DEFAULT 0"
            ")"
        )
        self._conn.commit()

    def save(self, url: str) -> str:
        """Lưu url với một mã ngắn duy nhất, trả về mã."""
        while True:
            code = create_short_code()
            try:
                self._conn.execute(
                    "INSERT INTO urls (code, url) VALUES (?, ?)", (code, url)
                )
                self._conn.commit()
                return code
            except sqlite3.IntegrityError:
                continue  # trùng mã (cực hiếm) → thử lại

    def get_url(self, code: str) -> str | None:
        row = self._conn.execute(
            "SELECT url FROM urls WHERE code = ?", (code,)
        ).fetchone()
        return row[0] if row else None

    def record_click(self, code: str) -> None:
        self._conn.execute(
            "UPDATE urls SET clicks = clicks + 1 WHERE code = ?", (code,)
        )
        self._conn.commit()

    def get_clicks(self, code: str) -> int | None:
        row = self._conn.execute(
            "SELECT clicks FROM urls WHERE code = ?", (code,)
        ).fetchone()
        return row[0] if row else None
