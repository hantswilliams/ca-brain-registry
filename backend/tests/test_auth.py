import requests
import json
import time
import jwt  # Add PyJWT for token inspection

# Base URL for the API
BASE_URL = "http://localhost:5005"

# Test data
test_user = {
    "username": f"testuser_{int(time.time())}",  # Use timestamp to avoid conflicts
    "email": f"testuser_{int(time.time())}@example.com",
    "password": "TestPass123",
    "first_name": "Test",
    "last_name": "User",
    "roles": ["user"]  # Add default user role
}

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[96m'
    RESET = '\033[0m'

def print_success(message):
    print(f"{Colors.GREEN}[SUCCESS] {message}{Colors.RESET}")

def print_error(message):
    print(f"{Colors.RED}[ERROR] {message}{Colors.RESET}")

def print_info(message):
    print(f"{Colors.YELLOW}[INFO] {message}{Colors.RESET}")

def print_debug(message):
    print(f"{Colors.BLUE}[DEBUG] {message}{Colors.RESET}")

def test_user_registration():
    """Test user registration endpoint"""
    print_info("Testing user registration...")
    
    response = requests.post(
        f"{BASE_URL}/auth/register",
        json=test_user
    )
    
    if response.status_code == 201:
        print_success(f"User registered successfully: {response.json()}")
        return True
    else:
        print_error(f"Failed to register user: {response.status_code} - {response.text}")
        return False

def test_user_login():
    """Test user login endpoint"""
    print_info("Testing user login...")
    
    login_data = {
        "username": test_user["username"],
        "password": test_user["password"]
    }
    
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json=login_data
    )
    
    if response.status_code == 200:
        token_data = response.json()
        print_success(f"User logged in successfully")
        print_info(f"Token type: {token_data['token_type']}")
        print_info(f"Expires in: {token_data['expires_in']} seconds")
        
        # Debug: Decode token to see its contents
        try:
            token = token_data["access_token"]
            decoded = jwt.decode(token, options={"verify_signature": False}, algorithms=["HS256"])
            print_debug(f"TOKEN CONTENTS: {json.dumps(decoded, indent=2)}")
        except Exception as e:
            print_error(f"Error decoding token: {str(e)}")
        
        return token_data["access_token"]
    else:
        print_error(f"Failed to login: {response.status_code} - {response.text}")
        return None

def test_protected_endpoint(token):
    """Test accessing a protected endpoint with JWT token"""
    print_info("Testing access to protected endpoint...")
    
    # Use patients endpoint as test
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    print_debug(f"Using Authorization header: Bearer {token[:15]}...")
    
    response = requests.get(
        f"{BASE_URL}/patients/",
        headers=headers
    )
    
    if response.status_code == 200:
        print_success("Successfully accessed protected endpoint")
        return True
    else:
        print_error(f"Failed to access protected endpoint: {response.status_code} - {response.text}")
        return False

def test_invalid_token():
    """Test accessing a protected endpoint with invalid token"""
    print_info("Testing access with invalid token...")
    
    headers = {
        "Authorization": "Bearer invalid_token_here"
    }
    
    response = requests.get(
        f"{BASE_URL}/patients/",
        headers=headers
    )
    
    if response.status_code == 401:
        print_success("Correctly rejected invalid token")
        return True
    else:
        print_error(f"Unexpected response with invalid token: {response.status_code} - {response.text}")
        return False

def verify_token_manually(token, secret_key="dev-secret-key-change-in-production"):
    """Manually verify a token using PyJWT to debug validation issues"""
    print_info("Manually verifying token...")
    
    try:
        # First decode without verification
        unverified_payload = jwt.decode(
            token, 
            options={"verify_signature": False},
            algorithms=["HS256"]
        )
        print_debug(f"Token claims (unverified): {json.dumps(unverified_payload, indent=2)}")
        
        # Now try to verify with the secret key
        verified_payload = jwt.decode(
            token,
            secret_key,
            algorithms=["HS256"]
        )
        print_success("Token verified successfully!")
        print_debug(f"Verified payload: {json.dumps(verified_payload, indent=2)}")
        return True
    except jwt.ExpiredSignatureError:
        print_error("Token has expired")
        return False
    except jwt.InvalidTokenError as e:
        print_error(f"Token is invalid: {str(e)}")
        return False
    except Exception as e:
        print_error(f"Unexpected error: {str(e)}")
        return False

def run_auth_tests():
    """Run all authentication tests"""
    print_info("Starting authentication tests...")
    
    # Test 1: Register a new user
    registration_success = test_user_registration()
    if not registration_success:
        print_error("User registration failed, skipping remaining tests.")
        return
    
    # Test 2: Login with the new user
    token = test_user_login()
    if not token:
        print_error("User login failed, skipping remaining tests.")
        return
    
    # Debug: Print raw token for inspection
    print_debug(f"Raw token: {token}")
    
    # Debug: Try to verify the token manually
    verify_token_manually(token)
    
    # Test 3: Access protected endpoint with valid token
    test_protected_endpoint(token)
    
    # Test 4: Access protected endpoint with invalid token
    test_invalid_token()
    
    print_info("Authentication tests completed.")

if __name__ == "__main__":
    run_auth_tests()