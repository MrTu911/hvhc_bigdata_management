# HƯỚNG DẪN KHẮC PHỤC SỰ CỐ - HỆ THỐNG HVHC BIG DATA

## 🔍 CHẨN ĐOÁN NHANH

### Bước 1: Kiểm tra trạng thái hệ thống

```bash
cd /home/ubuntu/hvhc_bigdata_management

# Kiểm tra server có chạy không
ps aux | grep -E "next|node" | grep -v grep

# Kiểm tra port
lsof -i :3000
lsof -i :3001
```

### Bước 2: Kiểm tra logs

```bash
# Xem log mới nhất
ls -lt .logs/ | head -5

# Xem nội dung log
tail -100 .logs/*.out
tail -100 .logs/*.err
```

### Bước 3: Kiểm tra database

```bash
cd nextjs_space

# Kiểm tra kết nối
node << 'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.user.count()
  .then(count => console.log('✓ Database connected. Users:', count))
  .catch(err => console.error('✗ Database error:', err.message))
  .finally(() => prisma.$disconnect());
EOF
```

---

## ⚠️ CÁC VẤN ĐỀ THƯỜNG GẶP

### 1. Server không khởi động

**Triệu chứng:**
- Không truy cập được http://localhost:3000
- Lỗi "Cannot GET /"

**Giải pháp:**

```bash
cd /home/ubuntu/hvhc_bigdata_management/nextjs_space

# Dừng tất cả process
pkill -f "node.*next"
pkill -f "yarn.*dev"

# Cài đặt dependencies
yarn install

# Generate Prisma Client
yarn prisma generate

# Khởi động lại
yarn dev
```

**Chờ 30-60 giây** để server khởi động hoàn toàn.

---

### 2. Database không có dữ liệu

**Triệu chứng:**
- Đăng nhập thất bại
- Dashboard trống
- Lỗi "User not found"

**Giải pháp:**

```bash
cd /home/ubuntu/hvhc_bigdata_management/nextjs_space

# Seed dữ liệu mẫu
yarn prisma db seed

# Hoặc chạy script seed trực tiếp
node scripts/seed.ts
```

**Sau khi seed, login với:**
- Email: `chihuy@hvhc.edu.vn`
- Password: `password123`

---

### 3. Lỗi Prisma Client

**Triệu chứng:**
- "Cannot find module '@prisma/client'"
- "PrismaClient is not a constructor"

**Giải pháp:**

```bash
cd /home/ubuntu/hvhc_bigdata_management/nextjs_space

# Xóa node_modules cũ
rm -rf node_modules
rm -rf .next

# Cài đặt lại
yarn install

# Generate Prisma Client
yarn prisma generate

# Build lại
yarn build
```

---

### 4. Lỗi Port đã được sử dụng

**Triệu chứng:**
- "Port 3000 is already in use"
- "EADDRINUSE"

**Giải pháp:**

```bash
# Cách 1: Kill process đang dùng port
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# Cách 2: Dùng port khác
PORT=3002 yarn dev
```

---

### 5. Lỗi Authentication

**Triệu chứng:**
- "Invalid credentials"
- "Session expired"
- Redirect loop

**Giải pháp:**

```bash
# Kiểm tra .env
cat nextjs_space/.env | grep -E "NEXTAUTH_SECRET|NEXTAUTH_URL"

# Nếu thiếu, thêm vào:
echo 'NEXTAUTH_SECRET="$(openssl rand -base64 32)"' >> nextjs_space/.env
echo 'NEXTAUTH_URL="http://localhost:3000"' >> nextjs_space/.env

# Restart server
pkill -f "yarn.*dev"
cd nextjs_space && yarn dev
```

---

### 6. Dashboard trống hoặc lỗi 404

**Triệu chứng:**
- Trang trắng
- "404 Page Not Found"
- Menu không hiển thị

**Giải pháp:**

```bash
# Kiểm tra build
cd /home/ubuntu/hvhc_bigdata_management/nextjs_space

# Build lại
yarn build

# Nếu có lỗi TypeScript, fix rồi build lại
# Sau đó start
yarn dev
```

