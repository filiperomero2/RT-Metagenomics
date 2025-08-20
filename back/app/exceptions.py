from fastapi import HTTPException
from typing import Optional, Any

# Custom exception classes
class MetagenomicsError(Exception):
    """Base exception for metagenomics-related errors."""
    def __init__(self, message: str, error_code: Optional[str] = None):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)

class TaskNotFoundError(MetagenomicsError):
    """Raised when a metagenomics task is not found."""
    pass

class TaskExecutionError(MetagenomicsError):
    """Raised when a metagenomics task fails to execute."""
    pass

class ParameterValidationError(MetagenomicsError):
    """Raised when metagenomics parameters are invalid."""
    pass

class FileNotFoundError(MetagenomicsError):
    """Raised when required files are not found."""
    pass

# Error response model
class ErrorResponse:
    def __init__(self, error: str, message: str, error_code: Optional[str] = None, details: Optional[Any] = None):
        self.error = error
        self.message = message
        self.error_code = error_code
        self.details = details
    
    def dict(self):
        return {
            "error": self.error,
            "message": self.message,
            "error_code": self.error_code,
            "details": self.details
        }

# Exception to HTTP status code mapping
EXCEPTION_STATUS_CODES = {
    TaskNotFoundError: 404,
    TaskExecutionError: 500,
    ParameterValidationError: 400,
    FileNotFoundError: 404,
    MetagenomicsError: 500,
}

def create_http_exception(error: MetagenomicsError) -> HTTPException:
    """Convert custom exceptions to FastAPI HTTPException."""
    status_code = EXCEPTION_STATUS_CODES.get(type(error), 500)
    return HTTPException(
        status_code=status_code,
        detail=ErrorResponse(
            error=error.__class__.__name__,
            message=error.message,
            error_code=error.error_code
        ).dict()
    )

def handle_metagenomics_exception(exc: MetagenomicsError) -> HTTPException:
    """Global exception handler for metagenomics errors."""
    return create_http_exception(exc) 