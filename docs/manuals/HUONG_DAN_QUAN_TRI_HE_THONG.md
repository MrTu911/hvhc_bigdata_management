
# HƯỚNG DẪN SỬ DỤNG HỆ THỐNG BIG DATA
## DÀNH CHO QUẢN TRỊ VIÊN HỆ THỐNG & ĐỘI NGŨ PHÁT TRIỂN

**Phiên bản:** 1.0  
**Ngày ban hành:** 10/10/2025  
**Đơn vị:** Học viện Hậu cần - Bộ Quốc phòng

---

## MỤC LỤC

1. [Giới thiệu](#1-giới-thiệu)
2. [Vai trò và Trách nhiệm](#2-vai-trò-và-trách-nhiệm)
3. [Hướng dẫn Cài đặt và Triển khai](#3-hướng-dẫn-cài-đặt-và-triển-khai)
4. [Quản lý Hệ thống](#4-quản-lý-hệ-thống)
5. [Quản lý Người dùng và Phân quyền](#5-quản-lý-người-dùng-và-phân-quyền)
6. [Giám sát và Vận hành](#6-giám-sát-và-vận-hành)
7. [Sao lưu và Phục hồi](#7-sao-lưu-và-phục-hồi)
8. [Bảo mật Hệ thống](#8-bảo-mật-hệ-thống)
9. [Xử lý Sự cố](#9-xử-lý-sự-cố)
10. [API Documentation](#10-api-documentation)

---

## 1. GIỚI THIỆU

### 1.1. Về Hệ thống
Hệ thống Big Data của Học viện Hậu cần là nền tảng quản lý dữ liệu tập trung, hỗ trợ:
- Quản lý Data Lake và Data Warehouse
- Machine Learning và AI cho nghiên cứu quân sự
- Phân tích dữ liệu đào tạo và nghiên cứu
- Hỗ trợ ra quyết định chiến lược

### 1.2. Kiến trúc Hệ thống
```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│                   Port: 3000 (Dev)                       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                 API Layer (Next.js API)                  │
│              Authentication (NextAuth.js)                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────┬──────────────────┬───────────────────┐
│   PostgreSQL     │    Data Lake     │   ML Engine       │
│   (Primary DB)   │   (S3/MinIO)     │   (Python/Flask)  │
│   Port: 5432     │                  │   Port: 5000      │
└──────────────────┴──────────────────┴───────────────────┘
```

---

## 2. VAI TRÒ VÀ TRÁCH NHIỆM

### 2.1. Quản trị viên Hệ thống
**Trách nhiệm chính:**
- Cài đặt, cấu hình và duy trì hệ thống
- Quản lý cơ sở hạ tầng (servers, databases, storage)
- Giám sát hiệu suất và tối ưu hóa
- Sao lưu và phục hồi dữ liệu
- Đảm bảo bảo mật và tuân thủ chính sách

**Quyền truy cập:**
- Full access toàn bộ hệ thống
- Quản lý tất cả người dùng và phân quyền
- Truy cập logs và monitoring tools
- Quản lý database và storage

### 2.2. Đội ngũ Phát triển
**Trách nhiệm chính:**
- Phát triển và bảo trì code base
- Triển khai tính năng mới
- Sửa lỗi và tối ưu hóa
- Viết và duy trì documentation
- Testing và quality assurance

**Quyền truy cập:**
- Truy cập source code repository
- Môi trường development và staging
- API testing tools
- Database read access (production)

---

## 3. HƯỚNG DẪN CÀI ĐẶT VÀ TRIỂN KHAI

### 3.1. Yêu cầu Hệ thống

**Phần cứng tối thiểu:**
- CPU: 8 cores (Intel Xeon hoặc tương đương)
- RAM: 32 GB
- Storage: 500 GB SSD + 2 TB HDD
- Network: 1 Gbps

**Phần mềm:**
- Ubuntu 20.04 LTS hoặc cao hơn
- Docker 24.0+ và Docker Compose 2.0+
- Node.js 18.x LTS
- PostgreSQL 15.x
- Python 3.10+

### 3.2. Cài đặt từ Source Code

#### Bước 1: Clone Repository
```bash
# Clone từ GitLab/GitHub nội bộ
git clone https://gitlab.hvhc.edu.vn/bigdata/hvhc-bigdata-system.git
cd hvhc-bigdata-system

# Checkout branch production
git checkout production
```

#### Bước 2: Cấu hình Environment Variables
```bash
# Copy file mẫu
cp .env.example .env

# Chỉnh sửa các biến môi trường
nano .env
```

**Các biến quan trọng:**
```env
# Database
DATABASE_URL="postgresql://admin:password@localhost:5432/bigdata_hvhc"
POSTGRES_USER=admin
POSTGRES_PASSWORD=<strong_password>
POSTGRES_DB=bigdata_hvhc

# NextAuth
NEXTAUTH_URL=https://bigdata.hvhc.edu.vn
NEXTAUTH_SECRET=<generate_random_string_32_chars>

# ML Engine
ML_ENGINE_URL=http://localhost:5000
ML_ENGINE_API_KEY=<generate_api_key>

# Storage
AWS_BUCKET_NAME=hvhc-datalake
AWS_FOLDER_PREFIX=production/
AWS_REGION=us-east-1

# Monitoring
LOG_LEVEL=info
ENABLE_METRICS=true
```

#### Bước 3: Khởi động Database
```bash
# Sử dụng Docker Compose
docker-compose up -d postgres

# Chờ database khởi động
sleep 10

# Chạy migrations
cd nextjs_space
yarn prisma migrate deploy
yarn prisma generate
```

#### Bước 4: Seed Initial Data
```bash
# Tạo dữ liệu mẫu và admin user
yarn prisma db seed

# Admin credentials mặc định:
# Email: admin@hvhc.edu.vn
# Password: Admin@123456
```

#### Bước 5: Build và Deploy Frontend
```bash
# Install dependencies
yarn install

# Build production
yarn build

# Start production server
yarn start
```

#### Bước 6: Deploy ML Engine
```bash
cd ../ml_engine

# Tạo virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start ML service
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### 3.3. Triển khai với Docker (Khuyến nghị)

#### Sử dụng Docker Compose
```bash
# Build và start tất cả services
docker-compose up -d

# Kiểm tra trạng thái
docker-compose ps

# Xem logs
docker-compose logs -f

# Dừng hệ thống
docker-compose down
```

**File docker-compose.yml:**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: bigdata-postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./sql_migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    networks:
      - bigdata-network

  nextjs:
    build:
      context: ./nextjs_space
      dockerfile: Dockerfile
    container_name: bigdata-frontend
    environment:
      DATABASE_URL: ${DATABASE_URL}
      NEXTAUTH_URL: ${NEXTAUTH_URL}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    networks:
      - bigdata-network

  ml_engine:
    build:
      context: ./ml_engine
      dockerfile: Dockerfile
    container_name: bigdata-ml-engine
    environment:
      ML_ENGINE_API_KEY: ${ML_ENGINE_API_KEY}
    ports:
      - "5000:5000"
    networks:
      - bigdata-network

volumes:
  postgres_data:

networks:
  bigdata-network:
    driver: bridge
```

### 3.4. Cấu hình Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/bigdata.hvhc.edu.vn
server {
    listen 80;
    server_name bigdata.hvhc.edu.vn;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name bigdata.hvhc.edu.vn;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/hvhc.crt;
    ssl_certificate_key /etc/ssl/private/hvhc.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ML Engine API
    location /api/ml/ {
        proxy_pass http://localhost:5000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # File upload limit
    client_max_body_size 500M;
}
```

**Kích hoạt cấu hình:**
```bash
sudo ln -s /etc/nginx/sites-available/bigdata.hvhc.edu.vn /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 4. QUẢN LÝ HỆ THỐNG

### 4.1. Dashboard Quản trị

Truy cập: `https://bigdata.hvhc.edu.vn/admin`

**Chức năng chính:**
- Giám sát hệ thống real-time
- Quản lý người dùng và quyền hạn
- Cấu hình hệ thống
- Xem logs và audit trail
- Thống kê sử dụng

### 4.2. Quản lý Cơ sở dữ liệu

#### Kết nối Database
```bash
# Kết nối PostgreSQL
psql -h localhost -U admin -d bigdata_hvhc

# Hoặc sử dụng pgAdmin
# URL: https://bigdata.hvhc.edu.vn/pgadmin
```

#### Các thao tác Database thường dùng

**Kiểm tra kích thước database:**
```sql
SELECT pg_size_pretty(pg_database_size('bigdata_hvhc')) AS database_size;

SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;
```

**Theo dõi active connections:**
```sql
SELECT 
    datname,
    count(*) as connections,
    max(backend_start) as oldest_connection
FROM pg_stat_activity
GROUP BY datname;
```

**Kiểm tra slow queries:**
```sql
SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query,
    state
FROM pg_stat_activity
WHERE state != 'idle'
  AND now() - pg_stat_activity.query_start > interval '5 seconds'
ORDER BY duration DESC;
```

#### Database Maintenance

**Vacuum và Analyze (chạy hàng tuần):**
```sql
-- Vacuum full database
VACUUM ANALYZE;

-- Vacuum specific tables
VACUUM ANALYZE training_sessions;
VACUUM ANALYZE research_projects;
VACUUM ANALYZE datasets;
```

**Reindex (chạy hàng tháng):**
```sql
REINDEX DATABASE bigdata_hvhc;
```

### 4.3. Quản lý Data Lake

#### Cấu hình Storage Backend

**Sử dụng MinIO (On-premise):**
```bash
# Start MinIO server
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  --name minio \
  -v /data/minio:/data \
  -e "MINIO_ROOT_USER=admin" \
  -e "MINIO_ROOT_PASSWORD=<strong_password>" \
  minio/minio server /data --console-address ":9001"

# Access MinIO Console
# URL: http://localhost:9001
```

**Tạo Bucket:**
```bash
# Install MinIO client
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/

# Configure
mc alias set hvhc http://localhost:9000 admin <password>

# Create bucket
mc mb hvhc/hvhc-datalake

# Set policy
mc policy set download hvhc/hvhc-datalake
```

#### Quản lý Dữ liệu

**Xem danh sách files:**
```bash
mc ls hvhc/hvhc-datalake/
```

**Upload files:**
```bash
mc cp /path/to/file hvhc/hvhc-datalake/datasets/
```

**Download files:**
```bash
mc cp hvhc/hvhc-datalake/datasets/file.csv /local/path/
```

**Xóa files:**
```bash
mc rm hvhc/hvhc-datalake/old-data/file.csv
```

### 4.4. Quản lý ML Engine

#### Kiểm tra trạng thái
```bash
# Health check
curl http://localhost:5000/health

# Version info
curl http://localhost:5000/version
```

#### Xem ML Models
```bash
# List all models
curl -X GET http://localhost:5000/api/models \
  -H "Authorization: Bearer ${ML_ENGINE_API_KEY}"

# Get model details
curl -X GET http://localhost:5000/api/models/{model_id} \
  -H "Authorization: Bearer ${ML_ENGINE_API_KEY}"
```

#### Logs ML Engine
```bash
# Docker logs
docker logs -f bigdata-ml-engine

# File logs
tail -f /var/log/ml_engine/app.log
```

---

## 5. QUẢN LÝ NGƯỜI DÙNG VÀ PHÂN QUYỀN

### 5.1. Hệ thống Phân quyền

**Các Role trong hệ thống:**

| Role | Mô tả | Quyền hạn |
|------|-------|-----------|
| SUPER_ADMIN | Quản trị viên tối cao | Full access toàn bộ hệ thống |
| ADMIN | Quản trị viên | Quản lý người dùng, dữ liệu, hệ thống |
| ACADEMY_LEADER | Chỉ huy học viện | Xem báo cáo tổng hợp, phê duyệt dự án |
| DEPARTMENT_LEADER | Chỉ huy Khoa/Phòng | Quản lý đơn vị, xem báo cáo |
| DIVISION_LEADER | Chỉ huy Ban/Bộ môn | Quản lý bộ môn, duyệt nghiên cứu |
| INSTRUCTOR | Giảng viên | Quản lý lớp, tạo dataset, nghiên cứu |
| RESEARCHER | Nghiên cứu viên | Tạo dự án nghiên cứu, ML experiments |
| STUDENT | Học viên/Sinh viên | Xem tài liệu, tham gia training |

### 5.2. Tạo Người dùng Mới

#### Qua Web Interface
1. Đăng nhập với tài khoản Admin
2. Vào **Admin > Quản lý Người dùng**
3. Click **"Tạo Người dùng Mới"**
4. Điền thông tin:
   - Họ tên
   - Email (định dạng: @hvhc.edu.vn)
   - Số điện thoại
   - Đơn vị
   - Chức vụ
   - Role
5. Mật khẩu mặc định: `HvHC@2025`
6. Gửi email thông báo cho người dùng

#### Qua API
```bash
curl -X POST https://bigdata.hvhc.edu.vn/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -d '{
    "email": "nguyenvana@hvhc.edu.vn",
    "fullName": "Nguyễn Văn A",
    "role": "INSTRUCTOR",
    "department": "Khoa Quân lý",
    "position": "Giảng viên",
    "phone": "0123456789"
  }'
```

#### Qua Database (Batch Import)
```sql
-- Import từ CSV
COPY users(email, full_name, role, department, position)
FROM '/tmp/users.csv'
DELIMITER ','
CSV HEADER;

-- Update password (bcrypt hash)
UPDATE users 
SET password_hash = '$2b$10$...' 
WHERE email = 'nguyenvana@hvhc.edu.vn';
```

### 5.3. Phân quyền Chi tiết

#### Permission Matrix

**Chức năng theo Role:**

| Chức năng | SUPER_ADMIN | ADMIN | ACADEMY_LEADER | DEPT_LEADER | DIV_LEADER | INSTRUCTOR | RESEARCHER | STUDENT |
|-----------|-------------|-------|----------------|-------------|------------|------------|------------|---------|
| Quản lý hệ thống | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Quản lý người dùng | ✓ | ✓ | Chỉ xem | ✗ | ✗ | ✗ | ✗ | ✗ |
| Xem Dashboard tổng hợp | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Quản lý Data Lake | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Tạo Dataset | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| Xem Dataset | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tạo Dự án Nghiên cứu | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ | ✓ | ✗ |
| Phê duyệt Nghiên cứu | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| ML Training | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| Quản lý Lớp học | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| Xem Báo cáo | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Export Dữ liệu | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |

#### Thiết lập Permission cho User
```typescript
// Qua Admin UI
// 1. Chọn user
// 2. Tab "Phân quyền"
// 3. Chọn các permissions cụ thể

// Hoặc qua API
curl -X POST https://bigdata.hvhc.edu.vn/api/admin/users/{userId}/permissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -d '{
    "permissions": [
      "datalake:read",
      "datalake:write",
      "research:create",
      "research:approve",
      "ml:train",
      "reports:view"
    ]
  }'
```

### 5.4. Quản lý Session và Security

#### Cấu hình Session
```typescript
// File: nextjs_space/lib/auth.ts

export const authOptions = {
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add custom fields
      if (user) {
        token.role = user.role;
        token.department = user.department;
      }
      return token;
    },
  },
};
```

#### Force Logout All Users
```sql
-- Invalidate all sessions
DELETE FROM sessions WHERE expires_at < NOW() + INTERVAL '24 hours';

-- Revoke all tokens
UPDATE users SET token_version = token_version + 1;
```

#### Password Policy
```typescript
// Minimum requirements:
// - Ít nhất 8 ký tự
// - 1 chữ hoa
// - 1 chữ thường
// - 1 số
// - 1 ký tự đặc biệt

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
```

---

## 6. GIÁM SÁT VÀ VẬN HÀNH

### 6.1. Monitoring Dashboard

**Truy cập Grafana:**
- URL: `https://bigdata.hvhc.edu.vn/grafana`
- Credentials: admin / <admin_password>

**Các Dashboard quan trọng:**
1. **System Overview** - Tổng quan hệ thống
2. **Database Metrics** - PostgreSQL performance
3. **API Performance** - Response times, error rates
4. **ML Engine** - Model training, inference stats
5. **User Activity** - Login, active users, actions

### 6.2. Logging

#### Cấu hình Log Levels
```env
# .env
LOG_LEVEL=info  # debug | info | warn | error

# Enable detailed logging
DEBUG=bigdata:*
```

#### Xem Logs

**Application Logs:**
```bash
# Next.js logs
pm2 logs bigdata-frontend

# ML Engine logs
journalctl -u ml-engine -f

# Nginx logs
tail -f /var/log/nginx/bigdata-access.log
tail -f /var/log/nginx/bigdata-error.log
```

**Database Logs:**
```bash
# PostgreSQL logs
tail -f /var/log/postgresql/postgresql-15-main.log

# Enable slow query logging
# File: /etc/postgresql/15/main/postgresql.conf
log_min_duration_statement = 1000  # Log queries > 1s
```

#### Log Rotation
```bash
# /etc/logrotate.d/bigdata
/var/log/bigdata/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload nginx
    endscript
}
```

### 6.3. Health Checks

**Automated Health Check Script:**
```bash
#!/bin/bash
# File: /usr/local/bin/bigdata-healthcheck.sh

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=== BigData System Health Check ==="
echo ""

# Check Frontend
echo -n "Frontend (Next.js): "
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
fi

# Check Database
echo -n "Database (PostgreSQL): "
if pg_isready -h localhost -p 5432 -U admin > /dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
fi

# Check ML Engine
echo -n "ML Engine: "
if curl -s http://localhost:5000/health | grep -q "ok"; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
fi

# Check Disk Space
echo ""
echo "Disk Usage:"
df -h | grep -E '/$|/data'

# Check Memory
echo ""
echo "Memory Usage:"
free -h

# Check CPU Load
echo ""
echo "CPU Load:"
uptime
```

**Chạy định kỳ với Cron:**
```bash
# Chạy mỗi 5 phút
*/5 * * * * /usr/local/bin/bigdata-healthcheck.sh >> /var/log/bigdata/healthcheck.log 2>&1
```

### 6.4. Performance Monitoring

#### Giám sát Database Performance
```sql
-- Query performance
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    min_time,
    max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;

-- Table statistics
SELECT 
    schemaname,
    tablename,
    seq_scan,
    idx_scan,
    n_tup_ins,
    n_tup_upd,
    n_tup_del
FROM pg_stat_user_tables
ORDER BY seq_scan DESC;

-- Index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

#### API Performance Metrics
```bash
# Average response time
curl https://bigdata.hvhc.edu.vn/api/metrics | jq '.api.avg_response_time'

# Error rate
curl https://bigdata.hvhc.edu.vn/api/metrics | jq '.api.error_rate'

# Requests per minute
curl https://bigdata.hvhc.edu.vn/api/metrics | jq '.api.requests_per_minute'
```

---

## 7. SAO LƯU VÀ PHỤC HỒI

### 7.1. Chiến lược Backup

**Backup Schedule:**
- **Database:** Mỗi ngày lúc 02:00 AM
- **Data Lake:** Mỗi tuần vào Chủ nhật
- **Configuration:** Mỗi khi thay đổi
- **Full System:** Mỗi tháng

**Retention Policy:**
- Daily backups: Giữ 30 ngày
- Weekly backups: Giữ 12 tuần
- Monthly backups: Giữ 12 tháng
- Yearly backups: Giữ vĩnh viễn

### 7.2. Database Backup

#### Automated Backup Script
```bash
#!/bin/bash
# File: /usr/local/bin/backup-database.sh

BACKUP_DIR="/backup/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="bigdata_hvhc_${DATE}.sql.gz"

# Create backup directory
mkdir -p ${BACKUP_DIR}

# Backup database
pg_dump -h localhost -U admin bigdata_hvhc | gzip > ${BACKUP_DIR}/${FILENAME}

# Verify backup
if [ $? -eq 0 ]; then
    echo "Backup successful: ${FILENAME}"
    
    # Upload to remote storage (optional)
    mc cp ${BACKUP_DIR}/${FILENAME} backup-server/postgres/
    
    # Delete old backups (older than 30 days)
    find ${BACKUP_DIR} -name "*.sql.gz" -mtime +30 -delete
else
    echo "Backup failed!"
    # Send alert
    curl -X POST https://alert.hvhc.edu.vn/api/notify \
      -d "subject=Database Backup Failed" \
      -d "message=Backup at ${DATE} failed"
fi
```

#### Crontab Entry
```bash
# Daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-database.sh >> /var/log/backup.log 2>&1
```

### 7.3. Restore Database

#### From Local Backup
```bash
# List available backups
ls -lh /backup/postgres/

# Restore specific backup
gunzip < /backup/postgres/bigdata_hvhc_20251010_020000.sql.gz | \
  psql -h localhost -U admin bigdata_hvhc

# Or restore latest
LATEST=$(ls -t /backup/postgres/*.sql.gz | head -1)
gunzip < ${LATEST} | psql -h localhost -U admin bigdata_hvhc
```

#### Point-in-Time Recovery (PITR)
```bash
# Enable WAL archiving
# File: /etc/postgresql/15/main/postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /backup/wal_archive/%f'

# Create base backup
pg_basebackup -h localhost -U admin -D /backup/base -Ft -z -P

# Restore to specific time
# 1. Stop PostgreSQL
sudo systemctl stop postgresql

# 2. Restore base backup
cd /var/lib/postgresql/15/main
rm -rf *
tar -xzf /backup/base/base.tar.gz

# 3. Create recovery.conf
cat > recovery.conf <<EOF
restore_command = 'cp /backup/wal_archive/%f %p'
recovery_target_time = '2025-10-10 14:30:00'
EOF

# 4. Start PostgreSQL
sudo systemctl start postgresql
```

### 7.4. Data Lake Backup

```bash
#!/bin/bash
# File: /usr/local/bin/backup-datalake.sh

BACKUP_DIR="/backup/datalake"
DATE=$(date +%Y%m%d)

# Sync from MinIO to backup location
mc mirror hvhc/hvhc-datalake ${BACKUP_DIR}/${DATE}/

# Verify
if [ $? -eq 0 ]; then
    echo "Data Lake backup successful"
    
    # Create tarball
    cd ${BACKUP_DIR}
    tar -czf datalake_${DATE}.tar.gz ${DATE}/
    
    # Upload to remote
    mc cp datalake_${DATE}.tar.gz backup-server/datalake/
    
    # Cleanup
    rm -rf ${DATE}
    find ${BACKUP_DIR} -name "datalake_*.tar.gz" -mtime +90 -delete
fi
```

### 7.5. Configuration Backup

```bash
#!/bin/bash
# Backup configuration files

BACKUP_DIR="/backup/config"
DATE=$(date +%Y%m%d)
DEST="${BACKUP_DIR}/config_${DATE}.tar.gz"

tar -czf ${DEST} \
  /home/ubuntu/hvhc_bigdata_management/.env \
  /home/ubuntu/hvhc_bigdata_management/docker-compose.yml \
  /etc/nginx/sites-available/bigdata.hvhc.edu.vn \
  /etc/postgresql/15/main/postgresql.conf

echo "Configuration backup saved: ${DEST}"
```

---

## 8. BẢO MẬT HỆ THỐNG

### 8.1. Security Checklist

**Hàng ngày:**
- [ ] Kiểm tra failed login attempts
- [ ] Review audit logs
- [ ] Kiểm tra CPU/Memory/Disk unusual spikes
- [ ] Verify backup completion

**Hàng tuần:**
- [ ] Review user access logs
- [ ] Check for security updates
- [ ] Analyze slow queries
- [ ] Review error logs

**Hàng tháng:**
- [ ] Update system packages
- [ ] Review và cập nhật firewall rules
- [ ] Password policy compliance check
- [ ] Security audit report

### 8.2. Firewall Configuration

```bash
# UFW (Uncomplicated Firewall)

# Reset firewall
sudo ufw --force reset

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (restrict to specific IPs)
sudo ufw allow from 192.168.1.0/24 to any port 22

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow Database (only from app server)
sudo ufw allow from 192.168.1.10 to any port 5432

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

### 8.3. SSL/TLS Configuration

**Generate SSL Certificate (Let's Encrypt):**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d bigdata.hvhc.edu.vn

# Auto-renewal (crontab)
0 3 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

**SSL Best Practices:**
```nginx
# Strong SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
ssl_prefer_server_ciphers on;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;

# HSTS
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /etc/ssl/certs/ca-cert.pem;
```

### 8.4. Database Security

**Restrict Database Access:**
```bash
# File: /etc/postgresql/15/main/pg_hba.conf

# TYPE  DATABASE        USER            ADDRESS                 METHOD

# Local connections
local   all             postgres                                peer
local   all             all                                     md5

# Remote connections (restrict to app server)
host    bigdata_hvhc    admin           192.168.1.10/32         md5

# Reject all others
host    all             all             0.0.0.0/0               reject
```

**Enable SSL for PostgreSQL:**
```bash
# Generate certificate
openssl req -new -x509 -days 365 -nodes -text \
  -out /var/lib/postgresql/15/main/server.crt \
  -keyout /var/lib/postgresql/15/main/server.key

# Set permissions
chown postgres:postgres /var/lib/postgresql/15/main/server.*
chmod 600 /var/lib/postgresql/15/main/server.key

# Enable SSL
# File: /etc/postgresql/15/main/postgresql.conf
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'

# Restart
sudo systemctl restart postgresql
```

**Database User Permissions:**
```sql
-- Create read-only user for reporting
CREATE USER reporting_user WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE bigdata_hvhc TO reporting_user;
GRANT USAGE ON SCHEMA public TO reporting_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO reporting_user;

-- Revoke unnecessary permissions
REVOKE ALL ON SCHEMA public FROM PUBLIC;
```

### 8.5. Application Security

**Environment Variables Protection:**
```bash
# Restrict .env file permissions
chmod 600 /home/ubuntu/hvhc_bigdata_management/.env
chown www-data:www-data /home/ubuntu/hvhc_bigdata_management/.env
```

**Rate Limiting:**
```typescript
// File: nextjs_space/lib/rate-limit.ts

import { RateLimiter } from "limiter";

const limiter = new RateLimiter({
  tokensPerInterval: 100,
  interval: "minute",
});

export async function rateLimit(req: Request) {
  const remaining = await limiter.removeTokens(1);
  if (remaining < 0) {
    throw new Error("Rate limit exceeded");
  }
}
```

**SQL Injection Prevention:**
```typescript
// Always use parameterized queries
// ✓ GOOD
const result = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${email}
`;

// ✗ BAD
const result = await prisma.$queryRawUnsafe(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

**XSS Prevention:**
```typescript
// Sanitize user input
import DOMPurify from 'isomorphic-dompurify';

const cleanHtml = DOMPurify.sanitize(userInput);
```

### 8.6. Audit Logging

**Enable Audit Trail:**
```sql
-- Create audit table
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT NOW(),
    user_id INTEGER,
    action VARCHAR(50),
    table_name VARCHAR(100),
    record_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT
);

-- Create trigger function
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (action, table_name, record_id, new_values)
        VALUES ('INSERT', TG_TABLE_NAME, NEW.id, row_to_json(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (action, table_name, record_id, old_values, new_values)
        VALUES ('UPDATE', TG_TABLE_NAME, NEW.id, row_to_json(OLD), row_to_json(NEW));
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (action, table_name, record_id, old_values)
        VALUES ('DELETE', TG_TABLE_NAME, OLD.id, row_to_json(OLD));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to sensitive tables
CREATE TRIGGER users_audit
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION audit_trigger();
```

**View Audit Logs:**
```sql
-- Recent actions
SELECT 
    timestamp,
    u.full_name,
    action,
    table_name,
    ip_address
FROM audit_log a
LEFT JOIN users u ON a.user_id = u.id
ORDER BY timestamp DESC
LIMIT 100;

-- Failed login attempts
SELECT 
    timestamp,
    ip_address,
    COUNT(*) as attempts
FROM audit_log
WHERE action = 'LOGIN_FAILED'
  AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY timestamp, ip_address
HAVING COUNT(*) > 5;
```

---

## 9. XỬ LÝ SỰ CỐ

### 9.1. Quy trình Xử lý Sự cố

**Level 1: Low Priority**
- Không ảnh hưởng đến hoạt động chính
- Thời gian phản hồi: 24 giờ
- Ví dụ: UI glitch, minor bugs

**Level 2: Medium Priority**
- Ảnh hưởng một phần chức năng
- Thời gian phản hồi: 4 giờ
- Ví dụ: Slow performance, feature not working

**Level 3: High Priority**
- Ảnh hưởng nghiêm trọng đến hệ thống
- Thời gian phản hồi: 1 giờ
- Ví dụ: Database connection lost, service down

**Level 4: Critical**
- Hệ thống ngừng hoạt động hoàn toàn
- Thời gian phản hồi: Ngay lập tức
- Ví dụ: Complete system outage, data breach

### 9.2. Common Issues và Solutions

#### Issue 1: Database Connection Failed
```bash
# Symptoms
# - Error: "Database connection refused"
# - Unable to login
# - 500 Internal Server Error

# Diagnosis
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check connections
psql -h localhost -U admin -d bigdata_hvhc

# Solution
# Restart PostgreSQL
sudo systemctl restart postgresql

# Check logs
tail -f /var/log/postgresql/postgresql-15-main.log

# If max connections reached
# File: /etc/postgresql/15/main/postgresql.conf
max_connections = 200  # Increase from 100

# Restart
sudo systemctl restart postgresql
```

#### Issue 2: Out of Disk Space
```bash
# Symptoms
# - "No space left on device"
# - Cannot upload files
# - Database writes failing

# Diagnosis
df -h

# Solution
# Find large files
du -sh /* | sort -rh | head -10

# Clean old logs
find /var/log -name "*.log" -mtime +30 -delete

# Clean old backups
find /backup -name "*.sql.gz" -mtime +60 -delete

# Vacuum database
psql -h localhost -U admin -d bigdata_hvhc -c "VACUUM FULL;"

# Clean Docker
docker system prune -a --volumes
```

#### Issue 3: High CPU Usage
```bash
# Diagnosis
top
htop

# Check PostgreSQL queries
psql -h localhost -U admin -d bigdata_hvhc -c "
SELECT pid, now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;
"

# Solution
# Kill long-running query
SELECT pg_terminate_backend(PID);

# Check for infinite loops in application
pm2 logs bigdata-frontend --lines 100

# Restart services if needed
pm2 restart bigdata-frontend
```

#### Issue 4: Memory Leak
```bash
# Diagnosis
free -h
ps aux --sort=-%mem | head

# Solution
# Restart application
pm2 restart bigdata-frontend

# Increase swap if needed
sudo fallocate -l 8G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

#### Issue 5: Cannot Login / Authentication Failed
```bash
# Symptoms
# - "Invalid credentials" error
# - Session expires immediately
# - Infinite redirect loop

# Diagnosis
# Check NextAuth configuration
cat /home/ubuntu/hvhc_bigdata_management/.env | grep NEXTAUTH

# Check database users table
psql -h localhost -U admin -d bigdata_hvhc -c "
SELECT id, email, role FROM users LIMIT 5;
"

# Solution
# Reset user password
psql -h localhost -U admin -d bigdata_hvhc -c "
UPDATE users 
SET password_hash = '$2b$10$YourHashedPassword'
WHERE email = 'admin@hvhc.edu.vn';
"

# Clear sessions
psql -h localhost -U admin -d bigdata_hvhc -c "
DELETE FROM sessions WHERE user_id = 1;
"

# Regenerate NEXTAUTH_SECRET
openssl rand -base64 32

# Update .env and restart
pm2 restart bigdata-frontend
```

### 9.3. Emergency Procedures

**Complete System Failure:**
```bash
# 1. Assess the situation
systemctl status postgresql
systemctl status nginx
pm2 status

# 2. Check logs
tail -100 /var/log/syslog
journalctl -xe

# 3. Restart all services
sudo systemctl restart postgresql
sudo systemctl restart nginx
pm2 restart all

# 4. If still failing, restore from backup
cd /home/ubuntu/hvhc_bigdata_management
git status
git diff

# Reset to last known good state
git reset --hard HEAD~1

# Restore database
gunzip < /backup/postgres/latest.sql.gz | \
  psql -h localhost -U admin bigdata_hvhc

# 5. Notify stakeholders
# Send email to admin-group@hvhc.edu.vn
```

**Data Corruption:**
```bash
# 1. Stop all write operations
# Revoke write permissions temporarily
psql -h localhost -U admin -d bigdata_hvhc -c "
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM PUBLIC;
"

# 2. Identify corrupt data
# Run data validation queries

# 3. Restore from backup
# Point-in-time recovery to before corruption

# 4. Re-run failed transactions

# 5. Verify data integrity

# 6. Restore normal operations
```

### 9.4. Contact Information

**Emergency Contacts:**
- **System Administrator:** admin@hvhc.edu.vn | 024-xxxx-xxxx
- **Development Team:** dev-team@hvhc.edu.vn | 024-xxxx-xxxx
- **Security Team:** security@hvhc.edu.vn | 024-xxxx-xxxx
- **On-call Engineer:** +84-xxx-xxx-xxx (24/7)

**Escalation Path:**
1. System Admin (0-30 minutes)
2. Lead Developer (30-60 minutes)
3. CTO / Technical Director (60+ minutes)
4. Academy Leadership (Critical incidents)

---

## 10. API DOCUMENTATION

### 10.1. API Overview

**Base URL:** `https://bigdata.hvhc.edu.vn/api`

**Authentication:**
```bash
# Get access token
curl -X POST https://bigdata.hvhc.edu.vn/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hvhc.edu.vn",
    "password": "your_password"
  }'

# Response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@hvhc.edu.vn",
    "role": "ADMIN"
  }
}

# Use token in subsequent requests
curl -X GET https://bigdata.hvhc.edu.vn/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 10.2. Core API Endpoints

#### User Management
```bash
# List users
GET /api/admin/users
GET /api/admin/users?role=INSTRUCTOR&department=Khoa%20Quân%20lý

# Get user by ID
GET /api/admin/users/{userId}

# Create user
POST /api/admin/users
Body: {
  "email": "string",
  "fullName": "string",
  "role": "INSTRUCTOR|RESEARCHER|STUDENT",
  "department": "string",
  "position": "string"
}

# Update user
PUT /api/admin/users/{userId}
Body: { /* fields to update */ }

# Delete user
DELETE /api/admin/users/{userId}

# Bulk import
POST /api/admin/users/bulk-import
Body: {
  "users": [
    { "email": "...", "fullName": "...", ... }
  ]
}
```

#### Data Lake Management
```bash
# List datasets
GET /api/datalake/datasets
GET /api/datalake/datasets?type=training&status=approved

# Upload dataset
POST /api/datalake/upload
Content-Type: multipart/form-data
Body: {
  "file": File,
  "name": "string",
  "description": "string",
  "type": "training|research|operational",
  "department": "string"
}

# Get dataset info
GET /api/datalake/datasets/{datasetId}

# Download dataset
GET /api/datalake/datasets/{datasetId}/download

# Delete dataset
DELETE /api/datalake/datasets/{datasetId}
```

#### Research Projects
```bash
# List projects
GET /api/research/projects

# Create project
POST /api/research/projects
Body: {
  "title": "string",
  "description": "string",
  "objectives": "string",
  "methodology": "string",
  "timeline": "string",
  "budget": number
}

# Update project status
PATCH /api/research/projects/{projectId}/status
Body: {
  "status": "pending|approved|in_progress|completed"
}

# Add team member
POST /api/research/projects/{projectId}/members
Body: {
  "userId": number,
  "role": "lead|member|advisor"
}
```

#### ML Training
```bash
# Start training
POST /api/ml/train
Body: {
  "datasetId": number,
  "modelType": "classification|regression|clustering",
  "hyperparameters": {
    "learning_rate": 0.001,
    "epochs": 100,
    "batch_size": 32
  }
}

# Get training status
GET /api/ml/experiments/{experimentId}

# List experiments
GET /api/ml/experiments?status=running

# Stop training
POST /api/ml/experiments/{experimentId}/stop

# Get model predictions
POST /api/ml/models/{modelId}/predict
Body: {
  "data": [...]
}
```

#### Analytics & Reporting
```bash
# Dashboard metrics
GET /api/analytics/dashboard
GET /api/analytics/dashboard?period=30d&department=Khoa%20Quân%20lý

# Training statistics
GET /api/analytics/training
Response: {
  "total_sessions": number,
  "active_sessions": number,
  "completion_rate": number,
  "avg_score": number
}

# Research statistics
GET /api/analytics/research

# User activity
GET /api/analytics/users/activity
GET /api/analytics/users/{userId}/activity

# Export reports
GET /api/analytics/export?format=csv|xlsx|pdf&type=training|research
```

### 10.3. Webhooks

**Configure Webhooks:**
```bash
POST /api/admin/webhooks
Body: {
  "url": "https://your-service.com/webhook",
  "events": ["dataset.uploaded", "research.approved", "training.completed"],
  "secret": "your_webhook_secret"
}
```

**Webhook Events:**
- `dataset.uploaded` - New dataset uploaded
- `dataset.approved` - Dataset approved
- `research.created` - New research project created
- `research.approved` - Research project approved
- `training.started` - Training session started
- `training.completed` - Training session completed
- `ml.training_complete` - ML model training completed
- `user.created` - New user account created

**Webhook Payload:**
```json
{
  "event": "dataset.uploaded",
  "timestamp": "2025-10-10T14:30:00Z",
  "data": {
    "id": 123,
    "name": "Dataset Name",
    "uploader": {
      "id": 45,
      "name": "Nguyễn Văn A"
    }
  },
  "signature": "sha256=..."
}
```

### 10.4. Rate Limits

- **Default:** 100 requests/minute per IP
- **Authenticated:** 1000 requests/minute per user
- **Upload:** 10 uploads/hour per user
- **Export:** 50 exports/day per user

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1696934400
```

---

## PHỤ LỤC

### A. Troubleshooting Commands

```bash
# Quick system check
curl https://bigdata.hvhc.edu.vn/api/health

# Database connection test
pg_isready -h localhost -U admin

# Check running processes
ps aux | grep -E 'node|postgres|nginx'

# Network connectivity
netstat -tulpn | grep -E '3000|5432|80|443'

# Disk I/O
iostat -x 1 10

# Memory usage by process
ps aux --sort=-%mem | head -20

# Check open files
lsof | wc -l
ulimit -n
```

### B. Useful SQL Queries

```sql
-- Active users in last 7 days
SELECT COUNT(DISTINCT user_id) 
FROM audit_log 
WHERE timestamp > NOW() - INTERVAL '7 days';

-- Popular datasets
SELECT d.name, COUNT(a.id) as access_count
FROM datasets d
LEFT JOIN dataset_access a ON d.id = a.dataset_id
GROUP BY d.name
ORDER BY access_count DESC
LIMIT 10;

-- Research project pipeline
SELECT status, COUNT(*) 
FROM research_projects 
GROUP BY status;

-- Training completion rate by department
SELECT 
    department,
    COUNT(*) as total,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
    ROUND(100.0 * SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / COUNT(*), 2) as completion_rate
FROM training_sessions
GROUP BY department;
```

### C. Configuration Templates

**Systemd Service:**
```ini
# /etc/systemd/system/bigdata-frontend.service
[Unit]
Description=BigData Frontend Service
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/home/ubuntu/hvhc_bigdata_management/nextjs_space
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=bigdata-frontend

[Install]
WantedBy=multi-user.target
```

**PM2 Ecosystem:**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'bigdata-frontend',
    script: 'npm',
    args: 'start',
    cwd: '/home/ubuntu/hvhc_bigdata_management/nextjs_space',
    instances: 4,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/bigdata/frontend-error.log',
    out_file: '/var/log/bigdata/frontend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

### D. Security Hardening Checklist

- [ ] Change all default passwords
- [ ] Enable firewall (UFW/iptables)
- [ ] Configure SSL/TLS
- [ ] Restrict database access
- [ ] Enable audit logging
- [ ] Set up fail2ban
- [ ] Disable root SSH login
- [ ] Use SSH key authentication
- [ ] Regular security updates
- [ ] Implement rate limiting
- [ ] Enable CORS properly
- [ ] Sanitize all user inputs
- [ ] Use parameterized queries
- [ ] Set secure headers
- [ ] Encrypt sensitive data
- [ ] Regular security audits

---

## LIÊN HỆ HỖ TRỢ

**Hotline Kỹ thuật:** 024-xxxx-xxxx (24/7)  
**Email:** support@hvhc.edu.vn  
**Tài liệu:** https://docs.bigdata.hvhc.edu.vn  

**Địa chỉ:**  
Học viện Hậu cần - Bộ Quốc phòng  
Số xx, Đường xxx, Quận xxx, Hà Nội

---

*Tài liệu này được cập nhật thường xuyên. Vui lòng kiểm tra phiên bản mới nhất tại: https://docs.bigdata.hvhc.edu.vn*
