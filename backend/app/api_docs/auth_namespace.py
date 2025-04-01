from flask_restx import Namespace, Resource, fields
from flask import request
from app.services.auth_service import auth_service
from app.schemas import UserCreate, UserLogin, TokenResponse, UserResponse

# Create a namespace for authentication endpoints
auth_ns = Namespace('auth', description='Authentication operations')

# Define models for request and response documentation
user_create_model = auth_ns.model('UserCreate', {
    'username': fields.String(required=True, description="User's username"),
    'email': fields.String(required=True, description="User's email address"),
    'password': fields.String(required=True, description="User's password"),
    'first_name': fields.String(required=False, description="User's first name"),
    'last_name': fields.String(required=False, description="User's last name"),
    'roles': fields.List(fields.String, required=False, description="List of role names to assign to the user")
})

user_login_model = auth_ns.model('UserLogin', {
    'username': fields.String(required=True, description="User's username or email"),
    'password': fields.String(required=True, description="User's password")
})

user_response_model = auth_ns.model('UserResponse', {
    'id': fields.Integer(description="User's unique identifier"),
    'username': fields.String(description="User's username"),
    'email': fields.String(description="User's email address"),
    'first_name': fields.String(description="User's first name"),
    'last_name': fields.String(description="User's last name"),
    'is_active': fields.Boolean(description="Whether the user account is active"),
    'created_at': fields.DateTime(description="When the user was created"),
    'last_login': fields.DateTime(description="Last login timestamp"),
    'roles': fields.List(fields.String, description="List of user's roles")
})

token_response_model = auth_ns.model('TokenResponse', {
    'access_token': fields.String(description="JWT access token"),
    'token_type': fields.String(description="Token type (bearer)"),
    'expires_in': fields.Integer(description="Token expiration time in seconds"),
    'user': fields.Nested(user_response_model, description="User information")
})

error_model = auth_ns.model('ErrorResponse', {
    'error': fields.String(description="Error message")
})

# Define routes and their documentation
@auth_ns.route('/register')
class Register(Resource):
    @auth_ns.doc('register_user', responses={
        201: 'User created successfully',
        400: 'Validation error',
        500: 'Server error'
    })
    @auth_ns.expect(user_create_model)
    @auth_ns.marshal_with(user_response_model, code=201)
    @auth_ns.response(400, 'Validation Error', error_model)
    def post(self):
        """Register a new user"""
        data = request.json
        user, status_code = auth_service.register_user(data)
        
        if status_code != 201:
            return user, status_code
            
        from app.schemas import UserResponse
        return UserResponse.model_validate(user).model_dump(), 201

@auth_ns.route('/login')
class Login(Resource):
    @auth_ns.doc('login_user', responses={
        200: 'Login successful',
        401: 'Invalid credentials',
        400: 'Validation error',
        500: 'Server error'
    })
    @auth_ns.expect(user_login_model)
    @auth_ns.marshal_with(token_response_model, code=200)
    @auth_ns.response(401, 'Invalid username or password', error_model)
    def post(self):
        """Authenticate a user and return a JWT token"""
        data = request.json
        
        user = auth_service.authenticate_user(data.get('username'), data.get('password'))
        
        if not user:
            auth_ns.abort(401, "Invalid username or password")
            
        token_data = auth_service.generate_token(user)
        
        from app.schemas import TokenResponse, UserResponse
        token_response = TokenResponse(
            access_token=token_data["access_token"],
            token_type=token_data["token_type"],
            expires_in=token_data["expires_in"],
            user=UserResponse.model_validate(user)
        )
        
        return token_response.model_dump()

@auth_ns.route('/me')
class CurrentUser(Resource):
    @auth_ns.doc('get_current_user', responses={
        200: 'User information retrieved successfully',
        401: 'Authentication required',
        500: 'Server error'
    })
    @auth_ns.marshal_with(user_response_model)
    @auth_ns.response(401, 'Authentication required', error_model)
    def get(self):
        """Get details of the currently authenticated user (requires JWT token)"""
        # Note: Actual implementation uses JWT middleware that's not applied here
        # This documentation is for reference only
        auth_ns.abort(401, "Authentication required - add Bearer token to Authorization header")
        
        # The following code won't be reached in this Swagger UI context
        # but represents what happens in the actual endpoint
        from flask import g
        user = getattr(g, 'current_user', None)
        if not user:
            auth_ns.abort(401, "Authentication required")
            
        from app.schemas import UserResponse
        return UserResponse.model_validate(user).model_dump()