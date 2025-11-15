#!/bin/bash

# ØLIV Website - Netlify Deployment Script
# Usage: ./deploy-netlify.sh

echo "🚀 ØLIV Website - Netlify Deployment"
echo "====================================="
echo ""

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null
then
    echo "❌ Netlify CLI er ikke installeret."
    echo ""
    echo "Install med:"
    echo "  npm install -g netlify-cli"
    echo ""
    echo "Eller brug Netlify Drop: https://app.netlify.com/drop"
    exit 1
fi

echo "✓ Netlify CLI fundet"
echo ""

# Check if index.html exists
if [ ! -f "index.html" ]; then
    echo "❌ index.html ikke fundet!"
    exit 1
fi

echo "✓ index.html fundet"
echo ""

# Login check
echo "Checker Netlify login status..."
if ! netlify status &> /dev/null; then
    echo "📝 Logger ind på Netlify..."
    netlify login
fi

echo ""
echo "🎯 Deployer til Netlify..."
echo ""

# Deploy
netlify deploy --prod --dir=. --message="ØLIV Website Update"

echo ""
echo "✅ Deployment komplet!"
echo ""
echo "📱 Åbn dit site med: netlify open:site"
echo "⚙️  Administrer med: netlify open:admin"
echo ""
