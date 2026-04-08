
# 🔗 ML Engine Integration Guide

Guide for integrating HVHC ML Engine with the Next.js frontend.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────┐
│           HVHC BigData Platform                 │
│                                                 │
│  ┌──────────────┐         ┌─────────────────┐ │
│  │  Next.js     │  HTTP   │   ML Engine     │ │
│  │  Frontend    │ ◄─────► │   (FastAPI)     │ │
│  │  (Port 3000) │         │   (Port 8001)   │ │
│  └──────────────┘         └─────────────────┘ │
│         │                         │            │
│         │                         │            │
│         ▼                         ▼            │
│  ┌─────────────────────────────────────────┐  │
│  │        PostgreSQL Database              │  │
│  │        (Shared Database)                │  │
│  └─────────────────────────────────────────┘  │
│                                                 │
│                    ┌─────────────┐             │
│                    │   MinIO     │             │
│                    │  (S3 Store) │             │
│                    └─────────────┘             │
└─────────────────────────────────────────────────┘
```

---

## 📡 API Integration

### 1. Create API Client in Next.js

**File:** `nextjs_space/lib/ml-client.ts`

```typescript
// ML Engine API Client
const ML_ENGINE_URL = process.env.NEXT_PUBLIC_ML_ENGINE_URL || 'http://localhost:8001';

export interface TrainModelRequest {
  file: File;
  modelName: string;
  algorithm: string;
  taskType: 'classification' | 'regression';
  targetColumn: string;
  categoricalColumns?: string[];
  testSize?: number;
  hyperparameters?: Record<string, any>;
  datasetName?: string;
}

export interface ModelInfo {
  model_id: string;
  model_name: string;
  algorithm: string;
  task_type: string;
  metrics: Record<string, any>;
  created_at: string;
}

export interface TrainResponse {
  success: boolean;
  model_id: string;
  model_name: string;
  algorithm: string;
  task_type: string;
  metrics: Record<string, any>;
  key_metric: {
    name: string;
    value: number;
  };
  message: string;
}

export interface PredictRequest {
  model_id: string;
  data: number[][];
}

export interface PredictResponse {
  success: boolean;
  model_id: string;
  model_name: string;
  predictions: number[];
  probabilities?: number[][];
  n_samples: number;
}

class MLEngineClient {
  private baseUrl: string;

  constructor(baseUrl: string = ML_ENGINE_URL) {
    this.baseUrl = baseUrl;
  }

