# Brain Registry API

The Brain Registry API is a Flask-based RESTful API that manages patients with neurological conditions. It provides endpoints for creating, reading, and searching patients and their conditions, with synchronization to a FHIR server for healthcare interoperability.

## Application Architecture

The API follows a layered architecture with clean separation of concerns:

### Core Components

- **API Layer (Blueprints)**: Handle HTTP requests/responses and route to appropriate services
- **Service Layer**: Implement business logic and orchestrate operations
- **Repository Layer**: Manage data access and persistence operations
- **Models**: Define database schema and entity relationships
- **Schemas**: Validate request data and format responses using Pydantic

### Key Features

- **FHIR Integration**: Synchronize data with FHIR server for healthcare standards compliance
- **Role-Based Authentication**: JWT-based authentication with role-based access control
- **Background Tasks**: Celery workers for asynchronous processing
- **API Documentation**: Swagger UI at `/api/docs/swagger` for interactive documentation
- **Standardized Error Handling**: Consistent error responses across all endpoints
- **Value Sets**: Reference data management for codes and controlled vocabularies

## Directory Structure

```
python-focused-api/
├── app/                          # Main application package
│   ├── api_docs/                 # API documentation (Swagger/OpenAPI)
│   ├── blueprints/               # Route definitions and HTTP handlers
│   │   ├── auth/                 # Authentication routes
│   │   ├── conditions/           # Condition management routes
│   │   ├── health/               # Health check routes
│   │   └── patients/             # Patient management routes
│   ├── middleware/               # Request processing middleware
│   ├── models.py                 # Database models and schema definitions
│   ├── repositories/             # Data access layer
│   ├── schemas.py                # Request/response schemas (Pydantic)
│   ├── services/                 # Business logic services
│   │   ├── auth_service/         # Authentication and authorization
│   │   ├── condition_service/    # Condition management
│   │   ├── patient_service/      # Patient management
│   │   └── sync_service/         # FHIR synchronization
│   ├── utils/                    # Utility functions and helpers
│   └── value_sets/               # Reference data for codes and enumerations
├── celery_worker.py              # Celery worker entry point
├── instance/                     # Instance-specific configuration (database, etc.)
├── manage.py                     # CLI management commands
├── migrations/                   # Database migration scripts
└── tests/                        # Test cases
```

## Configuration

Configuration is managed through environment variables. Create a `.env` file in the project root:

```
DATABASE_URI=sqlite:///app.db
CELERY_BROKER_URL=redis://localhost:6379/0
HAPI_FHIR_URL=http://localhost:8091/fhir
SECRET_KEY=your-secret-key-for-jwt
```

## Setup and Installation

### Prerequisites

- Python 3.8 or higher
- Redis (for Celery background tasks)
- SQLite or another database supported by SQLAlchemy

### Installation Steps

1. **Clone the repository**:
   ```
   git clone <repository-url>
   cd python-focused-api
   ```

2. **Create a virtual environment**:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```
   pip install -r requirements.txt
   ```

4. **Initialize the database**:
   ```
   flask db init
   flask db migrate -m "Initial"
   flask db upgrade
   ```

## Running the Application

### Development Server

```
flask run
```

### Background Tasks

Start the Celery worker for background task processing:

```
celery -A app.celery_app.celery worker --loglevel=info
```

### Redis Server

Ensure Redis is running (for Celery task queue):

```
redis-server
```

## API Endpoints

The API provides the following main endpoints:

- `/patients`: Manage patients (create, list, get by ID, search)
- `/conditions`: Manage conditions (create, get by ID, get by patient)
- `/auth`: User authentication (register, login)
- `/health`: Service health checks
- `/api/docs/swagger`: Interactive API documentation

## Testing

Run the test suite:

```
python -m pytest tests/
```

Or run a specific test file:

```
python -m pytest tests/test_auth.py
```

## Development Patterns

### Dependency Injection

Services use dependency injection for easier testing and component reuse. For example:

```python
# Create a service with a custom repository for testing
test_repository = MockPatientRepository()
patient_service = PatientService(repository=test_repository)
```

### Error Handling

Standardized error responses are provided through the `app.utils.error_handlers` module:

```python
from app.utils import validation_error, not_found_error, server_error

# Return a standard "not found" error response
return not_found_error("Patient", id)
```

### Logging

Consistent logging is implemented throughout the application with appropriate levels:

```python
logger.debug("Detailed debug information")
logger.info("Notable events like successful operations")
logger.warning("Issues that might need attention")
logger.error("Errors that prevent normal operation", exc_info=True)
```