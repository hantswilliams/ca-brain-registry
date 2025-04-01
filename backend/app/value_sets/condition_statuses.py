"""
Standard condition status values.
This follows FHIR Condition.clinicalStatus values.
"""

CONDITION_STATUSES = [
    {
        'code': 'active',
        'display': 'Active',
        'description': 'The condition is currently active and affecting the patient'
    },
    {
        'code': 'recurrence',
        'display': 'Recurrence',
        'description': 'The condition has recurred after a period of remission or resolution'
    },
    {
        'code': 'relapse',
        'display': 'Relapse',
        'description': 'The condition has returned after a period of remission, typically reserved for conditions with episodic recurrence'
    },
    {
        'code': 'inactive',
        'display': 'Inactive',
        'description': 'The condition is no longer active'
    },
    {
        'code': 'remission',
        'display': 'Remission',
        'description': 'The condition is in partial or complete remission'
    },
    {
        'code': 'resolved',
        'display': 'Resolved',
        'description': 'The condition has been resolved or gone away'
    }
]

# Function to get all defined condition statuses
def get_all_condition_statuses():
    return CONDITION_STATUSES

# Function to get a specific condition status by code
def get_condition_status_by_code(code):
    for status in CONDITION_STATUSES:
        if status['code'] == code:
            return status
    return None