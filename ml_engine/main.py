
"""
HVHC ML Engine - FastAPI Application
Machine Learning training, evaluation, and prediction service.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time

from api import train, evaluate, predict, models
from utils.config import settings
from utils.logger import setup_logger, get_logger
from utils.db_client import db_client
from utils.minio_client import minio_client

# Setup logger
setup_logger("hvhc_ml_engine")
logger = get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    """
    # Startup
    logger.info("=" * 80)
    logger.info("HVHC ML Engine Starting Up")
    logger.info("=" * 80)
    
    # Test database connection
    logger.info("Testing database connection...")
    db_connected = db_client.test_connection()
    if db_connected:
        logger.info("✅ Database connection successful")
    else:
        logger.warning("⚠️  Database connection failed - some features may not work")
    
    # Ensure MinIO bucket
    logger.info("Checking MinIO bucket...")
    try:
        minio_client._ensure_bucket()
        logger.info("✅ MinIO bucket ready")
    except Exception as e:
        logger.warning(f"⚠️  MinIO setup failed: {str(e)}")
    
    logger.info(f"ML Engine ready on http://{settings.ml_engine_host}:{settings.ml_engine_port}")
    logger.info("=" * 80)
    
    yield
    
    # Shutdown
    logger.info("ML Engine shutting down...")


# Create FastAPI app
app = FastAPI(
    title="HVHC ML Engine",
    description="Machine Learning training, evaluation, and prediction service for HVHC BigData Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_allowed_origins_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests."""
    start_time = time.time()
    
    # Log request
    logger.info(f"→ {request.method} {request.url.path}")
    
    # Process request
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        
        # Log response
        logger.info(f"← {response.status_code} ({process_time:.3f}s)")
        
        return response
    except Exception as e:
        logger.error(f"Request failed: {str(e)}")
        raise


# Include routers
app.include_router(train.router)
app.include_router(evaluate.router)
app.include_router(predict.router)
app.include_router(models.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "HVHC ML Engine",
        "version": "1.0.0",
        "status": "operational",
        "description": "Machine Learning service for HVHC BigData Platform",
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "train": "/api/ml/train",
            "evaluate": "/api/ml/evaluate",
            "predict": "/api/ml/predict",
            "list_models": "/api/ml/list"
        }
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    
    Returns:
        System health status
    """
    # Check database
    db_status = "healthy" if db_client.test_connection() else "unhealthy"
    
    # Check MinIO
    minio_status = "healthy"
    try:
        minio_client.list_models()
    except Exception as e:
        minio_status = f"unhealthy: {str(e)}"
    
    overall_status = "healthy" if db_status == "healthy" else "degraded"
    
    return {
        "status": overall_status,
        "version": "1.0.0",
        "components": {
            "database": db_status,
            "storage": minio_status
        },
        "timestamp": time.time()
    }


@app.get("/api/ml/info")
async def get_info():
    """
    Get ML Engine information.
    
    Returns:
        Engine configuration and capabilities
    """
    from core.trainer import ModelTrainer
    
    return {
        "service": "HVHC ML Engine",
        "version": "1.0.0",
        "capabilities": {
            "classification_algorithms": ModelTrainer.get_supported_algorithms('classification'),
            "regression_algorithms": ModelTrainer.get_supported_algorithms('regression'),
            "max_training_time": settings.max_training_time,
            "supported_formats": ["csv", "json"]
        },
        "configuration": {
            "host": settings.ml_engine_host,
            "port": settings.ml_engine_port,
            "environment": settings.ml_engine_env
        }
    }


# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": str(exc),
            "message": "Internal server error"
        }
    )


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=settings.ml_engine_host,
        port=settings.ml_engine_port,
        reload=True if settings.ml_engine_env == "development" else False,
        log_level=settings.log_level.lower()
    )
