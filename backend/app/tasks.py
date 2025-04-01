from .celery_app import celery
from .models import Patient, Condition, Observation, Procedure
from . import db
from .config import Config
from datetime import datetime
import requests

# Instead of creating the app immediately, we'll create it only when running a task
# This breaks the circular import cycle
def get_flask_app():
    from . import create_app
    return create_app()

@celery.task
def sync_patient_to_fhir(patient_id):
    # Get the app only when the task runs
    flask_app = get_flask_app()
    
    with flask_app.app_context():
        patient = Patient.query.get(patient_id)
        if not patient:
            return
        fhir_resource = {
            "resourceType": "Patient",
            "name": [{"text": patient.name}],
            "gender": patient.gender,
            "birthDate": patient.birth_date.strftime('%Y-%m-%d')
        }
        try:
            r = requests.post(f"{Config.HAPI_FHIR_URL}/Patient", json=fhir_resource)
            if r.status_code in (200, 201):
                patient.fhir_id = r.json().get("id")
                patient.sync_status = "success"
                patient.synced_at = datetime.utcnow()
            else:
                patient.sync_status = f"failed ({r.status_code})"
        except Exception as e:
            patient.sync_status = f"error: {str(e)}"
        db.session.commit()

@celery.task
def sync_condition_to_fhir(condition_id):
    # Get the app only when the task runs
    flask_app = get_flask_app()
    
    with flask_app.app_context():
        condition = Condition.query.get(condition_id)
        if not condition:
            return
            
        patient = Patient.query.get(condition.patient_id)
        if not patient:
            return
            
        fhir_resource = {
            "resourceType": "Condition",
            "subject": {"reference": f"Patient/{patient.fhir_id}"},
            "code": {"text": condition.condition_code},
            "clinicalStatus": {"text": condition.status},
            "onsetDateTime": condition.onset_date.strftime('%Y-%m-%d')
        }
        try:
            r = requests.post(f"{Config.HAPI_FHIR_URL}/Condition", json=fhir_resource)
            if r.status_code in (200, 201):
                condition.fhir_id = r.json().get("id")
                condition.sync_status = "success"
                condition.synced_at = datetime.utcnow()
            else:
                condition.sync_status = f"failed ({r.status_code})"
        except Exception as e:
            condition.sync_status = f"error: {str(e)}"
        db.session.commit()

@celery.task
def sync_observation_to_fhir(observation_id):
    # Get the app only when the task runs
    flask_app = get_flask_app()
    
    with flask_app.app_context():
        observation = Observation.query.get(observation_id)
        if not observation:
            return
            
        patient = Patient.query.get(observation.patient_id)
        if not patient:
            return
            
        fhir_resource = {
            "resourceType": "Observation",
            "status": observation.status,
            "code": {
                "coding": [
                    {
                        "system": "http://loinc.org",
                        "code": observation.observation_code,
                        "display": observation.observation_name
                    }
                ],
                "text": observation.observation_name
            },
            "subject": {"reference": f"Patient/{patient.fhir_id}"},
            "effectiveDateTime": observation.observation_date.strftime('%Y-%m-%dT%H:%M:%S%z'),
            "valueQuantity": {
                "value": float(observation.value) if observation.value.replace('.', '', 1).isdigit() else None,
                "unit": observation.unit,
                "system": "http://unitsofmeasure.org",
                "code": observation.unit
            }
        }
        try:
            r = requests.post(f"{Config.HAPI_FHIR_URL}/Observation", json=fhir_resource)
            if r.status_code in (200, 201):
                observation.fhir_id = r.json().get("id")
                observation.sync_status = "success"
                observation.synced_at = datetime.utcnow()
            else:
                observation.sync_status = f"failed ({r.status_code})"
        except Exception as e:
            observation.sync_status = f"error: {str(e)}"
        db.session.commit()

@celery.task
def sync_procedure_to_fhir(procedure_id):
    # Get the app only when the task runs
    flask_app = get_flask_app()
    
    with flask_app.app_context():
        procedure = Procedure.query.get(procedure_id)
        if not procedure:
            return
            
        patient = Patient.query.get(procedure.patient_id)
        if not patient:
            return
            
        fhir_resource = {
            "resourceType": "Procedure",
            "status": procedure.status,
            "code": {
                "coding": [
                    {
                        "system": "http://snomed.info/sct",
                        "code": procedure.procedure_code,
                        "display": procedure.procedure_name
                    }
                ],
                "text": procedure.procedure_name
            },
            "subject": {"reference": f"Patient/{patient.fhir_id}"},
            "performedDateTime": procedure.performed_date.strftime('%Y-%m-%dT%H:%M:%S%z'),
            "bodySite": [
                {
                    "text": procedure.body_site
                }
            ] if procedure.body_site else None,
            "note": [
                {
                    "text": procedure.notes
                }
            ] if procedure.notes else None
        }
        try:
            r = requests.post(f"{Config.HAPI_FHIR_URL}/Procedure", json=fhir_resource)
            if r.status_code in (200, 201):
                procedure.fhir_id = r.json().get("id")
                procedure.sync_status = "success"
                procedure.synced_at = datetime.utcnow()
            else:
                procedure.sync_status = f"failed ({r.status_code})"
        except Exception as e:
            procedure.sync_status = f"error: {str(e)}"
        db.session.commit()