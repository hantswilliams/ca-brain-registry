"""
Standard gender values used for patients.
This follows common FHIR gender values.
"""

GENDERS = [
    {
        'code': 'male',
        'display': 'Male',
        'description': 'Male gender'
    },
    {
        'code': 'female',
        'display': 'Female',
        'description': 'Female gender'
    },
    {
        'code': 'other',
        'display': 'Other',
        'description': 'Other gender'
    },
    {
        'code': 'unknown',
        'display': 'Unknown',
        'description': 'Unknown gender'
    }
]

# Function to get all defined gender values
def get_all_genders():
    return GENDERS

# Function to get a specific gender by code
def get_gender_by_code(code):
    for gender in GENDERS:
        if gender['code'] == code:
            return gender
    return None