  // Health check
  async healthCheck(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/health`);
    return response.json();
  }

  // Train model
  async trainModel(request: TrainModelRequest): Promise<TrainResponse> {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('model_name', request.modelName);
    formData.append('algorithm', request.algorithm);
    formData.append('task_type', request.taskType);
    formData.append('target_column', request.targetColumn);
    
    if (request.categoricalColumns) {
      formData.append('categorical_columns', JSON.stringify(request.categoricalColumns));
    }
    
    if (request.testSize) {
      formData.append('test_size', request.testSize.toString());
    }
    
    if (request.hyperparameters) {
      formData.append('hyperparameters', JSON.stringify(request.hyperparameters));
    }
    
    if (request.datasetName) {
      formData.append('dataset_name', request.datasetName);
    }

    const response = await fetch(`${this.baseUrl}/api/ml/train`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Training failed: ${response.statusText}`);
    }

    return response.json();
  }

  // List models
  async listModels(filters?: {
    modelName?: string;
    algorithm?: string;
    taskType?: string;
  }): Promise<{ success: boolean; count: number; models: ModelInfo[] }> {
    const params = new URLSearchParams();
    
    if (filters?.modelName) params.append('model_name', filters.modelName);
    if (filters?.algorithm) params.append('algorithm', filters.algorithm);
    if (filters?.taskType) params.append('task_type', filters.taskType);

    const response = await fetch(`${this.baseUrl}/api/ml/list?${params}`);
    return response.json();
  }

  // Get model
  async getModel(modelId: string): Promise<{ success: boolean; model: ModelInfo }> {
    const response = await fetch(`${this.baseUrl}/api/ml/get/${modelId}`);
    return response.json();
  }

  // Evaluate model
  async evaluateModel(modelId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/ml/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model_id: modelId }),
    });
    return response.json();
  }

  // Predict
  async predict(request: PredictRequest): Promise<PredictResponse> {
    const response = await fetch(`${this.baseUrl}/api/ml/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return response.json();
  }

  // Batch predict
  async predictBatch(file: File, modelId: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_id', modelId);

    const response = await fetch(`${this.baseUrl}/api/ml/predict-batch`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  }

  // Get best model
  async getBestModel(taskType: string, modelName?: string): Promise<any> {
    const params = new URLSearchParams({ task_type: taskType });
    if (modelName) params.append('model_name', modelName);

    const response = await fetch(`${this.baseUrl}/api/ml/best?${params}`);
    return response.json();
  }

  // Delete model
  async deleteModel(modelId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/api/ml/delete/${modelId}`, {
      method: 'DELETE',
    });
    return response.json();
  }

  // Get algorithms
  async getAlgorithms(taskType: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/ml/algorithms?task_type=${taskType}`);
    return response.json();
  }
}

// Export singleton instance
export const mlClient = new MLEngineClient();
```

---

## 🎨 Frontend Components

### 2. Train Model Component

**File:** `nextjs_space/app/ai-training/train/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { mlClient } from '@/lib/ml-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TrainModelPage() {
  const [file, setFile] = useState<File | null>(null);
  const [modelName, setModelName] = useState('');
  const [algorithm, setAlgorithm] = useState('random_forest');
  const [taskType, setTaskType] = useState<'classification' | 'regression'>('classification');
  const [targetColumn, setTargetColumn] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !modelName || !targetColumn) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await mlClient.trainModel({
        file,
        modelName,
        algorithm,
        taskType,
        targetColumn,
      });

      setResult(response);
    } catch (error) {
      console.error('Training failed:', error);
      alert('Training failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Train ML Model</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="file">Training Data (CSV/JSON)</Label>
              <Input
                id="file"
                type="file"
                accept=".csv,.json"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>

            <div>
              <Label htmlFor="modelName">Model Name</Label>
              <Input
                id="modelName"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="my_model"
              />
            </div>

            <div>
              <Label htmlFor="taskType">Task Type</Label>
              <Select value={taskType} onValueChange={(v: any) => setTaskType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classification">Classification</SelectItem>
                  <SelectItem value="regression">Regression</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="algorithm">Algorithm</Label>
              <Select value={algorithm} onValueChange={setAlgorithm}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="random_forest">Random Forest</SelectItem>
                  <SelectItem value="xgboost">XGBoost</SelectItem>
                  <SelectItem value="logistic_regression">Logistic Regression</SelectItem>
                  <SelectItem value="svm">SVM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="targetColumn">Target Column</Label>
              <Input
                id="targetColumn"
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value)}
                placeholder="label"
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? 'Training...' : 'Train Model'}
            </Button>
          </form>

          {result && (
            <div className="mt-6 p-4 bg-green-50 rounded">
              <h3 className="font-bold mb-2">✅ Training Successful!</h3>
              <p><strong>Model ID:</strong> {result.model_id}</p>
              <p><strong>{result.key_metric.name}:</strong> {result.key_metric.value.toFixed(4)}</p>
              <pre className="mt-2 text-xs overflow-auto">
                {JSON.stringify(result.metrics, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🔧 Environment Configuration

### 3. Add to `.env.local`

```bash
# ML Engine URL
NEXT_PUBLIC_ML_ENGINE_URL=http://localhost:8001
```

---

## 🚀 Deployment Steps

### Local Development

1. **Start ML Engine:**
```bash
cd ml_engine
./start-docker.sh
```

2. **Start Next.js:**
```bash
cd nextjs_space
yarn dev
```

3. **Access:**
   - Frontend: http://localhost:3000
   - ML Engine: http://localhost:8001
   - API Docs: http://localhost:8001/docs

---

### Production Deployment

1. **Deploy ML Engine on separate server/container**
2. **Update environment variable:**
```bash
NEXT_PUBLIC_ML_ENGINE_URL=https://ml-engine.hvhc.edu.vn
```

3. **Configure CORS in ML Engine `.env`:**
```bash
ALLOWED_ORIGINS=https://bigdata.hvhc.edu.vn
```

---

## 📊 Database Integration

Both services share the same PostgreSQL database.

**Run migration:**
```bash
psql -h <host> -U <user> -d <database> < sql_migrations/004_ml_training_logs.sql
```

---

## 🧪 Testing Integration

### Test Script (Node.js)

```javascript
// test-integration.js
const ML_ENGINE_URL = 'http://localhost:8001';

async function testIntegration() {
  console.log('🧪 Testing ML Engine Integration...\n');

  // 1. Health check
  console.log('1️⃣  Health Check');
  const health = await fetch(`${ML_ENGINE_URL}/health`).then(r => r.json());
  console.log('   Status:', health.status);
  console.log('   ✅ Health check passed\n');

  // 2. List models
  console.log('2️⃣  List Models');
  const models = await fetch(`${ML_ENGINE_URL}/api/ml/list`).then(r => r.json());
  console.log('   Total models:', models.count);
  console.log('   ✅ List models passed\n');

  // 3. Get algorithms
  console.log('3️⃣  Get Algorithms');
  const algos = await fetch(`${ML_ENGINE_URL}/api/ml/algorithms?task_type=classification`).then(r => r.json());
  console.log('   Available:', algos.algorithms.join(', '));
  console.log('   ✅ Get algorithms passed\n');

  console.log('✅ All integration tests passed!');
}

testIntegration().catch(console.error);
```

**Run:**
```bash
node test-integration.js
```

---

## 📝 API Reference Quick Guide

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Check service health |
| `/api/ml/train` | POST | Train new model |
| `/api/ml/list` | GET | List all models |
| `/api/ml/get/{id}` | GET | Get model details |
| `/api/ml/evaluate` | POST | Evaluate model |
| `/api/ml/predict` | POST | Make predictions |
| `/api/ml/predict-batch` | POST | Batch predictions |
| `/api/ml/best` | GET | Get best model |
| `/api/ml/delete/{id}` | DELETE | Delete model |
| `/api/ml/algorithms` | GET | List algorithms |

---

## 🔐 Security Best Practices

1. **API Key Authentication (Future):**
```typescript
headers: {
  'X-API-Key': process.env.ML_ENGINE_API_KEY
}
```

2. **CORS Configuration:**
   - Only allow specific origins in production
   - Use environment variables

3. **File Upload Validation:**
   - Check file types
   - Limit file size
   - Sanitize filenames

---

## 🐛 Troubleshooting

### CORS Errors
**Solution:** Add Next.js URL to ML Engine `.env`:
```bash
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
```

### Connection Refused
**Check:**
1. ML Engine is running: `curl http://localhost:8001/health`
2. Firewall allows port 8001
3. Environment variable is correct

### Training Fails
**Common causes:**
1. Invalid CSV format
2. Target column not found
3. Insufficient data
4. Database connection failed

**Check logs:**
```bash
docker-compose logs ml_engine
# or
tail -f ml_engine/logs/ml_engine.log
```

---

## 📚 Additional Resources

- **ML Engine API Docs:** http://localhost:8001/docs
- **FastAPI Documentation:** https://fastapi.tiangolo.com
- **scikit-learn Guide:** https://scikit-learn.org/stable/user_guide.html

---

**Integration Complete!** 🎉

You can now train and deploy ML models from your Next.js frontend.
