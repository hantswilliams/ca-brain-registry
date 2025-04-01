from . import db
from datetime import datetime
import uuid
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
from flask import current_app

# Centralized constants for model configuration
STANDARD_STRING_LENGTH = 120
SHORT_STRING_LENGTH = 50
VERY_SHORT_STRING_LENGTH = 10
DEFAULT_SYNC_STATUS = "pending"

# User-Role association table (many-to-many)
user_roles = db.Table('user_roles',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('role_id', db.Integer, db.ForeignKey('role.id'), primary_key=True)
)

class SyncableMixin:
    """Mixin for models that sync with FHIR server"""
    fhir_id = db.Column(db.String(STANDARD_STRING_LENGTH))
    sync_status = db.Column(db.String(SHORT_STRING_LENGTH), default=DEFAULT_SYNC_STATUS)
    synced_at = db.Column(db.DateTime)
    
    def update_sync_status(self, status, fhir_id=None):
        """Update sync status of the model"""
        self.sync_status = status
        if fhir_id:
            self.fhir_id = fhir_id
        if status == "success":
            self.synced_at = datetime.utcnow()
        db.session.commit()

# Base class for value set models
class ValueSet(db.Model):
    """Base class for all value set models"""
    __abstract__ = True
    code = db.Column(db.String(SHORT_STRING_LENGTH), primary_key=True)
    display = db.Column(db.String(STANDARD_STRING_LENGTH), nullable=False)
    description = db.Column(db.String(STANDARD_STRING_LENGTH))
    active = db.Column(db.Boolean, default=True)

class Gender(ValueSet):
    """Gender value set"""
    __tablename__ = 'gender'

class ConditionStatus(ValueSet):
    """Condition status value set"""
    __tablename__ = 'condition_status'

class NeurologicalCondition(ValueSet):
    """Neurological condition codes value set"""
    __tablename__ = 'neurological_condition'
    # Additional fields specific to condition codes
    system = db.Column(db.String(STANDARD_STRING_LENGTH), default="http://hl7.org/fhir/sid/icd-10")

class SyncStatus(ValueSet):
    """Sync status value set"""
    __tablename__ = 'sync_status'

class User(db.Model):
    """User model for authentication and authorization"""
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(STANDARD_STRING_LENGTH), unique=True, nullable=False)
    email = db.Column(db.String(STANDARD_STRING_LENGTH), unique=True, nullable=False)
    password_hash = db.Column(db.String(STANDARD_STRING_LENGTH), nullable=False)
    first_name = db.Column(db.String(SHORT_STRING_LENGTH))
    last_name = db.Column(db.String(SHORT_STRING_LENGTH))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # Relationships
    roles = db.relationship('Role', secondary=user_roles, lazy='subquery',
                           backref=db.backref('users', lazy=True))
    
    def set_password(self, password):
        """Set password hash"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check password against hash"""
        return check_password_hash(self.password_hash, password)
    
    def generate_jwt_token(self, expires_in=86400):  # Default: 24 hours
        """Generate JWT token for the user"""
        now = datetime.utcnow()
        payload = {
            'sub': self.id,
            'iat': now,
            'exp': now + timedelta(seconds=expires_in),
            'username': self.username,
            'roles': [role.name for role in self.roles]
        }
        token = jwt.encode(
            payload,
            current_app.config.get('SECRET_KEY'),
            algorithm='HS256'
        )
        # If token is returned as bytes, convert to string
        if isinstance(token, bytes):
            return token.decode('utf-8')
        return token

    @staticmethod
    def verify_jwt_token(token):
        """Verify JWT token and return User if valid"""
        try:
            # If token is a string and the library expects bytes, convert it
            if isinstance(token, str):
                token_to_verify = token
            elif isinstance(token, bytes):
                token_to_verify = token.decode('utf-8')
            else:
                token_to_verify = token
                
            payload = jwt.decode(
                token_to_verify,
                current_app.config.get('SECRET_KEY'),
                algorithms=['HS256']
            )
            user_id = payload['sub']
            user = User.query.get(user_id)
            if not user:
                print(f"User with ID {user_id} not found")
                return None
            return user
        except jwt.ExpiredSignatureError:
            print("Token expired")
            return None
        except jwt.InvalidTokenError as e:
            print(f"Invalid token: {str(e)}")
            return None
        except Exception as e:
            print(f"Unexpected error during token verification: {str(e)}")
            return None
    
    def has_role(self, role_name):
        """Check if user has a specific role"""
        return any(role.name == role_name for role in self.roles)

class Role(db.Model):
    """Role model for authorization"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(SHORT_STRING_LENGTH), unique=True, nullable=False)
    description = db.Column(db.String(STANDARD_STRING_LENGTH))
    
    def __repr__(self):
        return f'<Role {self.name}>'

class Patient(db.Model, SyncableMixin):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(STANDARD_STRING_LENGTH), nullable=False)
    birth_date = db.Column(db.Date, nullable=False)
    gender = db.Column(db.String(VERY_SHORT_STRING_LENGTH))
    conditions = db.relationship('Condition', backref='patient', lazy=True)
    observations = db.relationship('Observation', backref='patient', lazy=True)
    procedures = db.relationship('Procedure', backref='patient', lazy=True)
    
    # Add user relationship - who created/owns this patient
    created_by_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_by = db.relationship('User', backref=db.backref('patients', lazy=True))

class Condition(db.Model, SyncableMixin):
    id = db.Column(db.Integer, primary_key=True)
    condition_code = db.Column(db.String(STANDARD_STRING_LENGTH), nullable=False)
    onset_date = db.Column(db.Date)
    status = db.Column(db.String(SHORT_STRING_LENGTH))
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)
    
    # Add user relationship - who created/owns this condition
    created_by_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_by = db.relationship('User', backref=db.backref('conditions', lazy=True))

class Observation(db.Model, SyncableMixin):
    """Model for clinical observations"""
    id = db.Column(db.Integer, primary_key=True)
    observation_code = db.Column(db.String(STANDARD_STRING_LENGTH), nullable=False)
    observation_name = db.Column(db.String(STANDARD_STRING_LENGTH), nullable=False)
    value = db.Column(db.String(STANDARD_STRING_LENGTH), nullable=False)
    unit = db.Column(db.String(SHORT_STRING_LENGTH))
    reference_range = db.Column(db.String(STANDARD_STRING_LENGTH))
    observation_date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(SHORT_STRING_LENGTH), default="final")
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)
    
    # Add user relationship - who created this observation
    created_by_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_by = db.relationship('User', backref=db.backref('observations', lazy=True))
    
    # FHIR synchronization fields are inherited from SyncableMixin
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Observation {self.id}: {self.observation_name} for Patient {self.patient_id}>'

class Procedure(db.Model, SyncableMixin):
    """Model for medical procedures"""
    id = db.Column(db.Integer, primary_key=True)
    procedure_code = db.Column(db.String(STANDARD_STRING_LENGTH), nullable=False)
    procedure_name = db.Column(db.String(STANDARD_STRING_LENGTH), nullable=False)
    performed_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(SHORT_STRING_LENGTH), default="completed")
    body_site = db.Column(db.String(STANDARD_STRING_LENGTH))
    notes = db.Column(db.Text)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)
    
    # Add user relationship - who created this procedure
    created_by_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_by = db.relationship('User', backref=db.backref('procedures', lazy=True))
    
    # FHIR synchronization fields are inherited from SyncableMixin
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Procedure {self.id}: {self.procedure_name} for Patient {self.patient_id}>'