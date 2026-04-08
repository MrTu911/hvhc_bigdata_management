
"""Logging configuration for ML Engine."""

import logging
import sys
from pathlib import Path
from loguru import logger
from .config import settings


def setup_logger(name: str = "ml_engine") -> None:
    """
    Setup logger with Loguru.
    
    Args:
        name: Logger name
    """
    # Remove default handler
    logger.remove()
    
    # Console handler
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level=settings.log_level,
        colorize=True
    )
    
    # File handler
    log_file = Path(settings.log_file)
    log_file.parent.mkdir(parents=True, exist_ok=True)
    
    logger.add(
        log_file,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        level=settings.log_level,
        rotation="10 MB",
        retention="7 days",
        compression="zip"
    )
    
    logger.info(f"Logger initialized for {name}")


def get_logger():
    """Get logger instance."""
    return logger
