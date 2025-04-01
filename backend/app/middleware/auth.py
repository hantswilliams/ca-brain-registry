import logging
from functools import wraps
from typing import Callable, Optional, Dict, Any
from flask import request, jsonify, g, current_app
import jwt

from app.models import User
from app.utils import auth_error, permission_error

# Configure logging
logger = logging.getLogger(__name__)

def get_token_from_header() -> Optional[str]:
    """Extract token from Authorization header"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        logger.debug("No Authorization header found in request")
        return None
    
    parts = auth_header.split()
    if parts[0].lower() != 'bearer':
        logger.debug(f"Authorization header format is invalid: {auth_header[:15]}...")
        return None
    
    if len(parts) == 1:
        logger.debug("Bearer token is missing")
        return None
    
    if len(parts) > 2:
        logger.debug("Authorization header has too many parts")
        return None
    
    return parts[1]

def jwt_required(f: Callable) -> Callable:
    """Decorator to protect routes with JWT authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_header()
        
        if not token:
            logger.warning("Authentication failed: No token provided in request")
            return auth_error("Missing authorization token")
        
        try:
            # Get the secret key from config
            from app.config import Config
            secret_key = Config.SECRET_KEY
            
            # Decode and verify token
            payload = jwt.decode(token, secret_key, algorithms=['HS256'])
            user_id = int(payload['sub'])  # Convert string ID back to integer
            
            # Fetch user directly 
            user = User.query.get(user_id)
            
            if not user:
                logger.warning(f"Authentication failed: User with ID {user_id} not found")
                return auth_error("User not found")
                
            logger.debug(f"Authentication successful: User {user.username} (ID: {user_id})")
            
            # Set current user in Flask's g object for access in route handlers
            g.current_user = user
            
            return f(*args, **kwargs)
            
        except jwt.ExpiredSignatureError:
            logger.warning("Authentication failed: Token has expired")
            return auth_error("Token has expired")
        except jwt.InvalidTokenError as e:
            logger.warning(f"Authentication failed: Invalid token - {str(e)}")
            return auth_error("Invalid token")
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}", exc_info=True)
            return auth_error("Authentication error")
    
    return decorated

def has_role(required_role: str) -> Callable:
    """Decorator to check if user has required role"""
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated(*args, **kwargs):
            # First check if authenticated
            if not hasattr(g, 'current_user'):
                logger.warning("Role check failed: No authenticated user")
                return auth_error("Authentication required")
            
            # Check if user has the required role
            if not g.current_user.has_role(required_role):
                logger.warning(f"Permission denied: User {g.current_user.username} lacks required role '{required_role}'")
                return permission_error(f"Role '{required_role}' required")
            
            logger.debug(f"Role check passed: User {g.current_user.username} has required role '{required_role}'")
            return f(*args, **kwargs)
        return decorated
    return decorator

def has_any_role(roles: list) -> Callable:
    """Decorator to check if user has any of the specified roles"""
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated(*args, **kwargs):
            # First check if authenticated
            if not hasattr(g, 'current_user'):
                logger.warning("Role check failed: No authenticated user")
                return auth_error("Authentication required")
            
            # Check if user has any of the required roles
            user_roles = [role.name for role in g.current_user.roles]
            if not any(role in user_roles for role in roles):
                logger.warning(f"Permission denied: User {g.current_user.username} lacks any required role from {roles}")
                return permission_error(f"One of these roles required: {', '.join(roles)}")
            
            matching_roles = [role for role in roles if role in user_roles]
            logger.debug(f"Role check passed: User {g.current_user.username} has roles {matching_roles}")
            return f(*args, **kwargs)
        return decorated
    return decorator