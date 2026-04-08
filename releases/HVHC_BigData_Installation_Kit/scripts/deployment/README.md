# BỘ CÀI ĐẶT HVHC BIGDATA

## Cấu trúc thư mục

```
scripts/deployment/
├── install.sh          # Script cài đặt tự động
├── backup-database.sh  # Script backup database
├── restore-database.sh # Script restore database
├── quick-start.sh      # Script khởi động nhanh
├── docker-compose.yml  # Cấu hình Docker
├── Dockerfile          # Build image Docker
├── nginx.conf          # Cấu hình Nginx
└── README.md           # File này
```

## Cài đặt nhanh

### 1. Cài đặt trên Ubuntu (thủ công)
```bash
# Bước 1: Cài đặt dependencies
./install.sh

# Bước 2: Cấu hình .env
nano ../../.env

# Bước 3: Khởi động
./quick-start.sh dev   # Development
./quick-start.sh pm2   # Production với PM2
```

### 2. Cài đặt với Docker
```bash
# Tạo file .env
cp ../../.env.example ../../.env
nano ../../.env

# Khởi động
docker-compose up -d

# Kiểm tra
docker-compose ps
docker-compose logs -f app
```

## Backup Database

```bash
# Backup hàng ngày
./backup-database.sh

# Backup full
./backup-database.sh --full

# Backup hàng tuần
./backup-database.sh --weekly

# Xem thống kê backup
./backup-database.sh --stats
```

## Restore Database

```bash
# Liệt kê các backup có sẵn
./restore-database.sh --list

# Restore backup mới nhất
./restore-database.sh --latest

# Restore từ file cụ thể
./restore-database.sh --file /path/to/backup.dump
```

## Cấu hình Cron (Backup tự động)

```bash
# Mở crontab
crontab -e

# Thêm các dòng sau:

# Backup hàng ngày lúc 2:00 AM
0 2 * * * /opt/hvhc_bigdata/nextjs_space/scripts/deployment/backup-database.sh >> /var/log/hvhc_backup.log 2>&1

# Backup weekly mỗi Chủ nhật lúc 3:00 AM
0 3 * * 0 /opt/hvhc_bigdata/nextjs_space/scripts/deployment/backup-database.sh --weekly >> /var/log/hvhc_backup_weekly.log 2>&1

# Backup monthly vào ngày 1 hàng tháng lúc 4:00 AM
0 4 1 * * /opt/hvhc_bigdata/nextjs_space/scripts/deployment/backup-database.sh --monthly >> /var/log/hvhc_backup_monthly.log 2>&1
```

## Tài khoản mặc định

| Email | Mật khẩu | Vai trò |
|-------|----------|--------|
| admin@hvhc.edu.vn | Hv@2025 | System Admin |
| giamdoc@hvhc.edu.vn | Hv@2025 | Giám đốc |

## Hỗ trợ

- **Tài liệu chi tiết**: Xem file `docs/HUONG_DAN_CAI_DAT.md`
- **Email**: support@hvhc.edu.vn
