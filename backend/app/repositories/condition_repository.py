from app.repositories.base_repository import SQLAlchemyRepository
from app.models import Condition
from typing import List, Optional

class ConditionRepository(SQLAlchemyRepository[Condition]):
    """Repository for Condition model"""
    
    def __init__(self):
        super().__init__(Condition)
    
    def find_by_patient_id(self, patient_id: int) -> List[Condition]:
        """Find conditions for a specific patient"""
        return self.session.query(Condition).filter(Condition.patient_id == patient_id).all()
    
    def find_by_code(self, code: str) -> List[Condition]:
        """Find conditions by code (exact match)"""
        return self.session.query(Condition).filter(Condition.condition_code == code).all()
    
    def find_by_fhir_id(self, fhir_id: str) -> Optional[Condition]:
        """Find a condition by FHIR ID"""
        return self.session.query(Condition).filter(Condition.fhir_id == fhir_id).first()
    
    def update_sync_status(self, id: int, status: str, fhir_id: Optional[str] = None) -> Optional[Condition]:
        """Update sync status for a condition"""
        condition = self.get_by_id(id)
        if condition:
            condition.update_sync_status(status, fhir_id)
        return condition