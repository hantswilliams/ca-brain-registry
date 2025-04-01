import logging
from flask import Blueprint, request, jsonify, g
from typing import Dict, Any

from app.services.observation_service import observation_service
from app.schemas import ObservationCreate
from pydantic import ValidationError
from app.middleware.auth import jwt_required, has_role, has_any_role

# Configure logging
logger = logging.getLogger(__name__)

observation_bp = Blueprint('observation', __name__, url_prefix='/observations')

@observation_bp.route('/', methods=['POST'])
@jwt_required
def create_observation():
    """Create a new observation"""
    try:
        data = request.json
        logger.debug(f"Received request to create observation: {data}")
        
        # Add the current user as the creator
        if hasattr(g, 'current_user'):
            data['created_by_id'] = g.current_user.id
            logger.debug(f"Creating observation with creator ID: {g.current_user.id}")
        
        result, status_code = observation_service.create_observation(data)
        
        if status_code >= 400:
            logger.warning(f"Failed to create observation: {result}")
            return jsonify(result), status_code
        
        logger.info(f"Observation created successfully with ID: {result.id}")
        return jsonify(result.model_dump() if hasattr(result, 'model_dump') else result), status_code
    except Exception as e:
        logger.error(f"Unexpected error creating observation: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500

@observation_bp.route('/<int:id>', methods=['GET'])
@jwt_required
def get_observation(id):
    """Get an observation by ID"""
    try:
        logger.debug(f"Received request to get observation with ID: {id}")
        observation = observation_service.get_observation_by_id(id)
        
        if not observation:
            logger.info(f"Observation not found with ID: {id}")
            return jsonify({"error": "Observation not found"}), 404
        
        logger.debug(f"Retrieved observation with ID: {id}")
        return jsonify(observation.model_dump())
    except Exception as e:
        logger.error(f"Unexpected error retrieving observation {id}: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500

@observation_bp.route('/patient/<int:patient_id>', methods=['GET'])
@jwt_required
def get_patient_observations(patient_id):
    """Get all observations for a specific patient"""
    try:
        logger.debug(f"Received request to get observations for patient ID: {patient_id}")
        observations = observation_service.get_observations_by_patient_id(patient_id)
        logger.info(f"Retrieved {len(observations)} observations for patient ID: {patient_id}")
        return jsonify([observation.model_dump() for observation in observations])
    except Exception as e:
        logger.error(f"Unexpected error retrieving observations for patient {patient_id}: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500