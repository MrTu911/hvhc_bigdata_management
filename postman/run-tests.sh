
#!/bin/bash

# 🧪 Script tự động test APIs bằng Newman
# Cách dùng: ./run-tests.sh [environment]
# Example: ./run-tests.sh development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🧪 HVHC BigData Management - API Testing Suite              ║"
echo "║  Học viện Hậu cần - Big Data Research Platform               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if Newman is installed
if ! command -v newman &> /dev/null; then
    echo -e "${YELLOW}⚠️  Newman chưa được cài đặt. Đang cài đặt...${NC}"
    npm install -g newman newman-reporter-htmlextra
    echo -e "${GREEN}✅ Newman đã được cài đặt thành công!${NC}"
fi

# Environment selection
ENVIRONMENT=${1:-development}

if [ "$ENVIRONMENT" == "production" ]; then
    ENV_FILE="Production.postman_environment.json"
    echo -e "${YELLOW}⚠️  Testing on PRODUCTION environment${NC}"
else
    ENV_FILE="Development.postman_environment.json"
    echo -e "${GREEN}🔧 Testing on DEVELOPMENT environment${NC}"
fi

# Check if files exist
if [ ! -f "HVHC_BigData_APIs.postman_collection.json" ]; then
    echo -e "${RED}❌ Collection file not found!${NC}"
    exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Environment file not found: $ENV_FILE${NC}"
    exit 1
fi

# Create reports directory
mkdir -p reports

# Generate timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="reports/test-report-${ENVIRONMENT}-${TIMESTAMP}.html"

echo -e "\n${BLUE}📋 Test Configuration:${NC}"
echo -e "  Collection: HVHC_BigData_APIs.postman_collection.json"
echo -e "  Environment: $ENV_FILE"
echo -e "  Report: $REPORT_FILE"
echo ""

# Run Newman tests
echo -e "${BLUE}🚀 Starting API tests...${NC}\n"

newman run HVHC_BigData_APIs.postman_collection.json \
    -e "$ENV_FILE" \
    --reporters cli,htmlextra \
    --reporter-htmlextra-export "$REPORT_FILE" \
    --reporter-htmlextra-title "HVHC BigData API Test Report" \
    --reporter-htmlextra-darkTheme \
    --timeout-request 10000 \
    --bail \
    --color on

# Check exit code
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ All tests passed successfully!${NC}"
    echo -e "${GREEN}📊 Report: $REPORT_FILE${NC}"
    echo -e "\n${BLUE}📈 Next steps:${NC}"
    echo -e "  1. Review the HTML report: open $REPORT_FILE"
    echo -e "  2. Fix any failed tests if needed"
    echo -e "  3. Proceed to Frontend UI development"
else
    echo -e "\n${RED}❌ Some tests failed. Please review the report.${NC}"
    echo -e "${RED}📊 Report: $REPORT_FILE${NC}"
    exit 1
fi

echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ✨ Testing Complete - Ready for Production!                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}\n"
