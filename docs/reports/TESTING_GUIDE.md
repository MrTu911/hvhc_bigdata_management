
# 🧪 Hướng dẫn Test APIs - HVHC BigData Management System

## 📖 Tổng quan

Tài liệu này hướng dẫn **chi tiết từng bước** để test toàn bộ API endpoints của Hệ thống Quản lý BigData - Học viện Hậu cần.

---

## 🎯 Mục tiêu

✅ Đảm bảo **100% API endpoints hoạt động đúng**  
✅ Validate **authentication & authorization**  
✅ Kiểm tra **input validation & security**  
✅ Đo **performance benchmarks**  
✅ Sẵn sàng cho **production deployment**

---

## 🚀 Cách 1: Test với Postman (Visual - Khuyến nghị cho người mới)

### Bước 1: Cài đặt Postman

```bash
# Download Postman Desktop App
https://www.postman.com/downloads/

# Hoặc dùng Postman Web (cần account)
https://web.postman.co/
```

### Bước 2: Import Collection & Environment

1. Mở Postman
2. Click **Import** (góc trên bên trái)
3. Kéo thả 3 files:
   - `postman/HVHC_BigData_APIs.postman_collection.json`
   - `postman/Development.postman_environment.json`
   - `postman/Production.postman_environment.json`
4. Click **Import**

### Bước 3: Chọn Environment

- Góc trên bên phải → Dropdown **Environment**
- Chọn: **"HVHC BigData - Development"**

### Bước 4: Start Development Server

```bash
cd /home/ubuntu/hvhc_bigdata_management/nextjs_space
yarn dev
```

Đợi server khởi động xong: `http://localhost:3000`

### Bước 5: Chạy Test Collection

#### Option A: Run toàn bộ collection (khuyến nghị)

1. Click vào collection **"HVHC BigData Management APIs"**
2. Click nút **"Run"** (góc trên bên phải)
3. Đảm bảo **Environment** đã chọn: **Development**
4. Click **"Run HVHC BigData..."**

**Kết quả mong đợi:**
- ✅ 18 requests executed
- ✅ 54 tests passed
- ⏱️ Total time: ~10-20 seconds

#### Option B: Test từng endpoint riêng lẻ

**Test Authentication Flow:**

1. **Register New User**
   - Expand folder: **1. Authentication**
   - Click: **Register New User**
   - Click **Send**
   - ✅ Expected: 200 OK, user created

2. **Login**
   - Click: **Login**
   - Click **Send**
   - ✅ Expected: 200 OK, JWT token returned
   - 🔍 Check: Token đã được lưu vào Environment (`jwt_token`)

3. **Check Auth Status**
   - Click: **Check Auth Status**
   - Click **Send**
   - ✅ Expected: 200 OK, user data returned

**Test Data Management:**

4. **Upload Research File**
   - Expand folder: **2. Data Management**
   - Click: **Upload Research File**
   - Tab **Body** → **form-data**
   - Click **Select Files** → chọn file PDF/CSV
   - Click **Send**
   - ✅ Expected: 200 OK, file uploaded

5. **Execute Query**
   - Click: **Execute Query - PostgreSQL**
   - Click **Send**
   - ✅ Expected: 200 OK, query results

**Test Analytics:**

6. **Get Dashboard Summary**
   - Expand folder: **3. Analytics & Dashboard**
   - Click: **Get Dashboard Summary**
   - Click **Send**
   - ✅ Expected: 200 OK, complete metrics

### Bước 6: Xem Test Results

- Tab **Test Results** (dưới response)
- Kiểm tra các assertions:
  - ✅ Status code is 200
  - ✅ Response has success flag
  - ✅ Data structure is correct

### Bước 7: Debug nếu có lỗi

**Lỗi thường gặp:**

**1. Connection refused / ECONNREFUSED**
```
Nguyên nhân: Server chưa chạy
Giải pháp:
  cd nextjs_space && yarn dev
```

**2. 401 Unauthorized**
```
Nguyên nhân: Token chưa có hoặc hết hạn
Giải pháp:
  1. Chạy lại request "Login"
  2. Token sẽ tự động được lưu
  3. Thử lại request bị lỗi
```

**3. 500 Internal Server Error**
```
Nguyên nhân: Lỗi server-side
Giải pháp:
  1. Xem logs trong terminal (yarn dev)
  2. Check database connection
  3. Check MinIO service
```

---

## 🚀 Cách 2: Test với Newman CLI (Automated - Khuyến nghị cho CI/CD)

### Bước 1: Cài đặt Newman

```bash
cd /home/ubuntu/hvhc_bigdata_management/postman

# Install Newman globally
npm install -g newman newman-reporter-htmlextra

# Hoặc install local
npm install
```

### Bước 2: Make scripts executable

