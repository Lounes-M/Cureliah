#!/bin/bash

# Cureliah Button Testing Script
# This script checks all button functionality in the application

echo "🔍 CURELIAH - COMPREHENSIVE BUTTON FUNCTIONALITY CHECK"
echo "===================================================="
echo ""

# Function to check if a route exists in routes.tsx
check_route() {
    local route=$1
    if grep -q "path=\"$route\"" src/routes.tsx; then
        echo "✅ Route $route: FOUND"
        return 0
    else
        echo "❌ Route $route: MISSING"
        return 1
    fi
}

echo "📍 CHECKING NAVIGATION ROUTES REFERENCED IN HEADER:"
echo "---------------------------------------------------"

# Check all routes referenced in Header navigation
check_route "/admin"
check_route "/doctor/dashboard"
check_route "/bookings" 
check_route "/doctor/manage-vacations"
check_route "/establishment/dashboard"
check_route "/establishment/search"
check_route "/profile/complete"
check_route "/settings"  # This one might be missing

echo ""
echo "📍 CHECKING MAIN CTA ROUTES:"
echo "-----------------------------"

check_route "/auth"
check_route "/doctor/dashboard"
check_route "/establishment/dashboard"

echo ""
echo "📍 CHECKING PAYMENT ROUTES:"
echo "---------------------------"

check_route "/payment-success"
check_route "/payment-failure"
check_route "/subscribe"

echo ""
echo "📍 CHECKING ADMIN ROUTES:"
echo "------------------------"

check_route "/admin/*"

echo ""
echo "📍 SEARCHING FOR BUTTONS WITH NAVIGATION ISSUES:"
echo "------------------------------------------------"

# Search for common navigation patterns that might have issues
echo "🔍 Checking for onClick navigate patterns..."

# Find all navigate calls in components
grep -r "navigate(" src/components/ | grep -v node_modules | head -20

echo ""
echo "🔍 Checking for Link to patterns..."

# Find all Link to patterns
grep -r "to=\"" src/components/ | grep -v node_modules | head -15

echo ""
echo "📊 SUMMARY:"
echo "----------"

# Count total routes
total_routes=$(grep -c "path=\"" src/routes.tsx)
echo "Total routes defined: $total_routes"

# Count navigation links in Header
nav_links=$(grep -c "to=\"" src/components/Header.tsx)
echo "Navigation links in Header: $nav_links"

echo ""
echo "✅ Check complete! Review any ❌ MISSING routes above."
