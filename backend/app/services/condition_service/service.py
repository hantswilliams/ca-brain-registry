import logging
from typing import Dict, List, Optional, Tuple, Any, Union
from pydantic import ValidationError

from app import db
from app.models import Condition
from app.schemas import ConditionCreate, ConditionResponse
from app.services.base_service import BaseService
from app.repositories.condition_repository import ConditionRepository
from app.services.sync_service import trigger_condition_sync

# Configure logging
logger = logging.getLogger(__name__)

class ConditionService(BaseService[Condition, ConditionRepository]):
    """Service for condition-related operations"""
    
    def __init__(self, repository: Optional[ConditionRepository] = None):
        """Initialize with repository using dependency injection"""
        super().__init__(repository or ConditionRepository())
    
    @BaseService.handle_service_exceptions
    def create_condition(self, data: Dict[str, Any]) -> Tuple[Union[Dict[str, Any], ConditionResponse], int]:
        """Create a new condition and trigger sync"""
        try:
            # Log the incoming request
            logger.info(f"Creating new condition with data: {data}")
            
            # Validate incoming data with Pydantic
            condition_data = ConditionCreate(**{k: v for k, v in data.items() 
                                              if k in ['condition_code', 'onset_date', 'status', 'patient_id']})
            
            # Convert validated data to dict for repository
            condition_dict = condition_data.model_dump()
            
            # Add creator if present in original data
            if 'created_by_id' in data:
                condition_dict['created_by_id'] = data['created_by_id']
            
            # Use repository to create condition
            condition = self.repository.create(condition_dict)
            
            # Trigger sync
            logger.info(f"Triggering sync for new condition ID: {condition.id}")
            trigger_condition_sync(condition.id)
            
            # Return response using Pydantic model
            return ConditionResponse.model_validate(condition), 201
            
        except ValidationError as e:
            logger.warning(f"Validation error when creating condition: {e.errors()}")
            return {"error": e.errors()}, 400
    
    def get_condition_by_id(self, condition_id: int) -> Optional[ConditionResponse]:
        """Get a single condition by ID"""
        logger.debug(f"Fetching condition with ID: {condition_id}")
        condition = self.repository.get_by_id(condition_id)
        if not condition:
            logger.info(f"Condition with ID {condition_id} not found")
            return None
        return ConditionResponse.model_validate(condition)
    
    def get_conditions_by_patient_id(self, patient_id: int) -> List[ConditionResponse]:
        """Get all conditions for a specific patient"""
        logger.debug(f"Fetching conditions for patient ID: {patient_id}")
        conditions = self.repository.find_by_patient_id(patient_id)
        logger.info(f"Found {len(conditions)} conditions for patient ID: {patient_id}")
        return [ConditionResponse.model_validate(condition) for condition in conditions]

# Create an instance of the service for easier imports with default repository
condition_service = ConditionService()

# Export the functions for backward compatibility
create_new_condition = condition_service.create_condition
get_condition_by_id = condition_service.get_condition_by_id
get_conditions_by_patient_id = condition_service.get_conditions_by_patient_id