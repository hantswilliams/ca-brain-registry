# Adding a New Concept to the Brain Registry API

This guide explains the process of adding a new concept (such as "Medications") to the Brain Registry application. It covers all required changes from data models to FHIR synchronization.

## Table of Contents

1. [Data Model](#1-data-model)
2. [Repository Layer](#2-repository-layer)
3. [Service Layer](#3-service-layer)
4. [API Routes (Blueprints)](#4-api-routes-blueprints)
5. [Schema Validation](#5-schema-validation)
6. [FHIR Synchronization](#6-fhir-synchronization)
7. [API Documentation](#7-api-documentation)
8. [Testing](#8-testing)

## 1. Data Model

First, define the data model for your new concept in `app/models.py`:

```python
class Medication(Base):
    """Model for medications"""
    __tablename__ = 'medications'
    
    id = Column(Integer, primary_key=True)
    medication_code = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    dosage = Column(String(100))
    route = Column(String(100))
    frequency = Column(String(100))
    start_date = Column(Date)
    end_date = Column(Date)
    status = Column(String(50), nullable=False)  # active, completed, stopped, etc.
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False)
    created_by_id = Column(Integer, ForeignKey('users.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # FHIR synchronization fields
    sync_status = Column(String(50), default="pending")
    synced_at = Column(DateTime)
    fhir_id = Column(String(100))
    fhir_resource = Column(Text)
    
    # Relationships
    patient = relationship("Patient", back_populates="medications")
    created_by = relationship("User")
    
    def update_sync_status(self, status, fhir_id=None):
        """Update the sync status of the medication"""
        self.sync_status = status
        if status == "synced" and fhir_id:
            self.fhir_id = fhir_id
            self.synced_at = datetime.utcnow()
```

Then update the Patient model to include the relationship:

```python
class Patient(Base):
    # ...existing code...
    
    # Add this relationship
    medications = relationship("Medication", back_populates="patient", cascade="all, delete-orphan")
```

After defining the model, create a migration:

```bash
flask db migrate -m "Add Medication model"
flask db upgrade
```

## 2. Repository Layer

Create a repository for the new concept in `app/repositories/medication_repository.py`:

```python
from app.repositories.base_repository import SQLAlchemyRepository
from app.models import Medication
from typing import List, Optional
import logging

# Configure logging
logger = logging.getLogger(__name__)

class MedicationRepository(SQLAlchemyRepository[Medication]):
    """Repository for Medication model"""
    
    def __init__(self):
        super().__init__(Medication)
    
    def find_by_patient_id(self, patient_id: int) -> List[Medication]:
        """Find medications for a specific patient"""
        logger.debug(f"Finding medications for patient ID: {patient_id}")
        return self.session.query(Medication).filter(Medication.patient_id == patient_id).all()
    
    def find_by_code(self, code: str) -> List[Medication]:
        """Find medications by code (exact match)"""
        logger.debug(f"Finding medications with code: {code}")
        return self.session.query(Medication).filter(Medication.medication_code == code).all()
    
    def find_by_fhir_id(self, fhir_id: str) -> Optional[Medication]:
        """Find a medication by FHIR ID"""
        logger.debug(f"Finding medication by FHIR ID: {fhir_id}")
        return self.session.query(Medication).filter(Medication.fhir_id == fhir_id).first()
    
    def update_sync_status(self, id: int, status: str, fhir_id: Optional[str] = None) -> Optional[Medication]:
        """Update sync status for a medication"""
        logger.debug(f"Updating sync status for medication ID {id} to {status}")
        medication = self.get_by_id(id)
        if medication:
            medication.update_sync_status(status, fhir_id)
            self.session.commit()
        return medication
```

## 3. Service Layer

Create a service for the new concept in `app/services/medication_service.py`:

```python
import logging
from typing import List, Optional, Dict, Any, Tuple, Union
from datetime import datetime

from app.models import Medication
from app.repositories.medication_repository import MedicationRepository  
from app.services.base_service import BaseService
from app.schemas import MedicationCreate, MedicationResponse
from app.services.sync_service import trigger_medication_sync

# Configure logging
logger = logging.getLogger(__name__)

class MedicationService(BaseService[Medication, MedicationRepository]):
    """Service for medication-related operations"""
    
    def __init__(self, repository: Optional[MedicationRepository] = None):
        super().__init__(repository or MedicationRepository())
    
    @BaseService.handle_service_exceptions
    def create_medication(self, medication_data: Dict[str, Any]) -> Tuple[Union[Dict[str, Any], Medication], int]:
        """Create a new medication"""
        try:
            # Validate with Pydantic schema
            validated_data = MedicationCreate(**medication_data)
            
            # Create medication in database
            medication = self.repository.create(validated_data.model_dump())
            
            # Trigger sync to FHIR
            trigger_medication_sync(medication.id)
            
            logger.info(f"Created medication ID {medication.id} for patient ID {medication.patient_id}")
            return medication, 201
            
        except Exception as e:
            logger.error(f"Error creating medication: {str(e)}", exc_info=True)
            raise
    
    def get_medication_by_id(self, id: int) -> Optional[Medication]:
        """Get a medication by ID"""
        logger.debug(f"Getting medication by ID: {id}")
        return self.repository.get_by_id(id)
    
    def get_medications_by_patient_id(self, patient_id: int) -> List[Medication]:
        """Get all medications for a specific patient"""
        logger.debug(f"Getting medications for patient ID: {patient_id}")
        return self.repository.find_by_patient_id(patient_id)
    
    def get_medications_by_code(self, code: str) -> List[Medication]:
        """Get medications by medication code"""
        logger.debug(f"Getting medications by code: {code}")
        return self.repository.find_by_code(code)

# Create a singleton instance for easy import
medication_service = MedicationService()
```

## 4. API Routes (Blueprints)

Create a blueprint for the new concept in `app/blueprints/medications/__init__.py`:

```python
from flask import Blueprint

medication_bp = Blueprint('medication', __name__, url_prefix='/medications')

from app.blueprints.medications import routes
```

Then create routes in `app/blueprints/medications/routes.py`:

```python
import logging
from flask import request, jsonify, g
from typing import Dict, Any

from app.blueprints.medications import medication_bp
from app.services.medication_service import medication_service
from app.middleware.auth import jwt_required
from app.utils import validation_error, not_found_error, server_error

# Configure logging
logger = logging.getLogger(__name__)

@medication_bp.route('/', methods=['POST'])
@jwt_required
def create_medication():
    """Create a new medication"""
    try:
        data = request.json
        logger.debug(f"Received request to create medication: {data}")
        
        # Add the current user as the creator
        if hasattr(g, 'current_user'):
            data['created_by_id'] = g.current_user.id
            logger.debug(f"Creating medication with creator ID: {g.current_user.id}")
        
        result, status_code = medication_service.create_medication(data)
        
        if status_code >= 400:
            logger.warning(f"Failed to create medication: {result}")
            return jsonify(result), status_code
        
        logger.info(f"Medication created successfully with ID: {result.id}")
        return jsonify(result.model_dump() if hasattr(result, 'model_dump') else result), status_code
    except Exception as e:
        logger.error(f"Unexpected error creating medication: {str(e)}", exc_info=True)
        return server_error("Error creating medication", e)

@medication_bp.route('/<int:id>', methods=['GET'])
@jwt_required
def get_medication(id):
    """Get a medication by ID"""
    try:
        logger.debug(f"Received request to get medication with ID: {id}")
        medication = medication_service.get_medication_by_id(id)
        
        if not medication:
            return not_found_error("Medication", id)
        
        logger.debug(f"Retrieved medication with ID: {id}")
        return jsonify(medication.model_dump())
    except Exception as e:
        logger.error(f"Unexpected error retrieving medication {id}: {str(e)}", exc_info=True)
        return server_error(f"Error retrieving medication with ID {id}", e)

@medication_bp.route('/patient/<int:patient_id>', methods=['GET'])
@jwt_required
def get_patient_medications(patient_id):
    """Get all medications for a specific patient"""
    try:
        logger.debug(f"Received request to get medications for patient ID: {patient_id}")
        medications = medication_service.get_medications_by_patient_id(patient_id)
        logger.info(f"Retrieved {len(medications)} medications for patient ID: {patient_id}")
        return jsonify([medication.model_dump() for medication in medications])
    except Exception as e:
        logger.error(f"Unexpected error retrieving medications for patient {patient_id}: {str(e)}", exc_info=True)
        return server_error("Error retrieving medications", e)
```

Register this blueprint in your `app/__init__.py`:

```python
# In the create_app function
from app.blueprints.medications import medication_bp
app.register_blueprint(medication_bp)
```

## 5. Schema Validation

Define schemas for your new concept in `app/schemas.py`:

```python
# Medication schemas
class MedicationBase(BaseModel):
    """Base schema for medication data"""
    medication_code: str
    name: str
    dosage: Optional[str] = None
    route: Optional[str] = None
    frequency: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    status: str
    patient_id: int
    
class MedicationCreate(MedicationBase):
    """Schema for creating a new medication"""
    created_by_id: Optional[int] = None

class MedicationResponse(MedicationBase):
    """Schema for medication response"""
    id: int
    created_at: datetime
    updated_at: datetime
    sync_status: str
    synced_at: Optional[datetime] = None
    fhir_id: Optional[str] = None
    
    class Config:
        from_attributes = True
```

## 6. FHIR Synchronization

### 1. Add Sync Trigger Function

Add a function to trigger synchronization in `app/services/sync_service.py`:

```python
def trigger_medication_sync(medication_id: int) -> None:
    """
    Trigger a Celery task to sync a medication to FHIR
    
    Args:
        medication_id: The ID of the medication to sync
    """
    from app.tasks import sync_medication_to_fhir
    try:
        logger.info(f"Triggering sync for medication ID: {medication_id}")
        task = sync_medication_to_fhir.delay(medication_id)
        logger.debug(f"Sync task created for medication ID: {medication_id}, task ID: {task.id}")
    except Exception as e:
        logger.error(f"Failed to trigger sync for medication ID: {medication_id} - {str(e)}", exc_info=True)
```

### 2. Define Celery Task

Add a task for FHIR synchronization in `app/tasks.py`:

```python
@celery.task(name="sync_medication_to_fhir")
def sync_medication_to_fhir(medication_id):
    """
    Sync a medication to the FHIR server
    """
    from app.repositories.medication_repository import MedicationRepository
    import requests
    import json
    
    repository = MedicationRepository()
    medication = repository.get_by_id(medication_id)
    
    if not medication:
        logger.error(f"Medication with ID {medication_id} not found")
        return
    
    # Convert to FHIR MedicationStatement resource
    fhir_data = {
        "resourceType": "MedicationStatement",
        "status": medication.status,
        "medicationCodeableConcept": {
            "coding": [
                {
                    "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
                    "code": medication.medication_code,
                    "display": medication.name
                }
            ],
            "text": medication.name
        },
        "subject": {
            "reference": f"Patient/{medication.patient.fhir_id}" if medication.patient.fhir_id else None,
            "display": medication.patient.name
        },
        "effectivePeriod": {
            "start": medication.start_date.isoformat() if medication.start_date else None,
            "end": medication.end_date.isoformat() if medication.end_date else None
        },
        "dosage": [
            {
                "text": f"{medication.dosage or ''} {medication.route or ''} {medication.frequency or ''}".strip(),
                "route": {
                    "text": medication.route
                } if medication.route else None,
                "doseAndRate": [
                    {
                        "text": medication.dosage
                    }
                ] if medication.dosage else None
            }
        ]
    }
    
    # Clean up None values
    fhir_data = {k: v for k, v in fhir_data.items() if v is not None}
    
    try:
        # If the medication has a FHIR ID, update the existing resource
        if medication.fhir_id:
            response = requests.put(
                f"{FHIR_SERVER_URL}/MedicationStatement/{medication.fhir_id}",
                json=fhir_data,
                headers={"Content-Type": "application/fhir+json"}
            )
        # Otherwise create a new resource
        else:
            response = requests.post(
                f"{FHIR_SERVER_URL}/MedicationStatement",
                json=fhir_data,
                headers={"Content-Type": "application/fhir+json"}
            )
        
        if response.status_code in (200, 201):
            fhir_resource = response.json()
            fhir_id = fhir_resource.get("id")
            
            if fhir_id:
                # Store the FHIR resource JSON for reference
                medication.fhir_resource = json.dumps(fhir_resource)
                # Update sync status
                repository.update_sync_status(medication_id, "synced", fhir_id)
                logger.info(f"Medication {medication_id} synced to FHIR with ID {fhir_id}")
                return fhir_id
            else:
                repository.update_sync_status(medication_id, "error")
                logger.error(f"FHIR server response missing ID for medication {medication_id}")
        else:
            repository.update_sync_status(medication_id, "error")
            logger.error(f"Failed to sync medication {medication_id} to FHIR. Status: {response.status_code}, Response: {response.text}")
    
    except Exception as e:
        repository.update_sync_status(medication_id, "error")
        logger.error(f"Error syncing medication {medication_id} to FHIR: {str(e)}", exc_info=True)
```

## 7. API Documentation

Create API documentation for your new concept in `app/api_docs/medication_namespace.py`:

```python
from flask_restx import Namespace, Resource, fields
from flask import request
from app.services.medication_service import medication_service

# Create a namespace for medication-related endpoints
medication_ns = Namespace('medications', description='Medication operations')

# Define models for request and response documentation
medication_create_model = medication_ns.model('MedicationCreate', {
    'medication_code': fields.String(required=True, description="Medication code (e.g., RxNorm)"),
    'name': fields.String(required=True, description="Medication name"),
    'dosage': fields.String(required=False, description="Medication dosage"),
    'route': fields.String(required=False, description="Administration route"),
    'frequency': fields.String(required=False, description="Administration frequency"),
    'start_date': fields.Date(required=True, description="Start date (YYYY-MM-DD)"),
    'end_date': fields.Date(required=False, description="End date (YYYY-MM-DD)"),
    'status': fields.String(required=True, description="Medication status (active, completed, stopped)"),
    'patient_id': fields.Integer(required=True, description="ID of the patient taking this medication"),
})

medication_response_model = medication_ns.model('MedicationResponse', {
    'id': fields.Integer(description="Medication's unique identifier"),
    'medication_code': fields.String(description="Medication code"),
    'name': fields.String(description="Medication name"),
    'dosage': fields.String(description="Medication dosage"),
    'route': fields.String(description="Administration route"),
    'frequency': fields.String(description="Administration frequency"),
    'start_date': fields.Date(description="Start date"),
    'end_date': fields.Date(description="End date"),
    'status': fields.String(description="Medication status"),
    'patient_id': fields.Integer(description="Patient ID"),
    'sync_status': fields.String(description="Synchronization status"),
    'synced_at': fields.DateTime(description="Last sync timestamp"),
    'fhir_id': fields.String(description="FHIR resource ID"),
})

# Define routes and their documentation
@medication_ns.route('/')
class MedicationList(Resource):
    @medication_ns.doc('create_medication')
    @medication_ns.expect(medication_create_model)
    @medication_ns.marshal_with(medication_response_model, code=201)
    def post(self):
        """Create a new medication"""
        data = request.json
        result, status_code = medication_service.create_medication(data)
        return result.model_dump() if hasattr(result, 'model_dump') else result, status_code

@medication_ns.route('/<int:id>')
@medication_ns.param('id', 'The medication identifier')
@medication_ns.response(404, 'Medication not found')
class Medication(Resource):
    @medication_ns.doc('get_medication')
    @medication_ns.marshal_with(medication_response_model)
    def get(self, id):
        """Get a medication by ID"""
        medication = medication_service.get_medication_by_id(id)
        if not medication:
            medication_ns.abort(404, f"Medication {id} not found")
        return medication.model_dump()

@medication_ns.route('/patient/<int:patient_id>')
@medication_ns.param('patient_id', 'The patient identifier')
class PatientMedications(Resource):
    @medication_ns.doc('get_patient_medications')
    @medication_ns.marshal_list_with(medication_response_model)
    def get(self, patient_id):
        """Get all medications for a specific patient"""
        medications = medication_service.get_medications_by_patient_id(patient_id)
        return [m.model_dump() for m in medications]
```

Add the namespace to your API documentation in `app/api_docs/__init__.py`:

```python
# Import and register namespaces
from app.api_docs.medication_namespace import medication_ns
# ...existing code...
api.add_namespace(medication_ns)
```

## 8. Testing

### 1. Create Unit Tests

Create unit tests for the new medication service in `tests/unit/test_medication_service.py`:

```python
"""
Unit tests for the medication service using dependency injection
"""
import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, date
from typing import Dict, Any

from app.services.medication_service import MedicationService
from app.repositories.medication_repository import MedicationRepository
from app.models import Medication

class TestMedicationService:
    """Tests for the MedicationService class"""
    
    def test_get_medications_by_patient_id(self, medication_service, medication_repository):
        """Test getting medications for a patient"""
        # Arrange
        patient_id = 1
        mock_medications = [
            Medication(id=1, name="Test Med 1", medication_code="123", status="active", patient_id=patient_id),
            Medication(id=2, name="Test Med 2", medication_code="456", status="completed", patient_id=patient_id)
        ]
        medication_repository.find_by_patient_id = MagicMock(return_value=mock_medications)
        
        # Act
        result = medication_service.get_medications_by_patient_id(patient_id)
        
        # Assert
        assert len(result) == 2
        assert result[0].name == "Test Med 1"
        assert result[1].name == "Test Med 2"
        medication_repository.find_by_patient_id.assert_called_once_with(patient_id)
    
    # Add more unit tests for other methods...
```

### 2. Create Integration Tests

Create integration tests for the medication workflow in `tests/integration/test_medication_workflow.py`:

```python
"""
Integration tests for the medication workflow
"""
import pytest
import json
from datetime import date

class TestMedicationWorkflow:
    """Tests for the complete medication management workflow"""
    
    def test_medication_creation_and_retrieval(self, client, user_headers):
        """Test the complete workflow: create medication, retrieve it"""
        # Step 1: Create a test patient to associate the medication with
        patient_data = {
            "name": "Test Patient for Medication",
            "birth_date": "1990-01-01",
            "gender": "female"
        }
        
        patient_response = client.post(
            '/patients/',
            headers=user_headers,
            json=patient_data
        )
        
        patient_id = json.loads(patient_response.data)['id']
        
        # Step 2: Create a new medication
        medication_data = {
            "medication_code": "161",
            "name": "Acetaminophen",
            "dosage": "500mg",
            "route": "oral",
            "frequency": "every 6 hours",
            "start_date": "2023-01-01",
            "status": "active",
            "patient_id": patient_id
        }
        
        create_response = client.post(
            '/medications/',
            headers=user_headers,
            json=medication_data
        )
        
        # Check that medication was created successfully
        assert create_response.status_code == 201
        create_data = json.loads(create_response.data)
        assert create_data['name'] == "Acetaminophen"
        
        # Get the created medication's ID
        medication_id = create_data['id']
        
        # Step 3: Retrieve the medication by ID
        get_response = client.get(
            f'/medications/{medication_id}',
            headers=user_headers
        )
        
        # Check that medication can be retrieved
        assert get_response.status_code == 200
        get_data = json.loads(get_response.data)
        assert get_data['id'] == medication_id
        assert get_data['name'] == "Acetaminophen"
        assert get_data['dosage'] == "500mg"
        
        # Step 4: Retrieve medications for the patient
        patient_meds_response = client.get(
            f'/medications/patient/{patient_id}',
            headers=user_headers
        )
        
        # Check that patient medications can be retrieved
        assert patient_meds_response.status_code == 200
        patient_meds_data = json.loads(patient_meds_response.data)
        assert len(patient_meds_data) >= 1
        
        # Find our medication in the results
        found = False
        for med in patient_meds_data:
            if med['id'] == medication_id:
                found = True
                break
        
        assert found, "Created medication not found in patient medications list"
```

## Final Steps

After implementing all of the above components, follow these final steps:

1. **Database Migration**: Apply your database migrations to create the new table
   ```bash
   flask db migrate -m "Add Medication model"
   flask db upgrade
   ```

2. **Restart your application**: Restart your Flask application to load the new code

3. **Manual Testing**: Test the new endpoints via Swagger UI or Postman

4. **Monitor Sync**: Check the logs to ensure FHIR synchronization is working properly

Following this guide will ensure that your new concept is fully integrated into the Brain Registry system with proper data modeling, API access, validation, and FHIR synchronization.