import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_short_url(client: AsyncClient):
    response = await client.post("/shorten", json={"url": "https://example.com"})
    assert response.status_code == 200
    data = response.json()
    assert "short_code" in data
    assert data["original_url"] == "https://example.com/"
    assert data["clicks"] == 0


@pytest.mark.asyncio
async def test_create_short_url_idempotent(client: AsyncClient):
    response1 = await client.post("/shorten", json={"url": "https://idempotent.test"})
    assert response1.status_code == 200
    data1 = response1.json()

    response2 = await client.post("/shorten", json={"url": "https://idempotent.test"})
    assert response2.status_code == 200
    data2 = response2.json()

    assert data1["short_code"] == data2["short_code"]


@pytest.mark.asyncio
async def test_redirect_and_analytics(client: AsyncClient):
    create_resp = await client.post("/shorten", json={"url": "https://redirect.test"})
    assert create_resp.status_code == 200
    short_code = create_resp.json()["short_code"]

    redirect_resp = await client.get(f"/{short_code}", follow_redirects=False)
    assert redirect_resp.status_code == 301
    assert redirect_resp.headers["location"] == "https://redirect.test/"

    analytics_resp = await client.get(f"/analytics/{short_code}")
    assert analytics_resp.status_code == 200
    assert analytics_resp.json()["clicks"] == 1
