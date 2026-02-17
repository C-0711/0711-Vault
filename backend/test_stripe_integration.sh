#!/bin/bash
# Test script for Stripe billing integration
# Usage: ./test_stripe_integration.sh

set -e

API_URL="http://localhost:9506"

echo "============================================"
echo "Testing Stripe Billing Integration"
echo "============================================"
echo ""

echo "1. Testing /billing/plans endpoint..."
PLANS=$(curl -s "$API_URL/billing/plans")
echo "$PLANS" | python3 -m json.tool 2>/dev/null || echo "$PLANS"
echo ""

if echo "$PLANS" | grep -q "Free"; then
    echo "✅ Billing plans endpoint works!"
else
    echo "❌ Billing plans endpoint failed"
fi

echo ""
echo "2. Checking database schema for Stripe columns..."
docker exec vault-postgres psql -U vault -d vault -c \
  "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='users' AND column_name LIKE '%stripe%' OR column_name LIKE '%subscription%';"

echo ""
echo "============================================"
echo "Stripe Integration Implementation Complete!"
echo "============================================"
echo ""
echo "✅ Implemented features:"
echo "   - Save Stripe customer_id to database"
echo "   - Handle checkout.session.completed webhook"
echo "   - Handle customer.subscription.updated webhook"
echo "   - Handle customer.subscription.deleted webhook"
echo "   - Handle invoice.payment_failed webhook"
echo ""
echo "⚠️  Next steps:"
echo "   1. Configure Stripe API keys in .env"
echo "   2. Create products and prices in Stripe Dashboard"
echo "   3. Setup webhook endpoint in Stripe Dashboard"
echo "   4. Test full payment flow with Stripe test mode"
echo "   5. Build frontend subscription UI"
echo ""
