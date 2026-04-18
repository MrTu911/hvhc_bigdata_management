Phân tích tổng quan 2 hệ thống
hvhc_bigdata_management	Quanlykhoahoc_HVHC
Prisma models	233 models	97 models
UI modules	52 modules	28 modules
API routes	63+	50
Phạm vi	Toàn trường (nhân sự, đào tạo, đảng, khoa học, quản trị)	Chuyên sâu quản lý NCKH
Auth	NextAuth + SSO + MFA	NextAuth (cơ bản)
Workflow Engine	✅ Đầy đủ (template-based)	✅ Đơn giản hơn
Science modules	✅ M20-M26 (NckhProject...) nhưng sơ khai	✅ Chín muồi, chuyên sâu
Real-time chat	❌	✅ Socket.io
AI recommendations	✅ ML infrastructure	✅ TF-IDF + cosine similarity
Lab/Equipment booking	❌ (chỉ có Lab, LabEquipment)	✅ Đầy đủ
Tài chính granular	❌ chỉ ResearchBudget	✅ PO, Invoice, Expense, Grant
Council + voting	❌	✅ MeetingVote
Vùng chồng lấn cần giải quyết

hvhc_bigdata (M20-M26)          qlkh_hc_system
─────────────────────          ────────────────────
NckhProject                ↔   ResearchProject
NckhPublication            ↔   Publication
NckhScientistProfile       ↔   ScientistProfile
ScientificCouncil          ↔   Council + CouncilMember
ResearchBudget             ↔   ResearchBudget + PurchaseOrder + Invoice
ScientificWork             ↔   Content + ResearchDocument
LibraryItem                ↔   ResearchDocument
NckhMilestone              ↔   ProjectMilestone
Nhận định: M20-M26 của hvhc_bigdata là bản sơ khai — được xây dựng gần đây nhưng chưa có lifecycle đầy đủ, council voting, lab booking, hay chat. Còn qlkh thì sâu hơn nhiều ở đúng domain này.

Chiến lược khuyến nghị: "Science Module Consolidation"
Không nên duy trì 2 hệ thống riêng biệt (microservice) vì cùng DB PostgreSQL, cùng tech stack, cùng tổ chức — overhead sẽ rất lớn.
Nên tích hợp qlkh vào hvhc_bigdata theo hướng thay thế M20-M26 bằng phiên bản hoàn chỉnh hơn, đồng thời tận dụng hạ tầng có sẵn của hvhc_bigdata.

3 Phase triển khai
Phase 1 — Schema Consolidation (Không phá dữ liệu cũ)
Nguyên tắc: Giữ M20-M26 hiện tại của hvhc_bigdata, mở rộng schema từ qlkh vào, không xóa gì cả.


Từ qlkh → Thêm vào hvhc_bigdata schema:

ResearchProposal            →  Thêm mới (M20 chưa có proposal workflow)
ProjectMember               →  Merge vào NckhMember
ProjectMilestone            →  Merge vào NckhMilestone (extend fields)
CouncilMeeting + MeetingVote →  Thêm vào ScientificCouncil
ProjectReport               →  Thêm mới (báo cáo tiến độ)
ProjectAcceptance           →  Thêm mới (nghiệm thu)
ProjectExtension            →  Thêm mới (gia hạn)
LessonLearned               →  Thêm mới
PurchaseOrder + Invoice     →  Mở rộng ResearchBudget
Expense + Grant             →  Thêm mới
Laboratory + LabAssignment  →  Merge vào hvhc_bigdata Lab (đã có)
EquipmentAssignment         →  Merge vào hvhc_bigdata Equipment
ChatRoom + ChatMessage      →  Thêm mới (project chat)
Loại bỏ khỏi qlkh (dùng của hvhc_bigdata thay thế):

Personnel → dùng Personnel của hvhc_bigdata (sâu hơn nhiều)
Organization/OrgUnit → dùng Unit/Department của hvhc_bigdata
Role/User/Session → dùng Auth của hvhc_bigdata (có SSO + MFA)
Workflow → dùng WorkflowTemplate/WorkflowInstance của hvhc_bigdata
ResearchField → dùng ScienceCatalog/ResearchField của hvhc_bigdata (M19)
Phase 2 — Port các tính năng độc đáo của qlkh
Những gì qlkh có mà hvhc_bigdata chưa có, cần port sang:

Tính năng	Ưu tiên	Mức độ phức tạp
Full lifecycle (đề xuất → nghiệm thu → lưu trữ)	🔴 Cao	Trung bình
Council voting system	🔴 Cao	Thấp
Lab/Equipment booking	🟡 Trung	Trung bình
Real-time project chat (Socket.io)	🟡 Trung	Cao
AI proposal matching (TF-IDF)	🟢 Thấp	Trung bình
External collaboration	🟢 Thấp	Thấp
Tài chính granular (PO, Invoice, Expense, Grant)	🔴 Cao	Cao
Phase 3 — Loại bỏ qlkh, tích hợp hoàn toàn
Redirect URLs cũ của qlkh sang hvhc_bigdata
Migrate dữ liệu từ qlkh DB sang hvhc_bigdata DB
Tắt qlkh server
Tận dụng hạ tầng hvhc_bigdata (qlkh không cần rebuild)
hvhc_bigdata có sẵn	qlkh cần thay thế bằng
WorkflowTemplate + WorkflowInstance	Bỏ workflow.ts của qlkh
MasterDataItem + MasterCategory	Bỏ hardcode lookup trong qlkh
PersonnelAIAnalysis + ML infrastructure	Tích hợp AI recommendations vào
Notification system	Bỏ notification riêng của qlkh
AuditLog + UserActivity	Bỏ AuditTrail của qlkh
Analytics + Dashboard widgets	Bỏ analytics riêng
Auth + SSO + MFA (đang plan)	Bỏ auth-config của qlkh
Các Use Case mới sau tích hợp
Khi 2 hệ thống hợp nhất sẽ có những use case chỉ có thể làm được khi tích hợp:

Liên kết đề tài → Nhân sự: Từ 1 đề tài NCKH → xem hồ sơ nhân sự đầy đủ (bằng cấp, khen thưởng, kỷ luật, bảo hiểm) của chủ nhiệm — hiện qlkh chỉ có Personnel cơ bản
Liên kết đề tài → Đào tạo: Sinh viên tham gia đề tài → tự động ghi vào kết quả học tập, luận văn
Liên kết nhà khoa học → Giảng dạy: H-index, số công bố → tự động cập nhật FacultyEISScore
Workflow NCKH dùng Workflow Engine: Approval chain từng bước (khoa → học viện) được thiết kế qua workflow designer có sẵn
AI cross-domain: Gợi ý cộng tác dựa trên cả lịch sử đề tài + chuyên ngành giảng dạy + hồ sơ nhân sự
Dashboard tổng hợp: KPI khoa học của toàn trường cùng 1 dashboard với KPI đào tạo, nhân sự
Rủi ro và điểm cần lưu ý
Rủi ro	Mức độ	Giải pháp
Conflict model names (NckhProject vs ResearchProject)	🔴 Cao	Đặt prefix rõ ràng, migration có dual-read
Socket.io không tương thích Next.js App Router	🟡 Trung	Custom server hoặc Socket.io server riêng
qlkh dùng PrismaClient trực tiếp (không dùng singleton)	🟡 Trung	Port sang prisma singleton của hvhc_bigdata
2 Auth system khác nhau trong giai đoạn chuyển tiếp	🔴 Cao	SSO bridge hoặc shared JWT secret trước
Data migration nếu qlkh đang có dữ liệu production	🔴 Cao	Script backfill, dual-write giai đoạn đầu
Khuyến nghị thực tế
Nếu qlkh chưa có dữ liệu production thật → Tích hợp trực tiếp, bắt đầu từ Phase 1 schema ngay.

Nếu qlkh đang chạy production → Cần 3-4 tháng migration cẩn thận với dual-read strategy.

Ưu tiên port trước: Lifecycle đề tài (proposals → acceptance) và tài chính granular (PO, Invoice, Grant) vì đây là 2 điểm yếu nhất của M20-M26 hiện tại trong hvhc_bigdata.

