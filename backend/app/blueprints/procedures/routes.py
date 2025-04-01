import logging
from flask import Blueprint, request, jsonify, g
from typing import Dict, Any

from app.services.procedure_service import ProcedureService
from app.schemas import ProcedureCreate
from pydantic import ValidationError
from app.middleware.auth import jwt_required, has_role, has_any_role

# Configure logging
logger = logging.getLogger(__name__)

procedures_bp = Blueprint('procedures', __name__, url_prefix='/procedures')

@procedures_bp.route('/', methods=['POST'])
@jwt_required
def create_procedure():
    """Create a new procedure"""
    try:
        data = request.json
        logger.debug(f"Received request to create procedure: {data}")
        
        # Add the current user as the creator
        if hasattr(g, 'current_user'):
            data['created_by_id'] = g.current_user.id
            logger.debug(f"Creating procedure with creator ID: {g.current_user.id}")
        
        result, status_code = ProcedureService.create_procedure(data)
        
        if status_code >= 400:
            logger.warning(f"Failed to create procedure: {result}")
            return jsonify(result), status_code
        
        logger.info(f"Procedure created successfully with ID: {result.id}")
        return jsonify(result.model_dump() if hasattr(result, 'model_dump') else result), status_code
    except Exception as e:
        logger.error(f"Unexpected error creating procedure: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500

@procedures_bp.route('/<int:id>', methods=['GET'])
@jwt_required
def get_procedure(id):
    """Get a procedure by ID"""
    try:
        logger.debug(f"Received request to get procedure with ID: {id}")
        procedure = ProcedureService.get_procedure_by_id(id)
        
        if not procedure:
            logger.info(f"Procedure not found with ID: {id}")
            return jsonify({"error": "Procedure not found"}), 404
        
        logger.debug(f"Retrieved procedure with ID: {id}")
        return jsonify(procedure.model_dump())
    except Exception as e:
        logger.error(f"Unexpected error retrieving procedure {id}: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500

@procedures_bp.route('/patient/<int:patient_id>', methods=['GET'])
@jwt_required
def get_patient_procedures(patient_id):
    """Get all procedures for a specific patient"""
    try:
        logger.debug(f"Received request to get procedures for patient ID: {patient_id}")
        procedures = ProcedureService.get_procedures_by_patient_id(patient_id)
        logger.info(f"Retrieved {len(procedures)} procedures for patient ID: {patient_id}")
        return jsonify([procedure.model_dump() for procedure in procedures])
    except Exception as e:
        logger.error(f"Unexpected error retrieving procedures for patient {patient_id}: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500