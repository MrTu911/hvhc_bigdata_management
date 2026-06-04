#!/bin/bash
# Performance Testing Script
# Tests API response times before and after optimizations

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Performance Testing ===${NC}"
echo ""

# Test endpoints
ENDPOINTS=(
    "/api/dashboard/admin/overview"
    "/api/dashboard/student/overview"
    "/api/faculty/stats"
    "/api/student/stats"
)

for endpoint in "${ENDPOINTS[@]}"; do
    echo -e "${YELLOW}Testing: $endpoint${NC}"
    
    # Run 5 times and get average
    total=0
    for i in {1..5}; do
        time=$(curl -s -w "%{time_total}" -o /dev/null "http://localhost:3000$endpoint")
        total=$(echo "$total + $time" | bc)
        echo "  Run $i: ${time}s"
    done
    
    avg=$(echo "scale=3; $total / 5" | bc)
    echo -e "  ${GREEN}Average: ${avg}s${NC}"
    
    # Check if under target
    if (( $(echo "$avg < 0.5" | bc -l) )); then
        echo -e "  ${GREEN}✓ PASS (< 0.5s)${NC}"
    elif (( $(echo "$avg < 1.0" | bc -l) )); then
        echo -e "  ${YELLOW}⚠️  WARN (< 1.0s)${NC}"
    else
        echo -e "  ${RED}✗ FAIL (> 1.0s)${NC}"
    fi
    
    echo ""
done

echo -e "${GREEN}Performance test completed${NC}"
