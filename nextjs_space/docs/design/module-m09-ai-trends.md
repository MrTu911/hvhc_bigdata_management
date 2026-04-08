# MODULE M09 – UC-48
# AI PHÂN TÍCH XU HƯỚNG NGHIÊN CỨU

---

## 1. Mục tiêu use case

Nâng cấp phân hệ AI hiện có để phân tích xu hướng nghiên cứu khoa học trong Học viện Hậu cần, hỗ trợ:
- phát hiện chủ đề nghiên cứu nổi lên / suy giảm,
- so sánh danh mục nghiên cứu hiện có với khoảng trống tiềm năng,
- gợi ý nhà khoa học phù hợp,
- gợi ý tài liệu tham khảo,
- dự báo nhu cầu ngân sách nghiên cứu.

---

## 2. Thông tin use case

- Mã UC: UC-48
- Trạng thái: NÂNG CẤP (từ prototype hiện có)
- Độ phức tạp: Cao
- Stack kỹ thuật:
  - Python / FastAPI (AI Engine)
  - ClickHouse (analytics)
  - Apache Spark (batch)
- Model AI:
  - sentence-transformers embeddings
  - clustering HDBSCAN
  - time-series analysis
- Đường dẫn UI/API:
  - `/dashboard/research/ai/*`
  - `/api/research/ai/*`

---

## 3. Chức năng AI chính

### 3.1. Phân cụm chủ đề nghiên cứu
- embedding tất cả abstract đề tài và công bố
- clustering bằng HDBSCAN
- trực quan hóa bản đồ chủ đề bằng UMAP

### 3.2. Phân tích xu hướng
- time-series analysis trên số lượng công bố theo lĩnh vực
- phát hiện lĩnh vực:
  - tăng
  - giảm
  - mới nổi

### 3.3. Gap Analysis
- so sánh portfolio nghiên cứu của Học viện với top journals / chuẩn tham chiếu
- phát hiện lĩnh vực có tiềm năng nhưng chưa khai thác tốt

### 3.4. Gợi ý nhà khoa học phù hợp
- similarity search trên `researchVector`
- gợi ý PI hoặc thành viên phù hợp cho đề tài mới

### 3.5. Gợi ý tài liệu tham khảo
- RAG từ kho công bố nội bộ
- có thể kết nối Semantic Scholar API ở tầng AI Engine

### 3.6. Dự báo ngân sách nghiên cứu
- regression model trên lịch sử kinh phí
- gợi ý nhu cầu ngân sách năm tới

---

## 4. Pipeline kỹ thuật

```text
[PostgreSQL / CSDL M09]
→ [Apache Kafka: stream events]
→ [Apache Spark: batch mỗi đêm]
→ [ClickHouse: analytical store]
→ [Python AI Engine / FastAPI]
   ├── Embedding model
   ├── HDBSCAN clustering
   ├── Time-series
   └── RAG pipeline
→ [Next.js API Route: /api/research/ai/*]
→ [React + Superset dashboard]

5. Data Inputs

Nguồn dữ liệu đầu vào:

ResearchProject.abstract
ResearchPublication.abstract
ResearchPublication.keywords
ScientistProfile.researchFields
dữ liệu budget lịch sử
dữ liệu đề tài theo năm / lĩnh vực / cấp
6. Data Outputs
6.1. TrendCluster
clusterId
clusterName
topKeywords
topicCount
relatedFields
growthRate
6.2. TrendTimeSeries
field
year
publicationCount
projectCount
trendLabel
6.3. GapRecommendation
researchField
evidence
priorityScore
suggestedTopic
6.4. ResearcherRecommendation
userId
score
matchedFields
reason
6.5. BudgetForecast
year
field
predictedBudget
confidence
7. Business Rules
AI không thay quyết định của con người; chỉ đóng vai trò hỗ trợ
Dashboard phải hiển thị được nguồn gốc dữ liệu / độ tin cậy ở mức phù hợp
Dữ liệu AI phải có khả năng refresh theo batch
Gợi ý nhà khoa học phải dựa trên dữ liệu thực tế về lĩnh vực, đề tài, công bố
8. API Contract
8.1. GET /api/research/ai/trends

Query:

field
yearFrom
yearTo

Response:

xu hướng theo lĩnh vực
cluster topics
growth / decline signals
8.2. GET /api/research/ai/gaps
trả về gap analysis
8.3. GET /api/research/ai/recommend-researchers

Query:

keyword
field
abstract
8.4. GET /api/research/ai/recommend-references

Query:

keyword
abstract
8.5. GET /api/research/ai/budget-forecast

Query:

year
field
9. UI / Pages
app/dashboard/research/ai/trends/page.tsx
app/dashboard/research/ai/gaps/page.tsx
app/dashboard/research/ai/recommendations/page.tsx

Components:

components/research/ai/trend-chart.tsx
components/research/ai/topic-map.tsx
components/research/ai/gap-analysis-panel.tsx
components/research/ai/researcher-recommendation-list.tsx
components/research/ai/budget-forecast-chart.tsx
10. Kiến trúc code
Next.js side
app/api/research/ai/trends/route.ts
app/api/research/ai/gaps/route.ts
app/api/research/ai/recommend-researchers/route.ts
app/api/research/ai/recommend-references/route.ts
app/api/research/ai/budget-forecast/route.ts
AI integration service
lib/services/research-ai.service.ts
Adapter / client AI engine
lib/integrations/ai-engine/research-ai.client.ts
11. Tích hợp với các UC khác
UC-45: phân tích abstract đề tài, gợi ý PI, dự báo budget
UC-46: phân tích công bố và keyword
UC-47: dùng researchVector, năng lực chuyên môn
UC-49: dùng cùng nền embedding nhưng mục tiêu khác
12. Phase triển khai cho Claude
Phase 1
tạo API proxy / adapter tới AI Engine
Phase 2
dashboard trends cơ bản
Phase 3
researcher recommendation + reference recommendation
Phase 4
gap analysis + budget forecast
13. Notes for Claude
Đây là use case AI nâng cấp, không phải CRUD nội bộ thuần
Business logic chính nằm ở AI Engine
Next.js chủ yếu làm:
adapter,
presentation,
auth/RBAC,
dashboard,
orchestration
Không nhúng trực tiếp model AI vào Next.js app