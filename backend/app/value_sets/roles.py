"""
Standard roles used throughout the application.
This file defines the base roles that should exist in the system.
"""

ROLES = [
    {
        'name': 'admin',
        'description': 'Administrator with full access to all system functions'
    },
    {
        'name': 'user',
        'description': 'Regular user with standard access'
    },
    {
        'name': 'researcher',
        'description': 'Research personnel with data access privileges'
    },
    {
        'name': 'clinician',
        'description': 'Healthcare provider with patient management capabilities'
    }
]

# Function to get all defined roles
def get_all_roles():
    return ROLES

# Function to get a specific role by name
def get_role_by_name(name):
    for role in ROLES:
        if role['name'] == name:
            return role
    return None