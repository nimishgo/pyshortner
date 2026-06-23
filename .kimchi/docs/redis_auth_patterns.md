# Best-Practice Patterns: Async Redis + FastAPI & JWT Cookie Auth

> Sources: FastAPI docs, redis-py docs, pyjwt docs, passlib docs.

---

## 1. Async Redis (`redis-py`) with FastAPI Lifespan

**Goal:** share a single async Redis client across requests and cleanly close it on shutdown.

**Key references**
- FastAPI "Lifespan Events" — using `@asynccontextmanager` with `yield` before/after the app runs.  
  <https://fastapi.tiangolo.com/advanced/events/> (see also `docs_src/events/tutorial003_py310.py` in the FastAPI repo)
- redis-py Asyncio example — `redis.asyncio.Redis()` + explicit `await client.aclose()`.  
  <https://redis.readthedocs.io/en/stable/examples/asyncio_examples.html>

### Concise pattern

```python
# backend/app/core/redis.py
import redis.asyncio as redis
from fastapi import FastAPI, Request
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    app.state.redis = redis.Redis(
        host="localhost",
        port=6379,
        decode_responses=True,
    )
    await app.state.redis.ping()
    yield
    # Shutdown
    await app.state.redis.aclose()


# In main.py:
# app = FastAPI(lifespan=lifespan)


# Dependency to inject Redis into routes
async def get_redis(request: Request) -> redis.Redis:
    return request.app.state.redis
```

### Usage in a route

```python
from fastapi import Depends, APIRouter

router = APIRouter()

@router.get("/cache")
async def read_cache(r: redis.Redis = Depends(get_redis)):
    value = await r.get("my_key")
    return {"value": value}
```

**Why this pattern?**
- `lifespan` guarantees one client instance for the whole app lifetime, avoiding per-request connection overhead.
- `app.state` is the idiomatic FastAPI container for shared application state.
- `await redis.aclose()` is required in async mode because Python has no async destructor.

---

## 2. JWT Cookie-Based Auth with SQLAlchemy Async (`pyjwt`, `passlib[bcrypt]`)

**Goal:** issue/verify JWTs stored in `HttpOnly` cookies and load the current user via an async SQLAlchemy session.

**Key references**
- pyjwt usage — `jwt.encode` / `jwt.decode`.  
  <https://pyjwt.readthedocs.io/en/stable/usage.html>
- passlib hashing — `CryptContext(schemes=["bcrypt"])`.  
  <https://passlib.readthedocs.io/en/stable/lib/passlib.context.html>
- FastAPI response cookies — `response.set_cookie(...)`.  
  <https://fastapi.tiangolo.com/advanced/response-cookies/>

### Concise pattern

```python
# backend/app/core/security.py
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
import jwt

SECRET_KEY = "change-me-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
```

```python
# backend/app/core/auth.py
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.core.security import decode_access_token
from backend.app.models.user import User  # your SQLAlchemy model


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

    try:
        payload = decode_access_token(token)
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

    return user
```

```python
# backend/app/api/auth.py
from fastapi import APIRouter, Depends, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.core.security import verify_password, create_access_token
from backend.app.models.user import User

router = APIRouter()


@router.post("/login")
async def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.username == form_data.username))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,        # set False for local HTTP dev
        samesite="lax",
        max_age=1800,
    )
    return {"message": "Logged in"}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"message": "Logged out"}


@router.get("/me")
async def read_me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "username": current_user.username}
```

**Why this pattern?**
- `HttpOnly` cookies mitigate XSS by preventing JavaScript from reading the token.
- `secure=True` sends the cookie only over HTTPS (disable locally if needed).
- `samesite="lax"` protects against CSRF on cross-origin POSTs while still allowing top-level navigation.
- `get_current_user` is a standard FastAPI dependency: it reads the cookie, decodes the JWT, and hits the async DB only when required.
- `OAuth2PasswordRequestForm` keeps the login endpoint compatible with Swagger UI’s built-in authorize button.

---

## Local Codebase Context

- `backend/app/main.py` already uses `@asynccontextmanager` + `lifespan` for SQLAlchemy table creation.
- `backend/app/core/database.py` already defines `create_async_engine`, `async_sessionmaker`, and `get_db()`.
- `pyproject.toml` includes `fastapi[standard]` and `sqlalchemy` but **not** `redis`, `pyjwt`, or `passlib`. Add them before using these patterns.
