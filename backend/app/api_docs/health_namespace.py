from flask_restx import Namespace, Resource, fields

# Create a namespace for health check endpoints
health_ns = Namespace('health', description='Health check operations')

# Define models for response documentation
health_response_model = health_ns.model('HealthResponse', {
    'status': fields.String(description="Status of the API", example="healthy"),
    'version': fields.String(description="API version", example="1.0"),
    'database': fields.String(description="Database connection status", example="connected"),
    'fhir_server': fields.String(description="FHIR server connection status", example="connected"),
})

# Define routes and their documentation
@health_ns.route('/')
class HealthCheck(Resource):
    @health_ns.doc('health_check', responses={
        200: 'API is healthy',
        500: 'API is not healthy'
    })
    @health_ns.marshal_with(health_response_model)
    def get(self):
        """Get the health status of the API"""
        # This documentation is for reference only
        # The actual implementation checks database connectivity and FHIR server
        return {
            'status': 'healthy',
            'version': '1.0',
            'database': 'connected',
            'fhir_server': 'connected'
        }