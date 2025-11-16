#!/bin/bash

echo "🚀 Starting ØLIV Backend Server..."
echo ""

cd "$(dirname "$0")/server"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Start server
echo "✅ Starting server on port 3000..."
echo "📝 Press Ctrl+C to stop"
echo ""

node src/index.js