```bash
chmod +x run-tests.sh
chmod +x run-tests-quick.sh
```

### Bước 3: Chạy tests

#### Full test suite (tất cả 18 endpoints)

```bash
./run-tests.sh development
```

**Output:**
```
╔════════════════════════════════════════════════════════════════╗
║  🧪 HVHC BigData Management - API Testing Suite              ║
╚════════════════════════════════════════════════════════════════╝

🔧 Testing on DEVELOPMENT environment

📋 Test Configuration:
  Collection: HVHC_BigData_APIs.postman_collection.json
  Environment: Development.postman_environment.json
  Report: reports/test-report-development-20250105_143022.html

🚀 Starting API tests...

→ 1. Authentication / Register New User
  ✓ Status code is 200
  ✓ Response has success flag
  ✓ User data is returned

→ 1. Authentication / Login
  ✓ Status code is 200
  ✓ JWT token is returned
  ✓ User data is returned

... (18 requests)

┌─────────────────────────┬────────────┬────────────┐
│                         │   executed │     failed │
├─────────────────────────┼────────────┼────────────┤
│              iterations │          1 │          0 │
├─────────────────────────┼────────────┼────────────┤
│                requests │         18 │          0 │
├─────────────────────────┼────────────┼────────────┤
│            test-scripts │         36 │          0 │
├─────────────────────────┼────────────┼────────────┤
│      prerequest-scripts │         18 │          0 │
├─────────────────────────┼────────────┼────────────┤
│              assertions │         54 │          0 │
└─────────────────────────┴────────────┴────────────┘

✅ All tests passed successfully!
📊 Report: reports/test-report-development-20250105_143022.html
```

#### Quick test (chỉ critical endpoints)

```bash
./run-tests-quick.sh
```

#### Test specific modules

```bash
# Test authentication only
npm run test:auth

# Test data management only
npm run test:data

# Test on production
npm run test:prod
```

### Bước 4: Xem HTML Report

```bash
# Mở report trong browser
npm run report:open

# Hoặc mở thủ công
open reports/test-report-development-*.html
```

**Report bao gồm:**
- ✅ Test execution timeline
- 📊 Request/response details
- ⏱️ Performance metrics
- 📈 Charts & graphs
- 🐛 Failed test details

---

## 🎯 Test Scenarios chi tiết

### Scenario 1: User Registration & Login Flow

**Mục tiêu:** Đảm bảo users có thể đăng ký và đăng nhập thành công

**Steps:**

1. **Register new user**
   ```json
   POST /api/auth/register
   {
     "email": "test@hvhc.edu.vn",
     "password": "Test@123456",
     "name": "Nguyễn Văn Test",
     "role": "GIANG_VIEN"
   }
   ```
   ✅ Expected: User created, ID returned

2. **Login with credentials**
   ```json
   POST /api/auth/login
   {
     "email": "test@hvhc.edu.vn",
     "password": "Test@123456"
   }
   ```
   ✅ Expected: JWT token returned, expires in 7 days

3. **Verify token works**
   ```http
   GET /api/auth/login
   Authorization: Bearer {token}
   ```
   ✅ Expected: User data returned

**Validation:**
- [ ] Email must be unique
- [ ] Password >= 8 characters
- [ ] Token is valid for 7 days
- [ ] lastLoginAt updated

---

### Scenario 2: File Upload & Query Flow

**Mục tiêu:** Test upload file và query dữ liệu

**Steps:**

1. **Login first** (get JWT token)

2. **Upload research file**
   ```http
   POST /api/data/upload
   Authorization: Bearer {token}
   Content-Type: multipart/form-data
   
   file: [PDF file]
   fileType: RESEARCH_PAPER
   title: "Nghiên cứu AI trong BigData"
   department: "Khoa CNTT"
   ```
   ✅ Expected: File uploaded to MinIO, metadata saved

3. **List uploaded files**
   ```http
   GET /api/data/upload?page=1&limit=20
   Authorization: Bearer {token}
   ```
   ✅ Expected: List of files with pagination

4. **Execute query**
   ```json
   POST /api/data/query
   {
     "queryText": "SELECT * FROM \"User\" LIMIT 10",
     "queryType": "POSTGRESQL"
   }
   ```
   ✅ Expected: Query results, execution time measured

**Validation:**
- [ ] File size <= 500MB
- [ ] File stored in MinIO
- [ ] Metadata in database
- [ ] Queries are safe (no DROP/DELETE)
- [ ] Performance metrics logged

---

### Scenario 3: Dashboard Analytics

**Mục tiêu:** Verify dashboard metrics are accurate

**Steps:**

1. **Get dashboard summary**
   ```http
   GET /api/analytics/summary?period=today
   Authorization: Bearer {token}
   ```

