
Mô tả stack kỹ thuật, model AI, pipeline, các chức năng AI và dashboard của UC-48 đều bám trực tiếp tài liệu M09. :contentReference[oaicite:8]{index=8} :contentReference[oaicite:9]{index=9} :contentReference[oaicite:10]{index=10}

---

## `docs/design/module-m09-duplicate-check.md`

```md
# MODULE M09 – UC-49
# PHÁT HIỆN TRÙNG LẶP ĐỀ TÀI (AI DUPLICATE DETECTION)

---

## 1. Mục tiêu use case

Xây dựng phân hệ AI phát hiện trùng lặp đề tài nghiên cứu trước khi phê duyệt, giúp:
- giảm trùng lặp chủ đề,
- tránh đầu tư dàn trải,
- cảnh báo sớm đề tài quá tương đồng,
- hỗ trợ Phòng KHQS và Hội đồng KH ra quyết định.

---

## 2. Thông tin use case

- Mã UC: UC-49
- Trạng thái: MỚI phát triển
- Độ phức tạp: Cao
- Giai đoạn roadmap:
  - Sprint 4
- Kết quả bàn giao mong muốn:
  - AI endpoint
  - duplicate detection UI

---

## 3. Chức năng chính

### 3.1. Kiểm tra trùng lặp khi đăng ký đề tài
- nhập title / abstract / keywords
- hệ thống phân tích mức độ tương đồng với kho đề tài và công bố hiện có

### 3.2. Similarity search
- tìm top N đề tài / công bố tương đồng nhất

### 3.3. Risk banding
- phân mức cảnh báo:
  - đỏ
  - vàng
  - xanh

### 3.4. Giải thích kết quả
- hiển thị:
  - bản ghi tương đồng
  - điểm similarity
  - từ khóa / đoạn nội dung tương đồng
  - lý do gợi ý

---

## 4. Dữ liệu đầu vào

- title đề tài
- abstract đề tài
- keywords
- danh mục `ResearchProject`
- danh mục `ResearchPublication`

---

## 5. Hướng kỹ thuật

### 5.1. Thành phần chấm điểm
- embedding similarity
- cosine similarity
- BM25 / full-text match
- ensemble scoring

### 5.2. Kết quả
- `duplicateScore`
- `riskLevel`
- `matchedItems`
- `explanation`

### 5.3. Khả năng mở rộng
- thêm rule theo lĩnh vực
- thêm ngưỡng riêng cho từng loại đề tài
- học ngưỡng từ dữ liệu đánh giá thực tế

---

## 6. Data Model

### 6.1. DuplicateCheckResult

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | khóa chính |
| sourceTitle | string | yes | tiêu đề đầu vào |
| sourceAbstract | string | no | tóm tắt đầu vào |
| sourceKeywords | string[] | yes | từ khóa đầu vào |
| duplicateScore | float | yes | điểm tương đồng tổng |
| riskLevel | DuplicateRiskLevel | yes | mức rủi ro |
| explanation | string | no | giải thích |
| createdBy | string | no | người thực hiện |
| createdAt | DateTime | yes | thời điểm tạo |

### 6.2. DuplicateMatchItem

| Field | Type | Required | Description |
|------|------|----------|-------------|
| id | string | yes | khóa chính |
| checkResultId | string | yes | FK DuplicateCheckResult |
| matchedEntityType | string | yes | PROJECT / PUBLICATION |
| matchedEntityId | string | yes | id bản ghi tương đồng |
| title | string | yes | tiêu đề bản ghi khớp |
| score | float | yes | điểm tương đồng |
| reason | string | no | giải thích |
| rank | int | yes | thứ hạng |

### 6.3. Enum DuplicateRiskLevel
- RED
- YELLOW
- GREEN

---

## 7. Business Rules

- Duplicate detection là công cụ hỗ trợ quyết định, không tự động bác đề tài
- Kết quả phải lưu để audit
- Kiểm tra có thể chạy:
  - khi tạo mới đề tài,
  - khi submit đề tài,
  - khi KHQS yêu cầu kiểm tra lại
- Kết quả top matches phải có thể mở xem chi tiết

---

## 8. API Contract

### 8.1. POST `/api/research/ai/duplicate-check`
Request:
- title
- abstract
- keywords

Response:
```json
{
  "success": true,
  "data": {
    "duplicateScore": 0.82,
    "riskLevel": "RED",
    "matches": []
  },
  "error": null
}

8.2. GET /api/research/ai/duplicate-check/[id]
xem lại kết quả đã lưu
8.3. GET /api/research/ai/duplicate-check/history
lịch sử kiểm tra
9. UI / Pages
app/dashboard/research/ai/duplicate-check/page.tsx
app/dashboard/research/ai/duplicate-check/[id]/page.tsx

Components:

components/research/ai/duplicate-check-form.tsx
components/research/ai/duplicate-result-card.tsx
components/research/ai/duplicate-match-table.tsx
components/research/ai/duplicate-risk-badge.tsx
10. Kiến trúc code
API
app/api/research/ai/duplicate-check/route.ts
app/api/research/ai/duplicate-check/[id]/route.ts
app/api/research/ai/duplicate-check/history/route.ts
Service
lib/services/duplicate-check.service.ts
Repository
lib/repositories/duplicate-check.repo.ts
Validator
lib/validators/duplicate-check.schema.ts
AI adapter
lib/integrations/ai-engine/duplicate-check.client.ts
11. Tích hợp với các UC khác
UC-45: gọi duplicate-check khi tạo / submit đề tài
UC-46: dùng kho công bố làm tập tham chiếu
UC-47: có thể gợi ý chuyên gia phản biện theo chuyên môn liên quan
UC-48: dùng chung nền embedding và vectorization
12. Phase triển khai cho Claude
Phase 1
schema lưu kết quả check
Phase 2
API adapter gọi AI engine
Phase 3
lưu history và hiển thị kết quả
Phase 4
tích hợp vào form đăng ký đề tài UC-45
13. Notes for Claude
Đây là use case AI mới, không nên cài cứng thuật toán trong UI
Kết quả cần có khả năng audit
UI phải làm rõ mức độ rủi ro và top matches
Nên chừa ngưỡng riskLevel thành config để điều chỉnh sau
