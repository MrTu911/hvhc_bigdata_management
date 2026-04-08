
# 📮 Postman Test Collection - HVHC BigData Management System

## 🎯 Mục đích

Collection này được thiết kế để test **toàn bộ API endpoints** của Hệ thống Quản lý BigData - Học viện Hậu cần theo **tiêu chuẩn Production-Ready**.

---

## 📦 Nội dung Collection

### 1. **Authentication** (3 endpoints)
- ✅ Register New User
- ✅ Login & Get JWT Token
- ✅ Check Auth Status

### 2. **Data Management** (5 endpoints)
- ✅ Upload Research File
- ✅ Get Uploaded Files
- ✅ Execute Query - PostgreSQL
- ✅ Execute Query - ClickHouse
- ✅ Get Query History

### 3. **Analytics & Dashboard** (2 endpoints)
- ✅ Get Dashboard Summary (with period filter)
- ✅ Get Dashboard Stats (Legacy)

### 4. **User Management** (4 endpoints)
- ✅ Get All Users
- ✅ Get User by ID
- ✅ Update User
- ✅ Delete User (soft delete)

### 5. **Services Management** (2 endpoints)
- ✅ Get All Services
- ✅ Check Service Health

### 6. **Logs & Alerts** (2 endpoints)
- ✅ Get System Logs (with filters)
- ✅ Get Active Alerts

**Tổng cộng: 18 API endpoints được test đầy đủ**

---

## 🚀 Hướng dẫn sử dụng

### Bước 1: Import vào Postman

```bash
# Import 3 files vào Postman:
1. HVHC_BigData_APIs.postman_collection.json
2. Development.postman_environment.json
3. Production.postman_environment.json
```

**Trong Postman:**
1. Click **Import** (góc trên bên trái)
2. Kéo thả 3 files vào
3. Click **Import**

### Bước 2: Chọn Environment

Chọn **HVHC BigData - Development** từ dropdown Environment (góc trên bên phải)

### Bước 3: Chạy test theo thứ tự

#### 🔐 **A. Test Authentication Flow**

**1. Register New User**
```http
POST /api/auth/register

Body: {
  "email": "test.user@hvhc.edu.vn",
  "password": "Test@123456",
  "name": "Nguyễn Văn Test",
  "role": "GIANG_VIEN",
  ...
}
```

**✅ Expected:**
- Status: 200 OK
- User created successfully
- User ID returned

---

**2. Login**
```http
POST /api/auth/login

Body: {
  "email": "test.user@hvhc.edu.vn",
  "password": "Test@123456"
}
```

**✅ Expected:**
- Status: 200 OK
- JWT token returned
- Token automatically saved to `{{jwt_token}}` variable

---

**3. Check Auth Status**
```http
GET /api/auth/login
Authorization: Bearer {{jwt_token}}
```

**✅ Expected:**
- Status: 200 OK
- User data returned
- Token is valid

---

#### 📊 **B. Test Data Management Flow**

**4. Upload Research File**
```http
POST /api/data/upload
Authorization: Bearer {{jwt_token}}
Content-Type: multipart/form-data

Form data:
- file: [select file]
- fileType: RESEARCH_PAPER
- title: Nghiên cứu ứng dụng AI...
- description: ...
- department: Khoa CNTT
- tags: AI,BigData,ML
```

**✅ Expected:**
- Status: 200 OK
- File uploaded to MinIO
- File ID saved to `{{last_uploaded_file_id}}`
- Metadata stored in database

---

**5. Get Uploaded Files**
```http
GET /api/data/upload?page=1&limit=20&fileType=RESEARCH_PAPER
Authorization: Bearer {{jwt_token}}
```

**✅ Expected:**
- Status: 200 OK
- List of files with pagination
- File metadata included

---

**6. Execute Query - PostgreSQL**
```http
POST /api/data/query
Authorization: Bearer {{jwt_token}}

Body: {
  "queryText": "SELECT * FROM \"User\" LIMIT 10",
  "queryType": "POSTGRESQL"
}
```

**✅ Expected:**
- Status: 200 OK
- Query results returned
- Execution time measured
- Query ID saved to `{{last_query_id}}`

---

**7. Execute Query - ClickHouse**
```http
POST /api/data/query
Authorization: Bearer {{jwt_token}}

Body: {
  "queryText": "SELECT COUNT(*) FROM events WHERE...",
  "queryType": "CLICKHOUSE"
}
```

**✅ Expected:**
- Status: 200 OK
- ClickHouse query executed
- Analytics data returned

---

**8. Get Query History**
```http
GET /api/data/query?page=1&limit=20&status=COMPLETED
Authorization: Bearer {{jwt_token}}
```

**✅ Expected:**
- Status: 200 OK
- Query history with pagination
- Performance metrics included

---

#### 📈 **C. Test Analytics Flow**

**9. Get Dashboard Summary**
```http
GET /api/analytics/summary?period=today
Authorization: Bearer {{jwt_token}}
```

**✅ Expected:**
- Status: 200 OK
- Complete dashboard metrics:
  - Users: total, active, new
  - Services: total, healthy, degraded, down
  - Data: files, queries, storage
  - Performance: CPU, Memory, Disk
  - Alerts: active count
  - Recent activities

