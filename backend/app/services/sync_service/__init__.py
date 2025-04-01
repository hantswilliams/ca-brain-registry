# This file makes the sync_service directory a Python package
from app.services.sync_service.service import trigger_patient_sync, trigger_condition_sync

__all__ = ['trigger_patient_sync', 'trigger_condition_sync']