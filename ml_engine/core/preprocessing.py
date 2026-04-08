
"""Data preprocessing module for ML pipeline."""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from typing import Tuple, Optional, Dict, Any
from pathlib import Path
import json

from utils.logger import get_logger
from utils.config import settings

logger = get_logger()


class DataPreprocessor:
    """Data preprocessing for ML training."""
    
    def __init__(self):
        """Initialize preprocessor."""
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_names = []
        logger.info("DataPreprocessor initialized")
    
    def load_data(self, file_path: str) -> pd.DataFrame:
        """
        Load data from file.
        
        Args:
            file_path: Path to data file (CSV or JSON)
            
        Returns:
            DataFrame with loaded data
        """
        file_path = Path(file_path)
        
        if not file_path.exists():
            raise FileNotFoundError(f"Data file not found: {file_path}")
        
        if file_path.suffix == '.csv':
            df = pd.read_csv(file_path)
        elif file_path.suffix == '.json':
            df = pd.read_json(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_path.suffix}")
        
        logger.info(f"Loaded data: {df.shape[0]} rows, {df.shape[1]} columns")
        return df
    
    def handle_missing_values(
        self,
        df: pd.DataFrame,
        strategy: str = 'mean'
    ) -> pd.DataFrame:
        """
        Handle missing values in dataset.
        
        Args:
            df: Input DataFrame
            strategy: Strategy for handling missing values ('mean', 'median', 'drop')
            
        Returns:
            DataFrame with missing values handled
        """
        if strategy == 'drop':
            df_clean = df.dropna()
            logger.info(f"Dropped {len(df) - len(df_clean)} rows with missing values")
        else:
            # Fill numeric columns
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            if strategy == 'mean':
                df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())
            elif strategy == 'median':
                df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())
            
            # Fill categorical columns with mode
            categorical_cols = df.select_dtypes(include=['object']).columns
            for col in categorical_cols:
                df[col] = df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else 'Unknown')
            
            df_clean = df
            logger.info(f"Filled missing values using {strategy} strategy")
        
        return df_clean
    
    def encode_categorical(
        self,
        df: pd.DataFrame,
        categorical_columns: Optional[list] = None
    ) -> pd.DataFrame:
        """
        Encode categorical variables.
        
        Args:
            df: Input DataFrame
            categorical_columns: List of categorical columns (auto-detect if None)
            
        Returns:
            DataFrame with encoded categorical variables
        """
        if categorical_columns is None:
            categorical_columns = df.select_dtypes(include=['object']).columns.tolist()
        
        df_encoded = df.copy()
        
        for col in categorical_columns:
            if col in df_encoded.columns:
                le = LabelEncoder()
                df_encoded[col] = le.fit_transform(df_encoded[col].astype(str))
                self.label_encoders[col] = le
                logger.info(f"Encoded column: {col}")
        
        return df_encoded
    
    def scale_features(
        self,
        X: pd.DataFrame,
        fit: bool = True
    ) -> np.ndarray:
        """
        Scale features using StandardScaler.
        
        Args:
            X: Feature DataFrame
            fit: Whether to fit the scaler (True for training, False for inference)
            
        Returns:
            Scaled features as numpy array
        """
        if fit:
            X_scaled = self.scaler.fit_transform(X)
            logger.info("Features scaled and scaler fitted")
        else:
            X_scaled = self.scaler.transform(X)
            logger.info("Features scaled using existing scaler")
        
        return X_scaled
    
    def split_data(
        self,
        X: pd.DataFrame,
        y: pd.Series,
        test_size: float = None,
        random_state: int = None
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """
        Split data into train and test sets.
        
        Args:
            X: Features
            y: Target variable
            test_size: Proportion of test set
            random_state: Random seed
            
        Returns:
            X_train, X_test, y_train, y_test
        """
        test_size = test_size or settings.default_test_size
        random_state = random_state or settings.default_random_state
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y,
            test_size=test_size,
            random_state=random_state
        )
        
        logger.info(f"Data split: Train={len(X_train)}, Test={len(X_test)}")
        return X_train, X_test, y_train, y_test
    
    def preprocess_pipeline(
        self,
        file_path: str,
        target_column: str,
        categorical_columns: Optional[list] = None,
        missing_strategy: str = 'mean',
        test_size: float = None,
        scale: bool = True
    ) -> Dict[str, Any]:
        """
        Complete preprocessing pipeline.
        
        Args:
            file_path: Path to data file
            target_column: Name of target column
            categorical_columns: List of categorical columns
            missing_strategy: Strategy for missing values
            test_size: Test set proportion
            scale: Whether to scale features
            
        Returns:
            Dictionary with preprocessed data and metadata
        """
        logger.info("Starting preprocessing pipeline")
        
        # Load data
        df = self.load_data(file_path)
        
        # Handle missing values
        df = self.handle_missing_values(df, strategy=missing_strategy)
        
        # Separate features and target
        if target_column not in df.columns:
            raise ValueError(f"Target column '{target_column}' not found in dataset")
        
        X = df.drop(columns=[target_column])
        y = df[target_column]
        
        # Store feature names
        self.feature_names = X.columns.tolist()
        
        # Encode categorical variables
        X = self.encode_categorical(X, categorical_columns)
        
        # Encode target if categorical
        if y.dtype == 'object':
            le = LabelEncoder()
            y = pd.Series(le.fit_transform(y), name=target_column)
            self.label_encoders[target_column] = le
            logger.info(f"Encoded target variable: {target_column}")
        
        # Split data
        X_train, X_test, y_train, y_test = self.split_data(X, y, test_size=test_size)
        
        # Scale features
        if scale:
            X_train = self.scale_features(X_train, fit=True)
            X_test = self.scale_features(X_test, fit=False)
        
        result = {
            'X_train': X_train,
            'X_test': X_test,
            'y_train': y_train,
            'y_test': y_test,
            'feature_names': self.feature_names,
            'label_encoders': self.label_encoders,
            'scaler': self.scaler
        }
        
        logger.info("Preprocessing pipeline completed successfully")
        return result
    
    def save_preprocessor_state(self, save_path: str) -> str:
        """
        Save preprocessor state (scaler, encoders).
        
        Args:
            save_path: Path to save preprocessor state
            
        Returns:
            Path where state was saved
        """
        import joblib
        
        state = {
            'scaler': self.scaler,
            'label_encoders': self.label_encoders,
            'feature_names': self.feature_names
        }
        
        joblib.dump(state, save_path)
        logger.info(f"Preprocessor state saved to: {save_path}")
        return save_path
    
    def load_preprocessor_state(self, load_path: str):
        """
        Load preprocessor state.
        
        Args:
            load_path: Path to load preprocessor state from
        """
        import joblib
        
        state = joblib.load(load_path)
        self.scaler = state['scaler']
        self.label_encoders = state['label_encoders']
        self.feature_names = state['feature_names']
        
        logger.info(f"Preprocessor state loaded from: {load_path}")
