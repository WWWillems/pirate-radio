#!/bin/bash

# Test script for the Generate PAP endpoint with tools

BASE_URL="http://localhost:3000"
ENDPOINT="/api/generate-pap"

echo "==================================="
echo "Generate PAP API - Tool Testing"
echo "==================================="
echo ""

# Test 1: Basic request with date/time (default)
echo "Test 1: Basic request with date/time context"
echo "-----------------------------------"
curl -X POST "${BASE_URL}${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a short morning podcast about coffee culture"
  }' \
  --no-buffer

echo -e "\n\n"

# Test 2: Request with custom timezone
echo "Test 2: Request with custom timezone"
echo "-----------------------------------"
curl -X POST "${BASE_URL}${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a podcast about starting your day in Tokyo",
    "timezone": "Asia/Tokyo"
  }' \
  --no-buffer

echo -e "\n\n"

# Test 3: Request with weather (placeholder)
echo "Test 3: Request with weather context"
echo "-----------------------------------"
curl -X POST "${BASE_URL}${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a weather-focused morning podcast",
    "includeWeather": true,
    "weatherLocation": "Halifax, Nova Scotia"
  }' \
  --no-buffer

echo -e "\n\n"

# Test 4: Request without any context tools
echo "Test 4: Request without context tools"
echo "-----------------------------------"
curl -X POST "${BASE_URL}${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a timeless podcast about philosophy",
    "includeDateTime": false
  }' \
  --no-buffer

echo -e "\n\n"

# Test 5: Request with all context tools
echo "Test 5: Request with all context tools"
echo "-----------------------------------"
curl -X POST "${BASE_URL}${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a comprehensive morning show",
    "includeDateTime": true,
    "includeWeather": true,
    "weatherLocation": "San Francisco, CA",
    "timezone": "America/Los_Angeles",
    "temperature": 0.8
  }' \
  --no-buffer

echo -e "\n\n"

# Test 6: Error test - weather without location
echo "Test 6: Error handling - weather without location"
echo "-----------------------------------"
curl -X POST "${BASE_URL}${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a weather podcast",
    "includeWeather": true
  }'

echo -e "\n\n"
echo "==================================="
echo "All tests completed!"
echo "==================================="

