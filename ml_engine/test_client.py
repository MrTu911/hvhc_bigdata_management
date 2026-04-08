
"""
Test client for HVHC ML Engine
Python example showing how to interact with the ML Engine API
"""

import requests
import json
from pathlib import Path

BASE_URL = "http://localhost:8001"


def test_health():
    """Test health check endpoint."""
    print("=" * 60)
    print("1️⃣  Testing Health Check")
    print("=" * 60)
    
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()


def test_list_algorithms():
    """Test list algorithms endpoint."""
    print("=" * 60)
    print("2️⃣  Testing List Algorithms")
    print("=" * 60)
    
    response = requests.get(f"{BASE_URL}/api/ml/algorithms?task_type=classification")
    result = response.json()
    print(f"Available algorithms: {', '.join(result['algorithms'])}")
    print()


def test_train_model():
    """Test model training endpoint."""
    print("=" * 60)
    print("3️⃣  Testing Model Training")
    print("=" * 60)
    
    # Create sample data
    sample_data = """sepal_length,sepal_width,petal_length,petal_width,species
5.1,3.5,1.4,0.2,setosa
4.9,3.0,1.4,0.2,setosa
4.7,3.2,1.3,0.2,setosa
7.0,3.2,4.7,1.4,versicolor
6.4,3.2,4.5,1.5,versicolor
6.9,3.1,4.9,1.5,versicolor
6.3,3.3,6.0,2.5,virginica
5.8,2.7,5.1,1.9,virginica
7.1,3.0,5.9,2.1,virginica
"""
    
    # Save to temp file
    temp_file = Path("temp_iris.csv")
    temp_file.write_text(sample_data)
    
    try:
        # Train model
        with open(temp_file, 'rb') as f:
            files = {'file': f}
            data = {
                'model_name': 'test_iris_classifier',
                'algorithm': 'random_forest',
                'task_type': 'classification',
                'target_column': 'species',
                'test_size': '0.2'
            }
            
            response = requests.post(f"{BASE_URL}/api/ml/train", files=files, data=data)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Training successful!")
            print(f"Model ID: {result['model_id']}")
            print(f"Algorithm: {result['algorithm']}")
            print(f"Accuracy: {result['key_metric']['value']:.4f}")
            return result['model_id']
        else:
            print(f"❌ Training failed: {response.text}")
            return None
            
    finally:
        # Cleanup
        if temp_file.exists():
            temp_file.unlink()
    
    print()


def test_list_models():
    """Test list models endpoint."""
    print("=" * 60)
    print("4️⃣  Testing List Models")
    print("=" * 60)
    
    response = requests.get(f"{BASE_URL}/api/ml/list")
    result = response.json()
    
    print(f"Total models: {result['count']}")
    for model in result['models'][:3]:  # Show first 3
        print(f"  - {model['model_name']} ({model['algorithm']})")
    print()


def test_evaluate_model(model_id):
    """Test model evaluation endpoint."""
    if not model_id:
        print("⚠️  Skipping evaluation (no model_id)")
        return
    
    print("=" * 60)
    print("5️⃣  Testing Model Evaluation")
    print("=" * 60)
    
    response = requests.post(
        f"{BASE_URL}/api/ml/evaluate",
        json={"model_id": model_id}
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"Model: {result['model_name']}")
        print(f"Algorithm: {result['algorithm']}")
        print(f"Metrics: {json.dumps(result['metrics'], indent=2)}")
    else:
        print(f"❌ Evaluation failed: {response.text}")
    
    print()


def test_predict(model_id):
    """Test prediction endpoint."""
    if not model_id:
        print("⚠️  Skipping prediction (no model_id)")
        return
    
    print("=" * 60)
    print("6️⃣  Testing Predictions")
    print("=" * 60)
    
    # Sample features (iris data)
    test_data = [
        [5.1, 3.5, 1.4, 0.2],  # Should predict setosa
        [6.7, 3.1, 4.7, 1.5],  # Should predict versicolor
        [6.3, 2.9, 5.6, 1.8]   # Should predict virginica
    ]
    
    response = requests.post(
        f"{BASE_URL}/api/ml/predict",
        json={
            "model_id": model_id,
            "data": test_data
        }
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"Predictions: {result['predictions']}")
        if result.get('probabilities'):
            print(f"Probabilities: {result['probabilities']}")
    else:
        print(f"❌ Prediction failed: {response.text}")
    
    print()


def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("🧪 HVHC ML Engine - Test Client")
    print("=" * 60 + "\n")
    
    try:
        # Basic tests
        test_health()
        test_list_algorithms()
        
        # Training and evaluation
        model_id = test_train_model()
        test_list_models()
        test_evaluate_model(model_id)
        test_predict(model_id)
        
        print("=" * 60)
        print("✅ All tests completed successfully!")
        print("=" * 60)
        
    except requests.exceptions.ConnectionError:
        print("❌ Error: Cannot connect to ML Engine")
        print("   Make sure the ML Engine is running on http://localhost:8001")
    except Exception as e:
        print(f"❌ Error: {str(e)}")


if __name__ == "__main__":
    main()
