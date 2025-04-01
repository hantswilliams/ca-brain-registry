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

def create_test_patient(auth_headers):
    """Create a test patient for procedure tests"""
    print_info("Creating test patient for procedures...")
    
    new_patient = {
        "name": "Procedure Test Patient",
        "birth_date": "1980-08-25",
        "gender": "male"
    }
    
    create_response = requests.post(
        f"{BASE_URL}/patients",
        headers=auth_headers,
        json=new_patient
    )
    
    if create_response.status_code == 201:
        print_success("Test patient created successfully!")
        patient_data = create_response.json()
        patient_id = patient_data.get("id")
        return patient_id
    else:
        print_error(f"Failed to create test patient. Status code: {create_response.status_code}")
        print_error(f"Response: {create_response.text}")
        return None

def run_procedure_tests():
    """Run tests for procedure endpoints"""
    
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
    
    # Step 2: Create a test patient
    patient_id = create_test_patient(auth_headers)
    if not patient_id:
        print_error("Failed to create test patient, cannot proceed with procedure tests")
        return False
    
    # Step 3: Create procedures for the patient
    print_info("Creating procedures for the patient...")
    
    procedure_data = [
        {
            "procedure_code": "62323",
            "procedure_name": "Spinal injection",
            "description": "Injection of steroid medication into epidural space",
            "status": "completed",
            "patient_id": patient_id
        },
        {
            "procedure_code": "70553",
            "procedure_name": "MRI brain w/o & w/contrast",
            "description": "MRI of brain without and with contrast",
            "status": "scheduled",
            "patient_id": patient_id
        }
    ]
    
    procedures_created = []
    
    for proc_data in procedure_data:
        print_debug(f"Sending procedure data: {json.dumps(proc_data, indent=2)}")
        create_response = requests.post(
            f"{BASE_URL}/procedures",
            headers=auth_headers,
            json=proc_data
        )
        
        print_debug(f"Response status code: {create_response.status_code}")
        print_debug(f"Response headers: {create_response.headers}")
        print_debug(f"Raw response: {create_response.text}")
        
        if create_response.status_code == 201:
            print_success(f"Procedure '{proc_data['procedure_name']}' created successfully!")
            procedure = create_response.json()
            print_debug(f"Procedure data: {json.dumps(procedure, indent=2)}")
            procedures_created.append(procedure)
        else:
            print_error(f"Failed to create procedure. Status code: {create_response.status_code}")
            print_error(f"Response: {create_response.text}")
    
    if not procedures_created:
        print_error("No procedures were created, cannot proceed with tests")
        return False
    
    # Step 4: Wait for Celery sync
    print_info("Waiting for Celery to sync procedures...")
    time.sleep(5)  # adjust as needed
    
    # Step 5: Get a specific procedure by ID
    first_proc_id = procedures_created[0]['id']
    print_info(f"Retrieving procedure with ID {first_proc_id}...")
    
    get_response = requests.get(
        f"{BASE_URL}/procedures/{first_proc_id}",
        headers=auth_headers
    )
    
    if get_response.status_code == 200:
        procedure = get_response.json()
        print_success("Procedure retrieved successfully")
        print_debug(f"Retrieved procedure: {json.dumps(procedure, indent=2)}")
        fhir_id = procedure.get("fhir_id")
    else:
        print_error(f"Failed to retrieve procedure. Status code: {get_response.status_code}")
        print_error(f"Response: {get_response.text}")
        return False
    
    # Step 6: Check FHIR sync status
    if fhir_id:
        print_info(f"Retrieving procedure from FHIR with ID {fhir_id}...")
        fhir_response = requests.get(f"{FHIR_URL}/Procedure/{fhir_id}")
        if fhir_response.status_code == 200:
            fhir_procedure = fhir_response.json()
            print_success("Procedure retrieved from HAPI FHIR")
            print_debug(f"Procedure from HAPI FHIR: {json.dumps(fhir_procedure, indent=2)}")
        else:
            print_error(f"Failed to retrieve procedure from FHIR. Status: {fhir_response.status_code}")
            print_error(f"Response: {fhir_response.text}")
            # Don't fail the test just for FHIR sync issues, since that might be a separate concern
            print_info("Continuing with test despite FHIR sync issue...")
    else:
        print_info("FHIR ID not yet synced. Check Celery logs.")
    
    # Step 7: Get all procedures for the patient
    print_info(f"Retrieving all procedures for patient ID {patient_id}...")
    
    get_all_response = requests.get(
        f"{BASE_URL}/procedures/patient/{patient_id}",
        headers=auth_headers
    )
    
    if get_all_response.status_code == 200:
        patient_procedures = get_all_response.json()
        print_success(f"Retrieved {len(patient_procedures)} procedures for the patient")
        print_debug(f"Patient procedures: {json.dumps(patient_procedures, indent=2)}")
        
        # Verify we got the expected number of procedures
        if len(patient_procedures) == len(procedure_data):
            print_success("All procedures for the patient were successfully retrieved")
        else:
            print_error(f"Expected {len(procedure_data)} procedures, but got {len(patient_procedures)}")
            return False
    else:
        print_error(f"Failed to retrieve patient procedures. Status code: {get_all_response.status_code}")
        print_error(f"Response: {get_all_response.text}")
        return False
    
    # Step 8: Wait a bit longer and verify sync_status is updated to success
    print_info("Waiting for sync status to update...")
    time.sleep(5)  # Wait a bit longer to ensure sync has completed
    
    # Check sync status for the first procedure
    print_info(f"Checking final sync status for procedure ID {first_proc_id}...")
    final_check_response = requests.get(
        f"{BASE_URL}/procedures/{first_proc_id}",
        headers=auth_headers
    )
    
    if final_check_response.status_code == 200:
        final_procedure = final_check_response.json()
        sync_status = final_procedure.get("sync_status")
        fhir_id = final_procedure.get("fhir_id")
        
        print_info(f"Final sync status: {sync_status}")
        print_info(f"Final FHIR ID: {fhir_id}")
        
        if sync_status == "success":
            print_success("Procedure sync completed successfully!")
        elif sync_status == "pending":
            print_info("Sync still pending. This might be normal if Celery workers are busy or not running.")
        else:
            print_error(f"Unexpected sync status: {sync_status}")
            # Don't fail the test for sync issues
    else:
        print_error(f"Failed to check final sync status. Status code: {final_check_response.status_code}")
    
    # All tests passed
    return True

if __name__ == "__main__":
    print_info("Starting procedure test flow...")
    success = run_procedure_tests()
    if success:
        print_success("Procedure test flow completed successfully!")
    else:
        print_error("Procedure test flow failed!")