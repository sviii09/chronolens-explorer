#!/usr/bin/env bash
# Test the backend health endpoint
echo "Testing backend health endpoint..."
curl -X GET http://localhost:5000/health

echo -e "\n---------\n"

# Test the roles endpoint
echo "Testing roles endpoint..."
curl -X GET http://localhost:5000/roles

echo -e "\n---------\n"

# Test the query endpoint
echo "Testing query endpoint..."
curl -X POST http://localhost:5000/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What education scholarships are available?",
    "user_role": "public",
    "time_filter": null
  }'
