"""
Common neurological condition codes.
Using ICD-10 codes for neurological disorders.
"""

NEUROLOGICAL_CONDITIONS = [
    {
        'code': 'G30.9',
        'display': 'Alzheimer\'s disease, unspecified',
        'description': 'Alzheimer\'s disease without specification of early or late onset'
    },
    {
        'code': 'G20',
        'display': 'Parkinson\'s disease',
        'description': 'Primary Parkinson\'s disease'
    },
    {
        'code': 'G35',
        'display': 'Multiple sclerosis',
        'description': 'Multiple sclerosis'
    },
    {
        'code': 'G40.909',
        'display': 'Epilepsy, unspecified',
        'description': 'Epilepsy, unspecified, not intractable, without status epilepticus'
    },
    {
        'code': 'G43.909',
        'display': 'Migraine, unspecified',
        'description': 'Migraine, unspecified, not intractable, without status migrainosus'
    },
    {
        'code': 'I63.9',
        'display': 'Cerebral infarction, unspecified',
        'description': 'Cerebral infarction, unspecified'
    },
    {
        'code': 'G31.84',
        'display': 'Mild cognitive impairment',
        'description': 'Mild cognitive impairment, so stated'
    },
    {
        'code': 'F03.90',
        'display': 'Unspecified dementia without behavioral disturbance',
        'description': 'Unspecified dementia without behavioral disturbance'
    },
    {
        'code': 'G31.9',
        'display': 'Degenerative disease of nervous system, unspecified',
        'description': 'Degenerative disease of nervous system, unspecified'
    },
    {
        'code': 'G47.00',
        'display': 'Insomnia, unspecified',
        'description': 'Insomnia, unspecified'
    }
]

# Function to get all defined neurological conditions
def get_all_neurological_conditions():
    return NEUROLOGICAL_CONDITIONS

# Function to get a specific neurological condition by code
def get_neurological_condition_by_code(code):
    for condition in NEUROLOGICAL_CONDITIONS:
        if condition['code'] == code:
            return condition
    return None