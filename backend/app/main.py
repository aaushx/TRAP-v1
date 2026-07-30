import logging
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import settings
from app.middleware.cors import setup_cors
from app.middleware.logging import RequestLoggingMiddleware
from app.core.exceptions import (
    TRAPException,
    trap_exception_handler,
    http_exception_handler,
    validation_exception_handler,
    global_exception_handler
)

# Initialize standard structured logging to stdout stream
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("trap_api")

app = FastAPI(
    title="TRAP API",
    description="Placement Preparation OS Backend",
    version="1.0.0",
    docs_url="/docs" if settings.APP_ENV != "production" else None,
    redoc_url="/redoc" if settings.APP_ENV != "production" else None,
)

# Exception Handlers (Ensure unified structure)
app.add_exception_handler(TRAPException, trap_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

# Setup Middlewares (Log requests and configure CORS)
app.add_middleware(RequestLoggingMiddleware)
setup_cors(app)

# Include API Router
app.include_router(api_router, prefix="/api/v1")

@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    return {"status": "healthy", "environment": settings.APP_ENV}

@app.on_event("startup")
async def startup_event():
    logger.info("TRAP API server starting up...")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("TRAP API server shutting down...")
