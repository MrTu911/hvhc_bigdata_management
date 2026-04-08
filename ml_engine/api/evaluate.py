
"""Evaluation API endpoints."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List

from core.registry import model_registry
from core.trainer import ModelTrainer
from core.evaluator import ModelEvaluator
from core.preprocessing import DataPreprocessor
from utils.logger import get_logger

logger = get_logger()
router = APIRouter(prefix="/api/ml", tags=["Evaluation"])


class EvaluateRequest(BaseModel):
    """Evaluation request model."""
    model_id: str


@router.post("/evaluate")
async def evaluate_model(request: EvaluateRequest):
    """
    Evaluate a trained model (retrieve stored metrics).
    
    Args:
        request: Evaluation request with model_id
        
    Returns:
        Model evaluation metrics
    """
    try:
        logger.info(f"Evaluation request for model: {request.model_id}")
        
        # Get model info from registry
        model_info = model_registry.get_model(request.model_id)
        
        if not model_info:
            raise HTTPException(status_code=404, detail=f"Model not found: {request.model_id}")
        
        response = {
            'success': True,
            'model_id': request.model_id,
            'model_name': model_info['model_name'],
            'algorithm': model_info['algorithm'],
            'task_type': model_info['task_type'],
            'metrics': model_info['metrics'],
            'created_at': model_info['created_at']
        }
        
        return JSONResponse(content=response)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Evaluation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")


@router.get("/compare")
async def compare_models(model_ids: str):
    """
    Compare multiple models.
    
    Args:
        model_ids: Comma-separated list of model IDs
        
    Returns:
        Comparison results
    """
    try:
        # Parse model IDs
        ids = [mid.strip() for mid in model_ids.split(',')]
        logger.info(f"Comparing {len(ids)} models")
        
        # Get model information
        models = []
        for model_id in ids:
            model_info = model_registry.get_model(model_id)
            if not model_info:
                raise HTTPException(status_code=404, detail=f"Model not found: {model_id}")
            models.append(model_info)
        
        # Extract metrics
        metrics_list = [m['metrics'] for m in models]
        
        # Compare
        evaluator = ModelEvaluator()
        comparison = evaluator.compare_models(metrics_list)
        
        # Add model names to comparison
        comparison['models'] = [
            {
                'model_id': m['model_id'],
                'model_name': m['model_name'],
                'algorithm': m['algorithm']
            }
            for m in models
        ]
        
        response = {
            'success': True,
            'comparison': comparison
        }
        
        return JSONResponse(content=response)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Comparison failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")
