"""
Standard synchronization status values.
Used for tracking the state of synchronization with FHIR server.
"""

SYNC_STATUSES = [
    {
        'code': 'pending',
        'display': 'Pending',
        'description': 'Initial state, synchronization not yet attempted'
    },
    {
        'code': 'in_progress',
        'display': 'In Progress',
        'description': 'Synchronization is currently in progress'
    },
    {
        'code': 'success',
        'display': 'Success',
        'description': 'Synchronization completed successfully'
    },
    {
        'code': 'error',
        'display': 'Error',
        'description': 'Synchronization failed due to an error'
    },
    {
        'code': 'retry',
        'display': 'Retry',
        'description': 'Previous synchronization failed, retry scheduled'
    }
]

# Function to get all defined sync statuses
def get_all_sync_statuses():
    return SYNC_STATUSES

# Function to get a specific sync status by code
def get_sync_status_by_code(code):
    for status in SYNC_STATUSES:
        if status['code'] == code:
            return status
    return None