---

#### 👥 **D. Test User Management**

**10. Get All Users**
```http
GET /api/users
Authorization: Bearer {{jwt_token}}
```

**✅ Expected:**
- Status: 200 OK
- Array of users
- No password in response

---

**11. Get User by ID**
```http
GET /api/users/{{current_user_id}}
Authorization: Bearer {{jwt_token}}
```

**✅ Expected:**
- Status: 200 OK
- User details returned

---

#### 🔧 **E. Test Services Management**

**12. Get All Services**
```http
GET /api/services
Authorization: Bearer {{jwt_token}}
```

**✅ Expected:**
- Status: 200 OK
- List of BigData services
- Status for each service

---

**13. Check Service Health**
```http
GET /api/services/health
```

**✅ Expected:**
- Status: 200 OK
- Health check passed
- No authentication required

---

#### 📝 **F. Test Logs & Alerts**

**14. Get System Logs**
```http
GET /api/logs?level=INFO&category=AUTH&limit=50
Authorization: Bearer {{jwt_token}}
```

**✅ Expected:**
- Status: 200 OK
- Filtered logs returned
- Proper log structure

---

**15. Get Active Alerts**
```http
GET /api/alerts?status=ACTIVE&severity=HIGH
Authorization: Bearer {{jwt_token}}
```

**✅ Expected:**
- Status: 200 OK
- Active alerts list
- Severity levels correct

---

## 🎯 Automated Testing

### Run Collection in Postman

1. Click **Collection** → **HVHC BigData Management APIs**
2. Click **Run** button
3. Select **Development** environment
4. Click **Run HVHC BigData...**

**Postman sẽ:**
- ✅ Chạy tất cả 18 requests tuần tự
- ✅ Tự động validate responses
- ✅ Lưu JWT token và IDs giữa các requests
- ✅ Hiển thị pass/fail cho mỗi test
- ✅ Tạo báo cáo tổng hợp

---

### Run Collection via Newman (CLI)

```bash
# Install Newman
npm install -g newman

# Run collection
newman run HVHC_BigData_APIs.postman_collection.json \
  -e Development.postman_environment.json \
  --reporters cli,html \
  --reporter-html-export test-results.html
```

**Output:**
```
HVHC BigData Management APIs

→ 1. Authentication / Register New User
  ✓ Status code is 200
  ✓ Response has success flag
  ✓ User data is returned

→ 2. Authentication / Login
  ✓ Status code is 200
  ✓ JWT token is returned
  ✓ User data is returned

... (18 requests total)

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
```

---

## 🧪 Test Coverage Matrix

| Module              | Endpoints | Tests | Coverage |
|---------------------|-----------|-------|----------|
| Authentication      | 3         | 9     | 100%     |
| Data Management     | 5         | 15    | 100%     |
| Analytics           | 2         | 6     | 100%     |
| User Management     | 4         | 12    | 100%     |
| Services            | 2         | 6     | 100%     |
| Logs & Alerts       | 2         | 6     | 100%     |
| **TOTAL**           | **18**    | **54**| **100%** |

---

## 🔐 Security Checks

Collection tự động kiểm tra:

✅ **Authentication:**
- JWT token validation
- Token expiration handling
- Unauthorized access prevention

✅ **Input Validation:**
- Email format validation
- Password strength requirements
- File size limits (500MB)
- Query safety (no DROP/DELETE)

✅ **Data Protection:**
- Password không được trả về trong response
- Sensitive data encrypted
- SQL injection prevention

---

## 📊 Performance Benchmarks

Collection đo các metrics:

- ⏱️ **Response time** (must be < 5000ms)
- 📈 **Query execution time** (tracked per query)
- 💾 **Data size** (MB returned per request)
- 🔄 **Row count** (records processed)

---

## 🛠️ Troubleshooting

### Common Issues:

**1. "Unauthorized" error**
```
Giải pháp:
- Chạy lại request "Login"
- Kiểm tra JWT token trong Environment variables
- Token có thể đã hết hạn (7 days)
```

**2. "Connection refused"**
```
Giải pháp:
- Kiểm tra server đang chạy: http://localhost:3000
- Chạy: cd nextjs_space && yarn dev
```

**3. "File upload failed"**
```
Giải pháp:
- Kiểm tra file size < 500MB
- Kiểm tra MinIO service đang chạy
- Xem logs trong terminal
```

---

## 📚 Next Steps

Sau khi test APIs pass 100%:

1. ✅ **Bước 2:** Thêm/hoàn thiện Frontend UI
2. ✅ **Bước 3:** Deploy lên Production
3. ✅ **Bước 4:** Setup Monitoring (Prometheus + Grafana)

---

## 🤝 Contributing

Để thêm test case mới:

1. Mở Postman
2. Thêm request vào folder tương ứng
3. Viết test scripts trong tab "Tests"
4. Export collection: **File → Export**
5. Thay thế file JSON cũ

---

## 📞 Support

Nếu có vấn đề khi chạy tests:

- 📧 Email: support@hvhc.edu.vn
- 📖 Docs: /docs/API_Documentation.md
- 🐛 Issues: Báo cáo trong team

---

**✨ Happy Testing!**
