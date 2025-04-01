from app.repositories.base_repository import SQLAlchemyRepository
from app.models import Patient
from typing import List, Optional

class PatientRepository(SQLAlchemyRepository[Patient]):
    """Repository for Patient model"""
    
    def __init__(self):
        super().__init__(Patient)
    
    def find_by_name(self, name: str) -> List[Patient]:
        """Find patients by name (case-insensitive partial match)"""
        return self.session.query(Patient).filter(Patient.name.ilike(f'%{name}%')).all()
    
    def find_by_fhir_id(self, fhir_id: str) -> Optional[Patient]:
        """Find a patient by FHIR ID"""
        return self.session.query(Patient).filter(Patient.fhir_id == fhir_id).first()
    
    def update_sync_status(self, id: int, status: str, fhir_id: Optional[str] = None) -> Optional[Patient]:
        """Update sync status for a patient"""
        patient = self.get_by_id(id)
        if patient:
            patient.update_sync_status(status, fhir_id)
        return patient