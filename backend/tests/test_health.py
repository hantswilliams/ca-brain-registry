import requests
import time
import json

# Base URL for the API
BASE_URL = "http://localhost:5005"

def print_colored(message, color):
    """Print colored messages in the terminal"""
    colors = {
        'green': '\033[92m',
        'red': '\033[91m',
        'yellow': '\033[93m',
        'blue': '\033[94m',
        'reset': '\033[0m'
    }
    print(f"{colors.get(color, '')}{message}{colors['reset']}")

def test_health_endpoint():
    """Test the basic health endpoint"""
    print_colored("Testing basic health endpoint...", "blue")
    
    try:
        response = requests.get(f"{BASE_URL}/health/")
        if response.status_code == 200:
            print_colored(f"SUCCESS: API health check returned status code {response.status_code}", "green")
            print_colored(f"Response: {json.dumps(response.json(), indent=2)}", "green")
            return True
        else:
            print_colored(f"ERROR: API health check returned status code {response.status_code}", "red")
            print_colored(f"Response: {response.text}", "red")
            return False
    except requests.RequestException as e:
        print_colored(f"ERROR: Could not connect to API: {str(e)}", "red")
        return False

def test_celery_health_endpoint():
    """Test the Celery health check endpoint"""
    print_colored("Testing Celery health endpoint...", "blue")
    
    try:
        response = requests.get(f"{BASE_URL}/health/celery")
        status_code = response.status_code
        data = response.json()
        
        print_colored(f"Status Code: {status_code}", "yellow")
        print_colored(f"Response: {json.dumps(data, indent=2)}", "yellow")
        
        if status_code == 200:
            print_colored("SUCCESS: Celery workers are active!", "green")
            return True
        elif status_code == 503:
            print_colored(f"WARNING: {data.get('message', 'Celery workers are not available')}", "red")
            print_colored("This means FHIR synchronization will likely fail", "red")
            return False
        else:
            print_colored(f"ERROR: Unexpected status code {status_code}", "red")
            return False
    except requests.RequestException as e:
        print_colored(f"ERROR: Could not connect to API: {str(e)}", "red")
        return False

if __name__ == "__main__":
    print_colored("Starting health check tests...", "blue")
    
    # Test basic health endpoint
    api_health = test_health_endpoint()
    
    # Give a small delay between requests
    time.sleep(1)
    
    # Test Celery health endpoint
    celery_health = test_celery_health_endpoint()
    
    # Summary
    print_colored("\nTest Results Summary:", "blue")
    print_colored(f"API Health: {'✅ OK' if api_health else '❌ FAIL'}", "green" if api_health else "red")
    print_colored(f"Celery Health: {'✅ OK' if celery_health else '❌ FAIL'}", "green" if celery_health else "red")
    
    if not celery_health:
        print_colored("\nIMPORTANT: Celery worker is not available. FHIR synchronization will fail.", "red")
        print_colored("To start the Celery worker, run:", "yellow")
        print_colored("cd /path/to/python-focused-api && celery -A app.celery_app worker --loglevel=info", "yellow")