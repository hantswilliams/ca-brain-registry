import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Database settings
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Secret key for JWT and session management
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # FHIR API settings
    HAPI_FHIR_URL = os.environ.get('HAPI_FHIR_URL', 'http://localhost:8080/fhir')
    
    # JWT settings
    JWT_EXPIRATION = int(os.environ.get('JWT_EXPIRATION', 86400))  # 24 hours
    
    # Celery settings
    CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
    CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
