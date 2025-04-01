from abc import ABC, abstractmethod
from typing import List, TypeVar, Generic, Type, Dict, Any, Optional
from sqlalchemy.orm import Session
from app import db

T = TypeVar('T')

class BaseRepository(Generic[T], ABC):
    """Abstract base repository with common CRUD operations"""
    
    @abstractmethod
    def get_by_id(self, id: int) -> Optional[T]:
        """Get a single record by ID"""
        pass
    
    @abstractmethod
    def get_all(self) -> List[T]:
        """Get all records"""
        pass
    
    @abstractmethod
    def create(self, data: Dict[str, Any]) -> T:
        """Create a new record"""
        pass
    
    @abstractmethod
    def update(self, id: int, data: Dict[str, Any]) -> Optional[T]:
        """Update a record"""
        pass
    
    @abstractmethod
    def delete(self, id: int) -> bool:
        """Delete a record"""
        pass


class SQLAlchemyRepository(BaseRepository[T]):
    """SQLAlchemy implementation of the repository pattern"""
    
    def __init__(self, model_class: Type[T]):
        self.model_class = model_class
        self.session = db.session
    
    def get_by_id(self, id: int) -> Optional[T]:
        """Get a single record by ID"""
        return self.session.query(self.model_class).get(id)
    
    def get_all(self) -> List[T]:
        """Get all records"""
        return self.session.query(self.model_class).all()
    
    def create(self, data: Dict[str, Any]) -> T:
        """Create a new record"""
        obj = self.model_class(**data)
        self.session.add(obj)
        self.session.commit()
        return obj
    
    def update(self, id: int, data: Dict[str, Any]) -> Optional[T]:
        """Update a record"""
        obj = self.get_by_id(id)
        if obj:
            for key, value in data.items():
                setattr(obj, key, value)
            self.session.commit()
        return obj
    
    def delete(self, id: int) -> bool:
        """Delete a record"""
        obj = self.get_by_id(id)
        if obj:
            self.session.delete(obj)
            self.session.commit()
            return True
        return False