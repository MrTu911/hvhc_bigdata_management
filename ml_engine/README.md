
# 🧠 HVHC ML Engine - Phase 1

**Machine Learning Training & Evaluation Service**

FastAPI-based microservice for training, evaluating, and deploying ML models for the HVHC BigData Platform.

---

## 📋 Features

### ✅ Implemented (Phase 1)

- **Training Pipeline**
  - Multiple ML algorithms (Random Forest, XGBoost, SVM, Logistic Regression, etc.)
  - Automatic data preprocessing
  - Hyperparameter configuration
  - Support for classification and regression tasks

- **Model Evaluation**
  - Comprehensive metrics (accuracy, precision, recall, F1, RMSE, MAE, R²)
  - Confusion matrix for classification
  - Model comparison capabilities

- **Prediction Service**
  - Single and batch predictions
  - Probability predictions for classification
  - REST API endpoints

- **Model Management**
  - Model registry with versioning
  - MinIO storage integration (S3-compatible)
  - PostgreSQL logging
  - Download and delete models

- **Data Processing**
  - CSV and JSON support
  - Automatic handling of missing values
  - Categorical encoding
  - Feature scaling
  - Train/test splitting

---

## 🏗️ Architecture

```
ml_engine/
├── api/                    # API endpoints
│   ├── train.py           # Training endpoints
│   ├── evaluate.py        # Evaluation endpoints
│   ├── predict.py         # Prediction endpoints
│   └── models.py          # Model management
├── core/                  # Core ML modules
│   ├── preprocessing.py   # Data preprocessing
│   ├── trainer.py         # Model training
│   ├── evaluator.py       # Model evaluation
│   └── registry.py        # Model registry
├── utils/                 # Utilities
│   ├── config.py          # Configuration
│   ├── logger.py          # Logging setup
│   ├── db_client.py       # Database client
│   └── minio_client.py    # MinIO/S3 client
├── models/                # Saved models
├── data/                  # Training data
├── logs/                  # Application logs
├── main.py               # FastAPI application
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Docker Compose setup
└── requirements.txt      # Python dependencies
```

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# 1. Copy environment variables
cp .env.example .env

# 2. Edit .env with your database URL
nano .env

# 3. Start services
docker-compose up -d

# 4. Check status
docker-compose ps

# 5. View logs
docker-compose logs -f ml_engine
```

### Option 2: Local Development

```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy and configure environment
cp .env.example .env
nano .env

# 4. Run the application
python main.py
```

---

## 📡 API Endpoints

### Base URL
```
http://localhost:8001
```

### 1. Health Check
```bash
GET /health
```

### 2. Train Model
```bash
POST /api/ml/train

Form Data:
- file: training_data.csv (CSV or JSON)
- model_name: "logistics_predictor"
- algorithm: "random_forest" | "xgboost" | "logistic_regression" | "svm"
- task_type: "classification" | "regression"
- target_column: "target"
- categorical_columns: ["col1", "col2"] (JSON array)
- test_size: 0.2
- hyperparameters: {"n_estimators": 100} (JSON object)
```

**Example:**
```bash
curl -X POST "http://localhost:8001/api/ml/train" \
  -F "file=@data.csv" \
  -F "model_name=my_model" \
  -F "algorithm=random_forest" \
  -F "task_type=classification" \
  -F "target_column=label"
```

### 3. List Models
```bash
GET /api/ml/list?task_type=classification
```

### 4. Evaluate Model
```bash
POST /api/ml/evaluate
{
  "model_id": "abc123xyz456"
}
```

### 5. Predict
```bash
POST /api/ml/predict
{
  "model_id": "abc123xyz456",
  "data": [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]]
}
```

### 6. Batch Predict
```bash
POST /api/ml/predict-batch

Form Data:
- file: test_data.csv
- model_id: "abc123xyz456"
```

### 7. Get Best Model
```bash
GET /api/ml/best?task_type=classification
```

### 8. Delete Model
```bash
DELETE /api/ml/delete/{model_id}
```

### 9. Download Model
```bash
GET /api/ml/download/{model_id}
```

---

## 📊 Supported Algorithms

### Classification
- `random_forest` - Random Forest Classifier
- `logistic_regression` - Logistic Regression
- `svm` - Support Vector Machine
- `decision_tree` - Decision Tree Classifier
- `xgboost` - XGBoost Classifier

### Regression
- `random_forest` - Random Forest Regressor
- `linear_regression` - Linear Regression
- `svm` - Support Vector Regressor
- `decision_tree` - Decision Tree Regressor
- `xgboost` - XGBoost Regressor

---

## 🔧 Configuration

### Environment Variables

```bash
# Server
ML_ENGINE_HOST=0.0.0.0
ML_ENGINE_PORT=8001
ML_ENGINE_ENV=development

