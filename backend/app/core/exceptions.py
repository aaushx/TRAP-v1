from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging

logger = logging.getLogger("trap_api")

class TRAPException(Exception):
    def __init__(self, message: str = "", status_code: int = 400, error_code: str = "BAD_REQUEST", detail: str = None):
        self.message = detail or message
        self.status_code = status_code
        self.error_code = error_code

class UnauthorizedException(TRAPException):
    def __init__(self, message: str = "Unauthorized", detail: str = None):
        super().__init__(message=message, status_code=401, error_code="UNAUTHORIZED", detail=detail)

class ForbiddenException(TRAPException):
    def __init__(self, message: str = "Forbidden", detail: str = None):
        super().__init__(message=message, status_code=403, error_code="FORBIDDEN", detail=detail)

class BadRequestException(TRAPException):
    def __init__(self, message: str = "Bad Request", detail: str = None):
        super().__init__(message=message, status_code=400, error_code="BAD_REQUEST", detail=detail)

class ConflictException(TRAPException):
    def __init__(self, message: str = "Conflict", detail: str = None):
        super().__init__(message=message, status_code=409, error_code="CONFLICT", detail=detail)

class NotFoundException(TRAPException):
    def __init__(self, message: str = "Not Found", detail: str = None):
        super().__init__(message=message, status_code=404, error_code="NOT_FOUND", detail=detail)

async def trap_exception_handler(request: Request, exc: TRAPException):
    """Custom exception handler for structured TRAPException responses."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "message": exc.message,
            "error_code": exc.error_code,
            "details": None
        },
    )

async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Formats standard FastAPI/Starlette HTTPExceptions into our unified schema."""
    error_code = "HTTP_ERROR"
    if exc.status_code == 404:
        error_code = "NOT_FOUND"
    elif exc.status_code == 401:
        error_code = "UNAUTHORIZED"
    elif exc.status_code == 403:
        error_code = "FORBIDDEN"
    elif exc.status_code == 400:
        error_code = "BAD_REQUEST"
        
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "message": str(exc.detail),
            "error_code": error_code,
            "details": None
        },
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Formats request body Pydantic payload validation errors cleanly."""
    details = exc.errors()
    logger.warning(f"Validation error on {request.url.path}: {details}")
    return JSONResponse(
        status_code=422,
        content={
            "status": "error",
            "message": "Request payload validation failed",
            "error_code": "VALIDATION_ERROR",
            "details": details
        },
    )

async def global_exception_handler(request: Request, exc: Exception):
    """Intercepts unhandled server exceptions, logs stack traces internally, and returns standard 500."""
    logger.exception(f"Unhandled system exception on {request.method} {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "An unexpected error occurred on the server",
            "error_code": "INTERNAL_SERVER_ERROR",
            "details": None
        },
    )
