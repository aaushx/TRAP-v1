from sqlalchemy.orm import DeclarativeBase, declared_attr
import uuid

class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy declarative models.
    Provides a default table name generation based on the class name.
    """
    
    @declared_attr.directive
    def __tablename__(cls) -> str:
        # e.g. UserAccount -> user_account
        import re
        name = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', cls.__name__)
        return re.sub('([a-z0-9])([A-Z])', r'\1_\2', name).lower()
