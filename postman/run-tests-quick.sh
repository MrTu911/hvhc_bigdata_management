
#!/bin/bash

# 🚀 Quick test script - chỉ test critical endpoints
# Cách dùng: ./run-tests-quick.sh

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Quick API Test - Critical Endpoints Only${NC}\n"

# Check if Newman is installed
if ! command -v newman &> /dev/null; then
    echo "Installing Newman..."
    npm install -g newman
fi

# Run tests on critical endpoints only
newman run HVHC_BigData_APIs.postman_collection.json \
    -e Development.postman_environment.json \
    --folder "1. Authentication" \
    --folder "3. Analytics & Dashboard" \
    --reporters cli \
    --timeout-request 5000 \
    --color on

echo -e "\n${GREEN}✅ Quick test complete!${NC}"