**Kiểm tra URL:**
- ✓ Đúng: `http://localhost:3000/dashboard`
- ✗ Sai: `http://localhost:3000/` (chỉ là trang landing)

---

### 7. API AI không hoạt động

**Triệu chứng:**
- "AI service not configured"
- "Invalid API key"
- Timeout khi gọi AI

**Giải pháp:**

```bash
# Kiểm tra API key
cat nextjs_space/.env | grep -E "OPENAI_API_KEY|ABACUSAI_API_KEY"

# Nếu chưa có, chạy setup
bash scripts/setup-ai.sh

# Test AI service
bash scripts/test-ai-all.sh
```

---

### 8. Redis/Email errors (Không quan trọng)

**Triệu chứng:**
- "Redis Client Error: ECONNREFUSED"
- "SMTP not configured"

**Giải pháp:**

✅ **Các lỗi này KHÔNG ảnh hưởng chức năng chính.**

Redis và SMTP là optional services:
- Redis: Dùng cho caching (không bắt buộc)
- SMTP: Dùng cho email notifications (không bắt buộc)

Nếu muốn tắt warnings:

```bash
# Thêm vào .env
echo 'REDIS_ENABLED=false' >> nextjs_space/.env
echo 'SMTP_ENABLED=false' >> nextjs_space/.env
```

---

## 🔧 SCRIPT KHẮC PHỤC TỰ ĐỘNG

### Script 1: Reset toàn bộ (Sử dụng khi mọi thứ không hoạt động)

```bash
cat > /tmp/reset-all.sh << 'EOF'
#!/bin/bash
set -e

echo "🔄 Resetting HVHC Big Data System..."

cd /home/ubuntu/hvhc_bigdata_management/nextjs_space

# 1. Stop all processes
echo "[1/6] Stopping servers..."
pkill -f "node.*next" 2>/dev/null || true
pkill -f "yarn.*dev" 2>/dev/null || true
sleep 2

# 2. Clean build artifacts
echo "[2/6] Cleaning build artifacts..."
rm -rf .next .build node_modules/.cache

# 3. Reinstall dependencies
echo "[3/6] Reinstalling dependencies..."
yarn install

# 4. Generate Prisma Client
echo "[4/6] Generating Prisma Client..."
yarn prisma generate

# 5. Build
echo "[5/6] Building application..."
yarn build

# 6. Start dev server
echo "[6/6] Starting dev server..."
yarn dev &

echo ""
echo "✅ Reset complete!"
echo "Wait 30-60 seconds then visit: http://localhost:3000"
EOF

bash /tmp/reset-all.sh
```

### Script 2: Reseed database

```bash
cat > /tmp/reseed-db.sh << 'EOF'
#!/bin/bash
set -e

cd /home/ubuntu/hvhc_bigdata_management/nextjs_space

echo "🌱 Reseeding database..."

# Run seed
yarn prisma db seed

echo ""
echo "✅ Database seeded!"
echo ""
echo "Login credentials:"
echo "  Command: chihuy@hvhc.edu.vn / password123"
echo "  Faculty: truongkhoa@hvhc.edu.vn / password123"
echo "  Instructor: giangvien@hvhc.edu.vn / password123"
echo "  Student: hocvien@hvhc.edu.vn / password123"
EOF

bash /tmp/reseed-db.sh
```

### Script 3: Kiểm tra trạng thái

```bash
cat > /tmp/check-status.sh << 'EOF'
#!/bin/bash

echo "📊 HVHC Big Data System Status"
echo "================================"
echo ""

# Check processes
echo "🔹 Server processes:"
if ps aux | grep -E "node.*next" | grep -v grep > /dev/null; then
    echo "  ✓ Next.js server is running"
else
    echo "  ✗ Next.js server is NOT running"
fi

echo ""

# Check ports
echo "🔹 Ports:"
if lsof -i:3000 > /dev/null 2>&1; then
    echo "  ✓ Port 3000 is in use (dev server)"
else
    echo "  ✗ Port 3000 is available (server not running)"
fi

if lsof -i:3001 > /dev/null 2>&1; then
    echo "  ✓ Port 3001 is in use (prod server)"
else
    echo "  ✗ Port 3001 is available"
fi

echo ""

# Check database
echo "🔹 Database:"
cd /home/ubuntu/hvhc_bigdata_management/nextjs_space
if node -e "const {PrismaClient} = require('@prisma/client'); new PrismaClient().user.count().then(c => console.log('  ✓ Connected. Users:', c)).catch(e => console.error('  ✗ Error:', e.message)).finally(() => process.exit())" 2>/dev/null; then
    true
else
    echo "  ✗ Cannot connect to database"
fi

echo ""
echo "================================"
EOF

bash /tmp/check-status.sh
```

