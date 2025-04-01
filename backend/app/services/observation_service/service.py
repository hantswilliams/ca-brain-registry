import logging
from typing import Dict, List, Optional, Tuple, Any, Union
from pydantic import ValidationError

from app import db
from app.models import Observation
from app.schemas import ObservationCreate, ObservationResponse
from app.repositories.observation_repository import ObservationRepository
from app.services.base_service import BaseService

# Configure logging
logger = logging.getLogger(__name__)

class ObservationService(BaseService[Observation, ObservationRepository]):
    """Service for observation-related operations"""
    
    def __init__(self, repository: Optional[ObservationRepository] = None):
        """Initialize with repository using dependency injection"""
        super().__init__(repository or ObservationRepository())
    
    @BaseService.handle_service_exceptions
    def create_observation(self, data: Dict[str, Any]) -> Tuple[Union[Dict[str, Any], ObservationResponse], int]:
        """Create a new observation and trigger sync"""
        try:
            # Log the incoming request
            logger.info(f"Creating new observation with data: {data}")
            
            # Using ** unpacking for more direct validation instead of filtering
            observation_data = ObservationCreate(**data)
            
            # Convert validated data to dict for repository
            observation_dict = observation_data.model_dump()
            
            # Add creator if present in original data
            if 'created_by_id' in data:
                observation_dict['created_by_id'] = data['created_by_id']
                logger.debug(f"Setting creator ID to {data['created_by_id']}")
            
            # Use repository to create observation
            observation = self.repository.create(observation_dict)
            
            # Note: Sync functionality would be implemented here
            # For now, just log that we would sync in the future
            logger.info(f"Would trigger sync for new observation ID: {observation.id} in a real implementation")
            
            # Return response using Pydantic model
            return ObservationResponse.model_validate(observation), 201
            
        except ValidationError as e:
            logger.warning(f"Validation error when creating observation: {e.errors()}")
            return {"error": e.errors()}, 400
    
    def get_observation_by_id(self, observation_id: int) -> Optional[ObservationResponse]:
        """Get a single observation by ID"""
        logger.debug(f"Fetching observation with ID: {observation_id}")
        observation = self.repository.get_by_id(observation_id)
        if not observation:
            logger.info(f"Observation with ID {observation_id} not found")
            return None
        return ObservationResponse.model_validate(observation)
    
    def get_observations_by_patient_id(self, patient_id: int) -> List[ObservationResponse]:
        """Get all observations for a specific patient"""
        logger.debug(f"Fetching observations for patient ID: {patient_id}")
        observations = self.repository.find_by_patient_id(patient_id)
        logger.info(f"Found {len(observations)} observations for patient ID: {patient_id}")
        return [ObservationResponse.model_validate(observation) for observation in observations]

# Create an instance of the service for easier imports with default repository
observation_service = ObservationService()

# Export the functions for backward compatibility
create_new_observation = observation_service.create_observation
get_observation_by_id = observation_service.get_observation_by_id
get_observations_by_patient_id = observation_service.get_observations_by_patient_id