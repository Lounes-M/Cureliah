#!/bin/bash

# 🧪 Stripe Integration Test Script
# Run this after configuring all Price IDs and environment variables

echo "🧪 TESTING STRIPE INTEGRATION"
echo "=============================="
echo ""

# Test 1: Check configuration
echo "1️⃣ Configuration Check:"
echo "------------------------"

# Check if Price IDs are updated
PLACEHOLDER_COUNT=$(grep -r "TO_UPDATE" src/config/index.ts | wc -l)
if [ "$PLACEHOLDER_COUNT" -gt 0 ]; then
    echo "❌ Price IDs still contain placeholders"
    echo "   Run: ./update-stripe-prices.sh"
else
    echo "✅ Price IDs configured"
fi

# Check environment setup
if [ -f ".env.production.example" ]; then
    echo "✅ Environment template exists"
else
    echo "❌ Missing environment template"
fi

echo ""

# Test 2: Check Supabase functions
echo "2️⃣ Supabase Functions Check:"
echo "----------------------------"

FUNCTIONS=("create-subscription" "create-payment" "create-customer-portal" "stripe-webhook")
for func in "${FUNCTIONS[@]}"; do
    if [ -d "supabase/functions/$func" ]; then
        echo "✅ $func function exists"
    else
        echo "❌ Missing $func function"
    fi
done

echo ""

# Test 3: UI Components
echo "3️⃣ UI Components Check:"
echo "----------------------"

COMPONENTS=("PaymentButton" "PricingSection" "SubscriptionManagement")
for comp in "${COMPONENTS[@]}"; do
    if find src/ -name "*$comp*" -type f | grep -q .; then
        echo "✅ $comp component exists"
    else
        echo "❌ Missing $comp component"
    fi
done

echo ""

# Test 4: Payment flow pages
echo "4️⃣ Payment Flow Pages:"
echo "---------------------"

PAGES=("Subscribe" "PaymentSuccess" "PaymentFailure" "PaymentCheckout")
for page in "${PAGES[@]}"; do
    if find src/pages/ -name "*$page*" -type f | grep -q .; then
        echo "✅ $page page exists"
    else
        echo "❌ Missing $page page"
    fi
done

echo ""
echo "🎯 NEXT STEPS:"
echo "=============="
echo "1. Create products in Stripe Dashboard"
echo "2. Run: ./update-stripe-prices.sh"
echo "3. Configure Supabase environment variables"
echo "4. Test subscription flow in production"
echo ""
echo "📚 See SUPABASE_CONFIG_GUIDE.md for detailed setup"
