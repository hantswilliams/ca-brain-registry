import requests
import json
import time

# Base URLs
BASE_URL = "http://127.0.0.1:5005"  # adjust if Flask is running elsewhere
FHIR_URL = "http://localhost:8091/fhir"  # HAPI-FHIR server

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[96m'
    RESET = '\033[0m'

def print_success(message):
    print(f"{Colors.GREEN}{message}{Colors.RESET}")

def print_error(message):
    print(f"{Colors.RED}{message}{Colors.RESET}")

def print_info(message):
    print(f"{Colors.YELLOW}{message}{Colors.RESET}")

def print_debug(message):
    print(f"{Colors.BLUE}{message}{Colors.RESET}")

# Test user credentials
test_user = {
    "username": f"testuser_{int(time.time())}",  # Use timestamp to avoid conflicts
    "email": f"testuser_{int(time.time())}@example.com",
    "password": "TestPass123",
    "first_name": "Test",
    "last_name": "User",
    "roles": ["user"]
}

def register_and_login():
    """Register a new test user and get authentication token"""
    print_info("Registering test user...")
    
    # Register the user
    register_response = requests.post(
        f"{BASE_URL}/auth/register",
        json=test_user
    )
    
    if register_response.status_code != 201:
        print_error(f"Failed to register test user: {register_response.status_code} - {register_response.text}")
        return None
    
    print_success("Test user registered successfully")
    
    # Login to get auth token
    print_info("Logging in to get auth token...")
    login_data = {
        "username": test_user["username"],
        "password": test_user["password"]
    }
    
    login_response = requests.post(
        f"{BASE_URL}/auth/login",
        json=login_data
    )
    
    if login_response.status_code != 200:
        print_error(f"Failed to login: {login_response.status_code} - {login_response.text}")
        return None
    
    token_data = login_response.json()
    token = token_data["access_token"]
    print_success("Successfully authenticated")
    
    return token

def run_patient_tests():
    """Run the patient creation and sync tests"""
    
    # Step 1: Authenticate
    token = register_and_login()
    if not token:
        print_error("Authentication failed, cannot proceed with tests")
        return False
    
    # Set auth headers
    auth_headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Step 2: Create a new patient
    print_info("Creating new patient...")
    new_patient = {
        "name": "King Kong Test",
        "birth_date": "1988-01-01",
        "gender": "male"
    }
    
    create_response = requests.post(
        f"{BASE_URL}/patients",
        headers=auth_headers,
        json=new_patient
    )
    
    if create_response.status_code == 201:
        print_success("Patient created successfully!")
        patient_data = create_response.json()
        print_debug(f"Patient data: {json.dumps(patient_data, indent=2)}")
        patient_id = patient_data.get("id")
    else:
        print_error(f"Failed to create patient. Status code: {create_response.status_code}")
        print_error(f"Response: {create_response.text}")
        return False
    
    # Step 3: Wait for Celery sync
    print_info("Waiting for Celery to sync...")
    time.sleep(5)  # adjust as needed
    
    # Step 4: Retrieve patient from transactional DB (Flask API)
    print_info("Retrieving patient from database...")
    db_response = requests.get(
        f"{BASE_URL}/patients/{patient_id}",
        headers=auth_headers
    )
    
    if db_response.status_code == 200:
        db_patient = db_response.json()
        print_success("Patient retrieved from transactional DB")
        print_debug(f"Patient from Transactional DB: {json.dumps(db_patient, indent=2)}")
        fhir_id = db_patient.get("fhir_id")
    else:
        print_error(f"Failed to retrieve patient from Flask DB. Status code: {db_response.status_code}")
        print_error(f"Response: {db_response.text}")
        return False
    
    # Step 5: Retrieve patient from HAPI FHIR
    if fhir_id:
        print_info(f"Retrieving patient from FHIR with ID {fhir_id}...")
        fhir_response = requests.get(f"{FHIR_URL}/Patient/{fhir_id}")
        if fhir_response.status_code == 200:
            fhir_patient = fhir_response.json()
            print_success("Patient retrieved from HAPI FHIR")
            print_debug(f"Patient from HAPI FHIR: {json.dumps(fhir_patient, indent=2)}")
            return True
        else:
            print_error(f"Failed to retrieve patient from FHIR. Status: {fhir_response.status_code}")
            print_error(f"Response: {fhir_response.text}")
            return False
    else:
        print_info("FHIR ID not yet synced. Check Celery logs.")
        return True

if __name__ == "__main__":
    print_info("Starting patient test flow...")
    success = run_patient_tests()
    if success:
        print_success("Patient test flow completed successfully!")
    else:
        print_error("Patient test flow failed!")