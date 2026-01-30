#!/bin/bash
# 0711-Vault Stop Script

cd "$(dirname "$0")"

echo "🛑 Stopping 0711-Vault..."

# Stop frontend
pkill -f "vite" 2>/dev/null || true

# Stop backend
cd backend
docker compose -f docker-compose.local.yml down
cd ..

echo "✅ 0711-Vault stopped."
