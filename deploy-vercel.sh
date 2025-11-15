#!/bin/bash

# ØLIV Website - Vercel Deployment Script
# Usage: ./deploy-vercel.sh

echo "🚀 ØLIV Website - Vercel Deployment"
echo "===================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null
then
    echo "❌ Vercel CLI er ikke installeret."
    echo ""
    echo "Install med:"
    echo "  npm install -g vercel"
    echo ""
    exit 1
fi

echo "✓ Vercel CLI fundet"
echo ""

# Check if index.html exists
if [ ! -f "index.html" ]; then
    echo "❌ index.html ikke fundet!"
    exit 1
fi

echo "✓ index.html fundet"
echo ""

echo "🎯 Deployer til Vercel..."
echo ""

# Deploy to production
vercel --prod --yes

echo ""
echo "✅ Deployment komplet!"
echo ""
echo "🌐 Dit site er nu live!"
echo ""
