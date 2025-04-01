# This file makes the patient_service directory a Python package
from app.services.patient_service.service import (
    create_new_patient,
    get_all_patients,
    get_patient_by_id,
    patient_service  # Add the service instance itself
)