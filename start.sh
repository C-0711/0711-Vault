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
sleep 8

# Initialize database if needed
echo "🗄️  Checking database..."
TABLES=$(docker exec vault-postgres psql -U vault -d vault -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
if [ "$TABLES" = "0" ]; then
  echo "   Initializing database schema..."
  cat backend/init/postgres/*.sql | docker exec -i vault-postgres psql -U vault -d vault >/dev/null 2>&1
  echo "   ✅ Database initialized"
else
  echo "   ✅ Database ready ($TABLES tables)"
fi

# Create MinIO bucket if needed
echo "📁 Checking storage..."
docker exec vault-minio mc alias set local http://localhost:9000 minioadmin minioadmin >/dev/null 2>&1
docker exec vault-minio mc mb local/vault --ignore-existing >/dev/null 2>&1
echo "   ✅ Storage ready"

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
