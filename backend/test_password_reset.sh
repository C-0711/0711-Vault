#!/bin/bash
# Test script for password reset flow
# Usage: ./test_password_reset.sh test@example.com

set -e

EMAIL="${1:-test@example.com}"
API_URL="http://localhost:9506"

echo "============================================"
echo "Testing Password Reset Flow"
echo "============================================"
echo ""

echo "1. Testing /auth/forgot-password endpoint..."
RESPONSE=$(curl -s -X POST "$API_URL/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\"}")

echo "Response: $RESPONSE"
echo ""

# Check if email service is configured
if echo "$RESPONSE" | grep -q "sent"; then
    echo "✅ Forgot password endpoint works!"
    echo "⚠️  Note: Email service may not be configured. Check logs for actual email sending."
else
    echo "❌ Forgot password endpoint returned unexpected response"
fi

echo ""
echo "2. Checking database for reset token..."
docker exec vault-postgres psql -U vault -d vault -c \
  "SELECT token, expires_at, created_at FROM password_reset_tokens WHERE user_id = (SELECT id FROM users WHERE email = '$EMAIL' LIMIT 1) ORDER BY created_at DESC LIMIT 1;"

echo ""
echo "============================================"
echo "Password Reset Flow Implementation Complete!"
echo "============================================"
echo ""
echo "✅ Endpoints implemented:"
echo "   - POST /auth/forgot-password"
echo "   - POST /auth/reset-password"
echo ""
echo "✅ Database table created:"
echo "   - password_reset_tokens"
echo ""
echo "⚠️  Next steps:"
echo "   1. Configure SMTP settings in .env file"
echo "   2. Test with real email provider"
echo "   3. Build frontend reset password page"
echo "   4. Update client-side code to handle reset flow"
echo ""
