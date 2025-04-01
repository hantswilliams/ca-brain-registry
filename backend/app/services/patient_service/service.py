import logging
from typing import Dict, List, Optional, Tuple, Any, Union
from pydantic import ValidationError

from app import db
from app.models import Patient
from app.schemas import PatientCreate, PatientResponse
from app.services.base_service import BaseService
from app.repositories.patient_repository import PatientRepository
from app.services.sync_service import trigger_patient_sync

# Configure logging
logger = logging.getLogger(__name__)

class PatientService(BaseService[Patient, PatientRepository]):
    """Service for patient-related operations"""
    
    def __init__(self, repository: Optional[PatientRepository] = None):
        """Initialize with repository using dependency injection"""
        super().__init__(repository or PatientRepository())
    
    @BaseService.handle_service_exceptions
    def create_patient(self, data: Dict[str, Any]) -> Tuple[Union[Dict[str, Any], PatientResponse], int]:
        """Create a new patient and trigger sync"""
        try:
            # Log the incoming request
            logger.info(f"Creating new patient with data: {data}")
            
            # Validate incoming data with Pydantic
            patient_data = PatientCreate(**{k: v for k, v in data.items() if k in ['name', 'birth_date', 'gender']})
            
            # Convert validated data to dict for repository
            patient_dict = patient_data.model_dump()
            
            # Add creator if present in original data
            if 'created_by_id' in data:
                patient_dict['created_by_id'] = data['created_by_id']
            
            # Use repository to create patient
            patient = self.repository.create(patient_dict)
            
            # Trigger sync
            logger.info(f"Triggering sync for new patient ID: {patient.id}")
            trigger_patient_sync(patient.id)
            
            # Return response using Pydantic model
            return PatientResponse.model_validate(patient), 201
            
        except ValidationError as e:
            logger.warning(f"Validation error when creating patient: {e.errors()}")
            return {"error": e.errors()}, 400
    
    def get_all_patients(self) -> List[PatientResponse]:
        """Get all patients from database"""
        logger.debug("Fetching all patients")
        patients = self.repository.get_all()
        return [PatientResponse.model_validate(patient) for patient in patients]
    
    def get_patient_by_id(self, patient_id: int) -> Optional[PatientResponse]:
        """Get a single patient by ID"""
        logger.debug(f"Fetching patient with ID: {patient_id}")
        patient = self.repository.get_by_id(patient_id)
        if not patient:
            logger.info(f"Patient with ID {patient_id} not found")
            return None
        return PatientResponse.model_validate(patient)
    
    def find_patients_by_name(self, name: str) -> List[PatientResponse]:
        """Find patients by name"""
        logger.debug(f"Searching for patients with name containing: {name}")
        patients = self.repository.find_by_name(name)
        logger.info(f"Found {len(patients)} patients matching name query: {name}")
        return [PatientResponse.model_validate(patient) for patient in patients]

# Create an instance of the service for easier imports with default repository
patient_service = PatientService()

# Export the functions for backward compatibility
create_new_patient = patient_service.create_patient
get_all_patients = patient_service.get_all_patients
get_patient_by_id = patient_service.get_patient_by_id