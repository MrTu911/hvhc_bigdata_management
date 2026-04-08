
"""Prediction API endpoints."""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import json
import pandas as pd
from pathlib import Path
import shutil

from core.registry import model_registry
from core.trainer import ModelTrainer
from core.preprocessing import DataPreprocessor
from utils.logger import get_logger
from utils.config import settings

logger = get_logger()
router = APIRouter(prefix="/api/ml", tags=["Prediction"])


class PredictRequest(BaseModel):
    """Prediction request model."""
    model_id: str
    data: List[List[float]]


@router.post("/predict")
async def predict(request: PredictRequest):
    """
    Make predictions using a trained model.
    
    Args:
        request: Prediction request with model_id and data
        
    Returns:
        Predictions
    """
    try:
        logger.info(f"Prediction request for model: {request.model_id}")
        
        # Get model info
        model_info = model_registry.get_model(request.model_id)
        if not model_info:
            raise HTTPException(status_code=404, detail=f"Model not found: {request.model_id}")
        
        # Load model
        trainer = ModelTrainer()
        trainer.load_model(model_info['storage_location'])
        
        # Make predictions
        import numpy as np
        X = np.array(request.data)
        predictions = trainer.predict(X)
        
        # Get probabilities for classification
        probabilities = None
        if model_info['task_type'] == 'classification':
            try:
                probabilities = trainer.predict_proba(X).tolist()
            except:
                pass
        
        response = {
            'success': True,
            'model_id': request.model_id,
            'model_name': model_info['model_name'],
            'predictions': predictions.tolist(),
            'probabilities': probabilities,
            'n_samples': len(predictions)
        }
        
        logger.info(f"Predictions made: {len(predictions)} samples")
        return JSONResponse(content=response)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.post("/predict-batch")
async def predict_batch(
    file: UploadFile = File(...),
    model_id: str = Form(...)
):
    """
    Make batch predictions from a file.
    
    Args:
        file: Input data file (CSV or JSON)
        model_id: Model ID
        
    Returns:
        Predictions
    """
    try:
        logger.info(f"Batch prediction request for model: {model_id}")
        
        # Get model info
        model_info = model_registry.get_model(model_id)
        if not model_info:
            raise HTTPException(status_code=404, detail=f"Model not found: {model_id}")
        
        # Save uploaded file
        temp_path = Path(settings.temp_data_path) / file.filename
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Load data
        if temp_path.suffix == '.csv':
            df = pd.read_csv(temp_path)
        elif temp_path.suffix == '.json':
            df = pd.read_json(temp_path)
        else:
            raise ValueError(f"Unsupported file format: {temp_path.suffix}")
        
        # Load preprocessor and model
        preprocessor = DataPreprocessor()
        preprocessor_path = Path(settings.model_storage_path) / f"{model_info['model_name']}_preprocessor.pkl"
        
        if preprocessor_path.exists():
            preprocessor.load_preprocessor_state(str(preprocessor_path))
            # Apply preprocessing
            df_encoded = preprocessor.encode_categorical(df)
            X = preprocessor.scale_features(df_encoded, fit=False)
        else:
            # Use raw data
            X = df.values
        
        # Load model and predict
        trainer = ModelTrainer()
        trainer.load_model(model_info['storage_location'])
        predictions = trainer.predict(X)
        
        # Cleanup
        temp_path.unlink()
        
        response = {
            'success': True,
            'model_id': model_id,
            'model_name': model_info['model_name'],
            'predictions': predictions.tolist(),
            'n_samples': len(predictions)
        }
        
        logger.info(f"Batch predictions made: {len(predictions)} samples")
        return JSONResponse(content=response)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch prediction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")