2. **Verify metrics**
   - Users: total, active, new
   - Services: healthy, degraded, down
   - Data: files, queries, storage
   - Performance: CPU, Memory, Disk
   - Alerts: active count

**Validation:**
- [ ] All metric categories present
- [ ] Calculations are correct
- [ ] Period filter works (today/week/month)
- [ ] Response time < 1500ms

---

## 🔐 Security Testing Checklist

### Authentication Tests

- [ ] ✅ Login with valid credentials → 200 OK
- [ ] ❌ Login with wrong password → 401 Unauthorized
- [ ] ❌ Login with non-existent email → 401 Unauthorized
- [ ] ❌ Login with inactive account → 403 Forbidden
- [ ] ❌ Access protected route without token → 401 Unauthorized
- [ ] ❌ Access with invalid token → 401 Unauthorized
- [ ] ❌ Access with expired token → 401 Unauthorized

### Input Validation Tests

- [ ] ❌ Register with duplicate email → 400 Bad Request
- [ ] ❌ Register with weak password (< 8 chars) → 400 Bad Request
- [ ] ❌ Upload file > 500MB → 400 Bad Request
- [ ] ❌ Execute DROP TABLE query → 400 Bad Request
- [ ] ❌ Execute DELETE query → 400 Bad Request
- [ ] ❌ Missing required fields → 400 Bad Request

### Data Protection Tests

- [ ] Password NOT returned in any response
- [ ] JWT token properly signed
- [ ] Sensitive data encrypted
- [ ] SQL injection prevented

---

## ⏱️ Performance Benchmarks

| Endpoint                    | Expected Response Time | Benchmark |
|-----------------------------|-----------------------|-----------|
| POST /api/auth/login        | < 500ms               | ⚡ Fast   |
| POST /api/auth/register     | < 800ms               | ⚡ Fast   |
| POST /api/data/upload (10MB)| < 3000ms              | ✅ OK     |
| POST /api/data/query        | < 2000ms              | ✅ OK     |
| GET /api/analytics/summary  | < 1500ms              | ✅ OK     |
| GET /api/users              | < 500ms               | ⚡ Fast   |
| GET /api/services/health    | < 300ms               | ⚡ Fast   |

---

## 📊 Test Coverage Matrix

| Module              | Endpoints | Tests | Pass | Fail | Coverage |
|---------------------|-----------|-------|------|------|----------|
| Authentication      | 3         | 9     | [ ]  | [ ]  | [ ]%     |
| Data Management     | 5         | 15    | [ ]  | [ ]  | [ ]%     |
| Analytics           | 2         | 6     | [ ]  | [ ]  | [ ]%     |
| User Management     | 4         | 12    | [ ]  | [ ]  | [ ]%     |
| Services            | 2         | 6     | [ ]  | [ ]  | [ ]%     |
| Logs & Alerts       | 2         | 6     | [ ]  | [ ]  | [ ]%     |
| **TOTAL**           | **18**    | **54**| **[ ]**| **[ ]**| **[ ]%** |

---

## 🐛 Troubleshooting

### Newman installation fails

```bash
# Clear npm cache
npm cache clean --force

# Install with sudo (if needed)
sudo npm install -g newman
```

### Tests timeout

```bash
# Increase timeout
newman run collection.json --timeout-request 30000
```

### Port 3000 already in use

```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>

# Start server again
cd nextjs_space && yarn dev
```

---

## ✅ Sign-Off Checklist

Trước khi chuyển sang **Bước 2: Frontend UI Development:**

- [ ] ✅ All 18 API endpoints tested
- [ ] ✅ All 54 test assertions passed
- [ ] ✅ Security tests passed
- [ ] ✅ Performance benchmarks met
- [ ] ✅ HTML report generated
- [ ] ✅ No critical issues found

**Sign-off:**
- Tested by: ___________________
- Date: ___________________
- Approved: [ ] Yes [ ] No

---

## 📞 Support

Nếu gặp vấn đề:

1. **Check logs:**
   ```bash
   # Server logs
   cd nextjs_space && yarn dev
   
   # Database logs
   docker-compose logs postgres
   
   # MinIO logs
   docker-compose logs minio
   ```

2. **Check services:**
   ```bash
   docker-compose ps
   ```

3. **Restart services:**
   ```bash
   docker-compose restart
   ```

4. **Contact support:**
   - Email: support@hvhc.edu.vn
   - Docs: /docs/API_Documentation.md

---

## 🎉 Next Steps

Sau khi tất cả tests PASS:

✅ **Bước 1: Test APIs** ← **BẠN Ở ĐÂY**  
⬜ **Bước 2: Hoàn thiện Frontend UI**  
⬜ **Bước 3: Deploy Production**  
⬜ **Bước 4: Setup Monitoring (Prometheus + Grafana)**

---

**✨ Chúc bạn test thành công!**
