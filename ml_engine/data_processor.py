
"""
Data Preprocessing Worker
Handles real file processing with Pandas, MinIO integration, and data quality checks
"""

import pandas as pd
import numpy as np
import json
import os
from datetime import datetime
from typing import Dict, List, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DataProcessor:
    """Main data processing worker"""
    
    def __init__(self, database_url: str):
        """
        Initialize data processor with database connection
        
        Args:
            database_url: PostgreSQL connection URL
        """
        self.database_url = database_url
        self.conn = None
        
    def connect_db(self):
        """Establish database connection"""
        try:
            self.conn = psycopg2.connect(self.database_url)
            logger.info("Database connection established")
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            raise
            
    def close_db(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            logger.info("Database connection closed")
    
    def process_dataset(self, file_path: str, dataset_id: str) -> Dict[str, Any]:
        """
        Process uploaded dataset file
        
        Args:
            file_path: Path to the uploaded file
            dataset_id: Dataset ID in database
            
        Returns:
            Processing results including statistics and quality metrics
        """
        logger.info(f"Starting processing for dataset {dataset_id}")
        
        try:
            # Update status to PROCESSING
            self._update_processing_status(dataset_id, "PROCESSING")
            
            # Read file based on extension
            df = self._read_file(file_path)
            
            if df is None:
                raise ValueError("Failed to read file")
            
            # Analyze data
            stats = self._analyze_data(df)
            
            # Calculate quality score
            quality_score = self._calculate_quality_score(df, stats)
            
            # Detect schema
            schema = self._detect_schema(df)
            
            # Save results to database
            self._save_processing_results(
                dataset_id=dataset_id,
                stats=stats,
                quality_score=quality_score,
                schema=schema,
                df=df
            )
            
            # Update status to PROCESSED
            self._update_processing_status(dataset_id, "PROCESSED")
            
            logger.info(f"Processing completed for dataset {dataset_id}")
            
            return {
                "success": True,
                "dataset_id": dataset_id,
                "stats": stats,
                "quality_score": quality_score,
                "schema": schema,
            }
            
        except Exception as e:
            logger.error(f"Processing failed for dataset {dataset_id}: {e}")
            self._update_processing_status(dataset_id, "FAILED", str(e))
            return {
                "success": False,
                "error": str(e),
            }
    
    def _read_file(self, file_path: str) -> Optional[pd.DataFrame]:
        """
        Read file based on extension
        
        Args:
            file_path: Path to file
            
        Returns:
            Pandas DataFrame or None
        """
        ext = os.path.splitext(file_path)[1].lower()
        
        try:
            if ext == '.csv':
                return pd.read_csv(file_path)
            elif ext in ['.xlsx', '.xls']:
                return pd.read_excel(file_path)
            elif ext == '.json':
                return pd.read_json(file_path)
            elif ext == '.parquet':
                return pd.read_parquet(file_path)
            else:
                logger.warning(f"Unsupported file extension: {ext}")
                return None
        except Exception as e:
            logger.error(f"Failed to read file {file_path}: {e}")
            return None
    
    def _analyze_data(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Analyze DataFrame and compute statistics
        
        Args:
            df: Pandas DataFrame
            
        Returns:
            Dictionary with statistics
        """
        total_rows, total_cols = df.shape
        
        # Calculate null statistics
        null_counts = df.isnull().sum()
        null_percentages = (null_counts / total_rows * 100).round(2)
        
        # Calculate duplicate rows
        duplicate_count = df.duplicated().sum()
        duplicate_percentage = (duplicate_count / total_rows * 100).round(2)
        
        # Memory usage
        memory_usage = df.memory_usage(deep=True).sum() / (1024 * 1024)  # MB
        
        # Column statistics
        column_stats = []
        for col in df.columns:
            col_stat = {
                "name": col,
                "dtype": str(df[col].dtype),
                "null_count": int(null_counts[col]),
                "null_percentage": float(null_percentages[col]),
                "unique_count": int(df[col].nunique()),
            }
            
            # Add numeric statistics if applicable
            if pd.api.types.is_numeric_dtype(df[col]):
                col_stat.update({
                    "min": float(df[col].min()) if not pd.isna(df[col].min()) else None,
                    "max": float(df[col].max()) if not pd.isna(df[col].max()) else None,
                    "mean": float(df[col].mean()) if not pd.isna(df[col].mean()) else None,
                    "median": float(df[col].median()) if not pd.isna(df[col].median()) else None,
                })
            
            # Sample values
            sample_values = df[col].dropna().head(5).tolist()
            col_stat["sample_values"] = [str(v) for v in sample_values]
            
            column_stats.append(col_stat)
        
        return {
            "total_rows": total_rows,
            "total_columns": total_cols,
            "duplicate_rows": int(duplicate_count),
            "duplicate_percentage": float(duplicate_percentage),
            "memory_usage_mb": round(memory_usage, 2),
            "column_stats": column_stats,
        }
    
    def _calculate_quality_score(self, df: pd.DataFrame, stats: Dict[str, Any]) -> float:
        """
        Calculate data quality score (0-100)
        
        Args:
            df: Pandas DataFrame
            stats: Statistics dictionary
            
        Returns:
            Quality score
        """
        score = 100.0
        
        # Penalty for null values
        total_nulls = df.isnull().sum().sum()
        total_cells = df.shape[0] * df.shape[1]
        null_percentage = (total_nulls / total_cells * 100) if total_cells > 0 else 0
        score -= null_percentage * 0.5
        
        # Penalty for duplicates
        duplicate_percentage = stats["duplicate_percentage"]
        score -= duplicate_percentage * 0.8
        
        # Penalty for mixed-type columns
        mixed_type_count = 0
        for col in df.columns:
            if df[col].dtype == 'object':
                # Check if column has mixed numeric/string values
                try:
                    pd.to_numeric(df[col].dropna())
                    mixed_type_count += 1
                except:
                    pass
        
        score -= mixed_type_count * 5
        
        # Ensure score is between 0 and 100
        return max(0, min(100, round(score, 2)))
    
    def _detect_schema(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Detect and return schema information
        
        Args:
            df: Pandas DataFrame
            
        Returns:
            List of column schemas
        """
        schema = []
        
        for col in df.columns:
            col_schema = {
                "column_name": col,
                "data_type": str(df[col].dtype),
                "nullable": bool(df[col].isnull().any()),
                "unique": df[col].nunique() == len(df),
            }
            
            # Infer semantic type
            if pd.api.types.is_numeric_dtype(df[col]):
                if df[col].dtype == 'int64':
                    col_schema["semantic_type"] = "INTEGER"
                else:
                    col_schema["semantic_type"] = "FLOAT"
            elif pd.api.types.is_datetime64_any_dtype(df[col]):
                col_schema["semantic_type"] = "DATETIME"
            elif pd.api.types.is_bool_dtype(df[col]):
                col_schema["semantic_type"] = "BOOLEAN"
            else:
                col_schema["semantic_type"] = "STRING"
            
            schema.append(col_schema)
        
        return schema
    
    def _update_processing_status(
        self,
        dataset_id: str,
        status: str,
        error_message: Optional[str] = None
    ):
        """
        Update dataset processing status in database
        
        Args:
            dataset_id: Dataset ID
            status: New status (PROCESSING, PROCESSED, FAILED)
            error_message: Error message if failed
        """
        try:
            cursor = self.conn.cursor()
            
            if error_message:
                cursor.execute(
                    """
                    UPDATE research_files
                    SET status = %s,
                        updated_at = NOW()
                    WHERE id = %s
                    """,
                    (status, dataset_id)
                )
            else:
                cursor.execute(
                    """
                    UPDATE research_files
                    SET status = %s,
                        updated_at = NOW()
                    WHERE id = %s
                    """,
                    (status, dataset_id)
                )
            
            self.conn.commit()
            cursor.close()
            
        except Exception as e:
            logger.error(f"Failed to update status: {e}")
            self.conn.rollback()
    
    def _save_processing_results(
        self,
        dataset_id: str,
        stats: Dict[str, Any],
        quality_score: float,
        schema: List[Dict[str, Any]],
        df: pd.DataFrame
    ):
        """
        Save processing results to database
        
        Args:
            dataset_id: Dataset ID
            stats: Statistics
            quality_score: Quality score
            schema: Schema information
            df: DataFrame (for additional metadata)
        """
        try:
            cursor = self.conn.cursor()
            
            # Update research_files with statistics
            cursor.execute(
                """
                UPDATE research_files
                SET 
                    file_size = %s
                WHERE id = %s
                """,
                (stats["memory_usage_mb"] * 1024 * 1024, dataset_id)
            )
            
            # Note: In production, you would also save to:
            # - data_quality_metrics table
            # - data_schemas table
            # - data_processing_logs table
            
            self.conn.commit()
            cursor.close()
            
            logger.info(f"Processing results saved for dataset {dataset_id}")
            
        except Exception as e:
            logger.error(f"Failed to save processing results: {e}")
            self.conn.rollback()


def main():
    """Main entry point for worker"""
    # This would be called by Celery or as a background task
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        logger.error("DATABASE_URL not set")
        return
    
    processor = DataProcessor(database_url)
    processor.connect_db()
    
    # Example: Process a dataset
    # In production, this would be triggered by a queue system
    # result = processor.process_dataset("/path/to/file.csv", "dataset_id_123")
    # print(json.dumps(result, indent=2))
    
    processor.close_db()


if __name__ == "__main__":
    main()
