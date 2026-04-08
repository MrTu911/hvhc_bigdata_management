
"""Model training module supporting multiple ML algorithms."""

import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.svm import SVC, SVR
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from xgboost import XGBClassifier, XGBRegressor
from typing import Dict, Any, Optional
import joblib
from pathlib import Path
import time

from utils.logger import get_logger
from utils.config import settings

logger = get_logger()


class ModelTrainer:
    """Train ML models with various algorithms."""
    
    # Supported algorithms
    CLASSIFICATION_ALGORITHMS = {
        'random_forest': RandomForestClassifier,
        'logistic_regression': LogisticRegression,
        'svm': SVC,
        'decision_tree': DecisionTreeClassifier,
        'xgboost': XGBClassifier
    }
    
    REGRESSION_ALGORITHMS = {
        'random_forest': RandomForestRegressor,
        'linear_regression': LinearRegression,
        'svm': SVR,
        'decision_tree': DecisionTreeRegressor,
        'xgboost': XGBRegressor
    }
    
    def __init__(self):
        """Initialize trainer."""
        self.model = None
        self.algorithm = None
        self.task_type = None
        self.training_time = 0
        logger.info("ModelTrainer initialized")
    
    def train(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        algorithm: str = 'random_forest',
        task_type: str = 'classification',
        hyperparameters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Train a machine learning model.
        
        Args:
            X_train: Training features
            y_train: Training labels
            algorithm: Algorithm to use
            task_type: 'classification' or 'regression'
            hyperparameters: Model hyperparameters
            
        Returns:
            Training metadata
        """
        logger.info(f"Starting training: {algorithm} ({task_type})")
        
        # Select algorithm
        if task_type == 'classification':
            algorithms = self.CLASSIFICATION_ALGORITHMS
        elif task_type == 'regression':
            algorithms = self.REGRESSION_ALGORITHMS
        else:
            raise ValueError(f"Invalid task_type: {task_type}")
        
        if algorithm not in algorithms:
            raise ValueError(f"Algorithm '{algorithm}' not supported for {task_type}")
        
        # Initialize model with hyperparameters
        model_class = algorithms[algorithm]
        hyperparameters = hyperparameters or {}
        
        # Set default parameters for some algorithms
        if algorithm == 'random_forest' and not hyperparameters:
            hyperparameters = {
                'n_estimators': 100,
                'max_depth': 10,
                'random_state': settings.default_random_state
            }
        elif algorithm == 'xgboost' and not hyperparameters:
            hyperparameters = {
                'n_estimators': 100,
                'max_depth': 6,
                'learning_rate': 0.1,
                'random_state': settings.default_random_state
            }
        
        self.model = model_class(**hyperparameters)
        self.algorithm = algorithm
        self.task_type = task_type
        
        # Train model
        start_time = time.time()
        self.model.fit(X_train, y_train)
        self.training_time = time.time() - start_time
        
        logger.info(f"Training completed in {self.training_time:.2f} seconds")
        
        # Get feature importances if available
        feature_importance = None
        if hasattr(self.model, 'feature_importances_'):
            feature_importance = self.model.feature_importances_.tolist()
        
        return {
            'algorithm': algorithm,
            'task_type': task_type,
            'hyperparameters': hyperparameters,
            'training_time': self.training_time,
            'n_samples': len(X_train),
            'n_features': X_train.shape[1],
            'feature_importance': feature_importance
        }
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Make predictions using trained model.
        
        Args:
            X: Features to predict
            
        Returns:
            Predictions
        """
        if self.model is None:
            raise ValueError("Model not trained yet")
        
        predictions = self.model.predict(X)
        logger.info(f"Made {len(predictions)} predictions")
        return predictions
    
    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """
        Predict class probabilities (classification only).
        
        Args:
            X: Features to predict
            
        Returns:
            Class probabilities
        """
        if self.model is None:
            raise ValueError("Model not trained yet")
        
        if self.task_type != 'classification':
            raise ValueError("predict_proba only available for classification")
        
        if not hasattr(self.model, 'predict_proba'):
            raise ValueError(f"{self.algorithm} does not support predict_proba")
        
        probas = self.model.predict_proba(X)
        logger.info(f"Generated probabilities for {len(probas)} samples")
        return probas
    
    def save_model(self, save_path: str, metadata: Optional[Dict] = None) -> str:
        """
        Save trained model to disk.
        
        Args:
            save_path: Path to save model
            metadata: Additional metadata to save
            
        Returns:
            Path where model was saved
        """
        if self.model is None:
            raise ValueError("No model to save")
        
        # Ensure directory exists
        save_path = Path(save_path)
        save_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Prepare model package
        model_package = {
            'model': self.model,
            'algorithm': self.algorithm,
            'task_type': self.task_type,
            'training_time': self.training_time,
            'metadata': metadata or {}
        }
        
        # Save using joblib
        joblib.dump(model_package, save_path)
        logger.info(f"Model saved to: {save_path}")
        
        return str(save_path)
    
    def load_model(self, load_path: str) -> Dict[str, Any]:
        """
        Load trained model from disk.
        
        Args:
            load_path: Path to load model from
            
        Returns:
            Model metadata
        """
        load_path = Path(load_path)
        if not load_path.exists():
            raise FileNotFoundError(f"Model file not found: {load_path}")
        
        # Load model package
        model_package = joblib.load(load_path)
        
        self.model = model_package['model']
        self.algorithm = model_package['algorithm']
        self.task_type = model_package['task_type']
        self.training_time = model_package.get('training_time', 0)
        
        logger.info(f"Model loaded from: {load_path}")
        
        return {
            'algorithm': self.algorithm,
            'task_type': self.task_type,
            'training_time': self.training_time,
            'metadata': model_package.get('metadata', {})
        }
    
    @classmethod
    def get_supported_algorithms(cls, task_type: str = 'classification') -> list:
        """
        Get list of supported algorithms.
        
        Args:
            task_type: 'classification' or 'regression'
            
        Returns:
            List of algorithm names
        """
        if task_type == 'classification':
            return list(cls.CLASSIFICATION_ALGORITHMS.keys())
        elif task_type == 'regression':
            return list(cls.REGRESSION_ALGORITHMS.keys())
        else:
            return []
