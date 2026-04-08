
# ✅ API Testing Checklist - HVHC BigData Management

## 🎯 Mục tiêu Test

Đảm bảo **100% API endpoints hoạt động đúng** trước khi deploy production.

---

## 📋 Pre-Test Setup

- [ ] Server đang chạy: `http://localhost:3000`
- [ ] Database đã migrate: `yarn prisma migrate dev`
- [ ] MinIO service running: `docker-compose up -d minio`
- [ ] ClickHouse service running (optional)
- [ ] Import Postman Collection & Environment

---

## 🧪 Test Scenarios

### 1️⃣ Authentication Flow

#### ✅ Register New User
- [ ] POST `/api/auth/register`
- [ ] **Input:** Valid user data
- [ ] **Expected:** 201 Created, user ID returned
- [ ] **Validation:**
  - ✓ Email unique
  - ✓ Password >= 8 chars
  - ✓ militaryId unique
  - ✓ Role mapped correctly

**Test cases:**
- [ ] ✅ Valid registration
- [ ] ❌ Duplicate email
- [ ] ❌ Weak password (< 8 chars)
- [ ] ❌ Invalid role
- [ ] ❌ Missing required fields

---

#### ✅ Login
- [ ] POST `/api/auth/login`
- [ ] **Input:** Email + Password
- [ ] **Expected:** 200 OK, JWT token
- [ ] **Validation:**
  - ✓ Token saved to environment
  - ✓ User data (no password)
  - ✓ lastLoginAt updated

**Test cases:**
- [ ] ✅ Valid credentials
- [ ] ❌ Wrong password
- [ ] ❌ User not found
- [ ] ❌ Inactive user
- [ ] ❌ Missing fields

---

#### ✅ Check Auth Status
- [ ] GET `/api/auth/login`
- [ ] **Input:** Bearer token
- [ ] **Expected:** 200 OK, user data
- [ ] **Validation:**
  - ✓ Token valid
  - ✓ User is active

**Test cases:**
- [ ] ✅ Valid token
- [ ] ❌ No token
- [ ] ❌ Invalid token
- [ ] ❌ Expired token
- [ ] ❌ Inactive user

---

### 2️⃣ Data Management Flow

#### ✅ Upload Research File
- [ ] POST `/api/data/upload`
- [ ] **Input:** File + metadata (form-data)
- [ ] **Expected:** 200 OK, file ID
- [ ] **Validation:**
  - ✓ File uploaded to MinIO
  - ✓ Metadata in database
  - ✓ File size <= 500MB
  - ✓ ObjectKey generated correctly

**Test cases:**
- [ ] ✅ PDF file (10MB)
- [ ] ✅ CSV dataset (50MB)
- [ ] ✅ With tags & keywords
- [ ] ❌ File > 500MB
- [ ] ❌ No file provided
- [ ] ❌ Invalid fileType
- [ ] ❌ Unauthorized (no token)

---

#### ✅ Get Uploaded Files
- [ ] GET `/api/data/upload?page=1&limit=20`
- [ ] **Input:** Query params (optional filters)
- [ ] **Expected:** 200 OK, paginated list
- [ ] **Validation:**
  - ✓ Files sorted by uploadedAt DESC
  - ✓ Pagination correct
  - ✓ Filters work (fileType, department)

**Test cases:**
- [ ] ✅ No filters (all files)
- [ ] ✅ Filter by fileType
- [ ] ✅ Filter by department
- [ ] ✅ Page 2, limit 10
- [ ] ❌ Unauthorized

---

#### ✅ Execute Query - PostgreSQL
- [ ] POST `/api/data/query`
- [ ] **Input:** SQL query
- [ ] **Expected:** 200 OK, query results
- [ ] **Validation:**
  - ✓ Query executed safely
  - ✓ Execution time measured
  - ✓ Row count correct
  - ✓ Data size estimated
  - ✓ Query logged in database

