from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import string

from backend.app.models.url import URL, User
from backend.app.schemas.url import URLCreate, URLResponse
from backend.app.core.database import get_db
from backend.app.core.redis import get_redis_client
from backend.app.api.auth import get_current_user_optional

router = APIRouter()


@router.get("/shorten", response_model=list[URLResponse])
async def list_urls(
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    if current_user:
        stmt = select(URL).where(URL.owner_id == current_user.id).order_by(URL.created_at.desc())
    else:
        stmt = select(URL).order_by(URL.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/shorten", response_model=URLResponse)
async def create_short_url(
    url_data: URLCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    url_string = str(url_data.url)
    stmt = select(URL).where(URL.original_url == url_string)
    result = await db.execute(stmt)
    existing_url = result.scalar_one_or_none()

    if existing_url:
        return existing_url

    try:
        new_url = URL(original_url=url_string, owner_id=current_user.id if current_user else None)
        db.add(new_url)
        await db.commit()
        await db.refresh(new_url)
    except IntegrityError:
        await db.rollback()
        stmt = select(URL).where(URL.original_url == url_string)
        result = await db.execute(stmt)
        return result.scalar_one()

    BASE62_ALPHABET = string.digits + string.ascii_letters
    num = new_url.id
    short_code = ""
    while num > 0:
        rem = num % 62
        short_code = BASE62_ALPHABET[rem] + short_code
        num = num // 62
    new_url.short_code = short_code
    await db.commit()
    await db.refresh(new_url)

    redis = await get_redis_client()
    await redis.set(f"url:{short_code}", new_url.original_url, ex=3600)

    return new_url


@router.get("/analytics/{short_code}", response_model=URLResponse)
async def get_analytics(
    short_code: str,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(URL).where(URL.short_code == short_code)
    result = await db.execute(stmt)
    url = result.scalar_one_or_none()
    if not url:
        raise HTTPException(status_code=404, detail="URL not found")
    return url


@router.get("/{short_code}")
async def redirect_to_url(
    short_code: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    redis = await get_redis_client()
    cached_url = await redis.get(f"url:{short_code}")

    if cached_url:
        original_url = cached_url
    else:
        stmt = select(URL).where(URL.short_code == short_code)
        result = await db.execute(stmt)
        url = result.scalar_one_or_none()
        if not url:
            raise HTTPException(status_code=404)
        original_url = url.original_url
        await redis.set(f"url:{short_code}", original_url, ex=3600)

    stmt = select(URL).where(URL.short_code == short_code)
    result = await db.execute(stmt)
    url = result.scalar_one_or_none()
    if url:
        url.clicks = url.clicks + 1
        await db.commit()

    return RedirectResponse(url=original_url, status_code=301)
