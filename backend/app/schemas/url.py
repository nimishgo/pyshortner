from datetime import datetime
from pydantic import BaseModel, HttpUrl, ConfigDict


class URLCreate(BaseModel):
    url: HttpUrl


class URLResponse(BaseModel):
    id: int
    original_url: HttpUrl
    short_code: str
    clicks: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AnalyticsResponse(BaseModel):
    id: int
    original_url: HttpUrl
    short_code: str
    clicks: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