qlkh hiện nay chưa có dữ liệu gì
Với qlkh chưa có dữ liệu production — đây là tình huống lý tưởng nhất để tích hợp. Không cần migration, không rủi ro mất dữ liệu. Hành động ngay được luôn.

Quyết định chiến lược: Dừng phát triển qlkh
qlkh_hc_system trở thành "bản thiết kế tham chiếu" — không chạy nữa, nhưng dùng code của nó làm template để port vào hvhc_bigdata.

Từ giờ toàn bộ tính năng NCKH phát triển trực tiếp trong hvhc_bigdata, trong namespace M20-M26 đã có sẵn.

Bản đồ port cụ thể
Cái gì GIỮ nguyên từ hvhc_bigdata (không rebuild)
hvhc_bigdata	Thay thế cái gì của qlkh
WorkflowTemplate + WorkflowInstance	lib/workflow.ts của qlkh
MasterCategory + MasterDataItem	Hardcode lookup trong qlkh
Unit / Department / Personnel	Organization / OrgUnit / Personnel của qlkh
AuditLog + UserActivity	AuditTrail của qlkh
Notification + email service	notification.service.ts của qlkh
Auth + SSO + MFA	lib/auth-config.ts của qlkh
Lab + Equipment	Bộ Lab/Equipment của qlkh (port thêm booking)
AI/ML infrastructure	ai-recommendation-enhanced.service.ts của qlkh
Cái gì PORT từ qlkh → hvhc_bigdata
Nhóm 1: Schema (thêm vào prisma/schema.prisma)
Các model qlkh có nhưng hvhc_bigdata chưa có hoặc còn sơ khai:


Lifecycle đề tài:
  ResearchProposal        → thêm vào bên cạnh NckhProject
  ProjectReport           → báo cáo tiến độ định kỳ
  ProjectMidtermReview    → đánh giá giữa kỳ
  ProjectExtension        → gia hạn đề tài
  ProjectAcceptance       → nghiệm thu
  AcceptanceReview        → điểm số nghiệm thu
  ProjectClosure          → đóng đề tài
  LessonLearned           → bài học kinh nghiệm

Council & voting:
  CouncilMeeting          → thêm vào ScientificCouncil
  MeetingVote             → bỏ phiếu từng thành viên

Tài chính granular:
  PurchaseOrder + Items   → mua sắm theo đề tài
  Invoice + Items         → hoá đơn
  Expense                 → chi tiêu thực
  Grant + Disbursement    → tài trợ

Chat dự án:
  ChatRoom + ChatMessage  → giao tiếp nhóm nghiên cứu
  ChatReaction            
  ChatReadReceipt

Hợp tác ngoài:
  ResearchCollaboration   → hợp tác liên đơn vị/liên quốc gia
  CollaborationDocument

Nội dung tri thức:
  Content + ContentMember → qlkh gọi là knowledge base
  ContentReview
Nhóm 2: API routes (copy & adapt)
Port các route này từ qlkh/app/api/ → hvhc_bigdata/app/api/science/:


qlkh source                         hvhc_bigdata target
─────────────────────────────────   ──────────────────────────────────
api/research-proposals/             api/science/proposals/
api/lifecycle/acceptance/           api/science/lifecycle/acceptance/
api/lifecycle/acceptance-councils/  api/science/lifecycle/councils/
api/lifecycle/midterm-reviews/      api/science/lifecycle/midterm/
api/lifecycle/extensions/           api/science/lifecycle/extensions/
api/lifecycle/progress-reports/     api/science/lifecycle/reports/
api/lifecycle/lessons-learned/      api/science/lifecycle/lessons/
api/councils/                       → merge vào api/science/councils/
api/chat/                           api/science/chat/
api/research-collaborations/        api/science/collaborations/
api/purchase-orders/                api/science/finance/purchase-orders/
api/invoices/                       api/science/finance/invoices/
api/expenses/                       api/science/finance/expenses/
api/grants/                         api/science/finance/grants/
Lưu ý khi port API: Thay toàn bộ:

import { prisma } from '@/lib/db' → đúng path của hvhc_bigdata
getServerSession(authOptions) → dùng auth của hvhc_bigdata
Check role: bỏ DEPARTMENT_HEAD, dùng role system của hvhc_bigdata
Nhóm 3: UI pages (copy & adapt)

qlkh/dashboard/                     hvhc_bigdata/dashboard/science/
──────────────────────────────────  ──────────────────────────────
research-proposals/                 → science/proposals/
lifecycle/                          → science/lifecycle/
lifecycle/acceptance/               → science/lifecycle/acceptance/
lifecycle/progress-reports/         → science/lifecycle/reports/
finance/                            → science/finance/
finance/purchase-orders/            → science/finance/purchase-orders/
scientists/                         → science/resources/scientists/  ✅ đã có
publications/                       → science/publications/           ✅ đã có
account-management/                 → admin/ (đã có trong hvhc)
Thứ tự làm việc thực tế

Tuần 1-2: Schema
  □ Thêm các model lifecycle vào prisma/schema.prisma
  □ Thêm models tài chính (PO, Invoice, Expense, Grant)
  □ Thêm CouncilMeeting + MeetingVote
  □ Thêm ChatRoom + ChatMessage
  □ prisma migrate dev

Tuần 3-4: API lifecycle
  □ Port proposals API
  □ Port midterm-review, extension, acceptance API
  □ Port progress-reports API
  □ Port lessons-learned API

Tuần 5-6: API tài chính
  □ Port purchase-orders, invoices, expenses, grants

Tuần 7-8: UI lifecycle
  □ Port các trang lifecycle vào hvhc_bigdata/science/

Tuần 9-10: Chat + Collaboration
  □ Socket.io chat cho project (phức tạp nhất)
  □ Research collaboration

Tuần 11-12: AI recommendations
  □ Tích hợp TF-IDF matching của qlkh vào ML infrastructure của hvhc_bigdata
Use case mới CHỈ có khi tích hợp
Đây là lý do chính để tích hợp thay vì chạy 2 hệ thống:

Đề tài → Nhân sự đầy đủ: Click vào chủ nhiệm đề tài → xem toàn bộ hồ sơ: bằng cấp, khen thưởng, kỷ luật, bảo hiểm, lịch sử công tác (hvhc_bigdata có đầy đủ, qlkh chỉ có tên)

Đề tài → Kết quả đào tạo: Học viên tham gia đề tài → tự động tạo ThesisProject, ảnh hưởng GradeRecord

Nhà khoa học → Workload giảng dạy: Số giờ nghiên cứu + số giờ giảng dạy → FacultyEISScore, FacultyWorkloadSnapshot

Workflow engine cho NCKH: Dùng WorkflowTemplate của hvhc_bigdata để thiết kế quy trình phê duyệt đề tài qua giao diện drag-drop — không cần code hardcode như qlkh

Dashboard tổng hợp: 1 màn hình hiển thị KPI khoa học + KPI đào tạo + KPI nhân sự cùng lúc

Party member + Science: Thành viên Đảng tham gia đề tài → liên kết PartyMember với NckhProject

Hành động ngay hôm nay
Bước đơn giản nhất để bắt đầu:


# 1. Mở schema của hvhc_bigdata
# prisma/schema.prisma

# 2. Thêm các model lifecycle đơn giản nhất trước:
#    - CouncilMeeting, MeetingVote (chỉ ~10 fields mỗi model)
#    - LessonLearned, ProjectExtension (nhỏ, độc lập)

# 3. Migrate
npx prisma migrate dev --name extend_science_lifecycle

# 4. Port 1 API route đầu tiên:
#    qlkh/api/lifecycle/lessons-learned/route.ts
#    → hvhc_bigdata/api/science/lifecycle/lessons-learned/route.ts
#    (nhỏ, ít dependency, dễ test nhất)
qlkh lúc này đóng vai trò "thư viện tham khảo code" — mỗi khi cần feature gì, mở qlkh ra xem logic đã có, port sang hvhc_bigdata với convention mới. Không cần viết lại từ đầu.