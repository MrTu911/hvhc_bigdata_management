#!/bin/bash
#####################################################################
# Script kiểm tra tất cả AI endpoints
# Sử dụng: bash test-ai-all.sh
#####################################################################

set -e

echo "====================================================="
echo "Test tất cả AI Endpoints"
echo "====================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

BASE_URL="http://localhost:3000"

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    
    echo "${YELLOW}Testing: ${name}${NC}"
    echo "URL: ${method} ${endpoint}"
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "${BASE_URL}${endpoint}")
    else
        response=$(curl -s -w "\n%{http_code}" -X "${method}" "${BASE_URL}${endpoint}" \
            -H "Content-Type: application/json" \
            -d "${data}")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo "${GREEN}✓ Success (HTTP $http_code)${NC}"
        echo "Response: $(echo $body | jq -r '.success // .error // "No message"' 2>/dev/null || echo $body | head -c 100)"
    elif [ "$http_code" -eq 401 ]; then
        echo "${YELLOW}⚠ Unauthorized (HTTP 401) - Cần đăng nhập${NC}"
    else
        echo "${RED}✗ Failed (HTTP $http_code)${NC}"
        echo "Response: $body"
    fi
    
    echo ""
}

echo "${GREEN}[1/5]${NC} Kiểm tra trạng thái AI service..."
test_endpoint "Health Check" "GET" "/api/ai/sentiment" ""

echo "${GREEN}[2/5]${NC} Test Sentiment Analysis (single)..."
test_endpoint "Sentiment Single" "POST" "/api/ai/sentiment" \
    '{"text": "Khóa học rất hay và bổ ích, tôi rất hài lòng"}'

echo "${GREEN}[3/5]${NC} Test Sentiment Analysis (batch)..."
test_endpoint "Sentiment Batch" "POST" "/api/ai/sentiment" \
    '{"texts": ["Khóa học tốt", "Chưa được tốt lắm", "Trung bình"]}'

echo "${GREEN}[4/5]${NC} Test Generate Insights..."
test_endpoint "Generate Insights" "POST" "/api/ai/insights" \
    '{"data": {"sessionName": "Test Training", "participants": 50, "averageScore": 8.5}, "type": "training"}'

echo "${GREEN}[5/5]${NC} Test Summary..."
test_endpoint "Summary" "POST" "/api/ai/summary" \
    '{"text": "Nghiên cứu này trình bày một phương pháp mới để cải thiện hiệu quả đào tạo quân sự thông qua việc sử dụng trí tuệ nhân tạo và phân tích dữ liệu lớn.", "maxLength": 100}'

echo ""
echo "====================================================="
echo "${GREEN}HOÀN TẤT TEST${NC}"
echo "====================================================="
echo ""
echo "${YELLOW}Lưu ý:${NC}"
echo "  - Nếu thấy HTTP 401: Bạn cần đăng nhập vào hệ thống trước"
echo "  - Test trong browser: http://localhost:3000/dashboard/instructor/feedback-analysis"
echo "  - Xem log: docker-compose logs -f web"
echo ""
