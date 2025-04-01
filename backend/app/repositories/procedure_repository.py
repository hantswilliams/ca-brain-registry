from app.repositories.base_repository import SQLAlchemyRepository
from app.models import Procedure
from typing import List, Optional
import logging

# Configure logging
logger = logging.getLogger(__name__)

class ProcedureRepository(SQLAlchemyRepository[Procedure]):
    """Repository for Procedure model"""
    
    def __init__(self):
        super().__init__(Procedure)
    
    def find_by_patient_id(self, patient_id: int) -> List[Procedure]:
        """Find procedures for a specific patient"""
        logger.debug(f"Finding procedures for patient ID: {patient_id}")
        return self.session.query(Procedure).filter(Procedure.patient_id == patient_id).all()
    
    def find_by_code(self, code: str) -> List[Procedure]:
        """Find procedures by code (exact match)"""
        logger.debug(f"Finding procedures with code: {code}")
        return self.session.query(Procedure).filter(Procedure.procedure_code == code).all()
    
    def find_by_fhir_id(self, fhir_id: str) -> Optional[Procedure]:
        """Find a procedure by FHIR ID"""
        logger.debug(f"Finding procedure by FHIR ID: {fhir_id}")
        return self.session.query(Procedure).filter(Procedure.fhir_id == fhir_id).first()
    
    def update_sync_status(self, id: int, status: str, fhir_id: Optional[str] = None) -> Optional[Procedure]:
        """Update sync status for a procedure"""
        logger.debug(f"Updating sync status for procedure ID {id} to {status}")
        procedure = self.get_by_id(id)
        if procedure:
            procedure.update_sync_status(status, fhir_id)
            self.session.commit()
        return procedure