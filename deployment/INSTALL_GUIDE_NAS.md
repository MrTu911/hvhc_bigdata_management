
# 📘 Hướng dẫn triển khai trên NAS (Synology/QNAP)

## 🎯 Mục tiêu
Triển khai hệ thống HVHC Big Data trên NAS sử dụng Docker để:
- Dễ dàng quản lý
- Tự động khởi động
- Tách biệt môi trường
- Backup thuận tiện

---

## 📋 Yêu cầu

### Phần cứng
- Synology NAS hoặc QNAP NAS
- RAM: 8GB minimum (16GB khuyến nghị)
- Storage: 200GB+ available
- Network: 100Mbps+

### Phần mềm
- DSM 7.0+ (Synology) hoặc QTS 5.0+ (QNAP)
- Docker package installed
- SSH access enabled

---

## 🚀 Synology NAS

### Bước 1: Cài Đặt Docker

1. Mở **Package Center**
2. Tìm và cài **Docker**
3. Mở **Docker** app sau khi cài xong

### Bước 2: Enable SSH

1. Mở **Control Panel** → **Terminal & SNMP**
2. Enable **SSH service**
3. Port: 22 (hoặc custom port)

### Bước 3: Kết Nối SSH

```bash
ssh admin@nas-ip-address
```

### Bước 4: Tạo Thư Mục Project

```bash
# Tạo thư mục chính
mkdir -p /volume1/docker/hvhc_bigdata
cd /volume1/docker/hvhc_bigdata

# Tạo thư mục con
mkdir -p postgres_data redis_data uploads logs nginx postgres_backups
```

### Bước 5: Upload Code

**Cách 1: Git Clone (nếu NAS có git)**
```bash
cd /volume1/docker/hvhc_bigdata
git clone <repository-url> app
cd app
```

**Cách 2: File Station (GUI)**
1. Mở **File Station**
2. Navigate to `docker/hvhc_bigdata`
3. Upload toàn bộ folder project
4. Đổi tên thành `app`

**Cách 3: SCP từ máy local**
```bash
# Từ máy local
scp -r /path/to/hvhc_bigdata admin@nas-ip:/volume1/docker/hvhc_bigdata/app
```

### Bước 6: Tạo File Cấu Hình

```bash
cd /volume1/docker/hvhc_bigdata

# Copy docker-compose
cp app/deployment/docker-compose.nas.yml docker-compose.yml

# Copy .env
cp app/deployment/configs/.env.nas .env

# Chỉnh sửa .env
nano .env
```

**Cấu hình .env quan trọng:**
```env
# Database
DB_PASSWORD=your-secure-password

# NextAuth
NEXTAUTH_URL=http://192.168.1.100:3000  # Thay bằng IP NAS
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Redis
REDIS_PASSWORD=your-redis-password
```

### Bước 7: Khởi Động Containers

```bash
cd /volume1/docker/hvhc_bigdata

# Pull images
docker-compose pull

# Build và start
docker-compose up -d

# Xem logs
docker-compose logs -f
```

### Bước 8: Chạy Database Migrations

```bash
# Chờ containers khởi động (30 giây)
sleep 30

# Run migrations
docker-compose exec app npx prisma generate
docker-compose exec app npx prisma migrate deploy

# Seed data
docker-compose exec app npm run seed
```

### Bước 9: Truy Cập Application

- URL: `http://nas-ip:3000`
- Username: `admin@hvhc.edu.vn`
- Password: `Admin@123456`

---

## 🚀 QNAP NAS

### Bước 1: Cài Đặt Container Station

1. Mở **App Center**
2. Tìm và cài **Container Station**
3. Mở **Container Station** sau khi cài xong

### Bước 2: Enable SSH

1. Mở **Control Panel** → **Telnet/SSH**
2. Enable **SSH**
3. Port: 22

### Bước 3: Các bước tiếp theo tương tự Synology

