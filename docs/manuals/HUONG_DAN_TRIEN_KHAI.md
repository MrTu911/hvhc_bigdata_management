
# HƯỚNG DẪN TRIỂN KHAI HỆ THỐNG
## Hệ thống Quản lý Big Data - Học viện Hậu cần

---

## 📋 MỤC LỤC

1. [Yêu cầu Hệ thống](#1-yêu-cầu-hệ-thống)
2. [Chuẩn bị Môi trường](#2-chuẩn-bị-môi-trường)
3. [Cài đặt Database](#3-cài-đặt-database)
4. [Cài đặt Application](#4-cài-đặt-application)
5. [Cấu hình Production](#5-cấu-hình-production)
6. [Triển khai](#6-triển-khai)
7. [Monitoring & Maintenance](#7-monitoring--maintenance)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. YÊU CẦU HỆ THỐNG

### 1.1 Phần cứng

#### Server Application (Minimum)
```
CPU: 4 cores (Intel Xeon hoặc AMD EPYC)
RAM: 8 GB
Storage: 100 GB SSD
Network: 1 Gbps
```

#### Server Application (Recommended)
```
CPU: 8+ cores
RAM: 16+ GB
Storage: 500+ GB NVMe SSD
Network: 10 Gbps
```

#### Server Database (Minimum)
```
CPU: 4 cores
RAM: 8 GB
Storage: 200 GB SSD
```

#### Server Database (Recommended)
```
CPU: 8+ cores
RAM: 32+ GB
Storage: 1+ TB SSD với RAID 10
```

### 1.2 Phần mềm

#### Hệ điều hành
```
✅ Ubuntu 22.04 LTS (Khuyến nghị)
✅ Ubuntu 20.04 LTS
✅ Debian 11+
✅ CentOS 8+
✅ RHEL 8+
```

#### Các thành phần cần thiết
```
- Node.js 18.x hoặc 20.x
- PostgreSQL 16 (hoặc 14+)
- Redis 7.x (tùy chọn, cho caching)
- Nginx (cho reverse proxy)
- PM2 (cho process management)
- Docker & Docker Compose (tùy chọn)
- Git
```

---

## 2. CHUẨN BỊ MÔI TRƯỜNG

### 2.1 Cập nhật Hệ thống

```bash
# Update package list
sudo apt update

# Upgrade existing packages
sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential software-properties-common
```

### 2.2 Cài đặt Node.js

#### Phương pháp 1: NodeSource Repository (Khuyến nghị)
```bash
# Add Node.js 20.x repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

#### Phương pháp 2: NVM (Node Version Manager)
```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell
source ~/.bashrc

# Install Node.js
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node --version
```

### 2.3 Cài đặt Yarn

```bash
# Enable Corepack (included with Node.js 16.10+)
corepack enable

# Or install via npm
npm install -g yarn

# Verify installation
yarn --version
```

### 2.4 Cài đặt PM2

```bash
# Install PM2 globally
npm install -g pm2

# Verify installation
pm2 --version

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions output by the command
```

### 2.5 Cài đặt Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify installation
nginx -v
sudo systemctl status nginx
```

---

## 3. CÀI ĐẶT DATABASE

### 3.1 Cài đặt PostgreSQL 16

#### Ubuntu/Debian
```bash
# Add PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'

# Import repository signing key
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Update package list
sudo apt update

# Install PostgreSQL 16
sudo apt install -y postgresql-16 postgresql-contrib-16

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
sudo -u postgres psql --version
```

### 3.2 Cấu hình PostgreSQL

#### Tạo Database và User
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database
CREATE DATABASE bigdata_hvhc;

# Create user
CREATE USER bigdata_admin WITH ENCRYPTED PASSWORD 'your_secure_password_here';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE bigdata_hvhc TO bigdata_admin;

# Grant schema privileges
\c bigdata_hvhc
GRANT ALL ON SCHEMA public TO bigdata_admin;
ALTER DATABASE bigdata_hvhc OWNER TO bigdata_admin;

# Exit
\q
```

#### Cấu hình Connection

Chỉnh sửa `/etc/postgresql/16/main/postgresql.conf`:
```bash
sudo nano /etc/postgresql/16/main/postgresql.conf
```

Thêm/sửa:
```conf
# Network settings
listen_addresses = 'localhost'  # Or '*' for remote access
port = 5432

# Memory settings
shared_buffers = 2GB           # 25% of RAM
effective_cache_size = 6GB     # 75% of RAM
maintenance_work_mem = 512MB
work_mem = 16MB

# Connection settings
max_connections = 100

# WAL settings
wal_level = replica
max_wal_size = 2GB
min_wal_size = 1GB

# Logging
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
```

Chỉnh sửa `/etc/postgresql/16/main/pg_hba.conf`:
```bash
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

Thêm:
```conf
# Local connections
local   all             all                                     peer
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5

# If allowing remote connections (not recommended for production):
# host    bigdata_hvhc    bigdata_admin   10.0.0.0/8              md5
```

Khởi động lại PostgreSQL:
```bash
sudo systemctl restart postgresql
```

#### Kiểm tra Connection
```bash
# Test connection
psql -U bigdata_admin -d bigdata_hvhc -h localhost

# Should connect successfully
# Exit with \q
```

### 3.3 Cài đặt Redis (Optional)

```bash
# Install Redis
sudo apt install -y redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
```

Cấu hình:
```conf
# Bind to localhost
bind 127.0.0.1 ::1

# Set password
requirepass your_redis_password_here

# Set max memory
maxmemory 2gb
maxmemory-policy allkeys-lru

# Enable persistence
save 900 1
save 300 10
save 60 10000
```

Khởi động Redis:
```bash
# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify
redis-cli ping
# Should return PONG
```

---

## 4. CÀI ĐẶT APPLICATION

### 4.1 Clone Repository

```bash
# Create application directory
sudo mkdir -p /var/www
cd /var/www

# Clone repository (adjust URL as needed)
sudo git clone <repository-url> bigdata-hvhc
cd bigdata-hvhc

# Set ownership
sudo chown -R $USER:$USER /var/www/bigdata-hvhc
```

### 4.2 Install Dependencies

```bash
# Navigate to Next.js space
cd /var/www/bigdata-hvhc/nextjs_space

# Install dependencies
yarn install

# This may take a few minutes
```

### 4.3 Environment Configuration

```bash
# Create .env file
cd /var/www/bigdata-hvhc/nextjs_space
nano .env
```

Nội dung `.env`:
```bash
# Database
DATABASE_URL="postgresql://bigdata_admin:your_secure_password_here@localhost:5432/bigdata_hvhc?schema=public"

# NextAuth Configuration
NEXTAUTH_URL="https://your-domain.com"  # Or http://localhost:3000 for development
NEXTAUTH_SECRET="your-nextauth-secret-here-generate-with-openssl-rand-base64-32"

# Redis (Optional - for caching)
REDIS_URL="redis://:your_redis_password_here@localhost:6379"

# AWS S3 (Optional - for file uploads)
AWS_BUCKET_NAME="your-bucket-name"
AWS_REGION="ap-southeast-1"
# AWS credentials will be from IAM role or environment

# MLflow (Optional - for ML tracking)
MLFLOW_TRACKING_URI="http://localhost:5000"

# Application Settings
NODE_ENV="production"
PORT="3000"
```

#### Tạo NEXTAUTH_SECRET
```bash
# Generate secure secret
openssl rand -base64 32
# Copy the output to NEXTAUTH_SECRET in .env
```

### 4.4 Database Migration

```bash
# Navigate to nextjs_space
cd /var/www/bigdata-hvhc/nextjs_space

# Generate Prisma Client
yarn prisma generate

# Run migrations
yarn prisma migrate deploy

# Verify migrations
yarn prisma migrate status
```

#### Seed Initial Data (Optional)
```bash
# Run seed script if available
yarn prisma db seed
```

### 4.5 Build Application

```bash
# Navigate to nextjs_space
cd /var/www/bigdata-hvhc/nextjs_space

# Build for production
yarn build

# This will create .next directory with optimized build
```

### 4.6 Test Run

```bash
# Test the application
yarn start

# Application should start on port 3000
# Access: http://localhost:3000

# Press Ctrl+C to stop after verification
```

---

## 5. CẤU HÌNH PRODUCTION

### 5.1 PM2 Configuration

#### Create PM2 Ecosystem File
```bash
# Create ecosystem.config.js in project root
cd /var/www/bigdata-hvhc
nano ecosystem.config.js
```

Nội dung:
```javascript
module.exports = {
  apps: [{
    name: 'bigdata-hvhc',
    cwd: '/var/www/bigdata-hvhc/nextjs_space',
    script: 'yarn',
    args: 'start',
    instances: 'max',  // or specific number like 2, 4
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/bigdata-hvhc/error.log',
    out_file: '/var/log/bigdata-hvhc/out.log',
    log_file: '/var/log/bigdata-hvhc/combined.log',
    time: true
  }]
}
```

#### Create Log Directory
```bash
sudo mkdir -p /var/log/bigdata-hvhc
sudo chown -R $USER:$USER /var/log/bigdata-hvhc
```

### 5.2 Nginx Configuration

#### Create Nginx Config
```bash
sudo nano /etc/nginx/sites-available/bigdata-hvhc
```

Nội dung:
```nginx
# Upstream configuration
upstream bigdata_backend {
    least_conn;
    server 127.0.0.1:3000;
    # Add more servers for load balancing:
    # server 127.0.0.1:3001;
    # server 127.0.0.1:3002;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL configuration (will be managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_session_timeout 10m;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Logging
    access_log /var/log/nginx/bigdata-hvhc-access.log;
    error_log /var/log/nginx/bigdata-hvhc-error.log;

    # Client body size limit
    client_max_body_size 100M;

    # Root location
    location / {
        proxy_pass http://bigdata_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://bigdata_backend;
        proxy_cache_valid 200 60m;
        expires 1y;
        access_log off;
        add_header Cache-Control "public, immutable";
    }

    # Image caching
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
        proxy_pass https://img.pagecloud.com/wAegMZSQrxtIBtV-i7jBCW-Ho7Y=/1000x0/filters:no_upscale()/blogmerge/cf67f56e-00e6-48c0-a1a4-31a8e3baf0de.jpeg
        expires 1y;
        access_log off;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Enable Site
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/bigdata-hvhc /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 5.3 SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow the prompts:
# - Enter email address
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: yes)

# Verify auto-renewal
sudo certbot renew --dry-run

# Certificate will auto-renew via cron
```

### 5.4 Firewall Configuration

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check status
sudo ufw status
```

---

## 6. TRIỂN KHAI

### 6.1 Start Application

```bash
# Navigate to project root
cd /var/www/bigdata-hvhc

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Check status
pm2 status

# View logs
pm2 logs bigdata-hvhc

# Monitor
pm2 monit
```

### 6.2 Verification

#### Check Application
```bash
# Check if app is running
pm2 list

# Check logs for errors
pm2 logs bigdata-hvhc --lines 50

# Test locally
curl http://localhost:3000

# Should return HTML
```

#### Check Nginx
```bash
# Test nginx configuration
sudo nginx -t

# Check status
sudo systemctl status nginx

# Check logs
sudo tail -f /var/log/nginx/bigdata-hvhc-access.log
```

#### Check Database
```bash
# Connect to database
psql -U bigdata_admin -d bigdata_hvhc -h localhost

# Check tables
\dt

# Check sample data
SELECT COUNT(*) FROM users;

# Exit
\q
```

#### Access Application
```bash
# Open browser and navigate to:
https://your-domain.com

# You should see the login page
```

### 6.3 Create Initial Admin User

```bash
# Connect to database
psql -U bigdata_admin -d bigdata_hvhc -h localhost

# Create admin user (adjust values as needed)
INSERT INTO users (email, name, password, role, status)
VALUES (
    'admin@hvhc.edu.vn',
    'System Administrator',
    '$2a$10$YourHashedPasswordHere',  -- Use bcrypt to hash password
    'admin',
    'active'
);

# Exit
\q
```

Or use Node.js script:
```bash
# Create a script: create-admin.js
cd /var/www/bigdata-hvhc/nextjs_space
nano create-admin.js
```

```javascript
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdmin() {
  const hashedPassword = await bcrypt.hash('YourSecurePassword123!', 10);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@hvhc.edu.vn',
      name: 'System Administrator',
      password: hashedPassword,
      role: 'admin',
      status: 'active'
    }
  });
  
  console.log('Admin created:', admin);
}

createAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run:
```bash
node create-admin.js
```

---

## 7. MONITORING & MAINTENANCE

### 7.1 PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# List processes
pm2 list

# Show process details
pm2 show bigdata-hvhc

# View logs
pm2 logs bigdata-hvhc

# Flush logs
pm2 flush

# Restart application
pm2 restart bigdata-hvhc

# Reload (zero-downtime)
pm2 reload bigdata-hvhc

# Stop application
pm2 stop bigdata-hvhc
```

### 7.2 Log Management

#### Application Logs
```bash
# View real-time logs
pm2 logs bigdata-hvhc --lines 100

# View error logs only
pm2 logs bigdata-hvhc --err

# View out logs only
pm2 logs bigdata-hvhc --out
```

#### Nginx Logs
```bash
# Access logs
sudo tail -f /var/log/nginx/bigdata-hvhc-access.log

# Error logs
sudo tail -f /var/log/nginx/bigdata-hvhc-error.log
```

#### PostgreSQL Logs
```bash
# View logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

#### Log Rotation
```bash
# Create logrotate config
sudo nano /etc/logrotate.d/bigdata-hvhc
```

```
/var/log/bigdata-hvhc/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 7.3 Database Backup

#### Automated Backup Script
```bash
# Create backup script
sudo mkdir -p /opt/backups/scripts
sudo nano /opt/backups/scripts/backup-db.sh
```

```bash
#!/bin/bash

# Configuration
DB_NAME="bigdata_hvhc"
DB_USER="bigdata_admin"
BACKUP_DIR="/opt/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_DIR/backup_${DATE}.sql.gz

# Remove old backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Log
echo "$(date): Database backup completed" >> /var/log/bigdata-hvhc/backup.log
```

```bash
# Make executable
sudo chmod +x /opt/backups/scripts/backup-db.sh

# Create log file
sudo touch /var/log/bigdata-hvhc/backup.log
sudo chown $USER:$USER /var/log/bigdata-hvhc/backup.log

# Test backup
sudo -u postgres /opt/backups/scripts/backup-db.sh
```

#### Schedule Backup with Cron
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /opt/backups/scripts/backup-db.sh
```

### 7.4 Application Updates

```bash
# Navigate to project directory
cd /var/www/bigdata-hvhc

# Backup current version
tar -czf ../bigdata-hvhc-backup-$(date +%Y%m%d).tar.gz .

# Pull latest code
git pull origin main

# Navigate to nextjs_space
cd nextjs_space

# Install dependencies
yarn install

# Run migrations
yarn prisma migrate deploy

# Build application
yarn build

# Reload PM2 (zero-downtime)
pm2 reload bigdata-hvhc

# Or restart
# pm2 restart bigdata-hvhc

# Check logs
pm2 logs bigdata-hvhc --lines 50
```

### 7.5 Health Checks

#### Application Health
```bash
# Check application response
curl -I https://your-domain.com

# Should return 200 OK
```

#### Database Health
```bash
# Check database
psql -U bigdata_admin -d bigdata_hvhc -h localhost -c "SELECT version();"

# Check active connections
psql -U bigdata_admin -d bigdata_hvhc -h localhost -c "SELECT count(*) FROM pg_stat_activity;"
```

#### System Health
```bash
# Check disk space
df -h

# Check memory
free -h

# Check CPU
top

# Check load average
uptime
```

---

## 8. TROUBLESHOOTING

### 8.1 Application Issues

#### Issue: Application won't start
```bash
# Check PM2 logs
pm2 logs bigdata-hvhc

# Common causes:
# 1. Port already in use
sudo lsof -i :3000

# 2. Environment variables missing
cat /var/www/bigdata-hvhc/nextjs_space/.env

# 3. Database connection
psql -U bigdata_admin -d bigdata_hvhc -h localhost
```

#### Issue: High memory usage
```bash
# Check memory usage
pm2 list
free -h

# Restart application
pm2 restart bigdata-hvhc

# Adjust PM2 config (max_memory_restart)
nano /var/www/bigdata-hvhc/ecosystem.config.js
pm2 reload bigdata-hvhc
```

#### Issue: Slow response times
```bash
# Check database queries
psql -U bigdata_admin -d bigdata_hvhc -h localhost
SELECT * FROM pg_stat_activity WHERE state = 'active';

# Check Nginx logs
sudo tail -f /var/log/nginx/bigdata-hvhc-access.log

# Enable PM2 monitoring
pm2 monit
```

### 8.2 Database Issues

#### Issue: Cannot connect to database
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log

# Check connection settings
sudo nano /etc/postgresql/16/main/pg_hba.conf

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### Issue: Database performance
```bash
# Check long-running queries
psql -U bigdata_admin -d bigdata_hvhc -h localhost
SELECT pid, now() - query_start as duration, query 
FROM pg_stat_activity 
WHERE state = 'active' 
ORDER BY duration DESC;

# Analyze tables
ANALYZE;

# Vacuum database
VACUUM ANALYZE;
```

### 8.3 Nginx Issues

#### Issue: 502 Bad Gateway
```bash
# Check if application is running
pm2 list

# Check Nginx error logs
sudo tail -f /var/log/nginx/bigdata-hvhc-error.log

# Check upstream configuration
sudo nano /etc/nginx/sites-available/bigdata-hvhc

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### Issue: SSL Certificate
```bash
# Check certificate expiration
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

### 8.4 System Issues

#### Issue: Disk space full
```bash
# Check disk usage
df -h

# Find large files
sudo du -h / | sort -rh | head -20

# Clean old logs
sudo find /var/log -name "*.gz" -mtime +30 -delete

# Clean old backups
sudo find /opt/backups -mtime +30 -delete
```

#### Issue: High CPU usage
```bash
# Check processes
top
htop

# Check PM2 processes
pm2 monit

# Check PostgreSQL
psql -U bigdata_admin -d bigdata_hvhc -h localhost
SELECT * FROM pg_stat_activity;
```

---

## 9. ROLLBACK PROCEDURE

### 9.1 Application Rollback

```bash
# Stop current version
pm2 stop bigdata-hvhc

# Navigate to project directory
cd /var/www

# Extract backup
tar -xzf bigdata-hvhc-backup-YYYYMMDD.tar.gz -C bigdata-hvhc/

# Or use git
cd bigdata-hvhc
git reset --hard <commit-hash>

# Rebuild
cd nextjs_space
yarn install
yarn build

# Start application
pm2 start bigdata-hvhc
```

### 9.2 Database Rollback

```bash
# Stop application
pm2 stop bigdata-hvhc

# Restore database
gunzip < /opt/backups/database/backup_YYYYMMDD_HHMMSS.sql.gz | \
  psql -U bigdata_admin -d bigdata_hvhc -h localhost

# Start application
pm2 start bigdata-hvhc
```

---

## 10. SECURITY CHECKLIST

### Before Deployment
- [ ] Change all default passwords
- [ ] Generate strong NEXTAUTH_SECRET
- [ ] Configure firewall (UFW)
- [ ] Setup SSL/TLS certificate
- [ ] Disable unnecessary services
- [ ] Configure database authentication
- [ ] Review Nginx security headers
- [ ] Setup fail2ban (optional)

### After Deployment
- [ ] Test all functionality
- [ ] Verify SSL certificate
- [ ] Check security headers
- [ ] Review logs
- [ ] Setup monitoring
- [ ] Configure backups
- [ ] Document credentials securely
- [ ] Train administrators

---

## 11. SUPPORT & CONTACTS

### Documentation
- Technical Documentation: `/docs/BAO_CAO_KY_THUAT_TOAN_DIEN.md`
- User Guide: `/docs/HUONG_DAN_SU_DUNG.md`
- API Documentation: `/docs/TAI_LIEU_API.md`

### Logs & Monitoring
- Application Logs: `/var/log/bigdata-hvhc/`
- Nginx Logs: `/var/log/nginx/`
- PostgreSQL Logs: `/var/log/postgresql/`

---

**Phiên bản:** 1.0.0  
**Ngày cập nhật:** 10/10/2025  
**Trạng thái:** Production Ready

---

*Tài liệu này cung cấp hướng dẫn chi tiết để triển khai hệ thống từ đầu đến cuối.*
