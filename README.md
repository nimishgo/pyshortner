# Py-Shortner

![demo](./demo.gif)

A high-performance URL shortener built with Python, FastAPI, PostgreSQL, Redis, and Next.js.

## Tech Stack

- **Backend:** Python 3.14, FastAPI, SQLAlchemy (async), PostgreSQL, Redis
- **Frontend:** Next.js (Pages Router), TypeScript, Tailwind CSS
- **Auth:** JWT tokens in HTTP-only cookies, bcrypt password hashing
- **Infra:** Docker Compose for PostgreSQL and Redis

## Features

- Shorten URLs with Base62 encoding
- JWT cookie-based authentication (register, login, logout)
- User dashboard to view created URLs
- Click analytics per URL
- Redis caching for fast redirect lookups
- Async SQLAlchemy with PostgreSQL

## Quick Start

### Option A: Everything in Docker Compose (Recommended)

```bash
docker compose up -d
```

This starts PostgreSQL, Redis, the FastAPI backend, and the Next.js frontend.

- Frontend: [http://localhost:3000](http://localhost:3000)
- API Docs: [http://localhost:8001/docs](http://localhost:8001/docs)

```bash
docker compose down   # Stop everything
```

### Option B: Native Development (Faster Hot Reload)

**1. Start PostgreSQL and Redis**

```bash
docker compose up -d db redis
```

**2. Configure Backend**

```bash
cp .env.example .env
```

Edit `.env` if needed. Defaults work with the Docker Compose services.

**3. Install Backend Dependencies**

```bash
uv sync
```

**4. Run Backend**

```bash
uv run fastapi dev --port 8001
```

The API will be available at `http://localhost:8001`.

**5. Configure Frontend**

```bash
cd frontend
cp .env.example .env.local
```

**6. Install Frontend Dependencies**

```bash
npm install
```

**7. Run Frontend**

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`.

## Testing

### Backend Tests

```bash
uv run pytest tests/ -v
```

### Frontend Build

```bash
cd frontend
npm run build
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create a new account |
| POST | `/auth/login` | Login (sets JWT cookie) |
| POST | `/auth/logout` | Logout (clears cookie) |
| GET | `/auth/me` | Get current user |
| GET | `/shorten` | List user's URLs |
| POST | `/shorten` | Create a short URL |
| GET | `/{short_code}` | Redirect to original URL |
| GET | `/analytics/{short_code}` | Get URL analytics |

## Environment Variables

### Backend (.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://postgres:postgres@localhost:5432/shortener_db` | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection string |
| `SECRET_KEY` | `change-me-in-production` | JWT signing key (change this!) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | JWT expiration time |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | CORS allowed origins |

### Frontend (.env.local)

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API base URL |

## Docker Compose

```bash
docker compose up -d   # Start services
docker compose down     # Stop services
docker compose logs -f  # View logs
```

## Project Structure

```
.
├── backend/
│   └── app/
│       ├── api/
│       │   ├── auth.py          # Auth endpoints
│       │   └── routes.py        # URL endpoints
│       ├── core/
│       │   ├── config.py        # Settings
│       │   ├── database.py      # SQLAlchemy setup
│       │   ├── redis.py         # Redis client
│       │   └── security.py      # Password & JWT utils
│       ├── models/
│       │   └── url.py           # SQLAlchemy models
│       ├── schemas/
│       │   ├── auth.py          # Auth schemas
│       │   └── url.py           # URL schemas
│       └── main.py              # FastAPI app
├── frontend/
│   ├── components/
│   │   └── Layout.tsx           # Shared layout
│   ├── lib/
│   │   └── api.ts               # API client
│   ├── pages/
│   │   ├── index.tsx            # Shorten URL
│   │   ├── login.tsx            # Login
│   │   ├── register.tsx         # Register
│   │   ├── dashboard.tsx        # My URLs
│   │   └── analytics/
│   │       └── [short_code].tsx # Analytics
│   └── ...
├── tests/
│   ├── test_shortener.py
│   └── test_auth.py
├── docker-compose.yml
└── README.md
```