# Database (use existing HVHC database)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# MinIO (S3-compatible storage)
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=hvhc-ml-models

# ML Configuration
MAX_TRAINING_TIME=3600
DEFAULT_TEST_SIZE=0.2
DEFAULT_RANDOM_STATE=42

# Logging
LOG_LEVEL=INFO
LOG_FILE=./logs/ml_engine.log
```

---

## 📈 Database Schema

Add this table to your PostgreSQL database:

```sql
CREATE TABLE IF NOT EXISTS ml_training_logs (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(255) NOT NULL,
    algorithm VARCHAR(100) NOT NULL,
    dataset_name VARCHAR(255),
    accuracy FLOAT,
    parameters JSONB,
    model_path TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ml_training_created_at ON ml_training_logs(created_at DESC);
CREATE INDEX idx_ml_training_model_name ON ml_training_logs(model_name);
```

---

## 🧪 Testing

### Test with cURL

```bash
# 1. Health check
curl http://localhost:8001/health

# 2. Get available algorithms
curl http://localhost:8001/api/ml/algorithms?task_type=classification

# 3. Train a model (example with iris dataset)
curl -X POST http://localhost:8001/api/ml/train \
  -F "file=@iris.csv" \
  -F "model_name=iris_classifier" \
  -F "algorithm=random_forest" \
  -F "task_type=classification" \
  -F "target_column=species"

# 4. List all models
curl http://localhost:8001/api/ml/list
```

### Interactive API Docs

Visit: `http://localhost:8001/docs`

---

## 📦 Dependencies

See `requirements.txt` for full list. Key dependencies:

- **FastAPI** - Modern web framework
- **scikit-learn** - ML algorithms
- **XGBoost** - Gradient boosting
- **pandas** - Data manipulation
- **MinIO** - Object storage
- **PostgreSQL** - Database
- **Loguru** - Logging

---

## 🔐 Security Notes

### For Production

1. **Change default credentials:**
   ```bash
   MINIO_ACCESS_KEY=<strong-key>
   MINIO_SECRET_KEY=<strong-secret>
   ```

2. **Use HTTPS:**
   ```bash
   MINIO_USE_SSL=true
   ```

3. **Add API key authentication** (Phase 2)

4. **Enable rate limiting** (Phase 2)

---

## 🚧 Roadmap

### ✅ Phase 1 (Current)
- Core ML training pipeline
- Basic evaluation metrics
- Model registry
- REST API

### 🔜 Phase 2 (Next)
- Real-time training status
- Advanced visualizations
- Model versioning
- A/B testing support

### 🔮 Phase 3 (Future)
- AutoML capabilities
- Hyperparameter tuning
- Model monitoring
- Drift detection

---

## 🐛 Troubleshooting

### MinIO Connection Failed
```bash
# Check MinIO is running
docker-compose ps minio

# Check MinIO logs
docker-compose logs minio

# Access MinIO console
http://localhost:9001
```

### Database Connection Failed
```bash
# Verify DATABASE_URL in .env
# Ensure PostgreSQL is accessible
# Check table exists (see Database Schema section)
```

### Model Training Fails
```bash
# Check logs
docker-compose logs ml_engine

# Or if running locally
tail -f logs/ml_engine.log
```

---

## 📞 Support

- **Documentation:** `/docs` endpoint
- **Health Check:** `/health` endpoint
- **Logs:** `./logs/ml_engine.log`

---

## 📝 License

Internal use for HVHC BigData Platform.

---

**Version:** 1.0.0  
**Last Updated:** October 5, 2025  
**Author:** HVHC BigData Team

---

## 🎓 Example Usage

### Complete Training Workflow

```python
import requests

# 1. Upload and train model
with open('data.csv', 'rb') as f:
    response = requests.post(
        'http://localhost:8001/api/ml/train',
        files={'file': f},
        data={
            'model_name': 'sales_predictor',
            'algorithm': 'xgboost',
            'task_type': 'regression',
            'target_column': 'sales',
            'test_size': 0.2
        }
    )

model_info = response.json()
model_id = model_info['model_id']

# 2. Evaluate model
eval_response = requests.post(
    'http://localhost:8001/api/ml/evaluate',
    json={'model_id': model_id}
)
print(eval_response.json()['metrics'])

# 3. Make predictions
pred_response = requests.post(
    'http://localhost:8001/api/ml/predict',
    json={
        'model_id': model_id,
        'data': [[100, 200, 300]]  # Feature values
    }
)
print(pred_response.json()['predictions'])
```

---

🚀 **Ready to train your first model!**
