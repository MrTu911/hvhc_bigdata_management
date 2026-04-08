# MODULE M18 – IMPORT TEMPLATE & MIGRATION
# UC-T12

---

## 1. Mục tiêu

Cho phép nhập các file Word / Excel đang dùng thực tế để:
- phân tích cấu trúc template,
- phát hiện placeholder / field khả dĩ,
- gợi ý mapping bằng AI / rule-based matching,
- xác nhận và tạo template mới trong M18.

Đây là điểm khởi đầu để migration từ hệ thống cũ.

---

## 2. Use Case liên quan

### UC-T12 – Nhập template từ file Word/Excel hiện có
- upload file mẫu
- parse file
- detect fields / tables
- AI gợi ý mapping
- người dùng review
- confirm tạo template mới

---

## 3. Data Model

### 3.1. TemplateImportAnalysis

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | PK |
| fileKey | string | yes | file trên storage |
| fileName | string | yes | tên file |
| fileType | string | yes | DOCX / XLSX |
| fileStats | Json | no | thống kê file |
| detectedFields | Json | no | fields phát hiện |
| suggestedMappings | Json | no | gợi ý mapping |
| analysisStatus | string | yes | CREATED / ANALYZED / CONFIRMED / EXPIRED |
| expiresAt | DateTime | yes | TTL confirm |
| createdBy | string | no | user id |
| createdAt | DateTime | yes | tạo |

---

## 4. Business Rules

- file > 10MB hoặc > ngưỡng thiết kế có thể bị từ chối
- file có cấu trúc phức tạp phải cảnh báo giới hạn render
- placeholder đặc biệt hoặc bảng lồng có thể yêu cầu map tay
- analysis có TTL, quá hạn phải phân tích lại
- confirm sẽ tạo template mới với version 1

---

## 5. API Contract

- `POST /api/templates/import/analyze`
- `POST /api/templates/import/confirm`

### Analyze response
- suggestedPlaceholders
- tables
- fileStats
- confidence score

### Confirm response
- templateId
- version
- createdAt

---

## 6. UI / Pages

### Pages
- `app/dashboard/templates/import/page.tsx`

### Components
- `components/templates/import/template-import-wizard.tsx`
- `components/templates/import/step-upload.tsx`
- `components/templates/import/mapping-review.tsx`
- `components/templates/import/manual-override-input.tsx`

---

## 7. Kiến trúc code

### API
- `app/api/templates/import/analyze/route.ts`
- `app/api/templates/import/confirm/route.ts`

### Services
- `lib/services/template/template-import.service.ts`

### Integrations
- `lib/integrations/render/template-analyzer.ts`
- `lib/integrations/ai/template-field-matcher.ts`

---

## 8. Phase triển khai cho Claude

### Phase 1
- schema `TemplateImportAnalysis`

### Phase 2
- analyze API scaffold

### Phase 3
- confirm API + create template version 1

### Phase 4
- import wizard UI

---

## 9. Notes for Claude

- Đây là use case migration, rất quan trọng để chuyển mẫu cũ sang M18
- Không nên hứa “AI hiểu hết file cũ”
- Phải chừa manual override rõ ràng
- Analyze và confirm phải tách rời