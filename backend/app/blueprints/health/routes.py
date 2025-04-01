from flask import Blueprint, jsonify
from celery.exceptions import TimeoutError
import datetime
from app.celery_app import celery  # Changed from celery_app to celery
import logging

# Configure logging
logger = logging.getLogger(__name__)

health_bp = Blueprint('health', __name__, url_prefix='/health')

@health_bp.route('/', methods=['GET'])
def health_check():
    """Basic health check endpoint for the API"""
    return jsonify({
        "status": "ok",
        "timestamp": datetime.datetime.now().isoformat(),
        "service": "python-focused-api"
    }), 200

@health_bp.route('/celery', methods=['GET'])
def celery_health():
    """Check if Celery workers are available and responding"""
    logger.info("Checking Celery worker health...")
    
    try:
        # Try to ping the Celery worker with a timeout
        celery_inspect = celery.control.inspect()  # Using celery instead of celery_app
        stats = celery_inspect.stats()
        
        if not stats:
            logger.warning("No Celery workers are active")
            return jsonify({
                "status": "error",
                "message": "No Celery workers are active. FHIR synchronization may fail.",
                "timestamp": datetime.datetime.now().isoformat()
            }), 503  # Service Unavailable
        
        # Check each worker's status
        active_workers = []
        for worker_name, worker_stats in stats.items():
            active_workers.append({
                "name": worker_name,
                "status": "active",
                "tasks": worker_stats.get("total", {})
            })
        
        logger.info(f"Found {len(active_workers)} active Celery workers")
        
        # Get additional details about queued tasks
        active_tasks = celery_inspect.active()
        reserved_tasks = celery_inspect.reserved()
        
        return jsonify({
            "status": "ok",
            "message": "Celery workers are responding",
            "timestamp": datetime.datetime.now().isoformat(),
            "workers": active_workers,
            "active_tasks": active_tasks or {},
            "reserved_tasks": reserved_tasks or {}
        }), 200
        
    except TimeoutError:
        logger.error("Timeout connecting to Celery workers")
        return jsonify({
            "status": "error",
            "message": "Timeout connecting to Celery workers. FHIR synchronization may fail.",
            "timestamp": datetime.datetime.now().isoformat()
        }), 503  # Service Unavailable
        
    except Exception as e:
        logger.error(f"Error checking Celery health: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error connecting to Celery workers: {str(e)}. FHIR synchronization may fail.",
            "timestamp": datetime.datetime.now().isoformat()
        }), 503  # Service Unavailable