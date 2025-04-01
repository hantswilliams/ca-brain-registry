from pydantic import BaseModel, Field, validator, EmailStr
from datetime import date, datetime
from typing import Optional, List, Any

# Patient schemas
class PatientBase(BaseModel):
    """Base schema for patient data"""
    name: str = Field(..., min_length=1, description="Patient's full name")
    birth_date: date = Field(..., description="Patient's date of birth")
    gender: Optional[str] = Field(None, description="Patient's gender")
    
    @validator('gender')
    def validate_gender(cls, v):
        valid_genders = ['male', 'female', 'other', 'unknown', None]
        if v not in valid_genders:
            raise ValueError(f'Gender must be one of: {", ".join(str(g) for g in valid_genders if g)}')
        return v

class PatientCreate(PatientBase):
    """Schema for creating a new patient"""
    pass

class PatientResponse(PatientBase):
    """Schema for patient response"""
    id: int
    sync_status: str
    fhir_id: Optional[str] = None
    synced_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Condition schemas
class ConditionBase(BaseModel):
    """Base schema for condition data"""
    condition_code: str = Field(..., min_length=1, description="Condition code")
    onset_date: date = Field(..., description="Date of condition onset")
    status: str = Field(..., description="Condition status")
    patient_id: int = Field(..., description="ID of the patient with this condition")
    
    @validator('status')
    def validate_status(cls, v):
        valid_statuses = ['active', 'inactive', 'resolved', 'unknown']
        if v not in valid_statuses:
            raise ValueError(f'Status must be one of: {", ".join(valid_statuses)}')
        return v

class ConditionCreate(ConditionBase):
    """Schema for creating a new condition"""
    pass

class ConditionResponse(ConditionBase):
    """Schema for condition response"""
    id: int
    sync_status: str
    fhir_id: Optional[str] = None
    synced_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Role schemas
class RoleBase(BaseModel):
    """Base schema for role data"""
    name: str = Field(..., min_length=1, description="Role name")
    description: Optional[str] = Field(None, description="Role description")

class RoleCreate(RoleBase):
    """Schema for creating a new role"""
    pass

class RoleResponse(RoleBase):
    """Schema for role response"""
    id: int
    
    class Config:
        from_attributes = True

# User schemas
class UserBase(BaseModel):
    """Base schema for user data"""
    username: str = Field(..., min_length=3, description="Username")
    email: str = Field(..., description="Email address")
    first_name: Optional[str] = Field(None, description="First name")
    last_name: Optional[str] = Field(None, description="Last name")
    
    @validator('email')
    def email_must_be_valid(cls, v):
        # Simple email validation
        if '@' not in v:
            raise ValueError('must be a valid email address')
        return v

class UserCreate(UserBase):
    """Schema for creating a new user"""
    password: str = Field(..., min_length=8, description="Password")
    roles: Optional[List[str]] = Field(None, description="Role names")
    
    @validator('password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('password must be at least 8 characters')
        if not any(char.isdigit() for char in v):
            raise ValueError('password must contain at least one digit')
        if not any(char.isupper() for char in v):
            raise ValueError('password must contain at least one uppercase letter')
        return v

class UserLogin(BaseModel):
    """Schema for user login"""
    username: str = Field(..., description="Username or email")
    password: str = Field(..., description="Password")

class UserResponse(UserBase):
    """Schema for user response"""
    id: int
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    roles: List[RoleResponse] = []
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    """Schema for token response"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

# Observation schemas
class ObservationBase(BaseModel):
    """Base schema for observation data"""
    observation_code: str = Field(..., min_length=1, description="Observation code")
    observation_name: str = Field(..., min_length=1, description="Observation name/type")
    value: str = Field(..., description="Observation value")
    unit: Optional[str] = Field(None, description="Unit of measurement")
    reference_range: Optional[str] = Field(None, description="Reference range for the observation")
    observation_date: datetime = Field(..., description="Date and time of observation")
    status: str = Field("final", description="Observation status")
    patient_id: int = Field(..., description="ID of the patient with this observation")
    
    @validator('status')
    def validate_status(cls, v):
        valid_statuses = ['registered', 'preliminary', 'final', 'amended', 'corrected', 'cancelled', 'entered-in-error', 'unknown']
        if v not in valid_statuses:
            raise ValueError(f'Status must be one of: {", ".join(valid_statuses)}')
        return v

class ObservationCreate(ObservationBase):
    """Schema for creating a new observation"""
    pass

class ObservationResponse(ObservationBase):
    """Schema for observation response"""
    id: int
    sync_status: str
    fhir_id: Optional[str] = None
    synced_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Procedure schemas
class ProcedureBase(BaseModel):
    """Base schema for procedure data"""
    procedure_code: str = Field(..., min_length=1, description="Procedure code")
    procedure_name: str = Field(..., min_length=1, description="Procedure name/type")
    performed_date: datetime = Field(..., description="Date and time procedure was performed")
    status: str = Field("completed", description="Procedure status")
    body_site: Optional[str] = Field(None, description="Body site where procedure was performed")
    notes: Optional[str] = Field(None, description="Additional notes about the procedure")
    patient_id: int = Field(..., description="ID of the patient with this procedure")
    
    @validator('status')
    def validate_status(cls, v):
        valid_statuses = ['preparation', 'in-progress', 'not-done', 'on-hold', 'stopped', 'completed', 'entered-in-error', 'unknown']
        if v not in valid_statuses:
            raise ValueError(f'Status must be one of: {", ".join(valid_statuses)}')
        return v

class ProcedureCreate(ProcedureBase):
    """Schema for creating a new procedure"""
    pass

class ProcedureResponse(ProcedureBase):
    """Schema for procedure response"""
    id: int
    sync_status: str
    fhir_id: Optional[str] = None
    synced_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True