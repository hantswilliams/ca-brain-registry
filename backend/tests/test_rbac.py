import requests
import json
import time
import random

# Base URL for the API
BASE_URL = "http://localhost:5005"

# Test data with timestamp to avoid duplicate usernames
timestamp = int(time.time())

# Users with different roles
test_users = {
    "admin": {
        "username": f"admin_{timestamp}",
        "email": f"admin_{timestamp}@example.com",
        "password": "AdminPass123",
        "first_name": "Admin",
        "last_name": "User",
        "roles": ["admin"]
    },
    "user": {
        "username": f"user_{timestamp}",
        "email": f"user_{timestamp}@example.com",
        "password": "UserPass123",
        "first_name": "Regular",
        "last_name": "User",
        "roles": ["user"]
    },
    "researcher": {
        "username": f"researcher_{timestamp}",
        "email": f"researcher_{timestamp}@example.com",
        "password": "ResearchPass123",
        "first_name": "Research",
        "last_name": "User",
        "roles": ["researcher"]
    }
}

# Test resources
test_patient = {
    "name": f"Test Patient {random.randint(1000, 9999)}",
    "birth_date": "1980-01-01",
    "gender": "male"
}

test_condition = {
    "condition_code": f"TEST-{random.randint(1000, 9999)}",
    "onset_date": "2023-01-01",
    "status": "active",
    "patient_id": None  # Will be filled in after patient creation
}

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    RESET = '\033[0m'

def print_success(message):
    print(f"{Colors.GREEN}[SUCCESS] {message}{Colors.RESET}")

def print_error(message):
    print(f"{Colors.RED}[ERROR] {message}{Colors.RESET}")

def print_info(message):
    print(f"{Colors.YELLOW}[INFO] {message}{Colors.RESET}")

def print_role(message):
    print(f"{Colors.CYAN}[ROLE] {message}{Colors.RESET}")

def register_and_login(role):
    """Register and login a user with the specified role"""
    user_data = test_users[role]
    print_role(f"Setting up {role} user: {user_data['username']}")
    
    # Register
    response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
    if response.status_code != 201:
        print_error(f"Failed to register {role} user: {response.status_code} - {response.text}")
        return None
    
    print_success(f"Registered {role} user: {user_data['username']}")
    
    # Login
    login_data = {
        "username": user_data["username"],
        "password": user_data["password"]
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code != 200:
        print_error(f"Failed to login as {role} user: {response.status_code} - {response.text}")
        return None
    
    token_data = response.json()
    print_success(f"Logged in as {role} user")
    
    return token_data["access_token"]

def test_create_patient(token):
    """Test creating a patient with the given token"""
    print_info("Testing patient creation...")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/patients/", json=test_patient, headers=headers)
    
    if response.status_code == 201:
        print_success("Successfully created patient")
        # Debug the response content
        print_info(f"Response content: {response.text}")
        patient_data = response.json()
        patient_id = patient_data.get("id") or patient_data.get("patient_id")
        if patient_id:
            print_info(f"Created patient with ID: {patient_id}")
            return patient_id
        else:
            print_error("Created patient but couldn't extract patient ID from response")
            print_info(f"Response keys: {list(patient_data.keys())}")
            return 1  # Return a fallback ID to continue tests
    else:
        print_error(f"Failed to create patient: {response.status_code} - {response.text}")
        return None

def test_get_patients(token, expected_status=200):
    """Test getting patients list with the given token"""
    print_info("Testing patient list access...")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/patients/", headers=headers)
    
    if response.status_code == expected_status:
        print_success(f"Got expected status code {expected_status} for patients list")
        return True
    else:
        print_error(f"Unexpected status code {response.status_code} for patients list")
        return False

def test_create_condition(token, patient_id, expected_status=201):
    """Test creating a condition with the given token"""
    print_info("Testing condition creation...")
    
    # Update condition data with patient ID
    condition_data = test_condition.copy()
    condition_data["patient_id"] = patient_id
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/conditions/", json=condition_data, headers=headers)
    
    if response.status_code == expected_status:
        print_success(f"Got expected status code {expected_status} for condition creation")
        return True
    else:
        print_error(f"Unexpected status code {response.status_code} for condition creation")
        return False

def check_sync_status(token, patient_id, max_retries=3, retry_delay=5):
    """Check if a patient has been synchronized with the FHIR server"""
    print_info(f"Checking FHIR synchronization status for patient {patient_id}...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    for attempt in range(max_retries):
        # Wait for sync to potentially complete
        print_info(f"Waiting {retry_delay} seconds for sync to complete (attempt {attempt+1}/{max_retries})...")
        time.sleep(retry_delay)
        
        # Check patient details
        response = requests.get(f"{BASE_URL}/patients/{patient_id}", headers=headers)
        
        if response.status_code != 200:
            print_error(f"Failed to get patient details: {response.status_code} - {response.text}")
            continue
        
        patient_data = response.json()
        print_info(f"Patient data: {json.dumps(patient_data, indent=2)}")
        
        # Check sync status
        if patient_data.get("fhir_id") and patient_data.get("sync_status") == "success":
            print_success(f"Patient successfully synchronized with FHIR server")
            print_info(f"FHIR ID: {patient_data.get('fhir_id')}")
            print_info(f"Synced at: {patient_data.get('synced_at')}")
            return True
        
        print_info(f"Current sync status: {patient_data.get('sync_status', 'unknown')}")
    
    print_error(f"Patient not synchronized after {max_retries} attempts")
    return False

def test_rbac_scenarios():
    """Test various role-based access control scenarios"""
    print_info("Starting RBAC tests...")
    
    # Setup users with different roles
    admin_token = register_and_login("admin")
    user_token = register_and_login("user")
    researcher_token = register_and_login("researcher")
    
    if not all([admin_token, user_token, researcher_token]):
        print_error("Failed to set up test users, aborting tests.")
        return
    
    # Test scenario 1: Admin should be able to create and view patients
    print_role("Testing ADMIN permissions")
    admin_patient_id = test_create_patient(admin_token)
    test_get_patients(admin_token)
    
    if not admin_patient_id:
        print_error("Admin couldn't create patient, aborting subsequent tests.")
        return
    
    # Check FHIR sync status for admin-created patient
    print_role("Checking FHIR sync for admin-created patient")
    check_sync_status(admin_token, admin_patient_id)
    
    # Test scenario 2: Regular user should be able to view patients but may have restricted creation rights
    print_role("Testing USER permissions")
    user_patient_id = test_create_patient(user_token)
    test_get_patients(user_token)
    
    # Check FHIR sync status for user-created patient
    if user_patient_id:
        print_role("Checking FHIR sync for user-created patient")
        check_sync_status(user_token, user_patient_id)
    
    # Test scenario 3: Researcher should be able to view patients but may have different access patterns
    print_role("Testing RESEARCHER permissions")
    test_get_patients(researcher_token)
    
    # Test condition creation
    if admin_patient_id:
        print_role("Testing ADMIN condition creation")
        test_create_condition(admin_token, admin_patient_id)
    
    if user_patient_id:
        print_role("Testing USER condition creation")
        test_create_condition(user_token, user_patient_id)
    
    # Test cross-user access (if your system restricts access based on ownership)
    if admin_patient_id and user_token:
        print_role("Testing cross-user condition creation")
        test_create_condition(user_token, admin_patient_id, expected_status=201)  # Might be 403 if you restrict by ownership
    
    print_info("RBAC tests completed.")

if __name__ == "__main__":
    test_rbac_scenarios()