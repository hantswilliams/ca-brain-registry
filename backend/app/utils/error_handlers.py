import logging
from typing import Dict, Any, Tuple, Union, List
from flask import jsonify

# Configure logging
logger = logging.getLogger(__name__)

class ErrorCode:
    """Standardized error codes for the API"""
    VALIDATION_ERROR = "VALIDATION_ERROR"
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND"
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR"
    AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR"
    DATABASE_ERROR = "DATABASE_ERROR"
    FHIR_SYNC_ERROR = "FHIR_SYNC_ERROR"
    INTERNAL_ERROR = "INTERNAL_ERROR"

def format_validation_errors(errors: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Format pydantic validation errors into a standardized structure"""
    formatted_errors = []
    
    for error in errors:
        formatted_errors.append({
            "field": ".".join(str(loc) for loc in error.get("loc", [])),
            "message": error.get("msg", ""),
            "type": error.get("type", "")
        })
        
    return formatted_errors

def create_error_response(
    message: str, 
    code: str = ErrorCode.INTERNAL_ERROR, 
    status_code: int = 500,
    details: Any = None
) -> Tuple[Dict[str, Any], int]:
    """
    Create a standardized error response for the API
    
    Args:
        message: User-friendly error message
        code: Error code from ErrorCode class
        status_code: HTTP status code
        details: Additional error details (optional)
        
    Returns:
        Tuple with error response dict and HTTP status code
    """
    error_response = {
        "error": {
            "code": code,
            "message": message
        }
    }
    
    if details:
        error_response["error"]["details"] = details
        
    logger.debug(f"Creating error response: {code} - {message} (Status: {status_code})")
    return jsonify(error_response), status_code

def validation_error(errors: List[Dict[str, Any]]) -> Tuple[Dict[str, Any], int]:
    """
    Create a validation error response
    
    Args:
        errors: List of validation error details
        
    Returns:
        Standardized validation error response
    """
    formatted_errors = format_validation_errors(errors)
    logger.warning(f"Validation error: {formatted_errors}")
    return create_error_response(
        message="Validation error - check 'details' for more information",
        code=ErrorCode.VALIDATION_ERROR,
        status_code=400,
        details=formatted_errors
    )

def not_found_error(resource_type: str, resource_id: Any = None) -> Tuple[Dict[str, Any], int]:
    """
    Create a not found error response
    
    Args:
        resource_type: Type of resource that wasn't found (e.g., 'Patient')
        resource_id: ID of the resource (optional)
        
    Returns:
        Standardized not found error response
    """
    message = f"{resource_type} not found"
    if resource_id is not None:
        message = f"{resource_type} with ID {resource_id} not found"
        
    logger.info(f"Resource not found: {message}")
    return create_error_response(
        message=message,
        code=ErrorCode.RESOURCE_NOT_FOUND,
        status_code=404
    )

def auth_error(message: str = "Authentication required") -> Tuple[Dict[str, Any], int]:
    """
    Create an authentication error response
    
    Args:
        message: Authentication error message
        
    Returns:
        Standardized authentication error response
    """
    logger.warning(f"Authentication error: {message}")
    return create_error_response(
        message=message,
        code=ErrorCode.AUTHENTICATION_ERROR,
        status_code=401
    )

def permission_error(message: str = "Insufficient permissions") -> Tuple[Dict[str, Any], int]:
    """
    Create a permission (authorization) error response
    
    Args:
        message: Permission error message
        
    Returns:
        Standardized authorization error response
    """
    logger.warning(f"Permission error: {message}")
    return create_error_response(
        message=message,
        code=ErrorCode.AUTHORIZATION_ERROR,
        status_code=403
    )

def server_error(message: str = "Internal server error", exc: Exception = None) -> Tuple[Dict[str, Any], int]:
    """
    Create a server error response
    
    Args:
        message: Error message
        exc: Exception that caused the error (optional)
        
    Returns:
        Standardized server error response
    """
    if exc:
        logger.error(f"Server error: {message} - {str(exc)}", exc_info=True)
    else:
        logger.error(f"Server error: {message}")
        
    return create_error_response(
        message=message,
        code=ErrorCode.INTERNAL_ERROR,
        status_code=500
    )