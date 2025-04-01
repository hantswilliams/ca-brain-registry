from flask import Blueprint
from flask_restx import Api

# Create a blueprint for API documentation
api_doc = Blueprint('api_doc', __name__, url_prefix='/api/docs')

# Create a Flask-RESTX API instance
api = Api(
    api_doc,
    version='1.0',
    title='Brain Registry API',
    description='API for managing patients, conditions, and observations in the Brain Registry',
    doc='/swagger',  # Swagger UI will be available at /api/docs/swagger
)

# Import and register namespaces
from app.api_docs.patient_namespace import patient_ns
from app.api_docs.condition_namespace import condition_ns
from app.api_docs.auth_namespace import auth_ns
from app.api_docs.health_namespace import health_ns
from app.api_docs.value_sets_namespace import value_sets_ns
from app.api_docs.observation_namespace import observation_ns
from app.api_docs.procedure_namespace import procedure_ns

# Add all namespaces to the API
api.add_namespace(patient_ns)
api.add_namespace(condition_ns)
api.add_namespace(auth_ns)
api.add_namespace(health_ns)
api.add_namespace(value_sets_ns)
api.add_namespace(observation_ns)
api.add_namespace(procedure_ns)