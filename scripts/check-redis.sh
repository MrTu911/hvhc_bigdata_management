#!/bin/bash
# Redis Health Check Script

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Redis Health Check ===${NC}"
echo ""

# Check if Redis is running
if redis-cli ping &> /dev/null; then
    echo -e "${GREEN}✓ Redis is running${NC}"
else
    echo -e "${RED}✗ Redis is not running${NC}"
    exit 1
fi

# Get Redis info
echo ""
echo -e "${YELLOW}Redis Information:${NC}"
redis-cli INFO | grep -E "(redis_version|used_memory_human|connected_clients|total_commands_processed)"

# Test SET/GET
echo ""
echo -e "${YELLOW}Testing SET/GET:${NC}"
redis-cli SET test "Hello HVHC" > /dev/null
result=$(redis-cli GET test)

if [ "$result" = "Hello HVHC" ]; then
    echo -e "${GREEN}✓ SET/GET working${NC}"
else
    echo -e "${RED}✗ SET/GET failed${NC}"
fi

# Cleanup
redis-cli DEL test > /dev/null

echo ""
echo -e "${GREEN}Redis health check completed${NC}"
