
# 📘 Hướng dẫn chi tiết triển khai trên Ubuntu Server

## 🎯 Mục tiêu
Triển khai hệ thống HVHC Big Data lên Ubuntu Server production-ready với:
- High availability
- Auto-scaling
- Monitoring & Logging
- Backup & Recovery
- Security hardening

---

## 📋 Yêu cầu hệ thống

### Tối thiểu
- Ubuntu Server 20.04 LTS
- 8GB RAM
- 4 CPU cores
- 200GB SSD
- 50Mbps network

### Khuyến nghị (Production)
- Ubuntu Server 22.04 LTS
- 32GB RAM
- 16 CPU cores
- 500GB NVMe SSD
- 1Gbps network

---

## 🚀 Quy trình cài đặt

### Bước 1: Chuẩn bị Server

```bash
# Update hệ thống
sudo apt update && sudo apt upgrade -y

# Cài đặt git
sudo apt install -y git

# Clone repository
cd /opt
sudo git clone <your-repo-url> hvhc_bigdata
cd hvhc_bigdata
```

### Bước 2: Chạy Script Cài Đặt Tự Động

```bash
# Cấp quyền thực thi
sudo chmod +x deployment/scripts/install-production.sh

# Chạy script
sudo ./deployment/scripts/install-production.sh
```

Script sẽ tự động cài đặt:
- ✅ Node.js 18.x
- ✅ PostgreSQL 15
- ✅ Redis 7
- ✅ Nginx
- ✅ PM2
- ✅ Python3 (cho ML Engine)
- ✅ Firewall (UFW)
- ✅ Fail2ban
- ✅ Netdata monitoring

### Bước 3: Cấu Hình Database

```bash
# Đổi mật khẩu database (quan trọng!)
sudo -u postgres psql
ALTER USER hvhcapp WITH PASSWORD 'your-strong-password-here';
\q
```

### Bước 4: Cấu Hình Application

```bash
# Copy và chỉnh sửa file .env
cd /opt/hvhc_bigdata
cp deployment/configs/.env.production .env
sudo nano .env
```

**Các biến quan trọng cần thay đổi:**

```env
# Database - Thay đổi mật khẩu
DATABASE_URL="postgresql://hvhcapp:YOUR_PASSWORD@localhost:5432/hvhc_bigdata"

# NextAuth - Generate secret mới
NEXTAUTH_URL="https://bigdata.hvhc.edu.vn"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# Redis
REDIS_URL="redis://localhost:6379"

# Email (nếu cần)
SMTP_HOST="smtp.gmail.com"
SMTP_USER="your-email@hvhc.edu.vn"
SMTP_PASSWORD="your-app-password"
```

### Bước 5: Cài Đặt Dependencies và Build

```bash
cd /opt/hvhc_bigdata

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed data (lần đầu)
npm run seed

# Build application
npm run build
```

### Bước 6: Khởi Động Application với PM2

```bash
# Start với PM2
pm2 start npm --name "hvhc-bigdata" -- start

# Save PM2 configuration
pm2 save

# Enable PM2 on boot
pm2 startup
# Copy và chạy lệnh được hiển thị
```

### Bước 7: Cấu Hình Nginx

```bash
# Copy nginx config
sudo cp deployment/configs/nginx.production.conf /etc/nginx/sites-available/hvhc-bigdata

# Enable site
sudo ln -s /etc/nginx/sites-available/hvhc-bigdata /etc/nginx/sites-enabled/

# Xóa default site (nếu có)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Bước 8: Cài Đặt SSL Certificate

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d bigdata.hvhc.edu.vn

# Test auto-renewal
sudo certbot renew --dry-run
```

### Bước 9: Thiết Lập Backup Tự Động

```bash
# Make script executable
chmod +x deployment/scripts/backup.sh

# Add to crontab
sudo crontab -e

# Thêm dòng sau (backup hàng ngày lúc 2:00 AM)
0 2 * * * /opt/hvhc_bigdata/deployment/scripts/backup.sh >> /var/log/hvhc-backup.log 2>&1
```

### Bước 10: Kiểm Tra Hệ Thống

