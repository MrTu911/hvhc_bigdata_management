
# 🚀 HƯỚNG DẪN TRIỂN KHAI HỆ THỐNG BIG DATA HVHC

## 📋 MỤC LỤC

1. [Triển khai Production trên Ubuntu Server](#production)
2. [Triển khai trên NAS](#nas)
3. [Cài đặt Development trên Ubuntu Laptop](#development)
4. [Kiểm tra và Bảo trì](#maintenance)

---

## 🖥️ 1. TRIỂN KHAI PRODUCTION TRÊN UBUNTU SERVER {#production}

### Yêu cầu hệ thống
- Ubuntu Server 20.04 LTS trở lên
- RAM: 16GB+ (khuyến nghị 32GB)
- CPU: 8 cores+
- Disk: 500GB+ SSD
- Network: 100Mbps+

### Bước 1: Chuẩn bị server

```bash
# Clone repository
git clone <repository-url> /opt/hvhc_bigdata
cd /opt/hvhc_bigdata

# Chạy script cài đặt tự động
chmod +x deployment/scripts/install-production.sh
sudo ./deployment/scripts/install-production.sh
```

### Bước 2: Cấu hình môi trường

```bash
# Copy và chỉnh sửa file .env
cp deployment/configs/.env.production .env
nano .env
```

Cấu hình các biến quan trọng:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/hvhc_bigdata"

# NextAuth
NEXTAUTH_URL="https://bigdata.hvhc.edu.vn"
NEXTAUTH_SECRET="<generate-secure-secret>"

# Redis
REDIS_URL="redis://localhost:6379"

# ML Engine (optional)
ML_ENGINE_URL="http://localhost:8000"

# Email (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@hvhc.edu.vn"
SMTP_PASS="your-password"
```

### Bước 3: Khởi động services

```bash
# Khởi động database
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Khởi động Redis
sudo systemctl start redis
sudo systemctl enable redis

# Chạy migrations
cd /opt/hvhc_bigdata
npm install
npx prisma generate
npx prisma migrate deploy

# Seed dữ liệu mẫu (lần đầu)
npm run seed

# Build ứng dụng
npm run build

# Khởi động với PM2
pm2 start npm --name "hvhc-bigdata" -- start
pm2 save
pm2 startup
```

### Bước 4: Cấu hình Nginx

```bash
# Copy config
sudo cp deployment/configs/nginx.production.conf /etc/nginx/sites-available/hvhc-bigdata
sudo ln -s /etc/nginx/sites-available/hvhc-bigdata /etc/nginx/sites-enabled/

# Test và reload
sudo nginx -t
sudo systemctl reload nginx
```

### Bước 5: SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d bigdata.hvhc.edu.vn
```

### Bước 6: Thiết lập Backup tự động

```bash
# Cấu hình cron job
sudo crontab -e

# Thêm dòng sau (backup hàng ngày lúc 2:00 AM)
0 2 * * * /opt/hvhc_bigdata/deployment/scripts/backup.sh
```

---

## 💾 2. TRIỂN KHAI TRÊN NAS {#nas}

### Yêu cầu
- Synology NAS hoặc QNAP NAS
- Docker installed
- 8GB+ RAM
- 200GB+ storage

### Bước 1: Chuẩn bị NAS

```bash
# SSH vào NAS
ssh admin@nas-ip

# Tạo thư mục project
mkdir -p /volume1/docker/hvhc_bigdata
cd /volume1/docker/hvhc_bigdata

# Upload hoặc clone code
# Sử dụng Git, FTP, hoặc File Station
```

### Bước 2: Cấu hình Docker Compose

```bash
# Copy file docker-compose
cp deployment/docker-compose.nas.yml docker-compose.yml

# Chỉnh sửa cấu hình
nano docker-compose.yml
```

### Bước 3: Cấu hình môi trường

```bash
# Tạo file .env
cp deployment/configs/.env.nas .env
nano .env
```

### Bước 4: Khởi động containers

```bash
# Build và start
docker-compose up -d

# Kiểm tra logs
docker-compose logs -f

# Chạy migrations
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npm run seed
```

### Bước 5: Truy cập ứng dụng

- URL: `http://nas-ip:3000`
- Admin: `admin@hvhc.edu.vn` / `Admin@123456`

---

## 💻 3. CÀI ĐẶT DEVELOPMENT TRÊN UBUNTU LAPTOP {#development}

### Yêu cầu
- Ubuntu 20.04+
- 8GB+ RAM
- 50GB+ free space

### Bước 1: Cài đặt dependencies

```bash
# Chạy script tự động
cd hvhc_bigdata_management
chmod +x deployment/scripts/install-dev.sh
./deployment/scripts/install-dev.sh
```

Script sẽ tự động cài:
- Node.js 18+
- PostgreSQL
- Redis
- Git
- VS Code (optional)

### Bước 2: Setup project

```bash
# Clone repository (nếu chưa có)
git clone <repository-url>
cd hvhc_bigdata_management/nextjs_space

# Install dependencies
npm install

# Setup database
cp .env.example .env.local
nano .env.local
```

### Bước 3: Khởi tạo database

```bash
# Start PostgreSQL
sudo systemctl start postgresql

# Create database
sudo -u postgres psql
CREATE DATABASE hvhc_bigdata_dev;
CREATE USER dev_user WITH PASSWORD 'dev_password';
GRANT ALL PRIVILEGES ON DATABASE hvhc_bigdata_dev TO dev_user;
\q

# Run migrations
npx prisma generate
npx prisma migrate dev
npm run seed
```

### Bước 4: Khởi động development server

```bash
# Terminal 1: Redis
redis-server

# Terminal 2: Next.js
npm run dev

# Terminal 3: ML Engine (optional)
cd ../ml_engine
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Bước 5: Truy cập

- Next.js: `http://localhost:3000`
- ML Engine: `http://localhost:8000`
- Prisma Studio: `npx prisma studio` → `http://localhost:5555`

---

## 🔧 4. KIỂM TRA VÀ BẢO TRÌ {#maintenance}

### Kiểm tra sức khỏe hệ thống

```bash
# Script tự động kiểm tra
./deployment/scripts/health-check.sh
```

### Monitoring

```bash
# PM2 monitoring (Production)
pm2 monit

# Docker stats (NAS)
docker stats

# System resources
htop
```

### Backup và Restore

```bash
# Backup thủ công
./deployment/scripts/backup.sh

# Restore từ backup
./deployment/scripts/restore.sh /path/to/backup.tar.gz
```

### Update hệ thống

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Run migrations
npx prisma migrate deploy

# Rebuild
npm run build

# Restart (Production)
pm2 restart hvhc-bigdata

# Restart (NAS)
docker-compose restart
```

### Log management

```bash
# View logs (Production)
pm2 logs hvhc-bigdata

# View logs (NAS)
docker-compose logs -f app

# Clear logs
pm2 flush
```

---

## 🆘 TROUBLESHOOTING

### Database connection failed
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -U user -d hvhc_bigdata -h localhost
```

### Port already in use
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>
```

### Out of memory
```bash
# Check memory
free -h

# Restart services
pm2 restart all
# or
docker-compose restart
```

---

## 📞 HỖ TRỢ

- Email: support@hvhc.edu.vn
- Documentation: [Internal Wiki]
- Issue Tracker: [GitHub Issues]

---

**Phiên bản:** 6.1  
**Ngày cập nhật:** 15/10/2025  
**Người soạn:** HVHC IT Team
