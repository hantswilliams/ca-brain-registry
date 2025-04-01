import logging
from app.repositories.base_repository import SQLAlchemyRepository
from app.models import User, Role
from typing import List, Optional
from sqlalchemy.exc import IntegrityError
from datetime import datetime

# Configure logging
logger = logging.getLogger(__name__)

class UserRepository(SQLAlchemyRepository[User]):
    """Repository for User model"""
    
    def __init__(self):
        super().__init__(User)
    
    def find_by_username(self, username: str) -> Optional[User]:
        """Find a user by username"""
        logger.debug(f"Finding user by username: {username}")
        return self.session.query(User).filter(User.username == username).first()
    
    def find_by_email(self, email: str) -> Optional[User]:
        """Find a user by email"""
        logger.debug(f"Finding user by email: {email}")
        return self.session.query(User).filter(User.email == email).first()
    
    def create_with_roles(self, user_data: dict, role_names: List[str] = None) -> Optional[User]:
        """Create a new user with specified roles"""
        try:
            # Create user
            user = User(**user_data)
            
            # Add roles if provided
            if role_names:
                logger.debug(f"Assigning roles to new user: {role_names}")
                roles = self.session.query(Role).filter(Role.name.in_(role_names)).all()
                found_role_names = [role.name for role in roles]
                missing_roles = set(role_names) - set(found_role_names)
                
                if missing_roles:
                    logger.warning(f"Some roles were not found: {missing_roles}")
                
                user.roles = roles
            
            self.session.add(user)
            self.session.commit()
            logger.info(f"Created new user: {user.username} (ID: {user.id}) with roles: {[r.name for r in user.roles]}")
            return user
        except IntegrityError as e:
            self.session.rollback()
            logger.warning(f"Failed to create user due to integrity error: {str(e)}")
            return None
        except Exception as e:
            self.session.rollback()
            logger.error(f"Unexpected error creating user: {str(e)}", exc_info=True)
            raise
        
    def update_last_login(self, user_id: int) -> Optional[User]:
        """Update user's last login timestamp"""
        logger.debug(f"Updating last login for user ID: {user_id}")
        user = self.get_by_id(user_id)
        if user:
            user.last_login = datetime.utcnow()
            self.session.commit()
            logger.debug(f"Updated last login for user: {user.username}")
        else:
            logger.warning(f"Failed to update last login - User ID not found: {user_id}")
        return user