---

## 📝 CHECKLIST KHỞI ĐỘNG HỆ THỐNG

### Lần đầu tiên sau khi cài đặt:

- [ ] 1. Kiểm tra .env có đầy đủ thông tin
  ```bash
  cat nextjs_space/.env | grep -E "DATABASE_URL|NEXTAUTH"
  ```

- [ ] 2. Cài đặt dependencies
  ```bash
  cd nextjs_space && yarn install
  ```

- [ ] 3. Generate Prisma Client
  ```bash
  yarn prisma generate
  ```

- [ ] 4. Chạy migration (nếu cần)
  ```bash
  yarn prisma migrate deploy
  ```

- [ ] 5. Seed dữ liệu mẫu
  ```bash
  yarn prisma db seed
  ```

- [ ] 6. Build application
  ```bash
  yarn build
  ```

- [ ] 7. Khởi động server
  ```bash
  yarn dev
  ```

- [ ] 8. Đợi 30-60 giây

- [ ] 9. Truy cập http://localhost:3000

- [ ] 10. Login với: `chihuy@hvhc.edu.vn` / `password123`

- [ ] 11. Kiểm tra Dashboard hoạt động

---

## 🆘 KHẮC PHỤC NHANH - BẢNG TÓM TẮT

| Vấn đề | Lệnh khắc phục |
|--------|----------------|
| Server không chạy | `cd nextjs_space && pkill node && yarn dev` |
| Database trống | `cd nextjs_space && yarn prisma db seed` |
| Prisma error | `cd nextjs_space && yarn prisma generate` |
| Port bận | `lsof -ti:3000 \| xargs kill -9` |
| Build lỗi | `cd nextjs_space && rm -rf .next && yarn build` |
| Reset toàn bộ | `bash /tmp/reset-all.sh` |

---

## 📞 KHI CẦN TRỢ GIÚP

### Thông tin cần cung cấp:

1. **Log lỗi:**
   ```bash
   tail -100 /home/ubuntu/hvhc_bigdata_management/.logs/*.err
   ```

2. **Trạng thái hệ thống:**
   ```bash
   bash /tmp/check-status.sh
   ```

3. **Môi trường:**
   ```bash
   node --version
   yarn --version
   cat nextjs_space/.env | grep -v "PASSWORD\|SECRET\|KEY"
   ```

4. **Database status:**
   ```bash
   cd nextjs_space && yarn prisma studio
   # Mở http://localhost:5555 để xem dữ liệu
   ```

---

## ✅ XÁC NHẬN HỆ THỐNG HOẠT ĐỘNG

### Test từng bước:

```bash
# 1. Server chạy
curl http://localhost:3000
# Kỳ vọng: HTML response

# 2. API health check
curl http://localhost:3000/api/auth/csrf
# Kỳ vọng: {"csrfToken": "..."}

# 3. Database connected
cd nextjs_space && node -e "require('@prisma/client').PrismaClient().user.count().then(console.log)"
# Kỳ vọng: Số lượng users (>0)

# 4. Login works
# Truy cập http://localhost:3000/login
# Login: chihuy@hvhc.edu.vn / password123
# Kỳ vọng: Redirect to dashboard

# 5. Dashboard loads
# Truy cập http://localhost:3000/dashboard
# Kỳ vọng: Dashboard hiển thị đầy đủ
```

Nếu **tất cả 5 bước trên đều pass**, hệ thống hoạt động bình thường! ✅

---

**Tài liệu:** Phiên bản 1.0  
**Cập nhật:** 18/12/2024  
**Hỗ trợ:** support@hvhc.edu.vn
