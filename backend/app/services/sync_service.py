import logging
from typing import Optional, Dict, Any

# Configure logging
logger = logging.getLogger(__name__)

def trigger_patient_sync(patient_id: int) -> None:
    """
    Trigger a Celery task to sync a patient to FHIR
    This implementation avoids circular imports by importing inside the function
    
    Args:
        patient_id: The ID of the patient to sync
    """
    from app.tasks import sync_patient_to_fhir
    try:
        logger.info(f"Triggering sync for patient ID: {patient_id}")
        task = sync_patient_to_fhir.delay(patient_id)
        logger.debug(f"Sync task created for patient ID: {patient_id}, task ID: {task.id}")
    except Exception as e:
        logger.error(f"Failed to trigger sync for patient ID: {patient_id} - {str(e)}", exc_info=True)

def trigger_condition_sync(condition_id: int) -> None:
    """
    Trigger a Celery task to sync a condition to FHIR
    This implementation avoids circular imports by importing inside the function
    
    Args:
        condition_id: The ID of the condition to sync
    """
    from app.tasks import sync_condition_to_fhir
    try:
        logger.info(f"Triggering sync for condition ID: {condition_id}")
        task = sync_condition_to_fhir.delay(condition_id)
        logger.debug(f"Sync task created for condition ID: {condition_id}, task ID: {task.id}")
    except Exception as e:
        logger.error(f"Failed to trigger sync for condition ID: {condition_id} - {str(e)}", exc_info=True)

def trigger_observation_sync(observation_id: int) -> None:
    """
    Trigger a Celery task to sync an observation to FHIR
    This implementation avoids circular imports by importing inside the function
    
    Args:
        observation_id: The ID of the observation to sync
    """
    from app.tasks import sync_observation_to_fhir
    try:
        logger.info(f"Triggering sync for observation ID: {observation_id}")
        task = sync_observation_to_fhir.delay(observation_id)
        logger.debug(f"Sync task created for observation ID: {observation_id}, task ID: {task.id}")
    except Exception as e:
        logger.error(f"Failed to trigger sync for observation ID: {observation_id} - {str(e)}", exc_info=True)

def trigger_procedure_sync(procedure_id: int) -> None:
    """
    Trigger a Celery task to sync a procedure to FHIR
    This implementation avoids circular imports by importing inside the function
    
    Args:
        procedure_id: The ID of the procedure to sync
    """
    from app.tasks import sync_procedure_to_fhir
    try:
        logger.info(f"Triggering sync for procedure ID: {procedure_id}")
        task = sync_procedure_to_fhir.delay(procedure_id)
        logger.debug(f"Sync task created for procedure ID: {procedure_id}, task ID: {task.id}")
    except Exception as e:
        logger.error(f"Failed to trigger sync for procedure ID: {procedure_id} - {str(e)}", exc_info=True)

def check_sync_status(entity_type: str, entity_id: int) -> Optional[Dict[str, Any]]:
    """
    Check the sync status of an entity

    Args:
        entity_type: The type of entity ('patient', 'condition', 'observation', or 'procedure')
        entity_id: The ID of the entity

    Returns:
        Dictionary with sync status details or None if entity not found
    """
    try:
        logger.debug(f"Checking sync status for {entity_type} ID: {entity_id}")
        
        if entity_type == 'patient':
            from app.repositories.patient_repository import PatientRepository
            repository = PatientRepository()
        elif entity_type == 'condition':
            from app.repositories.condition_repository import ConditionRepository
            repository = ConditionRepository()
        elif entity_type == 'observation':
            from app.repositories.observation_repository import ObservationRepository
            repository = ObservationRepository()
        elif entity_type == 'procedure':
            from app.repositories.procedure_repository import ProcedureRepository
            repository = ProcedureRepository()
        else:
            logger.warning(f"Invalid entity type: {entity_type}")
            return None
        
        entity = repository.get_by_id(entity_id)
        if not entity:
            logger.warning(f"{entity_type.capitalize()} with ID {entity_id} not found")
            return None
        
        sync_status = {
            'id': entity_id,
            'type': entity_type,
            'sync_status': entity.sync_status,
            'synced_at': entity.synced_at.isoformat() if entity.synced_at else None,
            'fhir_id': entity.fhir_id
        }
        
        logger.debug(f"Sync status for {entity_type} ID {entity_id}: {sync_status}")
        return sync_status
        
    except Exception as e:
        logger.error(f"Error checking sync status for {entity_type} ID {entity_id}: {str(e)}", exc_info=True)
        return None