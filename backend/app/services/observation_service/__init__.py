# This file makes the observation_service directory a Python package
from app.services.observation_service.service import (
    create_new_observation,
    get_observation_by_id,
    get_observations_by_patient_id,
    observation_service  # Add the service instance itself
)