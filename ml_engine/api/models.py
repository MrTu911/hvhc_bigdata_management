
"""Model management API endpoints."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse, RedirectResponse
from pydantic import BaseModel
from typing import Optional

from core.registry import model_registry
from utils.logger import get_logger

logger = get_logger()
router = APIRouter(prefix="/api/ml", tags=["Models"])


@router.get("/list")
async def list_models(
    model_name: Optional[str] = None,
    algorithm: Optional[str] = None,
    task_type: Optional[str] = None
):
    """
    List registered models with optional filters.
    
    Args:
        model_name: Filter by model name
        algorithm: Filter by algorithm
        task_type: Filter by task type ('classification' or 'regression')
        
    Returns:
        List of registered models
    """
    try:
        logger.info("Listing models")
        
        models = model_registry.list_models(
            model_name=model_name,
            algorithm=algorithm,
            task_type=task_type
        )
        
        return {
            'success': True,
            'count': len(models),
            'models': models
        }
        
    except Exception as e:
        logger.error(f"Failed to list models: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/get/{model_id}")
async def get_model(model_id: str):
    """
    Get model information by ID.
    
    Args:
        model_id: Model ID
        
    Returns:
        Model information
    """
    try:
        logger.info(f"Getting model: {model_id}")
        
        model_info = model_registry.get_model(model_id)
        
        if not model_info:
            raise HTTPException(status_code=404, detail=f"Model not found: {model_id}")
        
        return {
            'success': True,
            'model': model_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get model: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/best")
async def get_best_model(
    model_name: Optional[str] = None,
    task_type: str = "classification"
):
    """
    Get best performing model.
    
    Args:
        model_name: Filter by model name
        task_type: Task type for metric selection
        
    Returns:
        Best model information
    """
    try:
        logger.info(f"Getting best model for task_type: {task_type}")
        
        best_model = model_registry.get_best_model(
            model_name=model_name,
            task_type=task_type
        )
        
        if not best_model:
            raise HTTPException(status_code=404, detail="No models found")
        
        return {
            'success': True,
            'model': best_model
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get best model: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/delete/{model_id}")
async def delete_model(model_id: str):
    """
    Delete a model.
    
    Args:
        model_id: Model ID
        
    Returns:
        Deletion status
    """
    try:
        logger.info(f"Deleting model: {model_id}")
        
        success = model_registry.delete_model(model_id)
        
        if not success:
            raise HTTPException(status_code=404, detail=f"Model not found: {model_id}")
        
        return {
            'success': True,
            'message': f'Model {model_id} deleted successfully'
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete model: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/download/{model_id}")
async def download_model(model_id: str):
    """
    Get download URL for a model.
    
    Args:
        model_id: Model ID
        
    Returns:
        Redirect to download URL
    """
    try:
        logger.info(f"Getting download URL for model: {model_id}")
        
        url = model_registry.get_model_download_url(model_id)
        
        if not url:
            raise HTTPException(status_code=404, detail=f"Model not found or not downloadable: {model_id}")
        
        return RedirectResponse(url=url)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get download URL: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
