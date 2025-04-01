from flask_restx import Namespace, Resource, fields
from flask import request
from app.services.procedure_service.service import procedure_service
from app.schemas import ProcedureCreate, ProcedureResponse

# Create a namespace for procedure-related endpoints
procedure_ns = Namespace('procedures', description='Procedure operations')

# Define models for request and response documentation
procedure_create_model = procedure_ns.model('ProcedureCreate', {
    'procedure_code': fields.String(required=True, description="Procedure code"),
    'procedure_name': fields.String(required=True, description="Procedure name/type"),
    'description': fields.String(required=False, description="Description of the procedure"),
    'status': fields.String(required=False, default="scheduled", description="Procedure status (scheduled, completed, cancelled)"),
    'patient_id': fields.Integer(required=True, description="ID of the patient undergoing this procedure"),
})

procedure_response_model = procedure_ns.model('ProcedureResponse', {
    'id': fields.Integer(description="Procedure's unique identifier"),
    'procedure_code': fields.String(description="Procedure code"),
    'procedure_name': fields.String(description="Procedure name/type"),
    'description': fields.String(description="Description of the procedure"),
    'status': fields.String(description="Procedure status"),
    'patient_id': fields.Integer(description="ID of the patient undergoing this procedure"),
    'sync_status': fields.String(description="Synchronization status"),
    'fhir_id': fields.String(description="FHIR resource ID"),
    'synced_at': fields.DateTime(description="Last sync timestamp"),
    'created_at': fields.DateTime(description="Creation timestamp"),
    'updated_at': fields.DateTime(description="Last update timestamp"),
})

# Define routes and their documentation
@procedure_ns.route('/')
class ProcedureList(Resource):
    @procedure_ns.doc('create_procedure')
    @procedure_ns.expect(procedure_create_model)
    @procedure_ns.marshal_with(procedure_response_model, code=201)
    def post(self):
        """Create a new procedure"""
        data = request.json
        result, status_code = procedure_service.create_procedure(data)
        return result.model_dump() if hasattr(result, 'model_dump') else result, status_code
    
@procedure_ns.route('/<int:id>')
@procedure_ns.param('id', 'The procedure identifier')
@procedure_ns.response(404, 'Procedure not found')
class Procedure(Resource):
    @procedure_ns.doc('get_procedure')
    @procedure_ns.marshal_with(procedure_response_model)
    def get(self, id):
        """Get a procedure by ID"""
        procedure = procedure_service.get_procedure_by_id(id)
        if not procedure:
            procedure_ns.abort(404, f"Procedure {id} not found")
        return procedure.model_dump() if hasattr(procedure, 'model_dump') else procedure
    
@procedure_ns.route('/patient/<int:patient_id>')
@procedure_ns.param('patient_id', 'The patient identifier')
@procedure_ns.response(404, 'No procedures found for this patient')
class PatientProcedures(Resource):
    @procedure_ns.doc('get_patient_procedures')
    @procedure_ns.marshal_with(procedure_response_model, as_list=True)
    def get(self, patient_id):
        """Get all procedures for a specific patient"""
        procedures = procedure_service.get_procedures_by_patient_id(patient_id)
        if not procedures:
            procedure_ns.abort(404, f"No procedures found for patient {patient_id}")
        return [proc.model_dump() if hasattr(proc, 'model_dump') else proc for proc in procedures]