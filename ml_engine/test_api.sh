
#!/bin/bash

# API Testing Script for HVHC ML Engine

BASE_URL="http://localhost:8001"

echo "================================================"
echo "  HVHC ML Engine - API Tests"
echo "================================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "1️⃣  Testing Health Check..."
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
else
    echo -e "${RED}❌ Health check failed (HTTP $http_code)${NC}"
fi
echo ""

# Test 2: Get Info
echo "2️⃣  Testing Get Info..."
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/ml/info")
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✅ Get info passed${NC}"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
else
    echo -e "${RED}❌ Get info failed (HTTP $http_code)${NC}"
fi
echo ""

# Test 3: List Algorithms
echo "3️⃣  Testing List Algorithms..."
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/ml/algorithms?task_type=classification")
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✅ List algorithms passed${NC}"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
else
    echo -e "${RED}❌ List algorithms failed (HTTP $http_code)${NC}"
fi
echo ""

# Test 4: List Models
echo "4️⃣  Testing List Models..."
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/ml/list")
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✅ List models passed${NC}"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
else
    echo -e "${RED}❌ List models failed (HTTP $http_code)${NC}"
fi
echo ""

echo "================================================"
echo "  Tests Completed"
echo "================================================"
echo ""
echo -e "${YELLOW}📝 Note:${NC} For full testing including training, prepare a CSV dataset"
echo "   and use: curl -X POST $BASE_URL/api/ml/train -F 'file=@data.csv' ..."
echo ""
