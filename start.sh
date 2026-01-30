#!/bin/bash
# 0711-Vault Local Development Start Script

set -e
cd "$(dirname "$0")"

echo "🚀 Starting 0711-Vault..."

# Start backend services
echo "📦 Starting backend containers..."
cd backend
docker compose -f docker-compose.local.yml up -d
cd ..

# Wait for services to be healthy
echo "⏳ Waiting for services..."
sleep 5

# Start frontend
echo "🎨 Starting frontend..."
cd frontend
npm run dev &
cd ..

sleep 3

# Status check
echo ""
echo "✅ 0711-Vault is running!"
echo ""
echo "📍 URLs:"
echo "   Frontend:  http://localhost:3000"
echo "   API:       http://localhost:8000"
echo "   AI:        http://localhost:8001"
echo "   MinIO:     http://localhost:9001"
echo "   Neo4j:     http://localhost:7474"
echo ""
echo "🛑 To stop: ./stop.sh"
