
#!/bin/bash

# HVHC ML Engine Startup Script

set -e

echo "================================================"
echo "  HVHC ML Engine - Starting..."
echo "================================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "📝  Copying .env.example to .env"
    cp .env.example .env
    echo "✅  Please edit .env with your configuration"
    echo ""
fi

# Create necessary directories
echo "📁  Creating directories..."
mkdir -p models data/temp logs

# Check Python version
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo "🐍  Python version: $PYTHON_VERSION"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "🔧  Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔌  Activating virtual environment..."
source venv/bin/activate

# Install/update dependencies
echo "📦  Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Run database migration (if needed)
echo "🗄️  Database migration check..."
echo "   (Manual step: Run sql_migrations/004_ml_training_logs.sql on your database)"

# Start the application
echo ""
echo "================================================"
echo "  🚀 Starting HVHC ML Engine"
echo "================================================"
echo "  API Docs: http://localhost:8001/docs"
echo "  Health:   http://localhost:8001/health"
echo "================================================"
echo ""

python main.py