**Test cases:**
- [ ] ✅ Simple SELECT
- [ ] ✅ JOIN query
- [ ] ✅ GROUP BY with aggregates
- [ ] ✅ Query with LIMIT
- [ ] ❌ DROP TABLE (blocked)
- [ ] ❌ DELETE (blocked)
- [ ] ❌ UPDATE (blocked)
- [ ] ❌ Missing queryText
- [ ] ❌ Unauthorized

---

#### ✅ Execute Query - ClickHouse
- [ ] POST `/api/data/query`
- [ ] **Input:** ClickHouse SQL
- [ ] **Expected:** 200 OK, analytics results
- [ ] **Validation:**
  - ✓ ClickHouse connection works
  - ✓ Time-series queries execute
  - ✓ Performance metrics logged

**Test cases:**
- [ ] ✅ COUNT query
- [ ] ✅ Time-series aggregation
- [ ] ✅ WITH ROLLUP
- [ ] ❌ Invalid syntax
- [ ] ❌ Unauthorized

---

#### ✅ Get Query History
- [ ] GET `/api/data/query?page=1&limit=20`
- [ ] **Input:** Query params (filters)
- [ ] **Expected:** 200 OK, query history
- [ ] **Validation:**
  - ✓ Only user's queries returned
  - ✓ Pagination works
  - ✓ Filters work (queryType, status)

**Test cases:**
- [ ] ✅ All queries
- [ ] ✅ Filter by COMPLETED
- [ ] ✅ Filter by FAILED
- [ ] ✅ Filter by queryType
- [ ] ❌ Unauthorized

---

### 3️⃣ Analytics & Dashboard

#### ✅ Get Dashboard Summary
- [ ] GET `/api/analytics/summary?period=today`
- [ ] **Input:** Period (today/week/month)
- [ ] **Expected:** 200 OK, complete metrics
- [ ] **Validation:**
  - ✓ All metric categories present:
    - Users (total, active, new)
    - Services (total, healthy, degraded, down)
    - Data (files, queries, storage)
    - Performance (CPU, Memory, Disk)
    - Alerts (active count)
    - Recent activities

**Test cases:**
- [ ] ✅ Period: today
- [ ] ✅ Period: week
- [ ] ✅ Period: month
- [ ] ❌ Unauthorized

**Verify calculations:**
- [ ] Users.active = users with lastLoginAt >= startDate
- [ ] Services status counts correct
- [ ] Storage GB calculation accurate
- [ ] Average metrics calculated correctly

---

### 4️⃣ User Management

#### ✅ Get All Users
- [ ] GET `/api/users`
- [ ] **Expected:** 200 OK, array of users
- [ ] **Validation:**
  - ✓ No password in response
  - ✓ All user fields present

**Test cases:**
- [ ] ✅ Admin can see all users
- [ ] ❌ Unauthorized

---

#### ✅ Get User by ID
- [ ] GET `/api/users/{id}`
- [ ] **Expected:** 200 OK, user details
- [ ] **Validation:**
  - ✓ User found
  - ✓ No password

**Test cases:**
- [ ] ✅ Valid user ID
- [ ] ❌ User not found
- [ ] ❌ Unauthorized

---

#### ✅ Update User
- [ ] PUT `/api/users/{id}`
- [ ] **Input:** Updated fields
- [ ] **Expected:** 200 OK, updated user
- [ ] **Validation:**
  - ✓ Fields updated correctly
  - ✓ Email unique check
  - ✓ militaryId unique check

**Test cases:**
- [ ] ✅ Update name, phone
- [ ] ✅ Update department
- [ ] ❌ Duplicate email
- [ ] ❌ Unauthorized
- [ ] ❌ Update other user (not admin)

---

#### ✅ Delete User
- [ ] DELETE `/api/users/{id}`
- [ ] **Expected:** 200 OK, soft delete
- [ ] **Validation:**
  - ✓ User status = INACTIVE
  - ✓ Not permanently deleted

**Test cases:**
- [ ] ✅ Admin deletes user
- [ ] ❌ Delete self
- [ ] ❌ Unauthorized
- [ ] ❌ User already inactive

---

### 5️⃣ Services Management

