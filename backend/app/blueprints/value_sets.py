from flask import Blueprint, jsonify
from app.models import Gender, ConditionStatus, NeurologicalCondition, SyncStatus

# Create a blueprint for value set endpoints
value_sets_bp = Blueprint('value_sets', __name__, url_prefix='/value-sets')

@value_sets_bp.route('/genders', methods=['GET'])
def get_genders():
    """Get all gender values"""
    genders = Gender.query.filter_by(active=True).all()
    return jsonify([{
        'code': gender.code,
        'display': gender.display,
        'description': gender.description
    } for gender in genders])

@value_sets_bp.route('/condition-statuses', methods=['GET'])
def get_condition_statuses():
    """Get all condition status values"""
    statuses = ConditionStatus.query.filter_by(active=True).all()
    return jsonify([{
        'code': status.code,
        'display': status.display,
        'description': status.description
    } for status in statuses])

@value_sets_bp.route('/neurological-conditions', methods=['GET'])
def get_neurological_conditions():
    """Get all neurological condition codes"""
    conditions = NeurologicalCondition.query.filter_by(active=True).all()
    return jsonify([{
        'code': condition.code,
        'display': condition.display,
        'description': condition.description,
        'system': condition.system
    } for condition in conditions])

@value_sets_bp.route('/sync-statuses', methods=['GET'])
def get_sync_statuses():
    """Get all sync status values"""
    statuses = SyncStatus.query.filter_by(active=True).all()
    return jsonify([{
        'code': status.code,
        'display': status.display,
        'description': status.description
    } for status in statuses])