#!/bin/bash

# Test script for the music generation endpoint
# Usage: ./test-music-endpoint.sh

echo "Testing music generation endpoint..."
echo ""

curl -X POST http://localhost:3000/api/music \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "upbeat jazz music with saxophone and piano, perfect for a morning radio show",
    "duration": 15,
    "temperature": 1.0,
    "segment_id": "test-music-segment"
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -v

echo ""
echo "Test complete!"

