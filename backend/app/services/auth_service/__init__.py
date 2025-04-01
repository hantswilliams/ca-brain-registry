import logging
from typing import Dict, Optional, Tuple, Any, Union
from datetime import datetime, timedelta
import jwt
from flask import current_app

from app.models import User
from app.services.base_service import BaseService
from app.repositories.user_repository import UserRepository
from app.repositories.role_repository import RoleRepository

# Configure logging
logger = logging.getLogger(__name__)

class AuthService(BaseService[User, UserRepository]):
    """Service for authentication-related operations"""
    
    def __init__(self, user_repository: Optional[UserRepository] = None, role_repository: Optional[RoleRepository] = None):
        """Initialize with repositories using dependency injection"""
        super().__init__(user_repository or UserRepository())
        self.role_repository = role_repository or RoleRepository()
    
    @BaseService.handle_service_exceptions
    def register_user(self, user_data: Dict[str, Any]) -> Tuple[Union[Dict[str, Any], User], int]:
        """Register a new user"""
        # Extract role names if present
        role_names = user_data.pop('roles', ['user'])  # Default to 'user' role
        
        # Log the roles being assigned
        logger.info(f"Registering user with roles: {role_names}")
        
        # Set password hash
        password = user_data.pop('password')
        user = User(**user_data)
        user.set_password(password)
        
        # Use repository to create user with roles
        user_dict = {
            'username': user.username,
            'email': user.email,
            'password_hash': user.password_hash,
            'first_name': user.first_name,
            'last_name': user.last_name
        }
        
        # Create the user with specified roles
        created_user = self.repository.create_with_roles(user_dict, role_names)
        
        if not created_user:
            logger.warning(f"Failed to create user. Username or email already exists: {user.username}, {user.email}")
            return {"error": "Username or email already exists"}, 400
        
        # Check if roles were properly assigned
        assigned_roles = [role.name for role in created_user.roles]
        logger.info(f"User created with roles: {assigned_roles}")
        
        # If no roles were assigned, try to add them manually
        if not assigned_roles and role_names:
            logger.warning(f"No roles were assigned automatically. Trying manual assignment...")
            for role_name in role_names:
                role = self.role_repository.find_by_name(role_name)
                if role:
                    created_user.roles.append(role)
            
            self.repository.session.commit()
            logger.info(f"After manual assignment, user has roles: {[r.name for r in created_user.roles]}")
            
        return created_user, 201
    
    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        """Authenticate a user by username/email and password"""
        logger.debug(f"Attempting to authenticate user: {username}")
        
        # Try to find by username
        user = self.repository.find_by_username(username)
        
        # If not found, try by email
        if not user:
            logger.debug(f"User not found by username, trying email")
            user = self.repository.find_by_email(username)
            
        # Check password if user exists
        if user and user.check_password(password):
            logger.info(f"User authenticated successfully: {username} (ID: {user.id})")
            # Update last login
            self.repository.update_last_login(user.id)
            return user
        
        if user:
            logger.warning(f"Failed authentication attempt for user: {username} - Invalid password")
        else:
            logger.warning(f"Failed authentication attempt - User not found: {username}")
            
        return None
    
    @BaseService.handle_service_exceptions
    def generate_token(self, user: User, expires_in: int = 86400) -> Dict[str, Any]:
        """Generate JWT token for authenticated user"""
        # Get config secret key
        from app.config import Config
        secret_key = Config.SECRET_KEY
        
        # Log token generation info with limited sensitive data
        logger.info(f"Generating token for user: {user.username} (ID: {user.id})")
        
        # Generate token
        now = datetime.utcnow()
        payload = {
            'sub': str(user.id),  # Convert ID to string to avoid JWT validation issues
            'iat': now,
            'exp': now + timedelta(seconds=expires_in),
            'username': user.username,
            'roles': [role.name for role in user.roles]
        }
        
        token = jwt.encode(
            payload,
            secret_key,
            algorithm='HS256'
        )
        
        # If token is returned as bytes, convert to string
        if isinstance(token, bytes):
            token = token.decode('utf-8')
            
        logger.info(f"Token generated successfully for user: {user.username}")
            
        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_in": expires_in,
            "user": user
        }

# Create instance for easier imports with default repositories
auth_service = AuthService()