#### ✅ Get All Services
- [ ] GET `/api/services`
- [ ] **Expected:** 200 OK, services list
- [ ] **Validation:**
  - ✓ PostgreSQL listed
  - ✓ MinIO listed
  - ✓ ClickHouse listed
  - ✓ Hadoop listed (if configured)
  - ✓ Spark listed (if configured)

**Test cases:**
- [ ] ✅ All services returned
- [ ] ❌ Unauthorized

---

#### ✅ Check Service Health
- [ ] GET `/api/services/health`
- [ ] **Expected:** 200 OK, health status
- [ ] **Validation:**
  - ✓ Overall status
  - ✓ Individual service status
  - ✓ Response times
  - ✓ No authentication required

**Test cases:**
- [ ] ✅ All services healthy
- [ ] ⚠️ Some services degraded
- [ ] ❌ Some services down

---

### 6️⃣ Logs & Alerts

#### ✅ Get System Logs
- [ ] GET `/api/logs?level=INFO&category=AUTH`
- [ ] **Expected:** 200 OK, filtered logs
- [ ] **Validation:**
  - ✓ Logs filtered correctly
  - ✓ Log structure complete
  - ✓ Limit works

**Test cases:**
- [ ] ✅ Filter by level (INFO)
- [ ] ✅ Filter by category (AUTH)
- [ ] ✅ Multiple filters
- [ ] ✅ Limit results
- [ ] ❌ Unauthorized

---

#### ✅ Get Active Alerts
- [ ] GET `/api/alerts?status=ACTIVE&severity=HIGH`
- [ ] **Expected:** 200 OK, alerts list
- [ ] **Validation:**
  - ✓ Alerts filtered correctly
  - ✓ Severity levels correct

**Test cases:**
- [ ] ✅ Active alerts only
- [ ] ✅ Filter by severity
- [ ] ✅ All alerts
- [ ] ❌ Unauthorized

---

## 🎯 Performance Tests

### Response Time Benchmarks

- [ ] Authentication: < 500ms
- [ ] File upload (10MB): < 3000ms
- [ ] Query execution: < 2000ms
- [ ] Dashboard summary: < 1500ms
- [ ] Get lists: < 500ms

### Load Testing (optional)

- [ ] 10 concurrent users
- [ ] 100 requests/minute
- [ ] No errors
- [ ] Response times stable

---

## 🔐 Security Tests

### Authentication
- [ ] No token = 401 Unauthorized
- [ ] Invalid token = 401
- [ ] Expired token = 401
- [ ] Token required for protected routes

### Input Validation
- [ ] SQL injection prevented
- [ ] File upload validation works
- [ ] XSS prevention
- [ ] CSRF protection (if applicable)

### Data Protection
- [ ] Passwords hashed (bcrypt)
- [ ] No password in responses
- [ ] JWT signed correctly
- [ ] Sensitive data encrypted

---

## 📊 Test Results Summary

| Module              | Total Tests | Passed | Failed | Coverage |
|---------------------|-------------|--------|--------|----------|
| Authentication      | 15          | [ ]    | [ ]    | [ ]%     |
| Data Management     | 28          | [ ]    | [ ]    | [ ]%     |
| Analytics           | 8           | [ ]    | [ ]    | [ ]%     |
| User Management     | 16          | [ ]    | [ ]    | [ ]%     |
| Services            | 8           | [ ]    | [ ]    | [ ]%     |
| Logs & Alerts       | 10          | [ ]    | [ ]    | [ ]%     |
| **TOTAL**           | **85**      | **[ ]**| **[ ]**| **[ ]%** |

---

## ✅ Sign-Off

**Test completed by:** ___________________  
**Date:** ___________________  
**Signature:** ___________________  

**Production deployment approved:** [ ] Yes [ ] No

---

## 📝 Notes & Issues

```
Ghi chú các vấn đề phát hiện trong quá trình test:

1. 

2. 

3. 

```

---

**🎉 Khi tất cả tests PASS → Sẵn sàng cho Bước 2: Frontend UI Development**
