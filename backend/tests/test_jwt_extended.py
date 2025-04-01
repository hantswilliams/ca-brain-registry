import requests
import json
import time
import jwt
from datetime import datetime, timedelta

# Base URL for the API
BASE_URL = "http://localhost:5005"

# Test data for different user roles
admin_user = {
    "username": f"admin_{int(time.time())}",
    "email": f"admin_{int(time.time())}@example.com",
    "password": "AdminPass123",
    "first_name": "Admin",
    "last_name": "User",
    "roles": ["admin"]
}

regular_user = {
    "username": f"user_{int(time.time())}",
    "email": f"user_{int(time.time())}@example.com",
    "password": "UserPass123",
    "first_name": "Regular",
    "last_name": "User",
    "roles": ["user"]
}

researcher_user = {
    "username": f"researcher_{int(time.time())}",
    "email": f"researcher_{int(time.time())}@example.com",
    "password": "ResearchPass123",
    "first_name": "Research",
    "last_name": "User",
    "roles": ["researcher"]
}

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def print_success(message):
    print(f"{Colors.GREEN}[SUCCESS] {message}{Colors.RESET}")

def print_error(message):
    print(f"{Colors.RED}[ERROR] {message}{Colors.RESET}")

def print_info(message):
    print(f"{Colors.YELLOW}[INFO] {message}{Colors.RESET}")

def print_test(message):
    print(f"{Colors.BLUE}[TEST] {message}{Colors.RESET}")

def register_user(user_data):
    """Register a user and return True if successful"""
    print_info(f"Registering user {user_data['username']}...")
    
    response = requests.post(
        f"{BASE_URL}/auth/register",
        json=user_data
    )
    
    if response.status_code == 201:
        print_success(f"User {user_data['username']} registered successfully")
        return True
    else:
        print_error(f"Failed to register user {user_data['username']}: {response.status_code} - {response.text}")
        return False

def login_user(username, password):
    """Login a user and return the token if successful"""
    print_info(f"Logging in as {username}...")
    
    login_data = {
        "username": username,
        "password": password
    }
    
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json=login_data
    )
    
    if response.status_code == 200:
        token_data = response.json()
        print_success(f"User {username} logged in successfully")
        return token_data
    else:
        print_error(f"Failed to login as {username}: {response.status_code} - {response.text}")
        return None

def decode_token(token):
    """Decode JWT token without verification to examine contents"""
    try:
        # Decode without verification just to see the content
        decoded = jwt.decode(token, options={"verify_signature": False}, algorithms=["HS256"])
        return decoded
    except Exception as e:
        print_error(f"Error decoding token: {str(e)}")
        return None

def test_token_content(token):
    """Test the content of the JWT token"""
    print_test("Testing token content...")
    
    decoded = decode_token(token)
    if not decoded:
        return False
    
    # Check if token has required claims
    required_claims = ['sub', 'iat', 'exp', 'username', 'roles']
    for claim in required_claims:
        if claim not in decoded:
            print_error(f"Token missing required claim: {claim}")
            return False
    
    print_success("Token contains all required claims")
    print_info(f"Token subject (user ID): {decoded['sub']}")
    print_info(f"Token username: {decoded['username']}")
    print_info(f"Token roles: {decoded['roles']}")
    print_info(f"Token expiration: {datetime.fromtimestamp(decoded['exp']).strftime('%Y-%m-%d %H:%M:%S')}")
    
    return True

def test_token_expiration(token):
    """Test token expiration by examining the exp claim"""
    print_test("Testing token expiration...")
    
    decoded = decode_token(token)
    if not decoded:
        return False
    
    exp_time = datetime.fromtimestamp(decoded['exp'])
    now = datetime.now()
    time_to_expiry = exp_time - now
    
    print_info(f"Token expires in {time_to_expiry.total_seconds()} seconds")
    
    if time_to_expiry > timedelta(0):
        print_success("Token is not expired")
        return True
    else:
        print_error("Token is already expired")
        return False

def test_token_roles(token, expected_roles):
    """Test that the token contains the expected roles"""
    print_test(f"Testing token roles (expecting {expected_roles})...")
    
    decoded = decode_token(token)
    if not decoded:
        return False
    
    if 'roles' not in decoded:
        print_error("Token does not contain roles claim")
        return False
    
    token_roles = decoded['roles']
    for role in expected_roles:
        if role not in token_roles:
            print_error(f"Token missing expected role: {role}")
            return False
    
    print_success(f"Token contains all expected roles: {token_roles}")
    return True

def test_access_with_token(token, endpoint, expected_status=200):
    """Test accessing an endpoint with the provided token"""
    print_test(f"Testing access to {endpoint} with token...")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    response = requests.get(
        f"{BASE_URL}{endpoint}",
        headers=headers
    )
    
    if response.status_code == expected_status:
        print_success(f"Got expected status code {expected_status} from {endpoint}")
        return True
    else:
        print_error(f"Unexpected status code {response.status_code} (expected {expected_status}) from {endpoint}")
        return False

def run_extended_jwt_tests():
    """Run comprehensive JWT authentication tests"""
    print_info("Starting comprehensive JWT authentication tests...")
    
    # Register users with different roles
    if not register_user(admin_user):
        print_error("Failed to register admin user, aborting tests.")
        return
    
    if not register_user(regular_user):
        print_error("Failed to register regular user, aborting tests.")
        return
    
    if not register_user(researcher_user):
        print_error("Failed to register researcher user, aborting tests.")
        return
    
    # Login as admin
    admin_token_data = login_user(admin_user["username"], admin_user["password"])
    if not admin_token_data:
        print_error("Failed to login as admin, aborting tests.")
        return
    
    # Login as regular user
    user_token_data = login_user(regular_user["username"], regular_user["password"])
    if not user_token_data:
        print_error("Failed to login as regular user, aborting tests.")
        return
    
    # Login as researcher
    researcher_token_data = login_user(researcher_user["username"], researcher_user["password"])
    if not researcher_token_data:
        print_error("Failed to login as researcher, aborting tests.")
        return
    
    # Test token content
    admin_token = admin_token_data["access_token"]
    user_token = user_token_data["access_token"]
    researcher_token = researcher_token_data["access_token"]
    
    test_token_content(admin_token)
    test_token_expiration(admin_token)
    test_token_roles(admin_token, ["admin"])
    
    test_token_content(user_token)
    test_token_roles(user_token, ["user"])
    
    test_token_content(researcher_token)
    test_token_roles(researcher_token, ["researcher"])
    
    # Test accessing endpoints with different tokens
    test_access_with_token(admin_token, "/patients/")
    test_access_with_token(user_token, "/patients/")
    test_access_with_token(researcher_token, "/patients/")
    
    # Test with invalid token
    test_access_with_token("invalid_token", "/patients/", expected_status=401)
    
    print_info("Comprehensive JWT authentication tests completed.")

if __name__ == "__main__":
    run_extended_jwt_tests()