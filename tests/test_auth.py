import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register(client: AsyncClient):
    response = await client.post(
        "/auth/register", json={"username": "testuser", "password": "secret"}
    )
    assert response.status_code == 201
    assert response.json()["message"] == "User created"


@pytest.mark.asyncio
async def test_register_duplicate(client: AsyncClient):
    await client.post("/auth/register", json={"username": "dupuser", "password": "secret"})
    response = await client.post(
        "/auth/register", json={"username": "dupuser", "password": "secret"}
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_login_and_me(client: AsyncClient):
    await client.post("/auth/register", json={"username": "loginuser", "password": "secret"})

    response = await client.post(
        "/auth/login", json={"username": "loginuser", "password": "secret"}
    )
    assert response.status_code == 200
    assert "access_token" in response.cookies

    me_response = await client.get("/auth/me")
    assert me_response.status_code == 200
    assert me_response.json()["username"] == "loginuser"


@pytest.mark.asyncio
async def test_logout(client: AsyncClient):
    await client.post("/auth/register", json={"username": "logoutuser", "password": "secret"})
    await client.post("/auth/login", json={"username": "logoutuser", "password": "secret"})

    logout_response = await client.post("/auth/logout")
    assert logout_response.status_code == 200

    me_response = await client.get("/auth/me")
    assert me_response.status_code == 401


@pytest.mark.asyncio
async def test_create_url_with_auth(client: AsyncClient):
    await client.post("/auth/register", json={"username": "urluser", "password": "secret"})
    await client.post("/auth/login", json={"username": "urluser", "password": "secret"})

    response = await client.post("/shorten", json={"url": "https://auth.test"})
    assert response.status_code == 200
    data = response.json()
    assert data["original_url"] == "https://auth.test/"