Thay đổi:
- Path: `/share/Container/hvhc_bigdata` thay vì `/volume1/docker/hvhc_bigdata`
- Sử dụng user `admin` để SSH

---

## 🔧 Quản Lý và Bảo Trì

### Xem Status

```bash
cd /volume1/docker/hvhc_bigdata
docker-compose ps
```

### Xem Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f postgres
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart app
```

### Stop/Start

```bash
# Stop all
docker-compose stop

# Start all
docker-compose start

# Stop specific service
docker-compose stop app
```

### Update Application

```bash
cd /volume1/docker/hvhc_bigdata

# Pull latest code (if using git)
cd app
git pull origin main
cd ..

# Rebuild and restart
docker-compose build app
docker-compose up -d app

# Run migrations
docker-compose exec app npx prisma migrate deploy
```

### Backup Database

```bash
# Manual backup
docker-compose exec postgres pg_dump -U hvhcapp hvhc_bigdata | gzip > postgres_backups/backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore Database

```bash
# Stop app first
docker-compose stop app

# Restore
gunzip -c postgres_backups/backup_YYYYMMDD_HHMMSS.sql.gz | docker-compose exec -T postgres psql -U hvhcapp hvhc_bigdata

# Start app
docker-compose start app
```

---

## 📊 Monitoring

### 1. Synology Docker GUI

1. Mở **Docker** app
2. **Container** tab: xem status các containers
3. **Log** tab: xem logs realtime
4. **Terminal**: truy cập shell của container

### 2. Command Line

```bash
# Container stats
docker stats

# Container info
docker-compose ps

# Disk usage
docker system df
```

### 3. Resource Monitor

1. Mở **Resource Monitor** (DSM)
2. Theo dõi CPU, RAM, Network usage

---

## 🔄 Auto-start on Boot

### Synology

Docker containers tự động start nếu:
1. Docker package đã enable auto-start
2. Containers được start với `restart: unless-stopped` (đã có trong docker-compose.yml)

### QNAP

Container Station có option **Auto Start**:
1. Mở Container Station
2. Select container
3. Settings → Auto Start: Enable

---

## 🔒 Bảo mật

### 1. Firewall

**Synology:**
1. **Control Panel** → **Security** → **Firewall**
2. Create rule cho ports cần thiết:
   - 3000 (App)
   - 22 (SSH)

**QNAP:**
1. **Control Panel** → **Security** → **Firewall**
2. Configure tương tự

### 2. SSL Certificate

**Option 1: Let's Encrypt (nếu có domain)**
```bash
# Install certbot trong container
docker-compose exec app sh
apk add certbot
certbot certonly --standalone -d your-domain.com
```

**Option 2: Self-signed certificate**
```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem
```

### 3. Change Default Passwords

```bash
# Change database password
docker-compose exec postgres psql -U hvhcapp
ALTER USER hvhcapp WITH PASSWORD 'new-secure-password';
\q

# Update .env file
nano .env
# Update DB_PASSWORD
```

---

## 🆘 Troubleshooting

### Container không start

```bash
# Check logs
docker-compose logs app

# Check if port is in use
sudo netstat -tlnp | grep 3000

# Restart
docker-compose restart
```

### Out of memory

```bash
# Check memory usage
free -m

# Restart specific service
docker-compose restart app

# Or restart all
docker-compose restart
```

### Database connection failed

```bash
# Check if postgres is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Restart postgres
docker-compose restart postgres
```

### Cannot access from browser

1. Check NAS firewall settings
2. Check if port 3000 is open
3. Try with NAS IP: `http://192.168.x.x:3000`
4. Check container logs: `docker-compose logs app`

---

## 📞 Support

- **Email:** support@hvhc.edu.vn
- **Logs location:** `/volume1/docker/hvhc_bigdata/logs`
- **Backups:** `/volume1/docker/hvhc_bigdata/postgres_backups`

---

**Phiên bản:** 6.1  
**Cập nhật:** 15/10/2025  
**Người soạn:** HVHC IT Team
