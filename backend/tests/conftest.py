import pytest
import asyncio
import asyncpg
import os
import sys
import subprocess
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession, AsyncEngine

# Configure environment settings immediately
os.environ["RUNNING_TESTS"] = "1"
TEST_DB_URL = "postgresql+asyncpg://trap_user:trap_password@localhost:5432/trap_db"
os.environ["DATABASE_URL"] = TEST_DB_URL

from app.main import app
from app.database.engine import get_db_session

ASYNC_CONN_URL = "postgresql://trap_user:trap_password@localhost:5432/trap_db"

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Setup, reset, and migrate the dedicated PostgreSQL test schema once per session."""
    async def reset_schema():
        # Connect to trap_db and recreate the isolated test schema
        conn = await asyncpg.connect(ASYNC_CONN_URL)
        try:
            await conn.execute("DROP SCHEMA IF EXISTS test CASCADE")
            await conn.execute("CREATE SCHEMA test")
            await conn.execute("GRANT ALL ON SCHEMA test TO trap_user")
        finally:
            await conn.close()

    asyncio.run(reset_schema())

    # Programmatically apply Alembic migrations inside the test schema
    print("\nApplying Alembic migrations on trap_db (test schema)...")
    env = os.environ.copy()
    env["RUNNING_TESTS"] = "1"
    env["DATABASE_URL"] = TEST_DB_URL
    subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        env=env,
        check=True,
        capture_output=True
    )

@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"

@pytest.fixture
async def test_engine() -> AsyncGenerator[AsyncEngine, None]:
    """Function-scoped engine to prevent event-loop connection pool mismatch failures."""
    engine = create_async_engine(
        TEST_DB_URL,
        connect_args={"server_settings": {"search_path": "test"}},
        future=True
    )
    yield engine
    await engine.dispose()

@pytest.fixture
def session_maker(test_engine: AsyncEngine) -> async_sessionmaker:
    """Create a sessionmaker bound to the active test engine."""
    return async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False
    )

@pytest.fixture
async def db_session(session_maker: async_sessionmaker) -> AsyncGenerator[AsyncSession, None]:
    """Provide a database session for test case data preparation and checks."""
    async with session_maker() as session:
        yield session

@pytest.fixture
async def client(session_maker: async_sessionmaker) -> AsyncGenerator[AsyncClient, None]:
    """Provide an HTTP client bound to request-scoped database sessions."""
    async def override_get_db_session():
        async with session_maker() as session:
            yield session
        
    app.dependency_overrides[get_db_session] = override_get_db_session
    
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver"
    ) as async_client:
        yield async_client
        
    app.dependency_overrides.clear()
