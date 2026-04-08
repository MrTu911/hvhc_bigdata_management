# HƯỚNG DẪN CÀI ĐẶT VÀ PHÁT TRIỂN PHẦN MỀM HVHC BIGDATA

## 📋 Mục Lục
1. [Yêu Cầu Hệ Thống](#1-yêu-cầu-hệ-thống)
2. [Backup Database](#2-backup-database)
3. [Cài Đặt Trên VPS](#3-cài-đặt-trên-vps)
4. [Cài Đặt Trên Laptop Ubuntu](#4-cài-đặt-trên-laptop-ubuntu)
5. [Cấu Hình Môi Trường](#5-cấu-hình-môi-trường)
6. [Chạy Ứng Dụng](#6-chạy-ứng-dụng)
7. [Xử Lý Lỗi Thường Gặp](#7-xử-lý-lỗi-thường-gặp)

---

## 1. Yêu Cầu Hệ Thống

### VPS/Server
- **OS:** Ubuntu 20.04/22.04 LTS
- **RAM:** Tối thiểu 4GB (khuyến nghị 8GB)
- **CPU:** 2 vCPU trở lên
- **Disk:** 50GB SSD
- **Network:** Mở ports 22 (SSH), 80/443 (HTTP/HTTPS), 3000 (Dev), 5432 (PostgreSQL)

### Laptop Ubuntu (Development)
- **OS:** Ubuntu 20.04/22.04/24.04 LTS
- **RAM:** Tối thiểu 8GB
- **Disk:** 20GB free space
- **Node.js:** v18.x hoặc v20.x
- **PostgreSQL:** v14 hoặc v15

---

## 2. Backup Database

### 2.1. Backup từ Abacus AI Database

Kết nối database hiện tại:
```bash
# Thông tin kết nối
HOST=db-10861c45f0.db002.hosteddb.reai.io
PORT=5432
DATABASE=10861c45f0
USER=role_10861c45f0
PASSWORD=s6S4T6QZAS6JdEVoV1Y6FbbHIYjCX4Dt
```

### 2.2. Export Full Database
```bash
# Cài đặt PostgreSQL client
sudo apt install postgresql-client -y

# Export toàn bộ database
PGPASSWORD='s6S4T6QZAS6JdEVoV1Y6FbbHIYjCX4Dt' pg_dump \
  -h db-10861c45f0.db002.hosteddb.reai.io \
  -p 5432 \
  -U role_10861c45f0 \
  -d 10861c45f0 \
  -F c -b -v \
  -f hvhc_backup_$(date +%Y%m%d).dump

# Hoặc export dạng SQL
PGPASSWORD='s6S4T6QZAS6JdEVoV1Y6FbbHIYjCX4Dt' pg_dump \
  -h db-10861c45f0.db002.hosteddb.reai.io \
  -p 5432 \
  -U role_10861c45f0 \
  -d 10861c45f0 \
  --no-owner --no-acl \
  -f hvhc_backup_$(date +%Y%m%d).sql
```

### 2.3. Export Schema Only (không data)
```bash
PGPASSWORD='s6S4T6QZAS6JdEVoV1Y6FbbHIYjCX4Dt' pg_dump \
  -h db-10861c45f0.db002.hosteddb.reai.io \
  -p 5432 \
  -U role_10861c45f0 \
  -d 10861c45f0 \
  --schema-only --no-owner --no-acl \
  -f hvhc_schema_$(date +%Y%m%d).sql
```

### 2.4. Export Data Only (từng bảng quan trọng)
```bash
# Export data từng bảng
TABLES="users personnel units user_positions party_members officer_careers soldier_profiles insurance_info policy_records"

for table in $TABLES; do
  PGPASSWORD='s6S4T6QZAS6JdEVoV1Y6FbbHIYjCX4Dt' psql \
    -h db-10861c45f0.db002.hosteddb.reai.io \
    -p 5432 \
    -U role_10861c45f0 \
    -d 10861c45f0 \
    -c "\COPY $table TO '${table}_data.csv' WITH CSV HEADER"
done
```

---

## 3. Cài Đặt Trên VPS

### 3.1. Cài đặt các phần mềm cần thiết
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Cài đặt Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Cài đặt Yarn
sudo npm install -g yarn

# Cài đặt PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Cài đặt Git
sudo apt install -y git

# Cài đặt PM2 (process manager)
sudo npm install -g pm2

# Cài đặt Nginx (reverse proxy)
sudo apt install -y nginx
```

### 3.2. Thiết lập PostgreSQL
```bash
# Đăng nhập PostgreSQL
sudo -u postgres psql

# Tạo database và user
CREATE USER hvhc_admin WITH PASSWORD 'YourStrongPassword123!';
CREATE DATABASE hvhc_bigdata OWNER hvhc_admin;
GRANT ALL PRIVILEGES ON DATABASE hvhc_bigdata TO hvhc_admin;
\q

# Cho phép remote access (optional)
sudo nano /etc/postgresql/14/main/postgresql.conf
# Thay đổi: listen_addresses = '*'

sudo nano /etc/postgresql/14/main/pg_hba.conf
# Thêm dòng: host all all 0.0.0.0/0 md5

sudo systemctl restart postgresql
```

### 3.3. Restore Database
```bash
# Restore từ dump file
pg_restore -h localhost -U hvhc_admin -d hvhc_bigdata -v hvhc_backup_YYYYMMDD.dump

# Hoặc từ SQL file
psql -h localhost -U hvhc_admin -d hvhc_bigdata -f hvhc_backup_YYYYMMDD.sql
```

### 3.4. Clone và cài đặt source code
```bash
# Tạo thư mục ứng dụng
sudo mkdir -p /var/www/hvhc_bigdata
sudo chown -R $USER:$USER /var/www/hvhc_bigdata

# Clone từ Git (nếu có repo)
git clone <your-git-repo> /var/www/hvhc_bigdata

# Hoặc copy từ local
rsync -avz --progress ./hvhc_bigdata_management/ user@vps-ip:/var/www/hvhc_bigdata/

# Cài đặt dependencies
cd /var/www/hvhc_bigdata/nextjs_space
yarn install

# Generate Prisma client
yarn prisma generate

# Build ứng dụng
yarn build
```

### 3.5. Cấu hình Nginx
```bash
sudo nano /etc/nginx/sites-available/hvhc_bigdata
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

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
sudo ln -s /etc/nginx/sites-available/hvhc_bigdata /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3.6. Chạy ứng dụng với PM2
```bash
cd /var/www/hvhc_bigdata/nextjs_space

# Start với PM2
pm2 start npm --name "hvhc-bigdata" -- start

# Tự động khởi động khi reboot
pm2 startup
pm2 save
```

---

## 4. Cài Đặt Trên Laptop Ubuntu (Development)

### 4.1. Cài đặt môi trường
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Cài đặt Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Kiểm tra version
node -v  # v20.x
npm -v   # 10.x

# Cài đặt Yarn
sudo npm install -g yarn

# Cài đặt PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Cài đặt Git
sudo apt install -y git
```

### 4.2. Thiết lập PostgreSQL Local
```bash
# Đăng nhập PostgreSQL
sudo -u postgres psql

# Tạo database và user
CREATE USER hvhc_dev WITH PASSWORD 'hvhc_dev_2025';
CREATE DATABASE hvhc_bigdata_dev OWNER hvhc_dev;
GRANT ALL PRIVILEGES ON DATABASE hvhc_bigdata_dev TO hvhc_dev;
ALTER USER hvhc_dev CREATEDB;
\q
```

### 4.3. Clone và cài đặt project
```bash
# Tạo thư mục làm việc
mkdir -p ~/projects
cd ~/projects

# Giải nén hoặc clone project
# Từ file zip:
unzip hvhc_bigdata_management.zip -d .

# Hoặc từ Git:
git clone <your-git-repo> hvhc_bigdata_management

# Di chuyển vào project
cd hvhc_bigdata_management/nextjs_space

# Cài đặt dependencies
yarn install
```

### 4.4. Cấu hình môi trường local
```bash
# Tạo file .env
cp .env.example .env
# Hoặc tạo mới:
nano .env
```

Nội dung `.env` cho development:
```env
# Database - Local PostgreSQL
DATABASE_URL='postgresql://hvhc_dev:hvhc_dev_2025@localhost:5432/hvhc_bigdata_dev'

# NextAuth
NEXTAUTH_SECRET='your-secret-key-generate-with-openssl-rand-base64-32'
NEXTAUTH_URL='http://localhost:3000'

# Abacus AI (optional - for AI features)
ABACUSAI_API_KEY='your-abacus-api-key'

# AWS S3 (optional - for file uploads)
AWS_BUCKET_NAME=''
AWS_FOLDER_PREFIX=''

# Redis (optional)
REDIS_URL=''

# SMTP (optional)
SMTP_HOST=''
SMTP_PORT=''
SMTP_USER=''
SMTP_PASS=''
```

### 4.5. Thiết lập Database
```bash
# Push schema to database
yarn prisma db push

# Generate Prisma client
yarn prisma generate

# Seed dữ liệu mẫu (nếu có)
yarn prisma db seed

# Hoặc restore từ backup
psql -h localhost -U hvhc_dev -d hvhc_bigdata_dev -f hvhc_backup_YYYYMMDD.sql
```

### 4.6. Chạy Development Server
```bash
# Start development server
yarn dev

# Ứng dụng sẽ chạy tại http://localhost:3000
```

---

## 5. Cấu Hình Môi Trường

### 5.1. Biến môi trường bắt buộc

| Biến | Mô tả | Ví dụ |
|------|-------|-------|
| `DATABASE_URL` | Connection string PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | Secret key cho authentication | Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL của ứng dụng | `http://localhost:3000` hoặc `https://domain.com` |

### 5.2. Biến môi trường tùy chọn

| Biến | Mô tả | Mặc định |
|------|-------|----------|
| `ABACUSAI_API_KEY` | API key cho AI features | - |
| `AWS_BUCKET_NAME` | S3 bucket cho file uploads | - |
| `REDIS_URL` | Redis connection string | - |
| `SMTP_HOST` | SMTP server | - |

### 5.3. Generate NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```

---

## 6. Chạy Ứng Dụng

### 6.1. Development
```bash
cd hvhc_bigdata_management/nextjs_space
yarn dev
```

### 6.2. Production Build
```bash
# Build
yarn build

# Start production server
yarn start
```

### 6.3. Với PM2 (Production)
```bash
# Start
pm2 start npm --name "hvhc" -- start

# Xem logs
pm2 logs hvhc

# Restart
pm2 restart hvhc

# Stop
pm2 stop hvhc
```

---

## 7. Xử Lý Lỗi Thường Gặp

### 7.1. Lỗi kết nối Database
```bash
# Kiểm tra PostgreSQL đang chạy
sudo systemctl status postgresql

# Kiểm tra connection string
psql "postgresql://user:pass@host:5432/db" -c "SELECT 1;"

# Reset Prisma
rm -rf node_modules/.prisma
yarn prisma generate
```

### 7.2. Lỗi Prisma
```bash
# Reset Prisma client
yarn prisma generate

# Sync schema với database
yarn prisma db push

# Xem schema hiện tại
yarn prisma studio
```

### 7.3. Lỗi Dependencies
```bash
# Xóa và cài lại
rm -rf node_modules yarn.lock
yarn install
```

### 7.4. Lỗi Port 3000 đã dùng
```bash
# Tìm process đang dùng port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### 7.5. Lỗi Permission
```bash
# Fix permissions
sudo chown -R $USER:$USER ~/projects/hvhc_bigdata_management
chmod -R 755 ~/projects/hvhc_bigdata_management
```

---

## 📞 Thông Tin Hỗ Trợ

- **Admin Account:** john@doe.com / johndoe123
- **Tài liệu API:** `/api-docs` hoặc `/docs`
- **Prisma Studio:** `yarn prisma studio` (port 5555)

---

## 📊 Thống Kê Database Hiện Tại

| Bảng | Số bản ghi |
|------|------------|
| Users | 287 |
| Personnel | 287 |
| Units | ~50 |
| UserPositions | 280 |
| PartyMembers | 251 |
| OfficerCareers | 250 |
| SoldierProfiles | 36 |
| InsuranceInfo | 287 |
| PolicyRecords | 287 |

---

**Phiên bản:** 8.0  
**Cập nhật:** 20/02/2026  
**Tác giả:** HVHC BigData Team
