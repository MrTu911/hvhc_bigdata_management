
#!/bin/bash

# HVHC ML Engine Docker Startup Script

set -e

echo "================================================"
echo "  HVHC ML Engine - Docker Deployment"
echo "================================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "📝  Copying .env.example to .env"
    cp .env.example .env
    echo "✅  Please edit .env with your configuration"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌  Error: Docker is not running"
    exit 1
fi

echo "🐳  Docker is running"

# Build and start services
echo ""
echo "🔨  Building ML Engine container..."
docker-compose build

echo ""
echo "🚀  Starting services..."
docker-compose up -d

# Wait for services to be healthy
echo ""
echo "⏳  Waiting for services to be ready..."
sleep 5

# Check service status
echo ""
echo "📊  Service Status:"
docker-compose ps

echo ""
echo "================================================"
echo "  ✅ ML Engine Started Successfully!"
echo "================================================"
echo "  API Docs:      http://localhost:8001/docs"
echo "  Health:        http://localhost:8001/health"
echo "  MinIO Console: http://localhost:9001"
echo "================================================"
echo ""
echo "📝  Useful commands:"
echo "  View logs:     docker-compose logs -f ml_engine"
echo "  Stop services: docker-compose down"
echo "  Restart:       docker-compose restart"
echo "================================================"
