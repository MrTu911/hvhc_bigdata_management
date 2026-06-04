
#!/bin/bash

###############################################################################
# HVHC Big Data - Health Check Script
# Check system health and services status
###############################################################################

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🏥 HVHC Big Data - System Health Check"
echo "======================================"
echo ""

ISSUES=0

# Check PostgreSQL
echo -n "📊 PostgreSQL... "
if systemctl is-active --quiet postgresql; then
    if sudo -u postgres psql -d hvhc_bigdata -c "SELECT 1" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Running${NC}"
    else
        echo -e "${RED}✗ Connection failed${NC}"
        ISSUES=$((ISSUES+1))
    fi
else
    echo -e "${RED}✗ Not running${NC}"
    ISSUES=$((ISSUES+1))
fi

# Check Redis
echo -n "🔴 Redis... "
if systemctl is-active --quiet redis; then
    if redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Running${NC}"
    else
        echo -e "${RED}✗ Connection failed${NC}"
        ISSUES=$((ISSUES+1))
    fi
else
    echo -e "${RED}✗ Not running${NC}"
    ISSUES=$((ISSUES+1))
fi

# Check Nginx
echo -n "🌐 Nginx... "
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
    ISSUES=$((ISSUES+1))
fi

# Check Next.js application
echo -n "⚛️  Next.js App... "
if pm2 list | grep -q "hvhc-bigdata.*online"; then
    if curl -s -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Running & Responsive${NC}"
    else
        echo -e "${YELLOW}⚠ Running but not responsive${NC}"
        ISSUES=$((ISSUES+1))
    fi
else
    echo -e "${RED}✗ Not running${NC}"
    ISSUES=$((ISSUES+1))
fi

# Check disk space
echo ""
echo "💾 Disk Usage:"
df -h / | tail -n 1 | awk '{
    usage = int($5);
    if (usage > 90) {
        print "  Root: \033[0;31m" $5 " used\033[0m (Critical!)";
    } else if (usage > 80) {
        print "  Root: \033[1;33m" $5 " used\033[0m (Warning)";
    } else {
        print "  Root: \033[0;32m" $5 " used\033[0m";
    }
}'

# Check memory
echo ""
echo "🧠 Memory Usage:"
free -h | awk 'NR==2 {
    total = $2;
    used = $3;
    available = $7;
    usage = (used / total) * 100;
    if (usage > 90) {
        print "  Used: \033[0;31m" used " / " total "\033[0m (Critical!)";
    } else if (usage > 80) {
        print "  Used: \033[1;33m" used " / " total "\033[0m (Warning)";
    } else {
        print "  Used: \033[0;32m" used " / " total "\033[0m";
    }
    print "  Available: " available;
}'

# Check CPU load
echo ""
echo "⚡ CPU Load:"
uptime | awk -F'load average:' '{print "  " $2}'

# Check network connectivity
echo ""
echo -n "🌍 Internet Connectivity... "
if ping -c 1 8.8.8.8 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Connected${NC}"
else
    echo -e "${RED}✗ No connection${NC}"
    ISSUES=$((ISSUES+1))
fi

# Check SSL certificate (if production)
if [ -f /etc/letsencrypt/live/bigdata.hvhc.edu.vn/fullchain.pem ]; then
    echo ""
    echo "🔒 SSL Certificate:"
    EXPIRY=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/bigdata.hvhc.edu.vn/fullchain.pem | cut -d= -f2)
    EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
    NOW_EPOCH=$(date +%s)
    DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))
    
    if [ $DAYS_LEFT -lt 7 ]; then
        echo -e "  Expires: ${RED}$DAYS_LEFT days${NC} (Renew now!)"
        ISSUES=$((ISSUES+1))
    elif [ $DAYS_LEFT -lt 30 ]; then
        echo -e "  Expires: ${YELLOW}$DAYS_LEFT days${NC} (Consider renewal)"
    else
        echo -e "  Expires: ${GREEN}$DAYS_LEFT days${NC}"
    fi
fi

# Check database size
echo ""
echo "📈 Database Statistics:"
sudo -u postgres psql -d hvhc_bigdata -t -c "
SELECT 
    'Users: ' || COUNT(*) 
FROM users;
" 2>/dev/null || echo "  Could not retrieve statistics"

DB_SIZE=$(sudo -u postgres psql -d hvhc_bigdata -t -c "SELECT pg_size_pretty(pg_database_size('hvhc_bigdata'));" 2>/dev/null || echo "Unknown")
echo "  Database Size: $DB_SIZE"

# Check last backup
echo ""
echo "💾 Last Backup:"
if [ -d /backup/hvhc_bigdata ]; then
    LAST_BACKUP=$(ls -1t /backup/hvhc_bigdata | head -n 1)
    if [ -n "$LAST_BACKUP" ]; then
        BACKUP_AGE=$(find /backup/hvhc_bigdata/$LAST_BACKUP -maxdepth 0 -mtime +1 | wc -l)
        if [ $BACKUP_AGE -eq 0 ]; then
            echo -e "  ${GREEN}$LAST_BACKUP (Recent)${NC}"
        else
            echo -e "  ${YELLOW}$LAST_BACKUP (Older than 24h)${NC}"
        fi
    else
        echo -e "  ${RED}No backups found${NC}"
        ISSUES=$((ISSUES+1))
    fi
else
    echo -e "  ${RED}Backup directory not found${NC}"
    ISSUES=$((ISSUES+1))
fi

# Summary
echo ""
echo "======================================"
if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ All systems healthy!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Found $ISSUES issue(s)${NC}"
    echo "Please review and fix the issues above."
    exit 1
fi
