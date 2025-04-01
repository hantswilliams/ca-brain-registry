from app.repositories.base_repository import SQLAlchemyRepository
from app.models import Role
from typing import List, Optional

class RoleRepository(SQLAlchemyRepository[Role]):
    """Repository for Role model"""
    
    def __init__(self):
        super().__init__(Role)
    
    def find_by_name(self, name: str) -> Optional[Role]:
        """Find a role by name"""
        return self.session.query(Role).filter(Role.name == name).first()
    
    def find_by_names(self, names: List[str]) -> List[Role]:
        """Find roles by name list"""
        return self.session.query(Role).filter(Role.name.in_(names)).all()
    
    def get_default_role(self) -> Optional[Role]:
        """Get the default role for new users"""
        return self.find_by_name('user')  # Assuming 'user' is our default role