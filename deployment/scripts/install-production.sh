
#!/bin/bash

###############################################################################
# HVHC Big Data - Production Installation Script
# Ubuntu Server 20.04+ LTS
###############################################################################

set -e

echo "🚀 HVHC Big Data - Production Installation"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ This script must be run as root${NC}" 
   exit 1
fi

echo -e "${GREEN}✓ Running as root${NC}"

# Update system
echo ""
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install essential tools
echo ""
echo "🔧 Installing essential tools..."
apt install -y curl wget git build-essential software-properties-common \
    ufw fail2ban htop vim nano unzip

# Install Node.js 18.x
echo ""
echo "📦 Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PostgreSQL
echo ""
echo "🐘 Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Install Redis
echo ""
echo "🔴 Installing Redis..."
apt install -y redis-server

# Configure Redis
sed -i 's/supervised no/supervised systemd/' /etc/redis/redis.conf
systemctl restart redis
systemctl enable redis

# Install Nginx
echo ""
echo "🌐 Installing Nginx..."
apt install -y nginx

# Start and enable Nginx
systemctl start nginx
systemctl enable nginx

# Install PM2 globally
echo ""
echo "📊 Installing PM2 process manager..."
npm install -g pm2 yarn

# Install Python3 and pip (for ML Engine - optional)
echo ""
echo "🐍 Installing Python3 and pip..."
apt install -y python3 python3-pip python3-venv

# Configure firewall
echo ""
echo "🔥 Configuring firewall..."
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 5432/tcp  # PostgreSQL (limit to local only in production)
ufw allow 6379/tcp  # Redis (limit to local only in production)

# Create application user
echo ""
echo "👤 Creating application user..."
if ! id -u hvhcapp > /dev/null 2>&1; then
    useradd -r -m -s /bin/bash hvhcapp
    echo -e "${GREEN}✓ User 'hvhcapp' created${NC}"
else
    echo -e "${YELLOW}⚠ User 'hvhcapp' already exists${NC}"
fi

# Create application directory
echo ""
echo "📁 Setting up application directory..."
APP_DIR="/opt/hvhc_bigdata"
mkdir -p $APP_DIR
chown -R hvhcapp:hvhcapp $APP_DIR

# Setup PostgreSQL database
echo ""
echo "🗄️  Setting up database..."
sudo -u postgres psql <<EOF
-- Create database
CREATE DATABASE hvhc_bigdata;

-- Create user
CREATE USER hvhcapp WITH ENCRYPTED PASSWORD 'hvhc_secure_password_2025';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE hvhc_bigdata TO hvhcapp;

-- Create extensions
\c hvhc_bigdata
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

\q
EOF

echo -e "${GREEN}✓ Database setup complete${NC}"

# Configure PostgreSQL for better performance
echo ""
echo "⚙️  Optimizing PostgreSQL..."
cat >> /etc/postgresql/*/main/postgresql.conf <<EOF

# HVHC Big Data Optimizations
shared_buffers = 4GB
effective_cache_size = 12GB
maintenance_work_mem = 1GB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 20MB
min_wal_size = 1GB
max_wal_size = 4GB
max_worker_processes = 8
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
EOF

systemctl restart postgresql

# Setup log rotation
echo ""
echo "📋 Configuring log rotation..."
cat > /etc/logrotate.d/hvhc-bigdata <<EOF
/var/log/hvhc-bigdata/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 hvhcapp hvhcapp
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

mkdir -p /var/log/hvhc-bigdata
chown -R hvhcapp:hvhcapp /var/log/hvhc-bigdata

# Install monitoring tools
echo ""
echo "📊 Installing monitoring tools..."
apt install -y netdata

# Setup backup directory
echo ""
echo "💾 Setting up backup directory..."
BACKUP_DIR="/backup/hvhc_bigdata"
mkdir -p $BACKUP_DIR
chown -R hvhcapp:hvhcapp $BACKUP_DIR

# Create systemd service file
echo ""
echo "🔄 Creating systemd service..."
cat > /etc/systemd/system/hvhc-bigdata.service <<EOF
[Unit]
Description=HVHC Big Data Management Platform
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=hvhcapp
WorkingDirectory=/opt/hvhc_bigdata
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=append:/var/log/hvhc-bigdata/app.log
StandardError=append:/var/log/hvhc-bigdata/error.log

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload

# Security hardening
echo ""
echo "🔒 Applying security hardening..."

# Disable root login via SSH
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart sshd

# Configure fail2ban
cat > /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-noscript]
enabled = true
EOF

systemctl enable fail2ban
systemctl restart fail2ban

# Print summary
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Installation Complete!${NC}"
echo "=========================================="
echo ""
echo "📋 Summary:"
echo "  - Node.js: $(node --version)"
echo "  - npm: $(npm --version)"
echo "  - PostgreSQL: $(sudo -u postgres psql --version | head -n1)"
echo "  - Redis: $(redis-server --version)"
echo "  - Nginx: $(nginx -v 2>&1)"
echo "  - PM2: $(pm2 --version)"
echo ""
echo "📁 Directories:"
echo "  - Application: $APP_DIR"
echo "  - Backups: $BACKUP_DIR"
echo "  - Logs: /var/log/hvhc-bigdata"
echo ""
echo "🗄️  Database:"
echo "  - Name: hvhc_bigdata"
echo "  - User: hvhcapp"
echo "  - Password: hvhc_secure_password_2025"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "  1. Copy your application code to $APP_DIR"
echo "  2. Create and configure .env file"
echo "  3. Run: cd $APP_DIR && npm install"
echo "  4. Run: npx prisma generate && npx prisma migrate deploy"
echo "  5. Run: npm run build"
echo "  6. Start: pm2 start npm --name hvhc-bigdata -- start"
echo "  7. Configure Nginx: copy nginx config and setup SSL"
echo ""
echo "🔒 Security:"
echo "  - Change database password in production!"
echo "  - Configure firewall rules properly"
echo "  - Setup SSL certificate with Let's Encrypt"
echo "  - Review and update /etc/ssh/sshd_config"
echo ""
echo "📚 Documentation: $APP_DIR/HUONG_DAN_TRIEN_KHAI_DAY_DU.md"
echo ""
