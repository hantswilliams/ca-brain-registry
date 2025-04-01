import logging
from flask import Blueprint, request, jsonify, g
from typing import Dict, Any

from app.services.auth_service import auth_service
from app.schemas import UserCreate, UserLogin, TokenResponse, UserResponse
from pydantic import ValidationError
from app.middleware.auth import jwt_required, has_role

# Configure logging
logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.json
        logger.debug("Received user registration request")
        
        # Validate request data with Pydantic
        user_data = UserCreate(**data)
        logger.debug(f"Registering user with username: {user_data.username}")
        
        # Register user with auth service
        user, status_code = auth_service.register_user(user_data.model_dump())
        
        if status_code != 201:
            logger.warning(f"User registration failed: {user}")
            return jsonify(user), status_code
        
        logger.info(f"User registered successfully: {user.username} (ID: {user.id})")
        # Return user data
        return jsonify(UserResponse.model_validate(user).model_dump()), 201
    except ValidationError as e:
        logger.warning(f"Validation error during user registration: {e.errors()}")
        return jsonify({"error": e.errors()}), 400
    except Exception as e:
        logger.error(f"Unexpected error during user registration: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate a user and return a JWT token"""
    try:
        data = request.json
        logger.debug("Received login request")
        
        # Validate request data with Pydantic
        login_data = UserLogin(**data)
        logger.debug(f"Attempting login for username: {login_data.username}")
        
        # Authenticate user
        user = auth_service.authenticate_user(login_data.username, login_data.password)
        
        if not user:
            logger.warning(f"Failed login attempt for username: {login_data.username}")
            return jsonify({"error": "Invalid username or password"}), 401
        
        # Generate token
        logger.debug(f"Generating token for user: {user.username}")
        token_data = auth_service.generate_token(user)
        
        # Create response
        token_response = TokenResponse(
            access_token=token_data["access_token"],
            token_type=token_data["token_type"],
            expires_in=token_data["expires_in"],
            user=UserResponse.model_validate(user)
        )
        
        logger.info(f"User logged in successfully: {user.username} (ID: {user.id})")
        return jsonify(token_response.model_dump()), 200
    except ValidationError as e:
        logger.warning(f"Validation error during login: {e.errors()}")
        return jsonify({"error": e.errors()}), 400
    except Exception as e:
        logger.error(f"Unexpected error during login: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required
def get_current_user():
    """Get details of the currently authenticated user"""
    try:
        logger.debug(f"Retrieving current user info for: {g.current_user.username}")
        return jsonify(UserResponse.model_validate(g.current_user).model_dump()), 200
    except Exception as e:
        logger.error(f"Error retrieving user info: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500

@auth_bp.route('/test', methods=['GET'])
@jwt_required
def test_auth():
    """Simple endpoint to test authentication without complex database operations"""
    try:
        logger.debug(f"Authentication test for user: {g.current_user.username}")
        return jsonify({
            "message": "Authentication successful",
            "user_id": g.current_user.id,
            "username": g.current_user.username,
            "roles": [role.name for role in g.current_user.roles]
        })
    except Exception as e:
        logger.error(f"Error in auth test: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500