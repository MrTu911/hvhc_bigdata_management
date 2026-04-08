
# 🚀 HVHC ML Engine - Quick Start Guide

Get the ML Engine running in 5 minutes!

---

## Prerequisites

- Python 3.11+ OR Docker
- PostgreSQL database (existing HVHC database)
- 2GB free disk space

---

## 🎯 Method 1: Docker (Easiest)

### Step 1: Copy environment file
```bash
cd ml_engine
cp .env.example .env
```

### Step 2: Edit database URL in `.env`
```bash
nano .env
# Set your DATABASE_URL from the main HVHC project
```

### Step 3: Start services
```bash
chmod +x start-docker.sh
./start-docker.sh
```

### Step 4: Test
```bash
curl http://localhost:8001/health
```

✅ **Done!** Visit http://localhost:8001/docs for API documentation.

---

## 🐍 Method 2: Local Development

### Step 1: Setup
```bash
cd ml_engine
chmod +x start.sh
./start.sh
```

The script will:
- Create virtual environment
- Install dependencies
- Start the server

### Step 2: Test
```bash
chmod +x test_api.sh
./test_api.sh
```

---

## 📊 Try Your First Training

### Create a sample CSV (iris dataset)
```bash
cat > sample_data.csv << 'EOF'
sepal_length,sepal_width,petal_length,petal_width,species
5.1,3.5,1.4,0.2,setosa
4.9,3.0,1.4,0.2,setosa
7.0,3.2,4.7,1.4,versicolor
6.4,3.2,4.5,1.5,versicolor
6.3,3.3,6.0,2.5,virginica
5.8,2.7,5.1,1.9,virginica
EOF
```

### Train a model
```bash
curl -X POST http://localhost:8001/api/ml/train \
  -F "file=@sample_data.csv" \
  -F "model_name=iris_classifier" \
  -F "algorithm=random_forest" \
  -F "task_type=classification" \
  -F "target_column=species"
```

### Response example:
```json
{
  "success": true,
  "model_id": "abc123xyz456",
  "accuracy": 0.95,
  "message": "Model trained successfully"
}
```

---

## 🎓 Next Steps

1. **Explore API Docs**: http://localhost:8001/docs
2. **List your models**: `curl http://localhost:8001/api/ml/list`
3. **Make predictions**: Use the `/api/ml/predict` endpoint
4. **Check logs**: `docker-compose logs -f` or `tail -f logs/ml_engine.log`

---

## 🛠️ Troubleshooting

### Port 8001 already in use
```bash
# Edit .env and change ML_ENGINE_PORT
nano .env
# Change to: ML_ENGINE_PORT=8002
```

### Database connection failed
```bash
# Check DATABASE_URL in .env
# Ensure PostgreSQL is accessible
# Run migration: psql < ../sql_migrations/004_ml_training_logs.sql
```

### MinIO not starting (Docker)
```bash
# Check logs
docker-compose logs minio

# Restart MinIO
docker-compose restart minio
```

---

## 📚 Resources

- **Full Documentation**: See `README.md`
- **API Documentation**: http://localhost:8001/docs
- **Health Check**: http://localhost:8001/health
- **MinIO Console**: http://localhost:9001 (admin/admin)

---

**Ready to train models!** 🎉
