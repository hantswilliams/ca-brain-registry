# This file makes the condition_service directory a Python package
from app.services.condition_service.service import (
    create_new_condition,
    get_condition_by_id,
    get_conditions_by_patient_id,
    condition_service  # Add the service instance itself
)