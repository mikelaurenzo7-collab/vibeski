#!/bin/bash
# =============================================
# Field of Dreams — Railway Deploy Script
# Prerequisites: railway CLI installed
# Install: npm install -g @railway/cli
# =============================================

set -e

echo "Field of Dreams — Railway Deployment"
echo "====================================="

# Check railway CLI
if ! command -v railway &> /dev/null; then
  echo "Installing Railway CLI..."
  npm install -g @railway/cli
fi

echo "Step 1: Login to Railway"
railway login

echo ""
echo "Step 2: Create/link project"
echo "Run: railway init (new project) OR railway link (existing)"
echo "Press Enter when ready..."
read

echo ""
echo "Step 3: Set environment variables"
echo "Copy vars from .env.production.example to Railway dashboard:"
echo "https://railway.app → Your Project → Variables"
echo "Press Enter when variables are set..."
read

echo ""
echo "Step 4: Deploy!"
railway up

echo ""
echo "✓ Deployment complete!"
echo "Your app is live at the Railway-provided URL."
echo "Set up your custom domain in Railway dashboard → Settings → Domains"
