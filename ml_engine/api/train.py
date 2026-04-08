
"""Training API endpoints."""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
import json
from pathlib import Path
import shutil

from core.preprocessing import DataPreprocessor
from core.trainer import ModelTrainer
from core.evaluator import ModelEvaluator
from core.registry import model_registry
from utils.logger import get_logger
from utils.config import settings

logger = get_logger()
router = APIRouter(prefix="/api/ml", tags=["Training"])


class TrainRequest(BaseModel):
    """Training request model."""
    model_name: str
    algorithm: str = "random_forest"
    task_type: str = "classification"
    target_column: str
    categorical_columns: Optional[list] = None
    test_size: float = 0.2
    hyperparameters: Optional[Dict[str, Any]] = None
    dataset_name: Optional[str] = "uploaded_dataset"


@router.post("/train")
async def train_model(
    file: UploadFile = File(...),
    model_name: str = Form(...),
    algorithm: str = Form("random_forest"),
    task_type: str = Form("classification"),
    target_column: str = Form(...),
    categorical_columns: Optional[str] = Form(None),
    test_size: float = Form(0.2),
    hyperparameters: Optional[str] = Form(None),
    dataset_name: Optional[str] = Form("uploaded_dataset")
):
    """
    Train a machine learning model.
    
    Args:
        file: Training data file (CSV or JSON)
        model_name: Name for the model
        algorithm: ML algorithm to use
        task_type: 'classification' or 'regression'
        target_column: Name of target column
        categorical_columns: JSON array of categorical column names
        test_size: Test set proportion
        hyperparameters: JSON object of hyperparameters
        dataset_name: Name of dataset
        
    Returns:
        Training results and model information
    """
    try:
        logger.info(f"Training request received: {model_name} ({algorithm})")
        
        # Save uploaded file
        temp_path = Path(settings.temp_data_path) / file.filename
        temp_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"Uploaded file saved: {temp_path}")
        
        # Parse optional parameters
        cat_cols = json.loads(categorical_columns) if categorical_columns else None
        hyperparams = json.loads(hyperparameters) if hyperparameters else None
        
        # Step 1: Preprocess data
        logger.info("Step 1/4: Preprocessing data")
        preprocessor = DataPreprocessor()
        preprocessed = preprocessor.preprocess_pipeline(
            file_path=str(temp_path),
            target_column=target_column,
            categorical_columns=cat_cols,
            test_size=test_size
        )
        
        X_train = preprocessed['X_train']
        X_test = preprocessed['X_test']
        y_train = preprocessed['y_train']
        y_test = preprocessed['y_test']
        
        # Step 2: Train model
        logger.info("Step 2/4: Training model")
        trainer = ModelTrainer()
        training_info = trainer.train(
            X_train=X_train,
            y_train=y_train,
            algorithm=algorithm,
            task_type=task_type,
            hyperparameters=hyperparams
        )
        
        # Step 3: Evaluate model
        logger.info("Step 3/4: Evaluating model")
        evaluator = ModelEvaluator()
        y_pred = trainer.predict(X_test)
        
        # Get probabilities for classification
        y_pred_proba = None
        if task_type == 'classification' and hasattr(trainer.model, 'predict_proba'):
            try:
                y_pred_proba = trainer.predict_proba(X_test)
            except:
                pass
        
        metrics = evaluator.evaluate(
            y_true=y_test,
            y_pred=y_pred,
            task_type=task_type,
            y_pred_proba=y_pred_proba
        )
        
        # Step 4: Save and register model
        logger.info("Step 4/4: Saving and registering model")
        model_filename = f"{model_name}_{algorithm}.pkl"
        model_path = Path(settings.model_storage_path) / model_filename
        trainer.save_model(str(model_path), metadata=training_info)
        
        # Save preprocessor state
        preprocessor_path = Path(settings.model_storage_path) / f"{model_name}_preprocessor.pkl"
        preprocessor.save_preprocessor_state(str(preprocessor_path))
        
        # Register model
        model_id = model_registry.register_model(
            model_name=model_name,
            model_path=str(model_path),
            algorithm=algorithm,
            task_type=task_type,
            metrics=metrics,
            hyperparameters=hyperparams or {},
            dataset_name=dataset_name,
            metadata={
                'n_features': training_info['n_features'],
                'feature_names': preprocessed['feature_names']
            }
        )
        
        # Cleanup temp file
        temp_path.unlink()
        
        # Prepare response
        key_metric = 'accuracy' if task_type == 'classification' else 'rmse'
        
        response = {
            'success': True,
            'model_id': model_id,
            'model_name': model_name,
            'algorithm': algorithm,
            'task_type': task_type,
            'training_info': training_info,
            'metrics': metrics,
            'key_metric': {
                'name': key_metric,
                'value': metrics.get(key_metric, 0.0)
            },
            'message': f'Model trained successfully with {key_metric}={metrics.get(key_metric, 0.0):.4f}'
        }
        
        logger.info(f"Training completed successfully: {model_id}")
        return JSONResponse(content=response)
        
    except Exception as e:
        logger.error(f"Training failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


@router.get("/algorithms")
async def get_algorithms(task_type: str = "classification"):
    """
    Get list of supported algorithms.
    
    Args:
        task_type: 'classification' or 'regression'
        
    Returns:
        List of supported algorithms
    """
    try:
        algorithms = ModelTrainer.get_supported_algorithms(task_type)
        
        return {
            'success': True,
            'task_type': task_type,
            'algorithms': algorithms
        }
    except Exception as e:
        logger.error(f"Failed to get algorithms: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
