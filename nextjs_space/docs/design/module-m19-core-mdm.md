# MODULE M19 – CORE MDM
# READ LAYER + SCHEMA + HOOK DÙNG CHUNG

---

## 1. Mục tiêu

Xây dựng lõi của M19 để mọi module trong hệ thống có thể:
- đọc master data qua API thống nhất,
- dùng hook `useMasterData(categoryCode)`,
- dùng component `MasterDataSelect`,
- hưởng lợi từ Redis cache và source tracking.

Đây là phase đầu tiên và quan trọng nhất của M19.

---

## 2. Data Model lõi

### 2.1. MasterCategory

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| code | string | yes | mã danh mục, unique |
| nameVi | string | yes | tên tiếng Việt |
| nameEn | string | no | tên tiếng Anh |
| groupTag | string | yes | nhóm |
| cacheType | string | yes | STATIC / SEMI / DYNAMIC |
| sourceType | string | yes | LOCAL / BQP / NATIONAL / ISO |
| isActive | boolean | yes | active flag |
| description | string | no | mô tả |
| sortOrder | int | yes | thứ tự |
| createdAt | DateTime | yes | ngày tạo |

### 2.2. MasterDataItem

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| categoryCode | string | yes | FK MasterCategory.code |
| code | string | yes | mã item |
| nameVi | string | yes | tên hiển thị |
| nameEn | string | no | tên tiếng Anh |
| shortName | string | no | tên ngắn |
| parentCode | string | no | hỗ trợ phân cấp |
| level | int | no | cấp cây |
| externalCode | string | no | mã chuẩn ngoài |
| sortOrder | int | yes | thứ tự |
| metadata | Json | no | metadata bổ sung |
| isActive | boolean | yes | active flag |
| validFrom | DateTime | no | hiệu lực từ |
| validTo | DateTime | no | hiệu lực đến |
| createdBy | string | no | user id |
| createdAt | DateTime | yes | ngày tạo |
| updatedAt | DateTime | yes | ngày cập nhật |

### 2.3. MasterDataChangeLog

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| itemId | string | yes | FK item |
| changeType | string | yes | CREATE / UPDATE / DEACTIVATE / REACTIVATE |
| fieldName | string | no | trường bị đổi |
| oldValue | Json | no | giá trị cũ |
| newValue | Json | no | giá trị mới |
| reason | string | no | lý do |
| changedBy | string | no | user id |
| changedAt | DateTime | yes | thời điểm |

### 2.4. MasterDataSyncLog

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| categoryCode | string | yes | danh mục |
| sourceType | string | yes | BQP / NATIONAL |
| syncStatus | string | yes | SUCCESS / FAILED / PARTIAL |
| diffSummary | Json | no | diff |
| errorSummary | Json | no | lỗi |
| triggeredBy | string | no | user/system |
| startedAt | DateTime | yes | bắt đầu |
| finishedAt | DateTime | no | kết thúc |

---

## 3. Public Read API

### 3.1. GET `/api/master-data/{categoryCode}`
Trả danh sách item đang active của 1 category.

Use case:
- dropdown
- filter bar
- form editor
- table filter
- validator mapping

Response chuẩn:
```json
{
  "success": true,
  "data": {
    "category": {},
    "items": []
  },
  "error": null
}

3.2. GET /api/master-data/{categoryCode}/tree

Trả dữ liệu cây cho danh mục phân cấp.

Use case:

địa danh
đơn vị
tổ chức phân cấp
3.3. Cache strategy
STATIC: TTL 24h
SEMI: TTL 12h hoặc phù hợp
DYNAMIC: TTL 5 phút – 1h theo loại
4. Hook dùng chung
4.1. useMasterData(categoryCode, options?)

Hook dùng bởi toàn bộ form dropdown.

Return:

items
isLoading
error
getItem(code)

Yêu cầu:

react-query client cache 5 phút
retry hợp lý
fallback an toàn
không gọi DB trực tiếp ở từng form
4.2. MasterDataSelect

Component dropdown tái sử dụng.

Props chính:

category
placeholder
multiple?
hierarchical?
searchable?
value
onChange
5. Business Rules lõi
categoryCode là duy nhất
code của item là unique trong phạm vi category
không xóa cứng item nếu đang được tham chiếu lịch sử
read API chỉ trả item còn hiệu lực hoặc active theo rule
nếu category là hierarchical thì phải hỗ trợ parentCode
6. Validation Rules
code không được rỗng
nameVi bắt buộc
categoryCode phải tồn tại
validFrom <= validTo nếu cả hai cùng có
parentCode phải cùng category hoặc phù hợp rule phân cấp
7. Kiến trúc code
API
app/api/master-data/[categoryCode]/route.ts
app/api/master-data/[categoryCode]/tree/route.ts
Service
lib/services/master-data/master-data-read.service.ts
Repository
lib/repositories/master-data/master-data-read.repo.ts
Hooks
hooks/useMasterData.ts
Components
components/shared/MasterDataSelect.tsx
8. Phase triển khai cho Claude
Phase 1
Prisma schema 4 bảng lõi
enum cache/source/sync status nếu cần
Phase 2
read repository + read service
public lookup APIs
Phase 3
useMasterData
MasterDataSelect
Phase 4
tree API + hierarchical select
9. Notes for Claude
Phase này ưu tiên khả năng tái sử dụng toàn hệ thống
Không gắn chặt với riêng một module nghiệp vụ nào
Nếu project đã có hook/select tương tự, phải refactor hoặc wrap thay vì tạo trùng lặp