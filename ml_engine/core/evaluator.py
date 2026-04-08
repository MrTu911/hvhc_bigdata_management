
"""Model evaluation module with various metrics."""

import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report,
    mean_squared_error, mean_absolute_error, r2_score
)
from typing import Dict, Any, Optional
import json

from utils.logger import get_logger

logger = get_logger()


class ModelEvaluator:
    """Evaluate ML models with comprehensive metrics."""
    
    def __init__(self):
        """Initialize evaluator."""
        logger.info("ModelEvaluator initialized")
    
    def evaluate_classification(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        y_pred_proba: Optional[np.ndarray] = None,
        class_names: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Evaluate classification model.
        
        Args:
            y_true: True labels
            y_pred: Predicted labels
            y_pred_proba: Predicted probabilities (optional)
            class_names: Names of classes (optional)
            
        Returns:
            Evaluation metrics
        """
        logger.info("Evaluating classification model")
        
        # Basic metrics
        accuracy = accuracy_score(y_true, y_pred)
        precision = precision_score(y_true, y_pred, average='weighted', zero_division=0)
        recall = recall_score(y_true, y_pred, average='weighted', zero_division=0)
        f1 = f1_score(y_true, y_pred, average='weighted', zero_division=0)
        
        # Confusion matrix
        cm = confusion_matrix(y_true, y_pred)
        
        # Classification report
        report = classification_report(
            y_true, y_pred,
            target_names=class_names,
            output_dict=True,
            zero_division=0
        )
        
        metrics = {
            'task_type': 'classification',
            'accuracy': float(accuracy),
            'precision': float(precision),
            'recall': float(recall),
            'f1_score': float(f1),
            'confusion_matrix': cm.tolist(),
            'classification_report': report,
            'n_samples': len(y_true),
            'n_classes': len(np.unique(y_true))
        }
        
        logger.info(f"Classification metrics: Accuracy={accuracy:.4f}, F1={f1:.4f}")
        return metrics
    
    def evaluate_regression(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray
    ) -> Dict[str, Any]:
        """
        Evaluate regression model.
        
        Args:
            y_true: True values
            y_pred: Predicted values
            
        Returns:
            Evaluation metrics
        """
        logger.info("Evaluating regression model")
        
        # Regression metrics
        mse = mean_squared_error(y_true, y_pred)
        rmse = np.sqrt(mse)
        mae = mean_absolute_error(y_true, y_pred)
        r2 = r2_score(y_true, y_pred)
        
        # Additional metrics
        mape = np.mean(np.abs((y_true - y_pred) / (y_true + 1e-10))) * 100
        
        metrics = {
            'task_type': 'regression',
            'mse': float(mse),
            'rmse': float(rmse),
            'mae': float(mae),
            'r2_score': float(r2),
            'mape': float(mape),
            'n_samples': len(y_true)
        }
        
        logger.info(f"Regression metrics: RMSE={rmse:.4f}, R2={r2:.4f}")
        return metrics
    
    def evaluate(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        task_type: str = 'classification',
        y_pred_proba: Optional[np.ndarray] = None,
        class_names: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Evaluate model based on task type.
        
        Args:
            y_true: True labels/values
            y_pred: Predicted labels/values
            task_type: 'classification' or 'regression'
            y_pred_proba: Predicted probabilities (classification only)
            class_names: Names of classes (classification only)
            
        Returns:
            Evaluation metrics
        """
        if task_type == 'classification':
            return self.evaluate_classification(y_true, y_pred, y_pred_proba, class_names)
        elif task_type == 'regression':
            return self.evaluate_regression(y_true, y_pred)
        else:
            raise ValueError(f"Invalid task_type: {task_type}")
    
    def compare_models(self, metrics_list: list[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Compare multiple models.
        
        Args:
            metrics_list: List of metrics dictionaries
            
        Returns:
            Comparison results
        """
        if not metrics_list:
            raise ValueError("No metrics to compare")
        
        task_type = metrics_list[0].get('task_type')
        
        if task_type == 'classification':
            key_metric = 'accuracy'
        elif task_type == 'regression':
            key_metric = 'rmse'
        else:
            raise ValueError("Invalid task_type in metrics")
        
        # Find best model
        if task_type == 'regression':
            # Lower is better for RMSE
            best_idx = min(range(len(metrics_list)), key=lambda i: metrics_list[i][key_metric])
        else:
            # Higher is better for accuracy
            best_idx = max(range(len(metrics_list)), key=lambda i: metrics_list[i][key_metric])
        
        comparison = {
            'task_type': task_type,
            'n_models': len(metrics_list),
            'best_model_index': best_idx,
            'best_model_score': metrics_list[best_idx][key_metric],
            'key_metric': key_metric,
            'all_scores': [m[key_metric] for m in metrics_list]
        }
        
        logger.info(f"Best model: index={best_idx}, {key_metric}={comparison['best_model_score']:.4f}")
        return comparison
