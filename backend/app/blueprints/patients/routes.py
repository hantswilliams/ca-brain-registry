import logging
from flask import Blueprint, request, jsonify, g
from typing import Dict, Any

from app.services.patient_service import patient_service
from app.schemas import PatientCreate
from pydantic import ValidationError
from app.middleware.auth import jwt_required, has_role, has_any_role
from app.utils import validation_error, not_found_error, server_error

# Configure logging
logger = logging.getLogger(__name__)

patient_bp = Blueprint('patient', __name__, url_prefix='/patients')

@patient_bp.route('/', methods=['POST'])
@jwt_required
def create_patient():
    """Create a new patient"""
    try:
        data = request.json
        logger.debug(f"Received request to create patient: {data}")
        
        # Add the current user as the creator
        if hasattr(g, 'current_user'):
            data['created_by_id'] = g.current_user.id
            logger.debug(f"Creating patient with creator ID: {g.current_user.id}")
        
        result, status_code = patient_service.create_patient(data)
        
        if status_code >= 400:
            if 'error' in result and isinstance(result['error'], list):
                return validation_error(result['error'])
            logger.warning(f"Failed to create patient: {result}")
            return jsonify(result), status_code
        
        logger.info(f"Patient created successfully with ID: {result.id}")
        return jsonify(result.model_dump() if hasattr(result, 'model_dump') else result), status_code
    except ValidationError as e:
        return validation_error(e.errors())
    except Exception as e:
        return server_error("Error creating patient", e)

@patient_bp.route('/', methods=['GET'])
@jwt_required
def get_patients():
    """Get all patients"""
    try:
        logger.debug("Received request to get all patients")
        patients = patient_service.get_all_patients()
        logger.info(f"Retrieved {len(patients)} patients")
        return jsonify([patient.model_dump() for patient in patients])
    except Exception as e:
        return server_error("Error retrieving patients", e)

@patient_bp.route('/<int:id>', methods=['GET'])
@jwt_required
def get_patient(id):
    """Get a patient by ID"""
    try:
        logger.debug(f"Received request to get patient with ID: {id}")
        patient = patient_service.get_patient_by_id(id)
        
        if not patient:
            return not_found_error("Patient", id)
        
        logger.debug(f"Retrieved patient with ID: {id}")
        return jsonify(patient.model_dump())
    except Exception as e:
        return server_error(f"Error retrieving patient with ID {id}", e)

@patient_bp.route('/search', methods=['GET'])
@jwt_required
def search_patients():
    """Search for patients by name"""
    try:
        name = request.args.get('name', '')
        logger.debug(f"Received request to search for patients with name: {name}")
        
        if not name:
            logger.warning("Patient search missing name parameter")
            return validation_error([{
                "loc": ["query", "name"],
                "msg": "Name parameter is required",
                "type": "value_error.missing"
            }])
        
        patients = patient_service.find_patients_by_name(name)
        logger.info(f"Found {len(patients)} patients matching name: {name}")
        return jsonify([patient.model_dump() for patient in patients])
    except Exception as e:
        return server_error("Error searching patients", e)