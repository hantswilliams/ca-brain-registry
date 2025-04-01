class SyncService:
    """Service for synchronizing entities with external systems"""
    
    @staticmethod
    def trigger_sync(entity_type, entity_id):
        """
        Generic method to trigger a sync based on entity type
        
        Args:
            entity_type: String representing entity type (e.g., 'patient', 'condition')
            entity_id: ID of the entity to sync
        """
        if entity_type == 'patient':
            from app.tasks import sync_patient_to_fhir
            sync_patient_to_fhir.delay(entity_id)
        elif entity_type == 'condition':
            from app.tasks import sync_condition_to_fhir
            sync_condition_to_fhir.delay(entity_id)
        else:
            raise ValueError(f"Unknown entity type: {entity_type}")


def trigger_patient_sync(patient_id):
    """
    Trigger a Celery task to sync a patient to FHIR
    """
    SyncService.trigger_sync('patient', patient_id)


def trigger_condition_sync(condition_id):
    """
    Trigger a Celery task to sync a condition to FHIR
    """
    SyncService.trigger_sync('condition', condition_id)