from flask_restx import Namespace, Resource, fields
from flask import request
from app.services.observation_service import observation_service
from app.schemas import ObservationCreate, ObservationResponse

# Create a namespace for observation-related endpoints
observation_ns = Namespace('observations', description='Observation operations')

# Define models for request and response documentation
observation_create_model = observation_ns.model('ObservationCreate', {
    'observation_code': fields.String(required=True, description="Observation code"),
    'observation_name': fields.String(required=True, description="Observation name/type"),
    'value': fields.String(required=True, description="Observation value"),
    'unit': fields.String(required=False, description="Unit of measurement"),
    'reference_range': fields.String(required=False, description="Reference range for the observation"),
    'observation_date': fields.DateTime(required=True, description="Date and time of observation"),
    'status': fields.String(required=False, default="final", description="Observation status (registered, preliminary, final, amended, corrected, cancelled, entered-in-error, unknown)"),
    'patient_id': fields.Integer(required=True, description="ID of the patient with this observation"),
})

observation_response_model = observation_ns.model('ObservationResponse', {
    'id': fields.Integer(description="Observation's unique identifier"),
    'observation_code': fields.String(description="Observation code"),
    'observation_name': fields.String(description="Observation name/type"),
    'value': fields.String(description="Observation value"),
    'unit': fields.String(description="Unit of measurement"),
    'reference_range': fields.String(description="Reference range for the observation"),
    'observation_date': fields.DateTime(description="Date and time of observation"),
    'status': fields.String(description="Observation status"),
    'patient_id': fields.Integer(description="ID of the patient with this observation"),
    'sync_status': fields.String(description="Synchronization status"),
    'fhir_id': fields.String(description="FHIR resource ID"),
    'synced_at': fields.DateTime(description="Last sync timestamp"),
    'created_at': fields.DateTime(description="Creation timestamp"),
    'updated_at': fields.DateTime(description="Last update timestamp"),
})

# Define routes and their documentation
@observation_ns.route('/')
class ObservationList(Resource):
    @observation_ns.doc('create_observation')
    @observation_ns.expect(observation_create_model)
    @observation_ns.marshal_with(observation_response_model, code=201)
    def post(self):
        """Create a new observation"""
        data = request.json
        result, status_code = observation_service.create_observation(data)
        return result.model_dump() if hasattr(result, 'model_dump') else result, status_code

@observation_ns.route('/<int:id>')
@observation_ns.param('id', 'The observation identifier')
@observation_ns.response(404, 'Observation not found')
class Observation(Resource):
    @observation_ns.doc('get_observation')
    @observation_ns.marshal_with(observation_response_model)
    def get(self, id):
        """Get an observation by ID"""
        observation = observation_service.get_observation_by_id(id)
        if not observation:
            observation_ns.abort(404, f"Observation {id} not found")
        return observation.model_dump()

@observation_ns.route('/patient/<int:patient_id>')
@observation_ns.param('patient_id', 'The patient identifier')
class PatientObservations(Resource):
    @observation_ns.doc('get_patient_observations')
    @observation_ns.marshal_list_with(observation_response_model)
    def get(self, patient_id):
        """Get all observations for a specific patient"""
        observations = observation_service.get_observations_by_patient_id(patient_id)
        return [o.model_dump() for o in observations]