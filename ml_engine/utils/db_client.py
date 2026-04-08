
"""Database client for PostgreSQL using SQLAlchemy."""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
from contextlib import contextmanager
from typing import Generator
from .config import settings
from .logger import get_logger

logger = get_logger()

# SQLAlchemy Base
Base = declarative_base()


class DatabaseClient:
    """Database client for PostgreSQL operations."""
    
    def __init__(self):
        """Initialize database client."""
        self.engine = create_engine(
            settings.database_url,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=10
        )
        self.SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self.engine
        )
        logger.info("Database client initialized")
    
    @contextmanager
    def get_session(self) -> Generator[Session, None, None]:
        """
        Get database session with context manager.
        
        Yields:
            Database session
        """
        session = self.SessionLocal()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"Database error: {str(e)}")
            raise
        finally:
            session.close()
    
    def test_connection(self) -> bool:
        """
        Test database connection.
        
        Returns:
            True if connection successful, False otherwise
        """
        try:
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Database connection test successful")
            return True
        except Exception as e:
            logger.error(f"Database connection test failed: {str(e)}")
            return False
    
    def log_training(
        self,
        model_name: str,
        algorithm: str,
        dataset_name: str,
        accuracy: float,
        parameters: dict,
        model_path: str
    ) -> int:
        """
        Log training run to database.
        
        Args:
            model_name: Name of the model
            algorithm: ML algorithm used
            dataset_name: Name of dataset
            accuracy: Model accuracy
            parameters: Training parameters
            model_path: Path to saved model
            
        Returns:
            Training run ID
        """
        with self.get_session() as session:
            query = text("""
                INSERT INTO ml_training_logs 
                (model_name, algorithm, dataset_name, accuracy, parameters, model_path, created_at)
                VALUES (:model_name, :algorithm, :dataset_name, :accuracy, :parameters::jsonb, :model_path, NOW())
                RETURNING id
            """)
            
            result = session.execute(
                query,
                {
                    "model_name": model_name,
                    "algorithm": algorithm,
                    "dataset_name": dataset_name,
                    "accuracy": accuracy,
                    "parameters": str(parameters),
                    "model_path": model_path
                }
            )
            
            training_id = result.fetchone()[0]
            logger.info(f"Training run logged with ID: {training_id}")
            return training_id
    
    def get_training_history(self, limit: int = 100) -> list:
        """
        Get training history.
        
        Args:
            limit: Maximum number of records to return
            
        Returns:
            List of training records
        """
        with self.get_session() as session:
            query = text("""
                SELECT id, model_name, algorithm, dataset_name, accuracy, 
                       parameters, model_path, created_at
                FROM ml_training_logs
                ORDER BY created_at DESC
                LIMIT :limit
            """)
            
            result = session.execute(query, {"limit": limit})
            records = [dict(row._mapping) for row in result]
            
            logger.info(f"Retrieved {len(records)} training records")
            return records


# Global database client instance
db_client = DatabaseClient()
