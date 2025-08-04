#!/bin/bash

# SECURITY VALIDATION SCRIPT
# This script validates that no sensitive data is exposed in the codebase

echo "🔒 COMPREHENSIVE SECURITY AUDIT REPORT"
echo "======================================="
echo ""

# Check for any remaining .env files with actual data
echo "1. Environment Files Status:"
if ls .env* 2>/dev/null | grep -v "\.example\|\.test" > /dev/null; then
    echo "❌ ALERT: Actual .env files detected!"
    ls -la .env* 2>/dev/null | grep -v "\.example\|\.test"
else
    echo "✅ Only example/test .env files found"
fi
echo ""

# Check for hardcoded API keys in source code
echo "2. API Key Exposure Check:"
API_KEYS=$(grep -r "sk_live\|pk_live\|sk_test\|pk_test" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null || echo "")
if [[ -n "$API_KEYS" ]]; then
    echo "❌ ALERT: Hardcoded API keys found in source code!"
    echo "$API_KEYS"
else
    echo "✅ No hardcoded API keys detected in source code"
fi
echo ""

# Check for sensitive environment variable values
echo "3. Environment Variable Configuration:"
ENV_VARS=$(grep -r "VITE_.*=" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "import.meta.env" || echo "")
if [[ -n "$ENV_VARS" ]]; then
    echo "❌ ALERT: Hardcoded environment values found!"
    echo "$ENV_VARS"
else
    echo "✅ Environment variables properly configured via import.meta.env"
fi
echo ""

# Check for console.log with sensitive data
echo "4. Debug Statement Security:"
CONSOLE_LOGS=$(grep -r "console\." src/ --include="*.ts" --include="*.tsx" | grep -E "(token|key|secret|password)" || echo "")
if [[ -n "$CONSOLE_LOGS" ]]; then
    echo "⚠️  WARNING: Console statements with potential sensitive data:"
    echo "$CONSOLE_LOGS"
else
    echo "✅ No console statements exposing sensitive data"
fi
echo ""

# Check .gitignore coverage
echo "5. Git Ignore Protection:"
if grep -q "\.env$" .gitignore && grep -q "\.env\.local" .gitignore; then
    echo "✅ .env files properly ignored"
else
    echo "❌ ALERT: .env files not properly ignored!"
fi
echo ""

# Check for git-tracked sensitive files
echo "6. Git Repository Cleanliness:"
TRACKED_ENV=$(git ls-files | grep "\.env$" || echo "")
if [[ -n "$TRACKED_ENV" ]]; then
    echo "❌ CRITICAL: .env files are tracked by git!"
    echo "$TRACKED_ENV"
else
    echo "✅ No sensitive .env files tracked by git"
fi
echo ""

echo "======================================="
echo "🔒 SECURITY AUDIT COMPLETE"
echo "======================================="
