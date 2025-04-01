import logging
from typing import Dict, List, Optional, Tuple, Any, Union
from pydantic import ValidationError

from app import db
from app.models import Procedure
from app.schemas import ProcedureCreate, ProcedureResponse
from app.repositories.procedure_repository import ProcedureRepository
from app.services.base_service import BaseService

# Configure logging
logger = logging.getLogger(__name__)

class ProcedureService(BaseService[Procedure, ProcedureRepository]):
    """Service for procedure-related operations"""
    
    def __init__(self, repository: Optional[ProcedureRepository] = None):
        """Initialize with repository using dependency injection"""
        super().__init__(repository or ProcedureRepository())
    
    @BaseService.handle_service_exceptions
    def create_procedure(self, data: Dict[str, Any]) -> Tuple[Union[Dict[str, Any], ProcedureResponse], int]:
        """Create a new procedure and trigger sync"""
        try:
            # Log the incoming request
            logger.info(f"Creating new procedure with data: {data}")
            
            # Using ** unpacking for more direct validation
            procedure_data = ProcedureCreate(**data)
            
            # Convert validated data to dict for repository
            procedure_dict = procedure_data.model_dump()
            
            # Add creator if present in original data
            if 'created_by_id' in data:
                procedure_dict['created_by_id'] = data['created_by_id']
                logger.debug(f"Setting creator ID to {data['created_by_id']}")
            
            # Use repository to create procedure
            procedure = self.repository.create(procedure_dict)
            
            # Note: Sync functionality would be implemented here
            # For now, just log that we would sync in the future
            logger.info(f"Would trigger sync for new procedure ID: {procedure.id} in a real implementation")
            
            # Return response using Pydantic model
            return ProcedureResponse.model_validate(procedure), 201
            
        except ValidationError as e:
            logger.warning(f"Validation error when creating procedure: {e.errors()}")
            return {"error": e.errors()}, 400
    
    def get_procedure_by_id(self, procedure_id: int) -> Optional[ProcedureResponse]:
        """Get a single procedure by ID"""
        logger.debug(f"Fetching procedure with ID: {procedure_id}")
        procedure = self.repository.get_by_id(procedure_id)
        if not procedure:
            logger.info(f"Procedure with ID {procedure_id} not found")
            return None
        return ProcedureResponse.model_validate(procedure)
    
    def get_procedures_by_patient_id(self, patient_id: int) -> List[ProcedureResponse]:
        """Get all procedures for a specific patient"""
        logger.debug(f"Fetching procedures for patient ID: {patient_id}")
        procedures = self.repository.find_by_patient_id(patient_id)
        logger.info(f"Found {len(procedures)} procedures for patient ID: {patient_id}")
        return [ProcedureResponse.model_validate(procedure) for procedure in procedures]

# Create an instance of the service for easier imports with default repository
procedure_service = ProcedureService()

# Export the functions for backward compatibility
create_new_procedure = procedure_service.create_procedure
get_procedure_by_id = procedure_service.get_procedure_by_id
get_procedures_by_patient_id = procedure_service.get_procedures_by_patient_id