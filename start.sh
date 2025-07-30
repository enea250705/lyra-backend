#!/bin/bash

# Lyra AI Backend Startup Script
echo "🚀 Starting Lyra AI Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 &> /dev/null; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL service."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env file with your configuration before proceeding."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Build the project
echo "🔨 Building TypeScript project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Start the server
    echo "🌟 Starting Lyra AI Backend server..."
    echo "📖 API Documentation will be available at: http://localhost:3000/api/docs"
    echo "🏥 Health check available at: http://localhost:3000/health"
    
    npm start
else
    echo "❌ Build failed! Please check for errors."
    exit 1
fi