#!/usr/bin/env python
"""
Master test script that runs all test components of the UVA CA Brain Registry application.
This file provides a unified way to run all tests and see consolidated results.
"""

import os
import sys
import time
import importlib.util
import subprocess
from datetime import datetime

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[96m'
    PURPLE = '\033[95m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    RESET = '\033[0m'

# Set up test path
TESTS_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(TESTS_DIR)

def print_header(message):
    """Print a formatted header"""
    print(f"\n{Colors.BOLD}{Colors.PURPLE}{'=' * 80}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.PURPLE}{message.center(80)}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.PURPLE}{'=' * 80}{Colors.RESET}\n")

def print_success(message):
    print(f"{Colors.GREEN}[SUCCESS] {message}{Colors.RESET}")

def print_error(message):
    print(f"{Colors.RED}[ERROR] {message}{Colors.RESET}")

def print_info(message):
    print(f"{Colors.YELLOW}[INFO] {message}{Colors.RESET}")

def print_debug(message):
    print(f"{Colors.BLUE}[DEBUG] {message}{Colors.RESET}")

def print_section(message):
    print(f"\n{Colors.BOLD}{Colors.BLUE}[SECTION] {message}{Colors.RESET}")

def run_test_file(file_path):
    """Run a test file and return if it was successful"""
    print_section(f"Running {os.path.basename(file_path)}")
    
    if not os.path.exists(file_path):
        print_error(f"Test file not found: {file_path}")
        return False
    
    file_name = os.path.basename(file_path)
    
    if file_name.endswith('.py'):
        # Import and run Python test files
        try:
            module_name = os.path.splitext(file_name)[0]
            spec = importlib.util.spec_from_file_location(module_name, file_path)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            
            # Check if the file has a main test function to run
            # Convention: functions that start with 'run_' and end with '_tests'
            test_functions = [f for f in dir(module) if f.startswith('run_') and f.endswith('_tests')]
            
            if test_functions:
                for func_name in test_functions:
                    print_info(f"Executing {func_name}()")
                    test_func = getattr(module, func_name)
                    test_func()
                return True
            elif hasattr(module, 'main'):
                print_info("Executing main()")
                module.main()
                return True
            else:
                print_info("No test function found, script was executed")
                # The file was already executed on import
                return True
        except Exception as e:
            print_error(f"Error running test file {file_path}: {str(e)}")
            return False
    else:
        # For non-Python files, try to execute them with the appropriate runner
        try:
            result = subprocess.run(['python', file_path], check=True)
            return result.returncode == 0
        except subprocess.CalledProcessError:
            print_error(f"Test failed: {file_path}")
            return False
        except Exception as e:
            print_error(f"Error running test file {file_path}: {str(e)}")
            return False

def check_server_status():
    """Verify that the API server is running"""
    print_section("Checking API server status")
    
    import requests
    try:
        response = requests.get("http://localhost:5005/health")
        if response.status_code == 200:
            print_success("API server is running")
            return True
        else:
            print_error(f"API server returned status code {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error("API server is not running. Please start the server before running tests.")
        return False

def run_all_tests():
    """Run all test files in the tests directory"""
    print_header("UVA CA BRAIN REGISTRY - COMPREHENSIVE TEST SUITE")
    print_info(f"Starting tests at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # First check if the server is running
    if not check_server_status():
        print_error("Cannot proceed with tests as the API server is not running.")
        print_info("Please start the server with: 'cd python-focused-api && flask run --port=5005'")
        return False
    
    # Get all test files
    test_files = []
    for filename in os.listdir(TESTS_DIR):
        if filename.startswith('test_') and filename.endswith('.py'):
            test_files.append(os.path.join(TESTS_DIR, filename))
    
    # Sort test files: health first, then auth, then value_sets, then others
    def test_file_priority(file_path):
        filename = os.path.basename(file_path)
        if 'health' in filename:
            return 0
        elif 'auth' in filename:
            return 1
        elif 'value_sets' in filename:
            return 2
        else:
            return 3
            
    test_files.sort(key=test_file_priority)
    
    # Run each test file
    total_tests = len(test_files)
    successful_tests = 0
    failed_tests = []
    
    print_info(f"Found {total_tests} test files to run")
    
    for file_path in test_files:
        file_name = os.path.basename(file_path)
        if run_test_file(file_path):
            print_success(f"Test file {file_name} completed successfully")
            successful_tests += 1
        else:
            print_error(f"Test file {file_name} failed")
            failed_tests.append(file_name)
    
    # Print summary
    print_header("TEST SUMMARY")
    print_info(f"Total test files: {total_tests}")
    print_success(f"Successful test files: {successful_tests}")
    
    if failed_tests:
        print_error(f"Failed test files: {len(failed_tests)}")
        for failed_test in failed_tests:
            print_error(f"  - {failed_test}")
        return False
    else:
        print_success("All test files ran successfully!")
        return True

if __name__ == "__main__":
    success = run_all_tests()
    if not success:
        sys.exit(1)
    else:
        sys.exit(0)