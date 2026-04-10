# HVHC BigData Management — Hướng dẫn Triển khai Ubuntu Server

> Phiên bản tài liệu: 2026-04  
> Hệ điều hành: Ubuntu 20.04 / 22.04 / 24.04 LTS (64-bit)  
> Người thực hiện: Admin hệ thống

---

## Mục lục

1. [Yêu cầu phần cứng & phần mềm](#1-yêu-cầu)
2. [Kịch bản A — Clone từ GitHub](#2-kịch-bản-a--clone-từ-github)
3. [Kịch bản B — Cài từ USB (offline)](#3-kịch-bản-b--cài-từ-usb-offline)
4. [Cấu hình sau cài đặt](#4-cấu-hình-sau-cài-đặt)
5. [Backup Database](#5-backup-database)
6. [Khôi phục Database](#6-khôi-phục-database)
7. [Quản lý dịch vụ hàng ngày](#7-quản-lý-dịch-vụ-hàng-ngày)
8. [Xử lý sự cố thường gặp](#8-xử-lý-sự-cố-thường-gặp)

---

## 1. Yêu cầu

### Phần cứng tối thiểu

| Thành phần | Tối thiểu | Khuyến nghị |
|------------|-----------|-------------|
| CPU        | 4 core    | 8+ core     |
| RAM        | 8 GB      | 16–32 GB    |
| Disk       | 100 GB SSD| 500 GB SSD  |
| Network    | 100 Mbps  | 1 Gbps      |

### Phần mềm yêu cầu (script tự cài)

| Phần mềm     | Phiên bản | Ghi chú                    |
|--------------|-----------|----------------------------|
| Ubuntu       | 20.04+    | LTS bắt buộc               |
| Node.js      | 20.x      | LTS                        |
| PostgreSQL   | 16        | Qua repo pgdg chính thức   |
| Redis        | 7.x       | Từ apt                     |
| MinIO        | latest    | Binary tải từ dl.min.io    |
| PM2          | latest    | Process manager cho Node   |

### Ports cần mở

| Port | Dịch vụ      | Ghi chú                    |
|------|--------------|----------------------------|
| 22   | SSH          | Quản trị hệ thống          |
| 3000 | Next.js App  | Mở public hoặc qua Nginx   |
| 9001 | MinIO Console| Chỉ mở nội bộ (nếu cần)   |
| 5432 | PostgreSQL   | Không mở ra ngoài          |
| 6379 | Redis        | Không mở ra ngoài          |

---

## 2. Kịch bản A — Clone từ GitHub

**Khi nào dùng:** Server có kết nối Internet.

### Bước 1 — Chuẩn bị

```bash
# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Kiểm tra Ubuntu version
lsb_release -a
```

### Bước 2 — Cấu hình URL repo (1 lần duy nhất)

Mở file `deploy/install.sh` và sửa dòng:

```bash
GITHUB_REPO="https://github.com/YOUR_ORG/hvhc_bigdata_management.git"
# ↑ Thay bằng URL repo thực tế
```

Nếu repo private, cấu hình SSH key trước:

```bash
# Trên server
ssh-keygen -t ed25519 -C "hvhc-server"
cat ~/.ssh/id_ed25519.pub   # Copy public key vào GitHub → Settings → Deploy keys
```

### Bước 3 — Chạy installer

```bash
# Download script
sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/YOUR_ORG/hvhc_bigdata_management/main/deploy/install.sh)" -- github

# Hoặc nếu đã clone được repo:
sudo bash /path/to/deploy/install.sh github
```

**Script tự động thực hiện:**
1. Cài Node.js 20, PostgreSQL 16, Redis, MinIO
2. Tạo user `hvhc` và thư mục `/opt/hvhc_bigdata_management`
3. Clone repo vào `/opt/hvhc_bigdata_management`
4. Tạo DB `hvhc_bigdata_89` và user `ductuking`
5. Tạo file `.env` với secrets ngẫu nhiên
6. `npm ci` + `prisma db push` + `npm run build`
7. Cấu hình PM2 + UFW firewall
8. Cài cron backup lúc 2:00 AM

### Bước 4 — Kiểm tra

```bash
# Trạng thái PM2
sudo -u hvhc pm2 status

# Log ứng dụng
sudo -u hvhc pm2 logs hvhc-app --lines 50

# Thử truy cập
curl http://localhost:3000/api/health
```

---

## 3. Kịch bản B — Cài từ USB (offline)

**Khi nào dùng:** Server không có Internet hoặc mạng nội bộ hạn chế.

### Bước A — Chuẩn bị USB (trên máy có Internet)

Chạy lệnh sau trên **máy nguồn** (laptop/máy trạm có source code):

```bash
cd /path/to/hvhc_bigdata_management

# Đóng gói vào USB (mount sẵn tại /media/usb)
bash deploy/prepare-usb.sh /media/usb

# Hoặc đóng gói vào thư mục tạm rồi copy sang USB
bash deploy/prepare-usb.sh /tmp/hvhc_pkg
cp -r /tmp/hvhc_pkg /media/usb/
```

**Script `prepare-usb.sh` tự động:**
- Copy source code (không có `node_modules`)
- Dump database hiện tại thành file `.dump`
- Tải Node.js 20 binary (`.tar.xz`)
- Tải MinIO binary
- Tạo npm offline cache
- Sinh `CHECKSUMS.txt`

**Cấu trúc USB sau khi chuẩn bị:**

```
/media/usb/hvhc_package/
├── source/                      ← Source code
│   └── nextjs_space/
│       └── .npm-offline-cache/  ← npm packages offline
├── offline-pkgs/
│   ├── node-v20.x.x-linux-x64.tar.xz
│   └── minio
├── db_dump_20260410_020000.dump ← Database backup
├── install.sh                   ← Installer chính
├── backup-db.sh
├── CHECKSUMS.txt
└── README.txt
```

### Bước B — Cài lên Server

```bash
# 1. Gắn USB vào server
lsblk    # Xem tên thiết bị (thường là sdb hoặc sdc)

# 2. Mount USB
sudo mkdir -p /media/usb
sudo mount /dev/sdb1 /media/usb   # Thay sdb1 bằng tên thực

# 3. Xác minh nội dung
ls /media/usb/hvhc_package/

# 4. Kiểm tra checksum
cd /media/usb/hvhc_package
sha256sum -c CHECKSUMS.txt 2>/dev/null | grep -v OK || echo "OK — checksums match"

# 5. Chạy installer
sudo bash /media/usb/hvhc_package/install.sh usb /media/usb/hvhc_package
```

### Bước C — Xác nhận cài đặt

```bash
# Kiểm tra dịch vụ
systemctl status postgresql redis-server minio
sudo -u hvhc pm2 status

# Kiểm tra DB đã restore
sudo -u postgres psql -d hvhc_bigdata_89 -c "\dt" | head -20

# Unmount USB
sudo umount /media/usb
```

---

## 4. Cấu hình sau cài đặt

### 4.1 Điền biến môi trường

```bash
sudo nano /opt/hvhc_bigdata_management/nextjs_space/.env
```

Các biến cần kiểm tra:

```bash
# Bắt buộc
DATABASE_URL="postgresql://ductuking:<pass>@localhost:5432/hvhc_bigdata_89?schema=public"
NEXTAUTH_URL="http://<server-ip>:3000"    # hoặc domain nếu có
NEXTAUTH_SECRET="<random-64-chars>"

# Redis (lấy pass từ /etc/redis/redis.conf)
REDIS_URL="redis://:<redis-pass>@localhost:6379"

# MinIO (lấy từ /etc/default/minio)
MINIO_ENDPOINT="http://localhost:9000"
MINIO_ACCESS_KEY="hvhc_minio_admin"
MINIO_SECRET_KEY="<minio-pass>"

# AI (tùy chọn — để trống nếu chưa có)
OPENAI_API_KEY=""
SCIENCE_AI_MODEL="gpt-4o"
```

### 4.2 Seed dữ liệu lần đầu

Chỉ chạy lần đầu khi DB còn trống:

```bash
cd /opt/hvhc_bigdata_management/nextjs_space

# Thứ tự bắt buộc
sudo -u hvhc npx tsx --require dotenv/config prisma/seed/seed_units.ts
sudo -u hvhc npx tsx --require dotenv/config prisma/seed/seed_users.ts
sudo -u hvhc npx tsx --require dotenv/config prisma/seed/assign_commanders.ts

# RBAC
sudo -u hvhc npx tsx --require dotenv/config prisma/seed/seed_rbac.ts
sudo -u hvhc npx tsx --require dotenv/config prisma/seed/seed_science_rbac.ts

# Demo data (nếu muốn)
sudo -u hvhc npx tsx --require dotenv/config prisma/seed/seed_m09_research_demo.ts
sudo -u hvhc npx tsx --require dotenv/config prisma/seed/seed_science_demo.ts
```

### 4.3 Khởi động lại ứng dụng

```bash
sudo -u hvhc pm2 restart hvhc-app
sudo -u hvhc pm2 logs hvhc-app --lines 30
```

### 4.4 Cấu hình Nginx (tùy chọn — nếu có domain)

```bash
sudo apt install nginx -y

sudo tee /etc/nginx/sites-available/hvhc <<'NGINX'
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
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 50M;
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/hvhc /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 5. Backup Database

### 5.1 Backup thủ công

```bash
# Backup đầy đủ (DB + Redis + MinIO + config)
sudo bash /opt/hvhc_bigdata_management/deploy/backup-db.sh

# Chỉ backup PostgreSQL
sudo bash /opt/hvhc_bigdata_management/deploy/backup-db.sh --db-only

# Backup và copy sang USB
sudo bash /opt/hvhc_bigdata_management/deploy/backup-db.sh --export-usb /media/usb

# Backup vào thư mục tùy chỉnh
sudo bash /opt/hvhc_bigdata_management/deploy/backup-db.sh --dest /mnt/nas/hvhc-backup
```

### 5.2 Cron backup tự động

Cron đã được cài bởi installer tại `/etc/cron.d/hvhc-backup`:

```
0 2 * * *   root   bash /opt/hvhc_bigdata_management/deploy/backup-db.sh
```

Kiểm tra cron:

```bash
cat /etc/cron.d/hvhc-backup
tail -50 /var/log/hvhc_backup.log
```

### 5.3 Cấu trúc thư mục backup

```
/var/backups/hvhc/
├── daily/
│   ├── 20260410_020000/
│   │   ├── postgres_hvhc_bigdata_89_20260410_020000.dump   ← dùng pg_restore
│   │   ├── postgres_hvhc_bigdata_89_20260410_020000.sql.gz ← dùng psql
│   │   ├── postgres_schema_20260410_020000.sql
│   │   ├── redis_dump_20260410_020000.rdb.gz
│   │   ├── minio_data_20260410_020000.tar.gz
│   │   ├── config/
│   │   │   ├── .env.bak
│   │   │   └── redis.conf.bak
│   │   ├── table_stats.csv
│   │   ├── CHECKSUMS_SHA256.txt
│   │   └── MANIFEST.txt
│   └── ... (7 bản gần nhất)
├── weekly/                 ← Chủ nhật (4 bản)
└── monthly/                ← Ngày 1 mỗi tháng (3 bản)
```

### 5.4 Backup trước khi cập nhật

Luôn backup trước mỗi lần cập nhật source:

```bash
# 1. Backup
sudo bash /opt/hvhc_bigdata_management/deploy/backup-db.sh

# 2. Xem file backup vừa tạo
ls -lh /var/backups/hvhc/daily/$(ls /var/backups/hvhc/daily | tail -1)/

# 3. Tiến hành cập nhật...
```

---

## 6. Khôi phục Database

### 6.1 Khôi phục từ custom dump (nhanh nhất)

```bash
# Cú pháp
sudo bash /opt/hvhc_bigdata_management/deploy/backup-db.sh \
  --restore /var/backups/hvhc/daily/20260410_020000/postgres_hvhc_bigdata_89_20260410_020000.dump

# Script sẽ hỏi xác nhận "YES" trước khi ghi đè
```

### 6.2 Khôi phục thủ công từ SQL dump

```bash
# Đọc từ biến môi trường
source /opt/hvhc_bigdata_management/nextjs_space/.env
DB_PASS=$(echo "$DATABASE_URL" | python3 -c "
import sys, urllib.parse, re
u = sys.stdin.read().strip()
m = re.search(r'://[^:]+:([^@]+)@', u)
print(urllib.parse.unquote(m.group(1))) if m else print('')
")

# Khôi phục từ .sql.gz
zcat /var/backups/hvhc/daily/.../postgres_hvhc_bigdata_89_*.sql.gz \
  | PGPASSWORD="$DB_PASS" psql -h localhost -U ductuking -d hvhc_bigdata_89

# Hoặc khôi phục từ custom dump (song song, nhanh hơn)
PGPASSWORD="$DB_PASS" pg_restore \
  -h localhost -U ductuking -d hvhc_bigdata_89 \
  -j 4 --no-owner --no-acl --clean --if-exists \
  /var/backups/hvhc/daily/.../postgres_hvhc_bigdata_89_*.dump
```

### 6.3 Chạy lại Prisma sau restore

```bash
cd /opt/hvhc_bigdata_management/nextjs_space
sudo -u hvhc npx prisma generate
# Nếu schema có thay đổi so với dump:
sudo -u hvhc npx prisma db push --accept-data-loss
```

### 6.4 Kiểm tra sau restore

```bash
sudo -u postgres psql -d hvhc_bigdata_89 -c "
SELECT schemaname||'.'||tablename AS table, n_live_tup AS rows
FROM pg_stat_user_tables
WHERE n_live_tup > 0
ORDER BY rows DESC
LIMIT 15;
"
```

---

## 7. Quản lý dịch vụ hàng ngày

### PM2 — Process Manager

```bash
# Trạng thái
sudo -u hvhc pm2 status

# Xem log
sudo -u hvhc pm2 logs hvhc-app
sudo -u hvhc pm2 logs hvhc-app --lines 100 --err

# Khởi động lại
sudo -u hvhc pm2 restart hvhc-app

# Dừng / xóa
sudo -u hvhc pm2 stop hvhc-app
sudo -u hvhc pm2 delete hvhc-app

# Xem memory/CPU
sudo -u hvhc pm2 monit
```

### PostgreSQL

```bash
# Trạng thái
systemctl status postgresql

# Kết nối vào DB
sudo -u postgres psql -d hvhc_bigdata_89

# Kiểm tra connections
sudo -u postgres psql -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"

# Reload config
sudo systemctl reload postgresql
```

### Redis

```bash
# Trạng thái
systemctl status redis-server

# Kiểm tra
redis-cli ping            # PONG
redis-cli info memory     # Dung lượng RAM

# Flush cache (chỉ dùng khi debug)
redis-cli -a <pass> FLUSHDB
```

### Cập nhật ứng dụng (từ GitHub)

```bash
# 1. Backup trước
sudo bash /opt/hvhc_bigdata_management/deploy/backup-db.sh --db-only

# 2. Pull source mới
cd /opt/hvhc_bigdata_management
sudo -u hvhc git pull --ff-only

# 3. Cài deps + migrate
cd nextjs_space
sudo -u hvhc npm ci --legacy-peer-deps
sudo -u hvhc npx prisma generate
sudo -u hvhc npx prisma db push --accept-data-loss

# 4. Build + restart
sudo -u hvhc npm run build
sudo -u hvhc pm2 restart hvhc-app

# 5. Kiểm tra
sudo -u hvhc pm2 logs hvhc-app --lines 30
```

---

## 8. Xử lý sự cố thường gặp

### App không khởi động

```bash
# Xem log PM2
sudo -u hvhc pm2 logs hvhc-app --err --lines 50

# Kiểm tra .env
cat /opt/hvhc_bigdata_management/nextjs_space/.env

# Thử chạy thủ công
cd /opt/hvhc_bigdata_management/nextjs_space
sudo -u hvhc NODE_ENV=production node_modules/.bin/next start
```

### Lỗi kết nối PostgreSQL

```bash
# Kiểm tra service
systemctl status postgresql

# Kiểm tra pg_hba.conf
sudo grep -v "^#" /etc/postgresql/16/main/pg_hba.conf

# Test kết nối
sudo -u postgres psql -c "\l"
```

### Lỗi Redis kết nối

```bash
# Kiểm tra pass trong redis.conf
sudo grep requirepass /etc/redis/redis.conf

# Test kết nối
redis-cli -a <pass> ping
```

### Prisma db push thất bại do vector extension

```bash
# Nếu không cài được pgvector, comment dòng embedding trong schema:
sudo nano /opt/hvhc_bigdata_management/nextjs_space/prisma/schema.prisma
# Tìm: embedding   Unsupported("vector(1536)")?
# Sửa: // embedding   Unsupported("vector(1536)")?

# Chạy lại
cd /opt/hvhc_bigdata_management/nextjs_space
sudo -u hvhc npx prisma db push --accept-data-loss
```

### Disk đầy

```bash
# Xem dung lượng
df -h

# Tìm file lớn nhất
du -sh /var/backups/hvhc/*/* | sort -rh | head -10

# Xoá backup cũ thủ công
find /var/backups/hvhc -type d -mtime +14 -exec rm -rf {} \; 2>/dev/null || true

# Xoá npm cache
sudo -u hvhc npm cache clean --force
```

### Xem toàn bộ log cài đặt

```bash
less /var/log/hvhc_install.log
less /var/log/hvhc_backup.log
```

---

## Liên hệ hỗ trợ

- Tài liệu hệ thống: `/opt/hvhc_bigdata_management/docs/`
- Log cài đặt: `/var/log/hvhc_install.log`
- Log backup: `/var/log/hvhc_backup.log`
- Log ứng dụng: `sudo -u hvhc pm2 logs hvhc-app`
