from contextvars import ContextVar
from typing import Optional
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from app.core.security import verify_token

# Context variable to store tenant ID
tenant_id_context: ContextVar[Optional[int]] = ContextVar("tenant_id", default=None)

class TenantMiddleware(BaseHTTPMiddleware):
    """
    Middleware to extract tenant ID from JWT token and set it in context
    """
    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Extract tenant ID from JWT token
        tenant_id = None

        # Get authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token_str = auth_header.split(" ")[1]
            # Decode the token
            payload = verify_token(token_str)
            if payload:
                # Extract tenant_id from token payload
                tenant_id = payload.get("tenant_id")

        token = tenant_id_context.set(tenant_id)

        try:
            response = await call_next(request)
            return response
        finally:
            tenant_id_context.reset(token)

def get_tenant_id() -> Optional[int]:
    """Get current tenant ID from context"""
    return tenant_id_context.get()
