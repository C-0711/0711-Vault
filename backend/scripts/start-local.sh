#!/bin/bash
set -e

echo "🚀 Starting 0711 Vault (Local Development)"
echo "==========================================="

cd "$(dirname "$0")/.."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your settings"
fi

# Start core services
echo ""
echo "📦 Starting databases and storage..."
docker compose up -d postgres redis minio

# Wait for postgres
echo "⏳ Waiting for PostgreSQL..."
until docker compose exec -T postgres pg_isready -U vault > /dev/null 2>&1; do
    sleep 1
done
echo "✅ PostgreSQL ready"

# Create MinIO bucket
echo "📁 Setting up MinIO..."
docker compose up -d minio-init
sleep 3

# Start Ollama
echo ""
echo "🤖 Starting Ollama..."
docker compose up -d ollama

# Pull models (this might take a while first time)
echo "⏳ Downloading AI models (this may take a few minutes on first run)..."
docker compose up ollama-init

# Start application services
echo ""
echo "🔧 Starting API services..."
docker compose up -d vault-api ai-service

# Wait for services
echo "⏳ Waiting for services to be ready..."
sleep 5

# Health check
echo ""
echo "🏥 Health check..."
curl -s http://localhost:8000/health | python3 -m json.tool 2>/dev/null || echo "API starting..."

echo ""
echo "==========================================="
echo "✅ 0711 Vault is running!"
echo ""
echo "Services:"
echo "  • API:      http://localhost:8000"
echo "  • AI:       http://localhost:8001"
echo "  • MinIO:    http://localhost:9001 (admin: minioadmin/minioadmin)"
echo "  • Postgres: localhost:5432"
echo "  • Redis:    localhost:6379"
echo ""
echo "To start the frontend:"
echo "  cd ../frontend && npm install && npm run dev"
echo ""
echo "To view logs:"
echo "  docker compose logs -f"
echo ""
echo "To stop:"
echo "  docker compose down"
