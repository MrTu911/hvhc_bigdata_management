Tôi đã có đủ thông tin. Bây giờ tôi sẽ phân tích toàn diện và xây dựng phương án triển khai.

Phân tích Tình trạng Hiện tại vs Thiết kế CSDL-KHQL
1. Tóm tắt
M09 hiện tại đã xây dựng được backbone vững chắc cho 5 UC cơ bản. Thiết kế CSDL-KHQL yêu cầu mở rộng lên 14 module. Chiến lược bắt buộc là EXTEND + ADD NEW, tuyệt đối không rebuild.

2. Gap Analysis chính xác
Module CSDL-KHQL	Yêu cầu	Trạng thái hiện tại	Chiến lược
M01 ScienceCatalog	LTREE catalog, code gen	CHƯA CÓ	Add new
M02+ Scientist detail	ScientistEducation, Career, Award	NckhScientistProfile có metrics nhưng thiếu sub-tables	Extend + Add sub-tables
M03+ Project nâng cao	ProjectWorkflowLog, embedding, sensitivity	NckhProject hoàn chỉnh nhưng thiếu 3 fields + WorkflowLog	Additive migration
M04+ Scientific Works	ScientificWork (sách/GT), CrossRef, DOI	NckhPublication focus bài báo, thiếu books/textbooks entity	Add new model
M05 Thư viện số	LibraryItem, LibraryAccessLog, MinIO bucket	CHƯA CÓ	Add new
M06 Kinh phí	ResearchBudget, BudgetLineItem (chi tiết)	NckhProject có 3 budget fields tổng, thiếu detail	Add new models
M07 Hội đồng KH	ScientificCouncil, CouncilMember, phản biện kín	NckhReview ghi kết quả đơn giản, thiếu Council formal	Add new models
M08 KPI	Aggregate queries, impact score	dashboard-stats + compute-stats có một phần	Extend services
M09 Dashboard	4-layer role dashboard	Có một phần, cần nâng cấp	Extend
M10 Data Quality	Data Catalog, Quality Score, Lineage	CHƯA CÓ	Add new
M11 Hybrid Search	BM25 + pgvector + unaccent	Có pgvector ở AI routes, chưa unified	Extend
M12+ AI nâng cao	RAG chatbot, redaction middleware	ai/trends, ai/duplicate-check có, cần RAG + redaction	Extend
M13+ RBAC mở rộng	20 function codes, 7 roles mới	RBAC engine đã có, thiếu science-specific codes	Extend (seed)
M14 Báo cáo BQP	docx/xlsx/pdf templates	export routes có, thiếu BQP template engine	Extend
3 xung đột model cần quyết định ngay:

Xung đột	Quyết định
NckhReview vs ScientificCouncil	Giữ cả 2: NckhReview = ghi kết quả nghiệm thu; ScientificCouncil = quản lý hội đồng formal (thành viên, phản biện kín, bỏ phiếu). Không thay thế nhau.
NckhPublication vs ScientificWork	Giữ cả 2: NckhPublication = bài báo/kết quả từ đề tài; ScientificWork = sách/giáo trình/chuyên khảo cho thư viện số. Khác bản chất.
Scientist (design) vs NckhScientistProfile	Không tạo Scientist mới. Extend NckhScientistProfile + thêm sub-tables NckhScientistEducation, NckhScientistCareer, NckhScientistAward.
3. Phụ thuộc hệ thống

M01 (RBAC) ─────────────────────────────────► Tất cả modules
M19 (ScienceCatalog) ──────────────────────► M03, M04, M05, M06
NckhScientistProfile (extended) ───────────► M03, M04, M07
NckhProject (extended) ────────────────────► M05, M06, M07
ScientificWork ─────────────────────────────► M05 (LibraryItem)
ResearchBudget ─────────────────────────────► M08 (KPI)
ScientificCouncil ──────────────────────────► M08 (KPI)
4. Phương án Phase Triển khai
Phase 0 — Chuẩn bị nền tảng (0.5 tuần)
Mục tiêu: Zero-risk preparation.


# Bắt buộc trước khi bắt đầu
pg_dump hvhc_bigdata_89 > backup_pre_csdlkhql_$(date +%Y%m%d).sql
Công việc:

