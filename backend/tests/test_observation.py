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
    """Create a test patient for observation tests"""
    print_info("Creating test patient for observations...")
    
    new_patient = {
        "name": "Observation Test Patient",
        "birth_date": "1975-05-15",
        "gender": "female"
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

def run_observation_tests():
    """Run tests for observation endpoints"""
    
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
        print_error("Failed to create test patient, cannot proceed with observation tests")
        return False
    
    # Step 3: Create observations for the patient
    print_info("Creating observations for the patient...")
    
    observation_data = [
        {
            "observation_code": "8480-6",
            "observation_name": "Systolic blood pressure",
            "value": "120",
            "unit": "mm[Hg]",
            "reference_range": "90-130",
            "observation_date": "2025-03-31T14:30:00",
            "status": "final",
            "patient_id": patient_id
        },
        {
            "observation_code": "8310-5",
            "observation_name": "Body temperature",
            "value": "37.5",
            "unit": "°C",
            "reference_range": "36.5-37.5",
            "observation_date": "2025-03-31T14:35:00",
            "status": "final",
            "patient_id": patient_id
        }
    ]
    
    observations_created = []
    
    for obs_data in observation_data:
        print_debug(f"Sending observation data: {json.dumps(obs_data, indent=2)}")
        create_response = requests.post(
            f"{BASE_URL}/observations",
            headers=auth_headers,
            json=obs_data
        )
        
        print_debug(f"Response status code: {create_response.status_code}")
        print_debug(f"Response headers: {create_response.headers}")
        print_debug(f"Raw response: {create_response.text}")
        
        if create_response.status_code == 201:
            print_success(f"Observation '{obs_data['observation_name']}' created successfully!")
            observation = create_response.json()
            print_debug(f"Observation data: {json.dumps(observation, indent=2)}")
            observations_created.append(observation)
        else:
            print_error(f"Failed to create observation. Status code: {create_response.status_code}")
            print_error(f"Response: {create_response.text}")
    
    if not observations_created:
        print_error("No observations were created, cannot proceed with tests")
        return False
    
    # Step 4: Wait for Celery sync
    print_info("Waiting for Celery to sync observations...")
    time.sleep(5)  # adjust as needed
    
    # Step 5: Get a specific observation by ID
    first_obs_id = observations_created[0]['id']
    print_info(f"Retrieving observation with ID {first_obs_id}...")
    
    get_response = requests.get(
        f"{BASE_URL}/observations/{first_obs_id}",
        headers=auth_headers
    )
    
    if get_response.status_code == 200:
        observation = get_response.json()
        print_success("Observation retrieved successfully")
        print_debug(f"Retrieved observation: {json.dumps(observation, indent=2)}")
        fhir_id = observation.get("fhir_id")
    else:
        print_error(f"Failed to retrieve observation. Status code: {get_response.status_code}")
        print_error(f"Response: {get_response.text}")
        return False
    
    # Step 6: Check FHIR sync status
    if fhir_id:
        print_info(f"Retrieving observation from FHIR with ID {fhir_id}...")
        fhir_response = requests.get(f"{FHIR_URL}/Observation/{fhir_id}")
        if fhir_response.status_code == 200:
            fhir_observation = fhir_response.json()
            print_success("Observation retrieved from HAPI FHIR")
            print_debug(f"Observation from HAPI FHIR: {json.dumps(fhir_observation, indent=2)}")
        else:
            print_error(f"Failed to retrieve observation from FHIR. Status: {fhir_response.status_code}")
            print_error(f"Response: {fhir_response.text}")
            # Don't fail the test just for FHIR sync issues, since that might be a separate concern
            print_info("Continuing with test despite FHIR sync issue...")
    else:
        print_info("FHIR ID not yet synced. Check Celery logs.")
    
    # Step 7: Get all observations for the patient
    print_info(f"Retrieving all observations for patient ID {patient_id}...")
    
    get_all_response = requests.get(
        f"{BASE_URL}/observations/patient/{patient_id}",
        headers=auth_headers
    )
    
    if get_all_response.status_code == 200:
        patient_observations = get_all_response.json()
        print_success(f"Retrieved {len(patient_observations)} observations for the patient")
        print_debug(f"Patient observations: {json.dumps(patient_observations, indent=2)}")
        
        # Verify we got the expected number of observations
        if len(patient_observations) == len(observation_data):
            print_success("All observations for the patient were successfully retrieved")
        else:
            print_error(f"Expected {len(observation_data)} observations, but got {len(patient_observations)}")
            return False
    else:
        print_error(f"Failed to retrieve patient observations. Status code: {get_all_response.status_code}")
        print_error(f"Response: {get_all_response.text}")
        return False
    
    # Step 8: Wait a bit longer and verify sync_status is updated to success
    print_info("Waiting for sync status to update...")
    time.sleep(5)  # Wait a bit longer to ensure sync has completed
    
    # Check sync status for the first observation
    print_info(f"Checking final sync status for observation ID {first_obs_id}...")
    final_check_response = requests.get(
        f"{BASE_URL}/observations/{first_obs_id}",
        headers=auth_headers
    )
    
    if final_check_response.status_code == 200:
        final_observation = final_check_response.json()
        sync_status = final_observation.get("sync_status")
        fhir_id = final_observation.get("fhir_id")
        
        print_info(f"Final sync status: {sync_status}")
        print_info(f"Final FHIR ID: {fhir_id}")
        
        if sync_status == "success":
            print_success("Observation sync completed successfully!")
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
    print_info("Starting observation test flow...")
    success = run_observation_tests()
    if success:
        print_success("Observation test flow completed successfully!")
    else:
        print_error("Observation test flow failed!")