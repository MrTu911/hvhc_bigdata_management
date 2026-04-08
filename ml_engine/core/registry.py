
"""Model registry for managing trained models."""

import json
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime
import hashlib

from utils.logger import get_logger
from utils.config import settings
from utils.minio_client import minio_client
from utils.db_client import db_client

logger = get_logger()


class ModelRegistry:
    """Registry for managing ML models."""
    
    def __init__(self):
        """Initialize model registry."""
        self.registry_path = Path(settings.model_storage_path) / "registry.json"
        self.registry_path.parent.mkdir(parents=True, exist_ok=True)
        self._load_registry()
        logger.info("ModelRegistry initialized")
    
    def _load_registry(self):
        """Load registry from disk."""
        if self.registry_path.exists():
            with open(self.registry_path, 'r') as f:
                self.registry = json.load(f)
            logger.info(f"Loaded registry with {len(self.registry)} models")
        else:
            self.registry = {}
            logger.info("Initialized empty registry")
    
    def _save_registry(self):
        """Save registry to disk."""
        with open(self.registry_path, 'w') as f:
            json.dump(self.registry, f, indent=2)
        logger.info(f"Registry saved with {len(self.registry)} models")
    
    def _generate_model_id(self, model_name: str) -> str:
        """Generate unique model ID."""
        timestamp = datetime.now().isoformat()
        hash_input = f"{model_name}_{timestamp}"
        model_id = hashlib.md5(hash_input.encode()).hexdigest()[:12]
        return model_id
    
    def register_model(
        self,
        model_name: str,
        model_path: str,
        algorithm: str,
        task_type: str,
        metrics: Dict[str, Any],
        hyperparameters: Dict[str, Any],
        dataset_name: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Register a trained model.
        
        Args:
            model_name: Name of the model
            model_path: Local path to model file
            algorithm: ML algorithm used
            task_type: 'classification' or 'regression'
            metrics: Evaluation metrics
            hyperparameters: Model hyperparameters
            dataset_name: Name of training dataset
            metadata: Additional metadata
            
        Returns:
            Model ID
        """
        model_id = self._generate_model_id(model_name)
        
        # Upload model to MinIO
        object_name = f"models/{model_name}/{model_id}.pkl"
        try:
            minio_client.upload_model(
                model_path,
                object_name,
                metadata={
                    'model_name': model_name,
                    'model_id': model_id,
                    'algorithm': algorithm,
                    'task_type': task_type
                }
            )
            storage_location = object_name
        except Exception as e:
            logger.warning(f"Failed to upload to MinIO: {str(e)}, using local path")
            storage_location = model_path
        
        # Register in database
        try:
            key_metric = 'accuracy' if task_type == 'classification' else 'rmse'
            accuracy = metrics.get(key_metric, 0.0)
            
            db_client.log_training(
                model_name=model_name,
                algorithm=algorithm,
                dataset_name=dataset_name,
                accuracy=accuracy,
                parameters=hyperparameters,
                model_path=storage_location
            )
        except Exception as e:
            logger.warning(f"Failed to log to database: {str(e)}")
        
        # Add to local registry
        self.registry[model_id] = {
            'model_id': model_id,
            'model_name': model_name,
            'algorithm': algorithm,
            'task_type': task_type,
            'metrics': metrics,
            'hyperparameters': hyperparameters,
            'dataset_name': dataset_name,
            'storage_location': storage_location,
            'created_at': datetime.now().isoformat(),
            'metadata': metadata or {}
        }
        
        self._save_registry()
        logger.info(f"Model registered: {model_name} (ID: {model_id})")
        
        return model_id
    
    def get_model(self, model_id: str) -> Optional[Dict[str, Any]]:
        """
        Get model information by ID.
        
        Args:
            model_id: Model ID
            
        Returns:
            Model information or None
        """
        return self.registry.get(model_id)
    
    def list_models(
        self,
        model_name: Optional[str] = None,
        algorithm: Optional[str] = None,
        task_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        List registered models with optional filters.
        
        Args:
            model_name: Filter by model name
            algorithm: Filter by algorithm
            task_type: Filter by task type
            
        Returns:
            List of model information
        """
        models = list(self.registry.values())
        
        # Apply filters
        if model_name:
            models = [m for m in models if m['model_name'] == model_name]
        if algorithm:
            models = [m for m in models if m['algorithm'] == algorithm]
        if task_type:
            models = [m for m in models if m['task_type'] == task_type]
        
        # Sort by creation date (newest first)
        models.sort(key=lambda x: x['created_at'], reverse=True)
        
        logger.info(f"Listed {len(models)} models")
        return models
    
    def get_best_model(
        self,
        model_name: Optional[str] = None,
        task_type: str = 'classification'
    ) -> Optional[Dict[str, Any]]:
        """
        Get best performing model.
        
        Args:
            model_name: Filter by model name
            task_type: Task type for metric selection
            
        Returns:
            Best model information or None
        """
        models = self.list_models(model_name=model_name, task_type=task_type)
        
        if not models:
            return None
        
        # Determine key metric
        key_metric = 'accuracy' if task_type == 'classification' else 'rmse'
        
        # Find best model
        if task_type == 'regression':
            # Lower is better for RMSE
            best_model = min(models, key=lambda m: m['metrics'].get(key_metric, float('inf')))
        else:
            # Higher is better for accuracy
            best_model = max(models, key=lambda m: m['metrics'].get(key_metric, 0.0))
        
        logger.info(f"Best model: {best_model['model_name']} (ID: {best_model['model_id']})")
        return best_model
    
    def delete_model(self, model_id: str) -> bool:
        """
        Delete model from registry.
        
        Args:
            model_id: Model ID
            
        Returns:
            True if successful
        """
        if model_id not in self.registry:
            logger.warning(f"Model not found: {model_id}")
            return False
        
        model_info = self.registry[model_id]
        storage_location = model_info['storage_location']
        
        # Delete from MinIO if stored there
        if storage_location.startswith('models/'):
            try:
                minio_client.delete_model(storage_location)
            except Exception as e:
                logger.warning(f"Failed to delete from MinIO: {str(e)}")
        
        # Delete from local storage
        local_path = Path(storage_location)
        if local_path.exists():
            local_path.unlink()
        
        # Remove from registry
        del self.registry[model_id]
        self._save_registry()
        
        logger.info(f"Model deleted: {model_id}")
        return True
    
    def get_model_download_url(self, model_id: str, expires: int = 3600) -> Optional[str]:
        """
        Get download URL for model.
        
        Args:
            model_id: Model ID
            expires: URL expiration time in seconds
            
        Returns:
            Download URL or None
        """
        model_info = self.get_model(model_id)
        if not model_info:
            return None
        
        storage_location = model_info['storage_location']
        
        # Generate presigned URL if stored in MinIO
        if storage_location.startswith('models/'):
            try:
                url = minio_client.get_model_url(storage_location, expires=expires)
                return url
            except Exception as e:
                logger.error(f"Failed to generate download URL: {str(e)}")
                return None
        
        return None


# Global model registry instance
model_registry = ModelRegistry()