Verify npx tsc --noEmit = 0 errors trên codebase hiện tại
Thêm ENABLE_CSDL_KHQL=false vào .env
Tạo thư mục app/api/science/ (path prefix mới, không đụng /api/research/)
Tạo thư mục app/(dashboard)/dashboard/science/
Tạo lib/services/science/ cho science-specific services
Output: Môi trường sạch, không breaking change nào.

Phase 1 — RBAC + Danh mục KH (Tuần 1–2)
Mục tiêu: Xây nền dữ liệu mà mọi module sau phụ thuộc vào.

Schema mới (additive, không đụng schema cũ):


model ScienceCatalog {
  id          String   @id @default(cuid())
  code        String   @unique  // HVHC-2026-FIELD-001
  name        String
  type        String   // FIELD|WORK_TYPE|PUBLISHER|FUND_SOURCE|LEVEL
  parentId    String?
  parent      ScienceCatalog?  @relation("CatalogTree", fields: [parentId], references: [id])
  children    ScienceCatalog[] @relation("CatalogTree")
  level       Int      @default(1)
  path        String?  // LTREE: science.military.logistics
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdById String
  createdBy   User     @relation(fields: [createdById], references: [id])

  @@index([type, isActive])
  @@index([parentId])
  @@map("science_catalogs")
}

model ScienceIdSequence {
  id          String @id @default(cuid())
  entityType  String
  year        Int
  lastSeq     Int    @default(0)

  @@unique([entityType, year])
  @@map("science_id_sequences")
}
Function codes mới (thêm vào file rbac hiện tại, không sửa codes cũ):


// Thêm vào cuối lib/rbac/function-codes.ts
MANAGE_SCIENCE_CATALOG: "MANAGE_SCIENCE_CATALOG",
VIEW_SCIENCE_CATALOG: "VIEW_SCIENCE_CATALOG",
VIEW_SCIENTIST_PROFILE: "VIEW_SCIENTIST_PROFILE",
MANAGE_SCIENTIST_PROFILE: "MANAGE_SCIENTIST_PROFILE",
SYNC_ORCID: "SYNC_ORCID",
CREATE_RESEARCH_PROJECT: "CREATE_RESEARCH_PROJECT",
APPROVE_RESEARCH_DEPT: "APPROVE_RESEARCH_DEPT",
APPROVE_RESEARCH_ACADEMY: "APPROVE_RESEARCH_ACADEMY",
CREATE_SCIENTIFIC_WORK: "CREATE_SCIENTIFIC_WORK",
IMPORT_FROM_CROSSREF: "IMPORT_FROM_CROSSREF",
UPLOAD_LIBRARY: "UPLOAD_LIBRARY",
DOWNLOAD_LIBRARY_NORMAL: "DOWNLOAD_LIBRARY_NORMAL",
DOWNLOAD_LIBRARY_SECRET: "DOWNLOAD_LIBRARY_SECRET",
MANAGE_RESEARCH_BUDGET: "MANAGE_RESEARCH_BUDGET",
APPROVE_BUDGET: "APPROVE_BUDGET",
VIEW_BUDGET_FINANCE: "VIEW_BUDGET_FINANCE",
MANAGE_COUNCIL: "MANAGE_COUNCIL",
SUBMIT_REVIEW: "SUBMIT_REVIEW",
FINALIZE_ACCEPTANCE: "FINALIZE_ACCEPTANCE",
VIEW_SCIENCE_DASHBOARD: "VIEW_SCIENCE_DASHBOARD",
USE_SCIENCE_SEARCH: "USE_SCIENCE_SEARCH",
USE_AI_SCIENCE: "USE_AI_SCIENCE",
EXPORT_SCIENCE_REPORT: "EXPORT_SCIENCE_REPORT",
APIs mới:

GET/POST /api/science/catalogs — filter by type, parent; cache Redis 1h
POST /api/science/catalogs/generate-code — format HVHC-{YEAR}-{TYPE}-{SEQ}
Output kiểm chứng: RBAC test 100%, catalog CRUD hoạt động, 0 breaking change.

Phase 2 — Mở rộng Hồ sơ Nhà Khoa học (Tuần 3–4)
Mục tiêu: Nâng NckhScientistProfile từ metrics summary → full career profile.

