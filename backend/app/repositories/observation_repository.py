from app.repositories.base_repository import SQLAlchemyRepository
from app.models import Observation
from typing import List, Optional
import logging

# Configure logging
logger = logging.getLogger(__name__)

class ObservationRepository(SQLAlchemyRepository[Observation]):
    """Repository for Observation model"""
    
    def __init__(self):
        super().__init__(Observation)
    
    def find_by_patient_id(self, patient_id: int) -> List[Observation]:
        """Find observations for a specific patient"""
        logger.debug(f"Finding observations for patient ID: {patient_id}")
        return self.session.query(Observation).filter(Observation.patient_id == patient_id).all()
    
    def find_by_code(self, code: str) -> List[Observation]:
        """Find observations by code (exact match)"""
        logger.debug(f"Finding observations with code: {code}")
        return self.session.query(Observation).filter(Observation.observation_code == code).all()
    
    def find_by_fhir_id(self, fhir_id: str) -> Optional[Observation]:
        """Find an observation by FHIR ID"""
        logger.debug(f"Finding observation by FHIR ID: {fhir_id}")
        return self.session.query(Observation).filter(Observation.fhir_id == fhir_id).first()
    
    def update_sync_status(self, id: int, status: str, fhir_id: Optional[str] = None) -> Optional[Observation]:
        """Update sync status for an observation"""
        logger.debug(f"Updating sync status for observation ID {id} to {status}")
        observation = self.get_by_id(id)
        if observation:
            observation.update_sync_status(status, fhir_id)
            self.session.commit()
        return observation