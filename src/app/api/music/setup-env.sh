#!/bin/bash

# Setup script for Google Vertex AI Lyria music generation
# This script helps you configure the required environment variables

echo "=== Google Vertex AI Lyria Setup ==="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

echo "✅ gcloud CLI is installed"
echo ""

# Get current project
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)

if [ -z "$CURRENT_PROJECT" ]; then
    echo "⚠️  No project is currently set"
    echo "Run: gcloud config set project YOUR_PROJECT_ID"
    echo ""
    read -p "Enter your Google Cloud Project ID: " PROJECT_ID
    gcloud config set project "$PROJECT_ID"
else
    echo "Current project: $CURRENT_PROJECT"
    read -p "Use this project? (y/n): " USE_CURRENT
    if [ "$USE_CURRENT" != "y" ]; then
        read -p "Enter your Google Cloud Project ID: " PROJECT_ID
        gcloud config set project "$PROJECT_ID"
    else
        PROJECT_ID="$CURRENT_PROJECT"
    fi
fi

echo ""
echo "=== Authentication Setup ==="
echo ""
echo "Choose your authentication method:"
echo "1. Use service account key file (recommended for local development)"
echo "2. Use Application Default Credentials (gcloud auth)"
echo ""
read -p "Enter choice (1 or 2): " AUTH_CHOICE

# Create or update .env.local
ENV_FILE=".env.local"

# Remove old entries if they exist
if [ -f "$ENV_FILE" ]; then
    sed -i.bak '/GOOGLE_CLOUD_PROJECT_ID/d' "$ENV_FILE"
    sed -i.bak '/GOOGLE_CLOUD_ACCESS_TOKEN/d' "$ENV_FILE"
    sed -i.bak '/GOOGLE_CLOUD_LOCATION/d' "$ENV_FILE"
    sed -i.bak '/GOOGLE_APPLICATION_CREDENTIALS/d' "$ENV_FILE"
    rm -f "$ENV_FILE.bak"
fi

if [ "$AUTH_CHOICE" = "1" ]; then
    echo ""
    echo "Looking for service account key files..."
    # Look for JSON key files in the project directory
    KEY_FILES=$(find . -maxdepth 1 -name "*.json" -type f 2>/dev/null)
    
    if [ -n "$KEY_FILES" ]; then
        echo "Found key files:"
        echo "$KEY_FILES"
        echo ""
        read -p "Enter the path to your service account key file (or press Enter to use the first one found): " KEY_FILE
        if [ -z "$KEY_FILE" ]; then
            KEY_FILE=$(echo "$KEY_FILES" | head -n 1)
        fi
    else
        read -p "Enter the path to your service account key file: " KEY_FILE
    fi
    
    if [ ! -f "$KEY_FILE" ]; then
        echo "❌ File not found: $KEY_FILE"
        exit 1
    fi
    
    # Get absolute path
    KEY_FILE_ABS=$(cd "$(dirname "$KEY_FILE")" && pwd)/$(basename "$KEY_FILE")
    
    echo ""
    echo "Updating $ENV_FILE..."
    
    cat >> "$ENV_FILE" << EOF

# Google Vertex AI Configuration
GOOGLE_CLOUD_PROJECT_ID=$PROJECT_ID
GOOGLE_APPLICATION_CREDENTIALS=$KEY_FILE_ABS
GOOGLE_CLOUD_LOCATION=us-central1
EOF
    
    echo "✅ Environment variables configured in $ENV_FILE"
    echo "✅ Using service account key: $KEY_FILE_ABS"
    
else
    echo ""
    echo "Setting up Application Default Credentials..."
    gcloud auth application-default login
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to set up Application Default Credentials"
        exit 1
    fi
    
    echo ""
    echo "Updating $ENV_FILE..."
    
    cat >> "$ENV_FILE" << EOF

# Google Vertex AI Configuration
GOOGLE_CLOUD_PROJECT_ID=$PROJECT_ID
GOOGLE_CLOUD_LOCATION=us-central1
# Using Application Default Credentials (no GOOGLE_APPLICATION_CREDENTIALS needed)
EOF
    
    echo "✅ Environment variables configured in $ENV_FILE"
    echo "✅ Using Application Default Credentials from gcloud"
fi

echo ""
echo "Next steps:"
echo "1. Start your dev server: yarn dev"
echo "2. Test the endpoint: ./src/app/api/music/test-music-endpoint.sh"
echo ""

