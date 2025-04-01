from flask_restx import Namespace, Resource, fields
from flask import request
from app.services.patient_service import patient_service
from app.schemas import PatientCreate, PatientResponse

# Create a namespace for patient-related endpoints
patient_ns = Namespace('patients', description='Patient operations')

# Define models for request and response documentation
patient_create_model = patient_ns.model('PatientCreate', {
    'name': fields.String(required=True, description="Patient's full name"),
    'birth_date': fields.Date(required=True, description="Patient's date of birth (YYYY-MM-DD)"),
    'gender': fields.String(required=False, description="Patient's gender (male, female, other, unknown)"),
})

patient_response_model = patient_ns.model('PatientResponse', {
    'id': fields.Integer(description="Patient's unique identifier"),
    'name': fields.String(description="Patient's full name"),
    'birth_date': fields.Date(description="Patient's date of birth"),
    'gender': fields.String(description="Patient's gender"),
    'sync_status': fields.String(description="Synchronization status"),
    'fhir_id': fields.String(description="FHIR resource ID"),
    'synced_at': fields.DateTime(description="Last sync timestamp"),
})

# Define routes and their documentation
@patient_ns.route('/')
class PatientList(Resource):
    @patient_ns.doc('list_patients')
    @patient_ns.marshal_list_with(patient_response_model)
    def get(self):
        """List all patients"""
        return [p.model_dump() for p in patient_service.get_all_patients()]
    
    @patient_ns.doc('create_patient')
    @patient_ns.expect(patient_create_model)
    @patient_ns.marshal_with(patient_response_model, code=201)
    def post(self):
        """Create a new patient"""
        data = request.json
        result, status_code = patient_service.create_patient(data)
        return result.model_dump() if hasattr(result, 'model_dump') else result, status_code

@patient_ns.route('/<int:id>')
@patient_ns.param('id', 'The patient identifier')
@patient_ns.response(404, 'Patient not found')
class Patient(Resource):
    @patient_ns.doc('get_patient')
    @patient_ns.marshal_with(patient_response_model)
    def get(self, id):
        """Get a patient by ID"""
        patient = patient_service.get_patient_by_id(id)
        if not patient:
            patient_ns.abort(404, f"Patient {id} not found")
        return patient.model_dump()

@patient_ns.route('/search')
@patient_ns.param('name', 'The name to search for')
class PatientSearch(Resource):
    @patient_ns.doc('search_patients')
    @patient_ns.marshal_list_with(patient_response_model)
    def get(self):
        """Search for patients by name"""
        name = request.args.get('name', '')
        if not name:
            patient_ns.abort(400, "Name parameter is required")
        
        patients = patient_service.find_patients_by_name(name)
        return [p.model_dump() for p in patients]