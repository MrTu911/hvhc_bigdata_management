
"""MinIO client for model storage (S3-compatible)."""

from minio import Minio
from minio.error import S3Error
from pathlib import Path
import io
from typing import Optional
from .config import settings
from .logger import get_logger

logger = get_logger()


class MinIOClient:
    """MinIO client for storing ML models and artifacts."""
    
    def __init__(self):
        """Initialize MinIO client."""
        self.client = Minio(
            settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_use_ssl
        )
        self.bucket_name = settings.minio_bucket_name
        self._ensure_bucket()
        logger.info("MinIO client initialized")
    
    def _ensure_bucket(self):
        """Ensure bucket exists, create if not."""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                logger.info(f"Created bucket: {self.bucket_name}")
            else:
                logger.info(f"Bucket exists: {self.bucket_name}")
        except S3Error as e:
            logger.error(f"Error ensuring bucket: {str(e)}")
            raise
    
    def upload_model(
        self,
        model_path: str,
        object_name: str,
        metadata: Optional[dict] = None
    ) -> str:
        """
        Upload model file to MinIO.
        
        Args:
            model_path: Local path to model file
            object_name: Name for object in MinIO
            metadata: Optional metadata dictionary
            
        Returns:
            Object name in MinIO
        """
        try:
            file_path = Path(model_path)
            if not file_path.exists():
                raise FileNotFoundError(f"Model file not found: {model_path}")
            
            # Upload file
            self.client.fput_object(
                self.bucket_name,
                object_name,
                model_path,
                metadata=metadata or {}
            )
            
            logger.info(f"Uploaded model: {object_name}")
            return object_name
        except S3Error as e:
            logger.error(f"Error uploading model: {str(e)}")
            raise
    
    def download_model(
        self,
        object_name: str,
        local_path: str
    ) -> str:
        """
        Download model from MinIO.
        
        Args:
            object_name: Name of object in MinIO
            local_path: Local path to save model
            
        Returns:
            Local path where model was saved
        """
        try:
            # Ensure directory exists
            Path(local_path).parent.mkdir(parents=True, exist_ok=True)
            
            # Download file
            self.client.fget_object(
                self.bucket_name,
                object_name,
                local_path
            )
            
            logger.info(f"Downloaded model: {object_name} to {local_path}")
            return local_path
        except S3Error as e:
            logger.error(f"Error downloading model: {str(e)}")
            raise
    
    def delete_model(self, object_name: str) -> bool:
        """
        Delete model from MinIO.
        
        Args:
            object_name: Name of object to delete
            
        Returns:
            True if successful
        """
        try:
            self.client.remove_object(self.bucket_name, object_name)
            logger.info(f"Deleted model: {object_name}")
            return True
        except S3Error as e:
            logger.error(f"Error deleting model: {str(e)}")
            return False
    
    def list_models(self, prefix: str = "") -> list:
        """
        List models in MinIO.
        
        Args:
            prefix: Optional prefix to filter objects
            
        Returns:
            List of object names
        """
        try:
            objects = self.client.list_objects(
                self.bucket_name,
                prefix=prefix,
                recursive=True
            )
            
            model_list = [obj.object_name for obj in objects]
            logger.info(f"Listed {len(model_list)} models")
            return model_list
        except S3Error as e:
            logger.error(f"Error listing models: {str(e)}")
            return []
    
    def get_model_url(self, object_name: str, expires: int = 3600) -> str:
        """
        Get presigned URL for model download.
        
        Args:
            object_name: Name of object
            expires: URL expiration time in seconds (default 1 hour)
            
        Returns:
            Presigned URL
        """
        try:
            url = self.client.presigned_get_object(
                self.bucket_name,
                object_name,
                expires=expires
            )
            logger.info(f"Generated URL for: {object_name}")
            return url
        except S3Error as e:
            logger.error(f"Error generating URL: {str(e)}")
            raise


# Global MinIO client instance
minio_client = MinIOClient()
