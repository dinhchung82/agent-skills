from pydantic import AnyHttpUrl, BaseModel


class ShortenRequest(BaseModel):
    url: AnyHttpUrl


class ShortenResponse(BaseModel):
    short_code: str
    short_url: str
