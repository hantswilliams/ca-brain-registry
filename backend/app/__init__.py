from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from .config import Config
import logging
import sqlalchemy.exc
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

db = SQLAlchemy()
migrate = Migrate()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS with specific settings
    CORS(app, resources={r"/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }})
    
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Register blueprints
    from app.blueprints import patient_bp, condition_bp, auth_bp, health_bp, value_sets_bp, observation_bp, procedures_bp
    
    app.register_blueprint(patient_bp)
    app.register_blueprint(condition_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(health_bp)
    app.register_blueprint(value_sets_bp)
    app.register_blueprint(observation_bp)
    app.register_blueprint(procedures_bp)
    
    # Register API documentation blueprint
    from app.api_docs import api_doc
    app.register_blueprint(api_doc)
    
    # Initialize value sets
    with app.app_context():
        init_value_sets()
        init_admin_user()  # Create default admin user if it doesn't exist
    
    return app

def init_value_sets():
    """Initialize all value sets in the database"""
    logger.info("Initializing value sets...")
    
    # Check if database tables exist before initializing
    if check_tables_exist():
        # Initialize roles
        init_roles()
        
        # Initialize other value sets
        init_sync_statuses()
        init_genders()
        init_condition_statuses()
        init_neurological_conditions()
    else:
        logger.info("Database tables don't exist yet. Skipping value set initialization.")

def check_tables_exist():
    """Check if required tables exist in the database"""
    try:
        inspector = sqlalchemy.inspect(db.engine)
        
        required_tables = ['role', 'gender', 'condition_status', 'neurological_condition', 'sync_status']
        existing_tables = inspector.get_table_names()
        
        missing_tables = [table for table in required_tables if table not in existing_tables]
        if missing_tables:
            logger.info(f"Tables not yet created: {', '.join(missing_tables)}")
            return False
        
        return True
    except Exception as e:
        logger.warning(f"Error checking if tables exist: {str(e)}")
        return False

def init_roles():
    """Initialize roles from value sets"""
    try:
        from app.models import Role
        from app.value_sets.roles import get_all_roles
        
        # Get roles from value sets
        standard_roles = get_all_roles()
        
        # Create roles that don't exist
        roles_created = 0
        for role_data in standard_roles:
            existing_role = Role.query.filter_by(name=role_data['name']).first()
            if not existing_role:
                logger.info(f"Creating role: {role_data['name']}")
                new_role = Role(**role_data)
                db.session.add(new_role)
                roles_created += 1
            else:
                logger.debug(f"Role already exists: {role_data['name']}")
        
        if roles_created > 0:
            db.session.commit()
            logger.info(f"Created {roles_created} new roles")
        else:
            logger.info("All standard roles already exist in the database")
            
    except Exception as e:
        logger.error(f"Error initializing roles: {str(e)}")
        db.session.rollback()

def init_genders():
    """Initialize gender reference data in database"""
    try:
        from app.models import Gender
        from app.value_sets.genders import get_all_genders
        
        # Create gender records that don't exist
        genders = get_all_genders()
        gender_count = 0
        
        for gender_data in genders:
            existing = Gender.query.filter_by(code=gender_data['code']).first()
            if not existing:
                new_gender = Gender(
                    code=gender_data['code'],
                    display=gender_data['display'],
                    description=gender_data['description']
                )
                db.session.add(new_gender)
                gender_count += 1
        
        if gender_count > 0:
            db.session.commit()
            logger.info(f"Created {gender_count} new gender records")
        else:
            logger.info("All gender values already exist in the database")
            
    except Exception as e:
        logger.error(f"Error initializing genders: {str(e)}")
        db.session.rollback()

def init_condition_statuses():
    """Initialize condition status reference data in database"""
    try:
        from app.models import ConditionStatus
        from app.value_sets.condition_statuses import get_all_condition_statuses
        
        # Create condition status records that don't exist
        statuses = get_all_condition_statuses()
        status_count = 0
        
        for status_data in statuses:
            existing = ConditionStatus.query.filter_by(code=status_data['code']).first()
            if not existing:
                new_status = ConditionStatus(
                    code=status_data['code'],
                    display=status_data['display'],
                    description=status_data['description']
                )
                db.session.add(new_status)
                status_count += 1
        
        if status_count > 0:
            db.session.commit()
            logger.info(f"Created {status_count} new condition status records")
        else:
            logger.info("All condition status values already exist in the database")
            
    except Exception as e:
        logger.error(f"Error initializing condition statuses: {str(e)}")
        db.session.rollback()

def init_neurological_conditions():
    """Initialize neurological condition code reference data in database"""
    try:
        from app.models import NeurologicalCondition
        from app.value_sets.neurological_conditions import get_all_neurological_conditions
        
        # Create neurological condition records that don't exist
        conditions = get_all_neurological_conditions()
        condition_count = 0
        
        for condition_data in conditions:
            existing = NeurologicalCondition.query.filter_by(code=condition_data['code']).first()
            if not existing:
                new_condition = NeurologicalCondition(
                    code=condition_data['code'],
                    display=condition_data['display'],
                    description=condition_data['description']
                )
                db.session.add(new_condition)
                condition_count += 1
        
        if condition_count > 0:
            db.session.commit()
            logger.info(f"Created {condition_count} new neurological condition records")
        else:
            logger.info("All neurological condition values already exist in the database")
            
    except Exception as e:
        logger.error(f"Error initializing neurological conditions: {str(e)}")
        db.session.rollback()

def init_sync_statuses():
    """Initialize sync status reference data in database"""
    try:
        from app.models import SyncStatus
        from app.value_sets.sync_statuses import get_all_sync_statuses
        
        # Create sync status records that don't exist
        statuses = get_all_sync_statuses()
        status_count = 0
        
        for status_data in statuses:
            existing = SyncStatus.query.filter_by(code=status_data['code']).first()
            if not existing:
                new_status = SyncStatus(
                    code=status_data['code'],
                    display=status_data['display'],
                    description=status_data['description']
                )
                db.session.add(new_status)
                status_count += 1
        
        if status_count > 0:
            db.session.commit()
            logger.info(f"Created {status_count} new sync status records")
        else:
            logger.info("All sync status values already exist in the database")
            
    except Exception as e:
        logger.error(f"Error initializing sync statuses: {str(e)}")
        db.session.rollback()

def init_admin_user():
    """Create default demo users if they don't exist"""
    try:
        from app.models import User, Role
        
        # Create demo users with different roles
        demo_users = [
            {
                'username': os.environ.get('DEFAULT_ADMIN_USERNAME', 'admin'),
                'password': os.environ.get('DEFAULT_ADMIN_PASSWORD', 'password'),
                'email': os.environ.get('DEFAULT_ADMIN_EMAIL', 'admin@example.com'),
                'first_name': 'Default',
                'last_name': 'Admin',
                'role_name': 'admin'
            },
            {
                'username': 'researcher',
                'password': 'research',
                'email': 'researcher@example.com',
                'first_name': 'Demo',
                'last_name': 'Researcher',
                'role_name': 'researcher'
            },
            {
                'username': 'clinician',
                'password': 'clinic',
                'email': 'clinician@example.com',
                'first_name': 'Demo',
                'last_name': 'Clinician', 
                'role_name': 'clinician'
            }
        ]
        
        users_created = 0
        
        for user_data in demo_users:
            # Check if user already exists
            existing_user = User.query.filter_by(username=user_data['username']).first()
            
            if not existing_user:
                # Get the role
                role = Role.query.filter_by(name=user_data['role_name']).first()
                
                if not role:
                    logger.warning(f"Role '{user_data['role_name']}' not found, can't create user '{user_data['username']}'")
                    continue
                    
                # Create the user
                new_user = User(
                    username=user_data['username'],
                    email=user_data['email'],
                    first_name=user_data['first_name'],
                    last_name=user_data['last_name'],
                    is_active=True
                )
                new_user.set_password(user_data['password'])
                new_user.roles.append(role)
                
                db.session.add(new_user)
                users_created += 1
                
                logger.info(f"Created demo user: {user_data['username']} with role: {user_data['role_name']}")
            else:
                logger.info(f"User '{user_data['username']}' already exists")
        
        if users_created > 0:
            db.session.commit()
            logger.info(f"Created {users_created} demo users")
            logger.info("IMPORTANT: These are demo users. Use secure passwords in production!")
        
    except Exception as e:
        logger.error(f"Error creating demo users: {str(e)}")
        db.session.rollback()