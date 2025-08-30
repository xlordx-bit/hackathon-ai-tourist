from fastapi import HTTPException
from typing import Type, Optional, Dict, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AppException(Exception):
    """Base exception class for application errors"""
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: str = "INTERNAL_ERROR",
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)

class DatabaseError(AppException):
    """Database related errors"""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=500,
            error_code="DATABASE_ERROR",
            details=details
        )

class ValidationError(AppException):
    """Data validation errors"""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=400,
            error_code="VALIDATION_ERROR",
            details=details
        )

class NotFoundError(AppException):
    """Resource not found errors"""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=404,
            error_code="NOT_FOUND",
            details=details
        )

class AuthenticationError(AppException):
    """Authentication related errors"""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=401,
            error_code="AUTHENTICATION_ERROR",
            details=details
        )

class AuthorizationError(AppException):
    """Authorization related errors"""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=403,
            error_code="AUTHORIZATION_ERROR",
            details=details
        )

def handle_exception(e: Exception) -> HTTPException:
    """Convert application exceptions to FastAPI HTTP exceptions"""
    if isinstance(e, AppException):
        logger.error(f"{e.error_code}: {e.message}", extra={"details": e.details})
        return HTTPException(
            status_code=e.status_code,
            detail={
                "error_code": e.error_code,
                "message": e.message,
                "details": e.details
            }
        )
    
    # Handle unexpected exceptions
    logger.error(f"Unexpected error: {str(e)}", exc_info=True)
    return HTTPException(
        status_code=500,
        detail={
            "error_code": "INTERNAL_ERROR",
            "message": "An unexpected error occurred",
            "details": {"error": str(e)}
        }
    )

def with_error_handling(func):
    """Decorator for handling exceptions in FastAPI endpoints"""
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            raise handle_exception(e)
    return wrapper
