import logging
from flask import Blueprint, request, jsonify, g
from typing import Dict, Any

from app.services.condition_service import condition_service
from app.schemas import ConditionCreate
from pydantic import ValidationError
from app.middleware.auth import jwt_required, has_role, has_any_role

# Configure logging
logger = logging.getLogger(__name__)

condition_bp = Blueprint('condition', __name__, url_prefix='/conditions')

@condition_bp.route('/', methods=['POST'])
@jwt_required
def create_condition():
    """Create a new condition"""
    try:
        data = request.json
        logger.debug(f"Received request to create condition: {data}")
        
        # Add the current user as the creator
        if hasattr(g, 'current_user'):
            data['created_by_id'] = g.current_user.id
            logger.debug(f"Creating condition with creator ID: {g.current_user.id}")
        
        result, status_code = condition_service.create_condition(data)
        
        if status_code >= 400:
            logger.warning(f"Failed to create condition: {result}")
            return jsonify(result), status_code
        
        logger.info(f"Condition created successfully with ID: {result.id}")
        return jsonify(result.model_dump() if hasattr(result, 'model_dump') else result), status_code
    except Exception as e:
        logger.error(f"Unexpected error creating condition: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500

@condition_bp.route('/<int:id>', methods=['GET'])
@jwt_required
def get_condition(id):
    """Get a condition by ID"""
    try:
        logger.debug(f"Received request to get condition with ID: {id}")
        condition = condition_service.get_condition_by_id(id)
        
        if not condition:
            logger.info(f"Condition not found with ID: {id}")
            return jsonify({"error": "Condition not found"}), 404
        
        logger.debug(f"Retrieved condition with ID: {id}")
        return jsonify(condition.model_dump())
    except Exception as e:
        logger.error(f"Unexpected error retrieving condition {id}: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500

@condition_bp.route('/patient/<int:patient_id>', methods=['GET'])
@jwt_required
def get_patient_conditions(patient_id):
    """Get all conditions for a specific patient"""
    try:
        logger.debug(f"Received request to get conditions for patient ID: {patient_id}")
        conditions = condition_service.get_conditions_by_patient_id(patient_id)
        logger.info(f"Retrieved {len(conditions)} conditions for patient ID: {patient_id}")
        return jsonify([condition.model_dump() for condition in conditions])
    except Exception as e:
        logger.error(f"Unexpected error retrieving conditions for patient {patient_id}: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500