```bash
# Run health check
./deployment/scripts/health-check.sh

# Check PM2 status
pm2 status

# Check logs
pm2 logs hvhc-bigdata

# Check Nginx
sudo systemctl status nginx

# Check database
sudo -u postgres psql -d hvhc_bigdata -c "SELECT COUNT(*) FROM users;"
```

---

## 🔒 Bảo mật

### 1. Firewall Rules

```bash
# Kiểm tra UFW status
sudo ufw status

# Chỉ cho phép SSH từ IP cụ thể (khuyến nghị)
sudo ufw allow from YOUR_IP to any port 22

# Hoặc cho phép SSH từ mọi nơi (ít an toàn hơn)
sudo ufw allow 22/tcp

# HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 2. SSH Hardening

```bash
sudo nano /etc/ssh/sshd_config
```

Thay đổi:
```
PermitRootLogin no
PasswordAuthentication no  # Chỉ dùng SSH key
Port 2222  # Đổi port SSH (optional)
```

Restart SSH:
```bash
sudo systemctl restart sshd
```

### 3. Fail2ban Configuration

```bash
# Check status
sudo fail2ban-client status

# Check SSH jail
sudo fail2ban-client status sshd
```

### 4. Database Security

```bash
# Chỉ cho phép local connections
sudo nano /etc/postgresql/*/main/postgresql.conf
```

Đảm bảo:
```
listen_addresses = 'localhost'
```

### 5. Regular Updates

```bash
# Setup automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 📊 Monitoring & Logging

### 1. PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Web dashboard
pm2 plus
```

### 2. Netdata Dashboard

Truy cập: `http://your-server-ip:19999`

### 3. Application Logs

```bash
# PM2 logs
pm2 logs hvhc-bigdata

# Nginx access logs
sudo tail -f /var/log/nginx/hvhc-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/hvhc-error.log

# System logs
sudo journalctl -u hvhc-bigdata -f
```

### 4. Database Logs

```bash
# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*-main.log
```

---

## 🔄 Maintenance Tasks

### Daily

```bash
# Check system health
./deployment/scripts/health-check.sh

# Monitor disk space
df -h

# Check service status
pm2 status
sudo systemctl status nginx postgresql redis
```

### Weekly

```bash
# Review logs
pm2 logs hvhc-bigdata --lines 1000

# Check for updates
cd /opt/hvhc_bigdata
git fetch origin
```

### Monthly

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Update application
./deployment/scripts/update.sh

# Review backups
ls -lh /backup/hvhc_bigdata

# Check SSL expiry
sudo certbot certificates
```

---

## 🆘 Troubleshooting

### Application không start

```bash
# Check logs
pm2 logs hvhc-bigdata --err

# Check port
sudo lsof -i :3000

# Restart
pm2 restart hvhc-bigdata
```

### Database connection error

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -U hvhcapp -d hvhc_bigdata -h localhost

# Reset password
sudo -u postgres psql
ALTER USER hvhcapp WITH PASSWORD 'new-password';
```

### Nginx 502 Bad Gateway

```bash
# Check if app is running
pm2 status

# Check Nginx error log
sudo tail -f /var/log/nginx/hvhc-error.log

# Check app is listening on correct port
sudo netstat -tlnp | grep 3000
```

### Out of Memory

```bash
# Check memory
free -h

# Restart services
pm2 restart all
sudo systemctl restart redis

# Clear cache
redis-cli FLUSHALL
```

### Disk Full

```bash
# Check disk usage
df -h

# Find large files
sudo du -h / | sort -rh | head -20

# Clean old logs
sudo journalctl --vacuum-time=7d
pm2 flush

# Clean old backups
find /backup/hvhc_bigdata -type d -mtime +30 -exec rm -rf {} \;
```

---

## 📞 Support

- **Email:** support@hvhc.edu.vn
- **Documentation:** `/opt/hvhc_bigdata/HUONG_DAN_TRIEN_KHAI_DAY_DU.md`
- **Logs:** `/var/log/hvhc-bigdata/`

---

**Phiên bản:** 6.1  
**Cập nhật:** 15/10/2025  
**Người soạn:** HVHC IT Team
