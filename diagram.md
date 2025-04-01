# Brain Registry System Architecture

## System Components

```
+-------------------+
|    Web Frontend   |
| (Admin & Clinical |
|   User Access)    |
+-------------------+
         |
         ▼
+-------------------+
| Transactional DB  |  (Postgres, MySQL, etc.)
| (Application CRUD |
|   Operations)     |
+-------------------+
         ▲
         │
+--------------------------+
|        API App           |
| +-----------------------+|  (Business Logic, Data Validation,
| | Controllers/Blueprints ||   Authentication, etc.)
| |  - Patients           ||
| |  - Conditions         ||
| |  - Auth               ||
| |  - Health             ||
| +-----------------------+|
| |      Services         ||
| |  - Patient Service    ||
| |  - Condition Service  ||
| |  - Auth Service       ||
| |  - Sync Service       ||
| +-----------------------+|
| |     Repositories      ||
| |  - Patient Repository ||
| |  - Condition Repository||
| |  - User Repository    ||
| +-----------------------+|
+--------------------------+
         │
         ▼
+-------------------+
| Sync/ETL Service  |  (Celery Worker)
| - Data Mapping    |  (Task Queue)
| - Data Validation |
+-------------------+
         │
         ▼
+-------------------+
|  HAPI FHIR Server |
|  (Canonical Data  |
|   FHIR API Access)|
+-------------------+
         │
         ▼
+-------------------+
|   External APIs   |  (Other Hospitals, Research, Analytics)
|   Data Extraction |
+-------------------+
```

## Cross-Cutting Components

```
+-------------------+    +-------------------+    +-------------------+
| Error Handling    |    | Authentication &  |    | Logging System    |
| - Standardized    |    | Authorization     |    | - Structured      |
| - Consistent      |    | - JWT             |    | - Levels          |
| - API Responses   |    | - Role-Based      |    | - Consistent      |
+-------------------+    +-------------------+    +-------------------+
```

```
+-------------------+    +-------------------+    +-------------------+
| API Documentation |    | Reference Data    |    | Testing Framework |
| - Swagger/OpenAPI |    | - Value Sets      |    | - Unit Tests      |
| - All Endpoints   |    | - Terminology     |    | - Integration     |
| - Response Models |    | - Code Systems    |    | - Dependency      |
+-------------------+    +-------------------+    |   Injection       |
                                                  +-------------------+
```

## Component Descriptions

**Transactional DB**: Stores app-facing, fast-access data (internal IDs, audit logs, app-specific fields)

**Flask API App**: 
- **Controllers/Blueprints**: HTTP request handling, routing
- **Services**: Business logic implementation with dependency injection
- **Repositories**: Data access layer with consistent patterns

**Sync/ETL Layer**: Converts/Maps transactional records into FHIR resources and syncs them to the HAPI FHIR Server using Celery tasks.

**HAPI FHIR Server**: Canonical source of patient registry data, compliant with FHIR standards. Exposed to external systems and researchers.

**External APIs**: Optional. Expose data securely to authorized external stakeholders, often via OAuth2 + SMART on FHIR protocols.

## Sync Strategies 

- **One-way sync** (Transactional → FHIR): Easier to maintain, ensures FHIR server consistency. Changes made on FHIR side won't reflect back in transactional DB.

- **Two-way sync**: Both systems stay updated; Requires versioning, conflict resolution strategies.

- **Event-driven sync** (recommended): Near real-time, scalable; Uses Celery task queue for reliable processing.

- **Scheduled ETL sync**: Simple, good for batch updates; Not real-time, potential data lag.

- **Hybrid Subscription/Polling Approach**: 
  - Primary: FHIR Subscriptions for real-time updates
  - Backup: Periodic polling for verification
  - With conflict resolution strategy for bi-directional sync

## Security Framework

- JWT-based authentication
- Role-based access control (RBAC)
- Standardized error responses
- Audit logging of all changes
- Secure API endpoints with proper authorization