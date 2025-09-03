#!/bin/bash

echo "🚀 Deploying Voispend MVP to Netlify..."

# Build the web version
echo "📦 Building web version..."
npx expo export --platform web

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "🌐 Web app is ready for deployment"
    echo ""
    echo "📋 Next steps:"
    echo "1. Go to https://app.netlify.com"
    echo "2. Drag and drop the 'dist' folder to deploy"
    echo "3. Or connect your GitHub repository for automatic deployments"
    echo ""
    echo "📱 For mobile app testing:"
    echo "1. Run: npx expo start"
    echo "2. Scan QR code with Expo Go app"
    echo "3. Or run: npx expo start --tunnel for remote testing"
else
    echo "❌ Build failed!"
    exit 1
fi
