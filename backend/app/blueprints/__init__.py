# This file makes the blueprints directory a Python package
from app.blueprints.patients import patient_bp
from app.blueprints.conditions import condition_bp
from app.blueprints.auth import auth_bp
from app.blueprints.health import health_bp
from app.blueprints.value_sets import value_sets_bp
from app.blueprints.observations import observation_bp
from app.blueprints.procedures import procedures_bp

__all__ = ['patient_bp', 'condition_bp', 'auth_bp', 'health_bp', 'value_sets_bp', 'observation_bp', 'procedures_bp']