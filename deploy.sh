#!/bin/bash

# Grounded/RaceQuest Deployment Script
set -e

echo "🚀 Starting Grounded/RaceQuest deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build all packages
echo "🔨 Building packages..."
npm run build

# Check deployment target
case "$1" in
    "netlify")
        echo "🌐 Deploying to Netlify..."
        if command -v netlify &> /dev/null; then
            cd apps/racequest
            netlify deploy --prod --dir=dist
            cd ../partners
            netlify deploy --prod --dir=dist
        else
            echo "❌ Netlify CLI not installed. Run: npm install -g netlify-cli"
            exit 1
        fi
        ;;
    "vercel")
        echo "▲ Deploying to Vercel..."
        if command -v vercel &> /dev/null; then
            cd apps/racequest
            vercel --prod
            cd ../partners
            vercel --prod
        else
            echo "❌ Vercel CLI not installed. Run: npm install -g vercel"
            exit 1
        fi
        ;;
    "docker")
        echo "🐳 Building Docker image..."
        docker build -t grounded-racequest .
        echo "✅ Docker image built successfully!"
        echo "Run with: docker run -p 80:80 grounded-racequest"
        ;;
    "android")
        echo "📱 Building Android app..."
        cd apps/racequest
        npm run build
        npx cap sync android
        npx cap open android
        ;;
    *)
        echo "Usage: ./deploy.sh [netlify|vercel|docker|android]"
        echo ""
        echo "Available deployment targets:"
        echo "  netlify  - Deploy to Netlify"
        echo "  vercel   - Deploy to Vercel"
        echo "  docker   - Build Docker image"
        echo "  android  - Build Android app"
        exit 1
        ;;
esac

echo "✅ Deployment completed successfully!"