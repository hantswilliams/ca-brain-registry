import requests
import json
import time

# Base URL for the API
BASE_URL = "http://localhost:5005"

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

def test_genders_endpoint():
    """Test the gender values endpoint"""
    print_info("Testing gender values endpoint...")
    
    response = requests.get(f"{BASE_URL}/api/value-sets/genders")
    
    if response.status_code == 200:
        data = response.json()
        if len(data) >= 4:
            print_success(f"Gender values retrieved successfully: {len(data)} values found")
            
            # Check if all expected gender codes are present
            expected_codes = ['male', 'female', 'other', 'unknown']
            codes = [item['code'] for item in data]
            
            missing_codes = [code for code in expected_codes if code not in codes]
            if not missing_codes:
                print_success("All expected gender codes are present")
            else:
                print_error(f"Missing gender codes: {missing_codes}")
                
            # Show sample of the data
            print_debug(f"Sample gender value: {json.dumps(data[0], indent=2)}")
            return True
        else:
            print_error(f"Too few gender values returned: {len(data)}")
            return False
    else:
        print_error(f"Failed to retrieve gender values: {response.status_code} - {response.text}")
        return False

def test_condition_statuses_endpoint():
    """Test the condition status values endpoint"""
    print_info("Testing condition status values endpoint...")
    
    response = requests.get(f"{BASE_URL}/api/value-sets/condition-statuses")
    
    if response.status_code == 200:
        data = response.json()
        if len(data) >= 6:
            print_success(f"Condition status values retrieved successfully: {len(data)} values found")
            
            # Check if all expected status codes are present
            expected_codes = ['active', 'inactive', 'resolved', 'remission', 'recurrence', 'relapse']
            codes = [item['code'] for item in data]
            
            missing_codes = [code for code in expected_codes if code not in codes]
            if not missing_codes:
                print_success("All expected condition status codes are present")
            else:
                print_error(f"Missing condition status codes: {missing_codes}")
                
            # Show sample of the data
            print_debug(f"Sample condition status value: {json.dumps(data[0], indent=2)}")
            return True
        else:
            print_error(f"Too few condition status values returned: {len(data)}")
            return False
    else:
        print_error(f"Failed to retrieve condition status values: {response.status_code} - {response.text}")
        return False

def test_neurological_conditions_endpoint():
    """Test the neurological condition codes endpoint"""
    print_info("Testing neurological condition codes endpoint...")
    
    response = requests.get(f"{BASE_URL}/api/value-sets/neurological-conditions")
    
    if response.status_code == 200:
        data = response.json()
        if len(data) >= 5:
            print_success(f"Neurological condition codes retrieved successfully: {len(data)} values found")
            
            # Check for a specific condition code (Alzheimer's)
            alzheimers_found = False
            for item in data:
                if item['code'] == 'G30.9':
                    alzheimers_found = True
                    if "Alzheimer" in item['display']:
                        print_success("Alzheimer's disease code found with correct display name")
                    else:
                        print_error(f"Alzheimer's disease code found but display name is incorrect: {item['display']}")
            
            if not alzheimers_found:
                print_error("Alzheimer's disease code (G30.9) not found")
                
            # Show sample of the data
            print_debug(f"Sample neurological condition: {json.dumps(data[0], indent=2)}")
            return True
        else:
            print_error(f"Too few neurological condition codes returned: {len(data)}")
            return False
    else:
        print_error(f"Failed to retrieve neurological condition codes: {response.status_code} - {response.text}")
        return False

def test_sync_statuses_endpoint():
    """Test the sync status values endpoint"""
    print_info("Testing sync status values endpoint...")
    
    response = requests.get(f"{BASE_URL}/api/value-sets/sync-statuses")
    
    if response.status_code == 200:
        data = response.json()
        if len(data) >= 5:
            print_success(f"Sync status values retrieved successfully: {len(data)} values found")
            
            # Check if all expected status codes are present
            expected_codes = ['pending', 'in_progress', 'success', 'error', 'retry']
            codes = [item['code'] for item in data]
            
            missing_codes = [code for code in expected_codes if code not in codes]
            if not missing_codes:
                print_success("All expected sync status codes are present")
            else:
                print_error(f"Missing sync status codes: {missing_codes}")
                
            # Show sample of the data
            print_debug(f"Sample sync status value: {json.dumps(data[0], indent=2)}")
            return True
        else:
            print_error(f"Too few sync status values returned: {len(data)}")
            return False
    else:
        print_error(f"Failed to retrieve sync status values: {response.status_code} - {response.text}")
        return False

def run_value_sets_tests():
    """Run all value sets tests"""
    print_info("Starting value sets tests...")
    
    # Test 1: Gender values
    test_genders_endpoint()
    
    # Test 2: Condition status values
    test_condition_statuses_endpoint()
    
    # Test 3: Neurological condition codes
    test_neurological_conditions_endpoint()
    
    # Test 4: Sync status values
    test_sync_statuses_endpoint()
    
    print_info("Value sets tests completed.")

if __name__ == "__main__":
    run_value_sets_tests()