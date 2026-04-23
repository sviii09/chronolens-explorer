#!/bin/bash
# API Testing Script
# Tests all endpoints of the Policy Retriever API

echo "🧪 Government Schemes Policy Retriever - API Test Suite"
echo "======================================================"
echo ""

# Configuration
API_URL="${1:-http://localhost:5000}"
FAILED=0
PASSED=0

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local description=$4

  echo -n "📌 Testing: $description... "
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -X GET "$API_URL$endpoint" \
      -H "Content-Type: application/json")
  else
    response=$(curl -s -X POST "$API_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data")
  fi

  # Check if response contains error
  if echo "$response" | grep -q "error" || [ -z "$response" ]; then
    echo -e "${RED}FAILED${NC}"
    echo "  Response: $response"
    ((FAILED++))
    return 1
  else
    echo -e "${GREEN}PASSED${NC}"
    ((PASSED++))
    return 0
  fi
}

# Check API health first
echo -e "${BLUE}Checking API Health${NC}"
echo -n "Connecting to $API_URL... "
if curl -s -f "$API_URL/api/health" > /dev/null; then
  echo -e "${GREEN}Connected!${NC}"
else
  echo -e "${RED}Failed to connect!${NC}"
  echo "Make sure the API server is running:"
  echo "  python policy_retriever_api.py"
  exit 1
fi
echo ""

# Test 1: Health Check
echo -e "${BLUE}1. Health Check${NC}"
test_endpoint "GET" "/api/health" "" "Health check endpoint"
echo ""

# Test 2: Get All Schemes
echo -e "${BLUE}2. Get All Schemes${NC}"
test_endpoint "GET" "/api/schemes?page=1&pageSize=10" "" "Get paginated schemes"
echo ""

# Test 3: Search Schemes
echo -e "${BLUE}3. Search Endpoints${NC}"
test_endpoint "POST" "/api/schemes/search" '{"query":"education","limit":10}' "Search for 'education'"
test_endpoint "POST" "/api/schemes/search" '{"query":"loan","limit":10}' "Search for 'loan'"
test_endpoint "POST" "/api/schemes/search" '{"query":"women","limit":10}' "Search for 'women'"
echo ""

# Test 4: Filter Schemes
echo -e "${BLUE}4. Filter Endpoints${NC}"
test_endpoint "POST" "/api/schemes/filter" '{"category":"Education & Learning","limit":10}' "Filter by category"
test_endpoint "POST" "/api/schemes/filter" '{"level":"Central","limit":10}' "Filter by level"
test_endpoint "POST" "/api/schemes/filter" '{"tags":"scholarship","limit":10}' "Filter by tags"
echo ""

# Test 5: Metadata
echo -e "${BLUE}5. Metadata Endpoint${NC}"
test_endpoint "GET" "/api/metadata" "" "Get metadata (categories & levels)"
echo ""

# Test 6: Statistics
echo -e "${BLUE}6. Statistics Endpoint${NC}"
test_endpoint "GET" "/api/schemes/statistics" "" "Get statistics by category and level"
echo ""

# Test 7: Advanced Search
echo -e "${BLUE}7. Advanced Search${NC}"
test_endpoint "POST" "/api/schemes/advanced-search" \
  '{"query":"education","category":"Education & Learning","level":"State"}' \
  "Advanced search with filters"
echo ""

# Test 8: Get by Category
echo -e "${BLUE}8. Get by Category${NC}"
test_endpoint "GET" "/api/schemes/category/Business%20%26%20Entrepreneurship?page=1&pageSize=5" "" \
  "Get schemes by specific category"
echo ""

# Test 9: Get by Level
echo -e "${BLUE}9. Get by Level${NC}"
test_endpoint "GET" "/api/schemes/level/Central?page=1&pageSize=5" "" \
  "Get schemes by government level"
echo ""

# Results
echo ""
echo "======================================================"
echo -e "${BLUE}Test Results${NC}"
echo -e "✅ Passed: ${GREEN}$PASSED${NC}"
echo -e "❌ Failed: ${RED}$FAILED${NC}"

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}All tests passed! 🎉${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed.${NC}"
  exit 1
fi
