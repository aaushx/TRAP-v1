import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("trap_api")

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Structured request duration logger. Omits printing sensitive request metadata."""
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        method = request.method
        path = request.url.path
        
        try:
            response = await call_next(request)
            duration = (time.time() - start_time) * 1000
            # Log complete status and process time
            logger.info(
                f"API Request: {method} {path} - Completed {response.status_code} in {duration:.2f}ms"
            )
            return response
        except Exception as e:
            duration = (time.time() - start_time) * 1000
            logger.error(
                f"API Request: {method} {path} - Failed with {type(e).__name__} in {duration:.2f}ms"
            )
            raise e
