from flask_restx import Namespace, Resource, fields
from flask import request
from app.services.condition_service import condition_service
from app.schemas import ConditionCreate, ConditionResponse

# Create a namespace for condition-related endpoints
condition_ns = Namespace('conditions', description='Condition operations')

# Define models for request and response documentation
condition_create_model = condition_ns.model('ConditionCreate', {
    'condition_code': fields.String(required=True, description="Condition code"),
    'onset_date': fields.Date(required=True, description="Date of condition onset (YYYY-MM-DD)"),
    'status': fields.String(required=True, description="Condition status (active, inactive, resolved, unknown)"),
    'patient_id': fields.Integer(required=True, description="ID of the patient with this condition"),
})

condition_response_model = condition_ns.model('ConditionResponse', {
    'id': fields.Integer(description="Condition's unique identifier"),
    'condition_code': fields.String(description="Condition code"),
    'onset_date': fields.Date(description="Date of condition onset"),
    'status': fields.String(description="Condition status"),
    'patient_id': fields.Integer(description="ID of the patient with this condition"),
    'sync_status': fields.String(description="Synchronization status"),
    'fhir_id': fields.String(description="FHIR resource ID"),
    'synced_at': fields.DateTime(description="Last sync timestamp"),
})

# Define routes and their documentation
@condition_ns.route('/')
class ConditionList(Resource):
    @condition_ns.doc('create_condition')
    @condition_ns.expect(condition_create_model)
    @condition_ns.marshal_with(condition_response_model, code=201)
    def post(self):
        """Create a new condition"""
        data = request.json
        result, status_code = condition_service.create_condition(data)
        return result.model_dump() if hasattr(result, 'model_dump') else result, status_code

@condition_ns.route('/<int:id>')
@condition_ns.param('id', 'The condition identifier')
@condition_ns.response(404, 'Condition not found')
class Condition(Resource):
    @condition_ns.doc('get_condition')
    @condition_ns.marshal_with(condition_response_model)
    def get(self, id):
        """Get a condition by ID"""
        condition = condition_service.get_condition_by_id(id)
        if not condition:
            condition_ns.abort(404, f"Condition {id} not found")
        return condition.model_dump()

@condition_ns.route('/patient/<int:patient_id>')
@condition_ns.param('patient_id', 'The patient identifier')
class PatientConditions(Resource):
    @condition_ns.doc('get_patient_conditions')
    @condition_ns.marshal_list_with(condition_response_model)
    def get(self, patient_id):
        """Get all conditions for a specific patient"""
        conditions = condition_service.get_conditions_by_patient_id(patient_id)
        return [c.model_dump() for c in conditions]