Schema (extend + add sub-tables, không drop gì):


// Thêm fields vào NckhScientistProfile (additive migration):
// bioEmbedding  Unsupported("vector(1536)")?
// sensitivityLevel String @default("NORMAL")
// researchAreaIds String[]  // FK → ScienceCatalog.id[]

// Sub-tables mới:
model NckhScientistEducation {
  id           String   @id @default(cuid())
  scientistId  String   // FK → NckhScientistProfile.id
  degree       String   // TSKH|TS|ThS|CN|KS
  major        String
  institution  String
  country      String   @default("Việt Nam")
  yearFrom     Int
  yearTo       Int
  thesisTitle  String?
  @@index([scientistId])
  @@map("nckh_scientist_education")
}

model NckhScientistCareer {
  id          String   @id @default(cuid())
  scientistId String
  position    String
  unitName    String
  yearFrom    Int
  yearTo      Int?
  isCurrent   Boolean  @default(false)
  @@index([scientistId])
  @@map("nckh_scientist_career")
}

model NckhScientistAward {
  id          String   @id @default(cuid())
  scientistId String
  awardName   String
  level       String   // MINISTRY|ACADEMY|DEPARTMENT
  year        Int
  projectId   String?  // Link đề tài nếu có
  @@index([scientistId])
  @@map("nckh_scientist_awards")
}
APIs mới (path /api/science/scientists/*, không sửa /api/research/scientists/*):

GET /api/science/scientists — full profile với education/career/awards
GET /api/science/scientists/:id — detail với sensitivity filter
POST /api/science/scientists/:id/sync-orcid — ORCID Public API v3.0, BullMQ job
GET /api/science/scientists/:id/export — biểu mẫu chuẩn BQP (docx/pdf)
Service mới: lib/services/science/scientist.service.ts — wrap NckhScientistProfile + aggregate education/career/awards.

Output kiểm chứng: Profile đầy đủ 5 tab (thông tin, học vấn, sự nghiệp, NCKH, giải thưởng). ORCID sync job hoạt động.

Phase 3 — Nâng cấp Đề tài + Công trình KH (Tuần 5–7)
Mục tiêu: Hoàn thiện M03 workflow + thêm M04 ScientificWork (sách/giáo trình).

Schema — Additive migration NckhProject:


// Thêm vào NckhProject (migration --create-only trước):
// sensitivity     String   @default("NORMAL")  // NORMAL|CONFIDENTIAL|SECRET
// embedding       Unsupported("vector(1536)")?
// fundSourceId    String?  // FK → ScienceCatalog

// Model mới: workflow audit trail
model NckhProjectWorkflowLog {
  id         String   @id @default(cuid())
  projectId  String
  fromStatus String
  toStatus   String
  fromPhase  String?
  toPhase    String?
  actionById String
  actionBy   User     @relation(fields: [actionById], references: [id])
  comment    String?
  actedAt    DateTime @default(now())
  @@index([projectId])
  @@map("nckh_project_workflow_logs")
}
Schema — ScientificWork (model mới, khác NckhPublication):


model ScientificWork {
  id          String   @id @default(cuid())
  code        String   @unique  // HVHC-2026-WORK-001
  type        String   // TEXTBOOK|BOOK|MONOGRAPH|REFERENCE|CURRICULUM
  title       String
  subtitle    String?
  isbn        String?
  issn        String?
  doi         String?  @unique
  publisherId String?  // FK → ScienceCatalog (type=PUBLISHER)
  journalName String?
  year        Int
  edition     Int      @default(1)
  sensitivity String   @default("NORMAL")
  abstractEmbedding Unsupported("vector(1536)")?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  isDeleted   Boolean  @default(false)
  authors     ScientificWorkAuthor[]
  libraryItems LibraryItem[]
  @@index([type, year])
  @@index([isDeleted])
  @@map("scientific_works")
}

model ScientificWorkAuthor {
  id           String          @id @default(cuid())
  workId       String
  scientistId  String?         // Link → NckhScientistProfile nếu là nội bộ
  authorName   String
  role         String          // LEAD|CO_AUTHOR|EDITOR|REVIEWER
  orderNum     Int
  affiliation  String?
  @@unique([workId, scientistId])
  @@map("scientific_work_authors")
}
APIs mới:

GET/POST /api/science/projects — wrap NckhProject với sensitivity filter
POST /api/science/projects/:id/workflow — transition với WorkflowLog
GET /api/science/projects/alerts — deadline < 30 ngày (cronjob 06:00)
GET/POST /api/science/works — ScientificWork CRUD
POST /api/science/works/import-crossref — DOI → auto-fill metadata
POST /api/science/works/check-duplicate — BM25 + cosine similarity, threshold 0.80
Output kiểm chứng: Workflow đề tài end-to-end với log. Import DOI từ CrossRef. Duplicate check hoạt động.

Phase 4 — Thư viện Số (Tuần 8–9)
Mục tiêu: Digital library với MinIO, virus scan, semantic search.

Schema:


model LibraryItem {
  id               String   @id @default(cuid())
  workId           String?  // FK → ScientificWork (optional)
  title            String
  filePath         String   // MinIO object key: library/{sensitivity}/{uuid}.pdf
  fileSize         BigInt
  mimeType         String
  checksumSha256   String
  sensitivity      String   @default("NORMAL")  // NORMAL|CONFIDENTIAL|SECRET
  accessCount      Int      @default(0)
  downloadCount    Int      @default(0)
  textEmbedding    Unsupported("vector(1536)")?
  isIndexed        Boolean  @default(false)
  indexedAt        DateTime?
  createdAt        DateTime @default(now())
  isDeleted        Boolean  @default(false)
  accessLogs       LibraryAccessLog[]
  @@index([sensitivity, isDeleted])
  @@map("library_items")
}

model LibraryAccessLog {
  id         String   @id @default(cuid())
  itemId     String
  userId     String
  action     String   // VIEW|DOWNLOAD
  ipAddress  String?
  accessedAt DateTime @default(now())
  @@index([itemId, accessedAt])
  @@map("library_access_logs")
}
APIs mới:

POST /api/science/library/upload — max 200MB, ClamAV scan, BullMQ indexing job
GET /api/science/library/:id/download — pre-signed URL 15 phút, ghi LibraryAccessLog
POST /api/science/library/semantic-search — query → embedding → pgvector cosine
Security: File SECRET chỉ serve qua IP whitelist nội bộ. Pre-signed URL expiry 15 phút.

Output kiểm chứng: Upload → scan → index pipeline. Download với audit trail. Semantic search hoạt động.

Phase 5 — Kinh phí + Hội đồng KH (Tuần 10–12)
Mục tiêu: Financial tracking chi tiết + formal council workflow.

Schema — ResearchBudget (extend từ NckhProject.budgetApproved, không xóa field cũ):


model ResearchBudget {
  id             String   @id @default(cuid())
  projectId      String   @unique  // 1-1 với NckhProject
  fundSourceId   String   // FK → ScienceCatalog (type=FUND_SOURCE)
  totalApproved  BigInt
  totalSpent     BigInt   @default(0)
  year           Int
  status         String   @default("DRAFT")  // DRAFT|APPROVED|FINALIZED
  approvedById   String?
  approvedAt     DateTime?
  lineItems      BudgetLineItem[]
  @@map("research_budgets")
}

model BudgetLineItem {
  id             String         @id @default(cuid())
  budgetId       String
  budget         ResearchBudget @relation(fields: [budgetId], references: [id], onDelete: Cascade)
  category       String         // PERSONNEL|EQUIPMENT|TRAVEL|OVERHEAD|OTHER
  description    String
  plannedAmount  BigInt
  spentAmount    BigInt         @default(0)
  period         String?        // Q1-2026
  @@map("budget_line_items")
}
Schema — ScientificCouncil (bổ sung cho NckhReview, không thay thế):


model ScientificCouncil {
  id               String   @id @default(cuid())
  projectId        String   // FK → NckhProject
  type             String   // REVIEW|ACCEPTANCE|FINAL
  chairmanId       String   // FK → User
  secretaryId      String   // FK → User
  meetingDate      DateTime?
  result           String?  // PASS|FAIL|REVISE
  overallScore     Float?
  conclusionText   String?
  minutesFilePath  String?  // MinIO path
  createdAt        DateTime @default(now())
  members          ScientificCouncilMember[]
  reviews          ScientificCouncilReview[]
  @@index([projectId])
  @@map("scientific_councils")
}

model ScientificCouncilMember {
  id         String             @id @default(cuid())
  councilId  String
  council    ScientificCouncil  @relation(fields: [councilId], references: [id], onDelete: Cascade)
  userId     String
  role       String             // CHAIRMAN|SECRETARY|REVIEWER|EXPERT
  vote       String?            // PASS|FAIL|REVISE (phản biện kín - chỉ CHAIRMAN/ADMIN thấy)
  @@unique([councilId, userId])
  @@map("scientific_council_members")
}
APIs mới:

GET/POST /api/science/budgets — CRUD budget với line items
GET /api/science/budgets/alerts/overspend — cảnh báo 90% và 100%
POST /api/science/councils — tạo hội đồng, chỉ định thành viên
POST /api/science/councils/:id/acceptance — kết quả PASS/FAIL/REVISE
Security: vote field của CouncilMember chỉ visible với CHAIRMAN + ADMIN (phản biện kín).

Output kiểm chứng: Budget with line items. Council workflow hoàn chỉnh.

Phase 6 — KPI + Báo cáo BQP (Tuần 13–14)
Mục tiêu: Analytics aggregation + report generation.

Service mới: lib/services/science/kpi.service.ts


// Aggregate từ NckhProject + NckhPublication + ScientificWork + ResearchBudget
interface UnitKpiData {
  unitId: string
  year: number
  totalProjects: number
  approvedProjects: number
  completedProjects: number
  totalPublications: number
  isiPublications: number
  scopusPublications: number
  totalBudgetApproved: bigint
  totalBudgetUsed: bigint
  avgCompletionScore: number
  impactScore: number  // weighted formula
}
APIs:

GET /api/science/metrics/unit-performance?unitId=&year= — aggregate M03+M04+scientists, cache Redis 10 phút
GET /api/science/reports?type=MONTHLY|QUARTERLY|ANNUAL&unit=&year= — BullMQ queue, docx/xlsx output
BQP Templates (5 mẫu cơ bản):

Báo cáo tháng NCKH đơn vị
Báo cáo đề tài theo cấp
Danh sách công trình KH năm
Tổng hợp kinh phí NCKH
Hồ sơ nhà khoa học (BQP format)
Output kiểm chứng: 5 mẫu báo cáo xuất đúng format. KPI dashboard data chính xác.

Phase 7 — Dashboard + Tìm kiếm thông minh (Tuần 15–16)
Mục tiêu: 4-layer role dashboard + unified hybrid search.

Dashboard layers:

Layer	Actor	Data
Academy	ACADEMY_CHIEF, ADMIN	Tổng hợp toàn học viện, top researchers, KPI chart
Unit	DEPT_CHIEF, SCI_DEPT_HEAD	Đề tài/công trình của đơn vị, budget progress
Researcher	RESEARCHER	Đề tài của bản thân, publications, profile metrics
Reviewer	REVIEWER	Hội đồng cần tham gia, phản biện pending
Hybrid Search (/api/science/search?q=&type=project|work|scientist):


// 3-stage ranking:
// 1. tsvector full-text (PostgreSQL, unaccent for Vietnamese)
// 2. pg_trgm trigram similarity
// 3. pgvector cosine similarity (semantic)
// BM25 ensemble score → ranked results
Output kiểm chứng: Dashboard render đúng theo role. Search tiếng Việt có/không dấu cho kết quả liên quan.


Phase 8 — AI nâng cao + Data Quality (Tuần 17–18)
Mục tiêu: RAG chatbot + data quality monitoring.

Data Redaction Middleware (bắt buộc trước mọi AI call):


// lib/science/ai-redaction.ts
const SENSITIVE_FIELDS = [
  'sensitivity', 'rank', 'militaryPosition',
  'budgetFinancialDetail', 'councilVoteDetail', 'secretFilePath'
]
RAG Chatbot:

Vector store: pgvector (abstracts + keywords từ NckhProject, NckhPublication, ScientificWork)
LLM: OpenAI GPT-4o với system prompt domain-specific
Guard: AI chỉ hoạt động trên records có status = PUBLISHED/COMPLETED/APPROVED
Audit: logAudit({ resourceType: 'AI_CHAT_SCIENCE' }) sau mỗi session
Data Quality (M10):


interface DataQualityScore {
  entityType: string  // PROJECT|PUBLICATION|SCIENTIST
  completeness: number  // % fields filled
  accuracy: number      // validation rules passed
  timeliness: number    // last updated within threshold
  overallScore: number  // weighted 40/40/20
}
Output kiểm chứng: AI không trả dữ liệu SECRET. Chatbot phân quyền đúng scope. Data quality score > 80% cho mẫu dữ liệu.

5. File cần tạo/sửa theo Phase
Phase	File tạo mới	File sửa
P0	app/api/science/ (dir), app/(dashboard)/dashboard/science/ (dir)	.env
P1	prisma/migrations/*_add_science_catalog, app/api/science/catalogs/route.ts, lib/services/science/catalog.service.ts, prisma/seeds/science-rbac-seed.ts	lib/rbac/function-codes.ts
P2	prisma/migrations/*_extend_scientist_profile, Models: NckhScientistEducation/Career/Award, app/api/science/scientists/[id]/route.ts, lib/services/science/scientist.service.ts	prisma/schema.prisma (additive)
P3	prisma/migrations/*_extend_project_sensitivity, Model: NckhProjectWorkflowLog, Model: ScientificWork + ScientificWorkAuthor, app/api/science/projects/, app/api/science/works/, lib/services/science/project.service.ts, lib/services/science/scientific-work.service.ts, lib/integrations/crossref-api.ts	prisma/schema.prisma
P4	Models: LibraryItem + LibraryAccessLog, app/api/science/library/, lib/services/science/library.service.ts, lib/integrations/clamav-scanner.ts	prisma/schema.prisma, lib/minio-client.ts (add library bucket)
P5	Models: ResearchBudget + BudgetLineItem + ScientificCouncil + ScientificCouncilMember + ScientificCouncilReview, app/api/science/budgets/, app/api/science/councils/	prisma/schema.prisma
P6	lib/services/science/kpi.service.ts, app/api/science/metrics/, app/api/science/reports/, BQP templates	—
P7	app/(dashboard)/dashboard/science/overview/page.tsx (4-layer), app/api/science/search/route.ts, hybrid search service	lib/services/science/scientist.service.ts (add embedding compute)
P8	lib/science/ai-redaction.ts, app/api/science/ai/chat/route.ts, app/api/science/ai/research-trends/route.ts, data quality service	—
6. Rủi ro và Biện pháp
Rủi ro	Mức độ	Biện pháp
Migration phá schema cũ	Cao	Luôn --create-only trước, review, chạy staging, pg_dump backup
/api/science/* conflict với /api/research/*	Thấp	Path prefix tách biệt hoàn toàn
NckhScientistProfile extend thêm vector field	Trung bình	pgvector extension đã có, thêm field nullable — safe
ScientificWork vs NckhPublication confused	Trung bình	Document rõ business boundary: Works = sách/GT; Publication = bài báo
Budget detail vs NckhProject.budgetApproved	Thấp	Giữ cả 2: NckhProject fields = summary; ResearchBudget = detail. Sync qua service
AI call lộ dữ liệu SECRET	Cao	Data redaction middleware bắt buộc ở Phase 8, test explicit
Council vote visibility (phản biện kín)	Cao	Vote field = null trong response khi role ≠ CHAIRMAN/ADMIN
7. Nguyên tắc backward compatibility xuyên suốt
Path cũ không đổi: /api/research/* tiếp tục hoạt động. Không touch.
Schema additive only: Không DROP column/table nào trong toàn bộ 8 phases.
Service isolation: lib/services/science/ hoàn toàn mới, không sửa service cũ trừ extend.
Feature flag: ENABLE_CSDL_KHQL=false trong .env — có thể tắt toàn bộ /api/science/* nếu cần rollback.
Budget dual-write: Phase 5 khi tạo ResearchBudget, service tự sync ngược về NckhProject.budgetApproved để UI cũ không bị break.