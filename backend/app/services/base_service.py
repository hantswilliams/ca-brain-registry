# Base service module providing common service functionality
from app import db
from datetime import datetime
import logging
from typing import Dict, Tuple, Any, Optional, List, TypeVar, Type, Generic, Callable
from functools import wraps
from app.repositories.base_repository import BaseRepository

# Define a generic type for our models
T = TypeVar('T')
R = TypeVar('R', bound=BaseRepository)

# Configure logging
logger = logging.getLogger(__name__)

class BaseService(Generic[T, R]):
    """Base service class with common CRUD operations, error handling, and dependency injection"""
    
    def __init__(self, repository: R):
        """Initialize with repository dependency injection"""
        self.repository = repository
    
    @staticmethod
    def handle_service_exceptions(func: Callable) -> Callable:
        """Decorator for handling common service exceptions with logging"""
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except KeyError as e:
                error_msg = f"Missing required field: {str(e)}"
                logger.warning(f"Validation error: {error_msg}")
                return {"error": error_msg}, 400
            except ValueError as e:
                error_msg = f"Invalid data format: {str(e)}"
                logger.warning(f"Validation error: {error_msg}")
                return {"error": error_msg}, 400
            except Exception as e:
                error_msg = f"Server error: {str(e)}"
                logger.error(f"Unexpected error in service operation: {error_msg}", exc_info=True)
                db.session.rollback()
                return {"error": error_msg}, 500
        return wrapper
    
    def get_by_id(self, id: int) -> Optional[T]:
        """Get a single record by ID"""
        logger.debug(f"Fetching record with ID: {id}")
        return self.repository.get_by_id(id)
    
    def get_all(self) -> List[T]:
        """Get all records"""
        logger.debug("Fetching all records")
        return self.repository.get_all()
    
    def create(self, data: Dict[str, Any]) -> Tuple[T, int]:
        """Create a new record"""
        logger.info(f"Creating new record with data: {data}")
        try:
            record = self.repository.create(data)
            return record, 201
        except Exception as e:
            logger.error(f"Error creating record: {str(e)}", exc_info=True)
            db.session.rollback()
            raise
    
    def update(self, id: int, data: Dict[str, Any]) -> Tuple[Optional[T], int]:
        """Update a record"""
        logger.info(f"Updating record {id} with data: {data}")
        record = self.repository.update(id, data)
        if record:
            return record, 200
        return None, 404
    
    def delete(self, id: int) -> Tuple[Dict[str, Any], int]:
        """Delete a record"""
        logger.info(f"Deleting record with ID: {id}")
        success = self.repository.delete(id)
        if success:
            return {"message": "Record deleted successfully"}, 200
        return {"error": "Record not found"}, 404
    
    @staticmethod
    def format_datetime(dt) -> Optional[str]:
        """Format datetime to ISO format or return None"""
        return dt.isoformat() if dt else None