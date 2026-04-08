# MODULE M18 – TEMPLATE MANAGEMENT
# UC-T01, UC-T02, UC-T08

---

## 1. Mục tiêu

Xây dựng lõi quản lý template:
- tạo / sửa / vô hiệu hóa template
- upload file mẫu DOCX / XLSX / HTML
- quản lý metadata
- quản lý version
- rollback version
- template library theo nhóm nghiệp vụ

---

## 2. Use Cases liên quan

### UC-T01 – Quản lý danh mục Template
- CRUD template
- upload file lên MinIO
- gán module nguồn
- gán format output
- validate placeholder
- audit log

### UC-T02 – Quản lý phiên bản Template
- xem lịch sử phiên bản
- so sánh diff placeholder
- rollback về phiên bản cũ
- không rollback nếu job đang chạy

### UC-T08 – Template Library
- thư viện mẫu theo nhóm nghiệp vụ
- card/list view
- search realtime
- filter theo module / status / format

---

## 3. Data Model

### 3.1. ReportTemplate

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK UUID |
| code | string | yes | mã unique |
| name | string | yes | tên template |
| description | string | no | mô tả |
| moduleSource | string[] | yes | danh sách module nguồn |
| outputFormats | string[] | yes | DOCX/PDF/XLSX/HTML |
| rbacCode | string | yes | function code |
| fileKey | string | no | file active hiện tại trên MinIO |
| dataMap | Json | yes | field mapping JSON |
| isActive | boolean | yes | active flag |
| currentVersion | int | yes | version hiện tại |
| createdBy | string | no | user id |
| createdAt | DateTime | yes | created time |
| updatedAt | DateTime | yes | updated time |

### 3.2. ReportTemplateVersion

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| templateId | string | yes | FK ReportTemplate |
| version | int | yes | số version |
| fileKey | string | yes | file trên MinIO |
| placeholders | Json | no | placeholder scan result |
| dataMapSnapshot | Json | yes | snapshot mapping |
| changeNote | string | no | ghi chú |
| changedBy | string | no | user id |
| changedAt | DateTime | yes | thời điểm đổi |

---

## 4. Business Rules

- `code` phải unique
- upload file > 20MB bị từ chối
- placeholder sai định dạng phải báo lỗi cụ thể
- update metadata có thể tăng version nếu làm thay đổi dataMap quan trọng
- không xóa cứng template
- không rollback nếu có export job đang chạy
- file đã export phải gắn đúng version lịch sử

---

## 5. Validation Rules

- `code`, `name`, `rbacCode` bắt buộc
- `moduleSource` không rỗng
- `outputFormats` không rỗng
- `dataMap` phải là JSON hợp lệ
- `file upload` chỉ nhận DOCX / XLSX / HTML
- `targetVersion` phải tồn tại khi rollback

---

## 6. API Contract

### Template CRUD
- `GET /api/templates`
- `POST /api/templates`
- `GET /api/templates/[id]`
- `PUT /api/templates/[id]`
- `DELETE /api/templates/[id]`

### File upload
- `POST /api/templates/[id]/upload`

### Versioning
- `GET /api/templates/[id]/versions`
- `POST /api/templates/[id]/rollback`

---

## 7. UI / Pages

### Pages
- `app/dashboard/templates/page.tsx`
- `app/dashboard/templates/new/page.tsx`
- `app/dashboard/templates/[id]/edit/page.tsx`

### Components
- `components/templates/library/template-library.tsx`
- `components/templates/library/template-card.tsx`
- `components/templates/library/template-list-view.tsx`
- `components/templates/detail/template-detail-drawer.tsx`
- `components/templates/wizard/template-wizard.tsx`
- `components/templates/version/version-history-list.tsx`

---

## 8. Phase triển khai cho Claude

### Phase 1
- schema `ReportTemplate`, `ReportTemplateVersion`

### Phase 2
- template CRUD API + repository + service

### Phase 3
- upload file + placeholder scan stub

### Phase 4
- version history + rollback

### Phase 5
- template library UI + create/edit wizard shell

---

## 9. Notes for Claude

- Không biến template thành “1 file upload đơn giản”
- Phải giữ versioning là tính năng lõi
- `moduleSource` là điểm mấu chốt để liên kết tới M02–M17
- File active hiện tại và lịch sử version phải tách rõ