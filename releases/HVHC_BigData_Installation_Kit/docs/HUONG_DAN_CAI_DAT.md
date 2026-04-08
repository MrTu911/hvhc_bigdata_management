# HƯỚNG DẪN CÀI ĐẶT HỆ THỐNG QUẢN LÝ DỮ LIỆU LỚN HVHC

## Mục lục
1. [Yêu cầu hệ thống](#1-yêu-cầu-hệ-thống)
2. [Cài đặt trên Ubuntu Server](#2-cài-đặt-trên-ubuntu-server)
3. [Cài đặt trên Laptop Ubuntu](#3-cài-đặt-trên-laptop-ubuntu)
4. [Cấu hình Database](#4-cấu-hình-database)
5. [Backup và Restore Database](#5-backup-và-restore-database)
6. [Khởi động ứng dụng](#6-khởi-động-ứng-dụng)
7. [Cấu hình Production](#7-cấu-hình-production)
8. [Xử lý sự cố](#8-xử-lý-sự-cố)

---

## 1. Yêu cầu hệ thống

### Phần cứng tối thiểu
| Thành phần | Ubuntu Server | Laptop Ubuntu |
|------------|---------------|---------------|
| CPU | 2 cores | 2 cores |
| RAM | 4 GB | 8 GB |
| Disk | 50 GB SSD | 100 GB SSD |
| Network | 100 Mbps | WiFi/Ethernet |

### Phần cứng khuyến nghị (Production)
| Thành phần | Cấu hình |
|------------|----------|
| CPU | 4+ cores |
| RAM | 16 GB |
| Disk | 200 GB NVMe SSD |
| Network | 1 Gbps |

### Phần mềm yêu cầu
- **Hệ điều hành**: Ubuntu 20.04 LTS / 22.04 LTS / 24.04 LTS
- **Node.js**: v18.x hoặc v20.x (LTS)
- **PostgreSQL**: 14.x hoặc 15.x
- **Redis**: 6.x hoặc 7.x (tùy chọn, cho caching)
- **Nginx**: 1.18+ (reverse proxy cho production)
- **Git**: 2.x

---

## 2. Cài đặt trên Ubuntu Server

### 2.1 Cập nhật hệ thống
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential
```

### 2.2 Cài đặt Node.js (v20 LTS)
```bash
# Cài đặt NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source $HOME/.bashrc

# Cài đặt Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Kiểm tra phiên bản
node -v  # Kết quả: v20.x.x
npm -v   # Kết quả: 10.x.x
```

### 2.3 Cài đặt Yarn
```bash
npm install -g yarn
yarn -v  # Kiểm tra phiên bản
```

### 2.4 Cài đặt PostgreSQL
```bash
# Cài đặt PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Khởi động PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Kiểm tra trạng thái
sudo systemctl status postgresql
```

### 2.5 Tạo Database
```bash
# Đăng nhập vào PostgreSQL
sudo -u postgres psql

# Tạo user và database
CREATE USER hvhc_admin WITH PASSWORD 'MatKhauManh@2025';
CREATE DATABASE hvhc_bigdata OWNER hvhc_admin;
GRANT ALL PRIVILEGES ON DATABASE hvhc_bigdata TO hvhc_admin;

# Thoát
\q
```

### 2.6 Cài đặt Redis (Tùy chọn - cho caching)
```bash
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Kiểm tra Redis
redis-cli ping  # Kết quả: PONG
```

### 2.7 Clone và cài đặt ứng dụng
```bash
# Tạo thư mục
cd /opt
sudo mkdir -p hvhc_bigdata
sudo chown $USER:$USER hvhc_bigdata
cd hvhc_bigdata

# Clone code (hoặc copy từ source)
# git clone https://github.com/your-org/hvhc_bigdata_management.git .
# Hoặc copy từ USB/network:
cp -r /path/to/source/* .

# Vào thư mục nextjs_space
cd nextjs_space

# Cài đặt dependencies
yarn install
```

### 2.8 Cấu hình môi trường
```bash
# Copy file môi trường mẫu
cp .env.example .env

# Chỉnh sửa file .env
nano .env
```

Nội dung file `.env`:
```env
# Database
DATABASE_URL="postgresql://hvhc_admin:MatKhauManh@2025@localhost:5432/hvhc_bigdata?schema=public"

# NextAuth
NEXTAUTH_URL="http://your-server-ip:3000"
NEXTAUTH_SECRET="your-random-secret-key-here"

# Redis (tùy chọn)
REDIS_URL="redis://localhost:6379"

# AI/ML (tùy chọn)
ABACUSAI_API_KEY="your-api-key"
```

### 2.9 Khởi tạo Database
```bash
# Generate Prisma Client
yarn prisma generate

# Tạo tables
yarn prisma db push

# Seed dữ liệu mẫu
yarn prisma db seed
```

### 2.10 Build ứng dụng
```bash
yarn build
```

### 2.11 Khởi động ứng dụng
```bash
# Development mode
yarn dev

# Production mode
yarn start
```

---

## 3. Cài đặt trên Laptop Ubuntu

### 3.1 Cài đặt nhanh (Script tự động)
```bash
# Download và chạy script cài đặt
chmod +x scripts/deployment/install.sh
./scripts/deployment/install.sh
```

### 3.2 Cài đặt thủ công
Làm theo các bước tương tự phần 2 (Ubuntu Server), với một số khác biệt:

#### Cài đặt Desktop dependencies
```bash
sudo apt install -y postgresql-client pgadmin4
```

#### Sử dụng Docker (Tùy chọn)
```bash
# Cài đặt Docker
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker $USER

# Khởi động với Docker
docker-compose up -d
```

---

## 4. Cấu hình Database

### 4.1 Cấu trúc Database
```
hvhc_bigdata/
├── users              # Tài khoản người dùng
├── personnel          # Quân nhân
├── faculty_profiles   # Giảng viên
├── hoc_vien          # Học viên
├── party_members     # Đảng viên
├── units             # Đơn vị
├── departments       # Khoa/Phòng
├── positions         # Chức vụ
├── rbac_functions    # Phân quyền
└── ... (80+ tables)
```

### 4.2 Quản lý Database
```bash
# Xem danh sách tables
yarn prisma studio

# Tạo migration mới
yarn prisma migrate dev --name "ten_migration"

# Apply migration cho production
yarn prisma migrate deploy
```

---

## 5. Backup và Restore Database

### 5.1 Backup Database

#### Script backup tự động
```bash
chmod +x scripts/deployment/backup-database.sh
./scripts/deployment/backup-database.sh
```

#### Backup thủ công
```bash
# Backup toàn bộ database
pg_dump -h localhost -U hvhc_admin -d hvhc_bigdata -F c -b -v -f "backup_$(date +%Y%m%d_%H%M%S).dump"

# Backup chỉ schema
pg_dump -h localhost -U hvhc_admin -d hvhc_bigdata -s -f "schema_$(date +%Y%m%d).sql"

# Backup chỉ data
pg_dump -h localhost -U hvhc_admin -d hvhc_bigdata -a -f "data_$(date +%Y%m%d).sql"
```

### 5.2 Restore Database

#### Script restore
```bash
chmod +x scripts/deployment/restore-database.sh
./scripts/deployment/restore-database.sh backup_20250228_120000.dump
```

#### Restore thủ công
```bash
# Restore từ file .dump
pg_restore -h localhost -U hvhc_admin -d hvhc_bigdata -v backup_file.dump

# Restore từ file .sql
psql -h localhost -U hvhc_admin -d hvhc_bigdata < backup_file.sql
```

### 5.3 Cấu hình Backup tự động (Cron)
```bash
# Mở crontab
crontab -e

# Thêm dòng sau (backup lúc 2:00 AM mỗi ngày)
0 2 * * * /opt/hvhc_bigdata/nextjs_space/scripts/deployment/backup-database.sh >> /var/log/hvhc_backup.log 2>&1

# Backup hàng tuần (Chủ nhật 3:00 AM)
0 3 * * 0 /opt/hvhc_bigdata/nextjs_space/scripts/deployment/backup-database.sh --full >> /var/log/hvhc_backup_weekly.log 2>&1
```

---

## 6. Khởi động ứng dụng

### 6.1 Development Mode
```bash
cd /opt/hvhc_bigdata/nextjs_space
yarn dev
```
Truy cập: http://localhost:3000

### 6.2 Production Mode
```bash
# Build
yarn build

# Start
yarn start
```

### 6.3 Sử dụng PM2 (Production)
```bash
# Cài đặt PM2
npm install -g pm2

# Khởi động ứng dụng
pm2 start yarn --name "hvhc-bigdata" -- start

# Các lệnh quản lý
pm2 status           # Xem trạng thái
pm2 logs hvhc-bigdata   # Xem logs
pm2 restart hvhc-bigdata # Khởi động lại
pm2 stop hvhc-bigdata    # Dừng

# Tự động khởi động khi reboot
pm2 startup
pm2 save
```

### 6.4 Sử dụng Systemd Service
```bash
# Tạo service file
sudo nano /etc/systemd/system/hvhc-bigdata.service
```

Nội dung file service:
```ini
[Unit]
Description=HVHC BigData Management System
After=network.target postgresql.service

[Service]
Type=simple
User=hvhc
WorkingDirectory=/opt/hvhc_bigdata/nextjs_space
ExecStart=/usr/bin/yarn start
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

```bash
# Enable và start service
sudo systemctl daemon-reload
sudo systemctl enable hvhc-bigdata
sudo systemctl start hvhc-bigdata

# Kiểm tra status
sudo systemctl status hvhc-bigdata
```

---

## 7. Cấu hình Production

### 7.1 Cài đặt Nginx (Reverse Proxy)
```bash
sudo apt install -y nginx
```

#### Cấu hình Nginx
```bash
sudo nano /etc/nginx/sites-available/hvhc-bigdata
```

```nginx
server {
    listen 80;
    server_name bigdata.hvhc.edu.vn;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/hvhc-bigdata /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7.2 Cài đặt SSL (Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d bigdata.hvhc.edu.vn
```

### 7.3 Cấu hình Firewall
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## 8. Xử lý sự cố

### 8.1 Lỗi thường gặp

#### Lỗi kết nối Database
```bash
# Kiểm tra PostgreSQL đang chạy
sudo systemctl status postgresql

# Kiểm tra kết nối
psql -h localhost -U hvhc_admin -d hvhc_bigdata -c "SELECT 1;"

# Kiểm tra file pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

#### Lỗi Prisma
```bash
# Regenerate Prisma Client
yarn prisma generate

# Reset database (CẢNH BÁO: Xóa toàn bộ dữ liệu)
yarn prisma migrate reset
```

#### Lỗi Port đã được sử dụng
```bash
# Kiểm tra port 3000
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>
```

### 8.2 Logs
```bash
# Application logs
pm2 logs hvhc-bigdata

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### 8.3 Liên hệ hỗ trợ
- **Email**: support@hvhc.edu.vn
- **Hotline**: 1900-xxxx
- **Documentation**: https://docs.hvhc.edu.vn

---

## Phụ lục

### A. Danh sách Commands thường dùng
```bash
# Quản lý ứng dụng
yarn dev          # Chạy development
yarn build        # Build production
yarn start        # Chạy production

# Quản lý Database
yarn prisma studio           # Mở Prisma Studio
yarn prisma generate         # Generate client
yarn prisma db push          # Push schema
yarn prisma migrate dev      # Tạo migration
yarn prisma db seed          # Seed data

# Quản lý PM2
pm2 status
pm2 restart hvhc-bigdata
pm2 logs hvhc-bigdata
```

### B. Cấu trúc thư mục
```
hvhc_bigdata_management/
├── nextjs_space/
│   ├── app/              # Pages và API routes
│   ├── components/       # React components
│   ├── lib/              # Utilities
│   ├── prisma/           # Database schema
│   ├── public/           # Static files
│   ├── scripts/          # Scripts
│   │   └── deployment/   # Deployment scripts
│   ├── docs/             # Documentation
│   ├── .env              # Environment variables
│   └── package.json
└── README.md
```

### C. Tài khoản mặc định
| Email | Mật khẩu | Vai trò |
|-------|----------|--------|
| admin@hvhc.edu.vn | Hv@2025 | System Admin |
| giamdoc@hvhc.edu.vn | Hv@2025 | Giám đốc |

---

**Phiên bản tài liệu**: 1.0  
**Cập nhật lần cuối**: 28/02/2026  
**Tác giả**: Đội phát triển HVHC BigData
