# M05 PROMPTS – BỘ PROMPT CHUẨN CHO MODULE CSDL CHÍNH SÁCH

---

# 1. PROMPT MỞ ĐẦU M05

## 1.1. Đọc overview
```text
Đọc:
- docs/design/system-overview.md
- docs/design/system-module-map.md
- docs/design/system-integration-map.md
- docs/design/module-m05-overview.md

Chưa code.

Hãy tóm tắt:
1. Vai trò của M05 trong toàn hệ thống
2. 12 use case của M05
3. 6 lĩnh vực nghiệp vụ mà M05 hợp nhất
4. Vì sao M05 là module pháp lý phức tạp
5. M05 phụ thuộc vào M01, M02, M13, M18, M19 như thế nào
6. Thứ tự phase triển khai hợp lý
1.2. Mapping codebase
Đọc:
- docs/design/module-m05-overview.md
- docs/design/module-m05-award-discipline.md
- docs/design/module-m05-insurance-allowance.md
- docs/design/module-m05-merit-retirement.md
- docs/design/module-m05-selfservice-dashboard.md

Chưa code.

Hãy:
1. Mapping M05 vào codebase hiện tại
2. Liệt kê file cần tạo/sửa
3. Chỉ ra integration points với M01/M02/M13/M18/M19
4. Nêu chỗ nào phải tái sử dụng Personnel/Unit hiện có
5. Chia phase triển khai
2. PROMPT CHO KHEN THƯỞNG / THI ĐUA / KỶ LUẬT
2.1. Prompt mở đầu
/implement-from-design

Đọc:
- docs/design/module-m05-overview.md
- docs/design/module-m05-award-discipline.md

Chưa code.

Hãy:
1. Tóm tắt UC-73, UC-74, UC-75, UC-76
2. Liệt kê models cần có
3. Liệt kê APIs chính
4. Chỉ ra integration points với M02, M13, M18, M19
5. Chia phase triển khai
2.2. Phase 1 schema
/m09-phase1-schema

Đọc docs/design/module-m05-award-discipline.md.

Chỉ triển khai Phase 1 schema.

Yêu cầu:
- cập nhật prisma/schema.prisma
- thêm:
  - RewardRecord
  - EmulationCampaign
  - DisciplineRecord
  - EmulationScoreLedger
- nếu Personnel đã có thì nối relation đúng
- enum/workflow status chỉ thêm khi thật cần; ưu tiên lookup M19 nếu phù hợp

Không làm API.
Không làm UI.

Sau khi xong:
1. liệt kê models đã thêm
2. nêu relation với Personnel
3. nêu unique/index quan trọng
4. nêu giả định kỹ thuật
5. đưa lệnh prisma tiếp theo
2.3. Phase 2 reward/discipline APIs
Đọc docs/design/module-m05-award-discipline.md.

Triển khai Phase 2.

Yêu cầu:
- tạo reward CRUD + approve API
- tạo discipline CRUD + clear API
- encode rules:
  - reward workflow status
  - discipline clearDate logic
  - block/cảnh báo khen thưởng nếu án còn hiệu lực
- chưa làm AI suggestion

Sau khi xong:
- liệt kê endpoint
- nêu flow approve reward
- nêu flow clear discipline
2.4. Phase 3 emulation + AI suggestion
Đọc docs/design/module-m05-award-discipline.md.

Triển khai Phase 3.

Yêu cầu:
- tạo campaign CRUD
- tạo emulation score APIs
- tạo AI suggestion endpoint scaffold
- AI chỉ hỗ trợ quyết định, không auto approve

Sau khi xong:
- nêu scoring flow
- nêu AI response shape
- nêu phần nào là rule-based, phần nào là AI-ready
2.5. Phase 4 UI
Đọc docs/design/module-m05-award-discipline.md.

Triển khai Phase 4.

Yêu cầu:
- tạo rewards page
- tạo emulation page
- tạo disciplines page
- tạo reward workflow board
- tạo discipline reminder card

Sau khi xong:
- liệt kê file UI
- nêu UX flow chính
3. PROMPT CHO BHXH / PHỤ CẤP / TRỢ CẤP
3.1. Prompt mở đầu
/implement-from-design

Đọc:
- docs/design/module-m05-overview.md
- docs/design/module-m05-insurance-allowance.md

Chưa code.

Hãy:
1. Tóm tắt UC-77, UC-78, UC-79, UC-80
2. Liệt kê models cần có
3. Liệt kê APIs cần có
4. Chia phase triển khai
5. Chỉ ra phép tính nào phải tách thành service riêng
3.2. Phase 1 schema
/m09-phase1-schema

Đọc docs/design/module-m05-insurance-allowance.md.

Chỉ triển khai Phase 1 schema.

Yêu cầu:
- thêm:
  - InsuranceProfile
  - InsuranceContributionHistory
  - InsuranceSettlement
  - AllowanceRecord
  - SubsidyCase
- nối relation với Personnel

Không làm API/UI.

Sau khi xong:
- liệt kê models
- nêu relation chính
- nêu index nên có
3.3. Phase 2 APIs + services
Đọc docs/design/module-m05-insurance-allowance.md.

Triển khai Phase 2.

Yêu cầu:
- tạo insurance APIs
- tạo settlement APIs
- tạo allowance APIs
- tạo subsidy APIs
- tách calculation services cho:
  - BHXH settlement
  - allowance recalculation
- chưa làm full UI

Sau khi xong:
- liệt kê endpoint
- nêu service nào xử lý tính toán
- nêu phần nào chờ export/report integration
3.4. Phase 3 warnings + recalculation + UI
Đọc docs/design/module-m05-insurance-allowance.md.

Triển khai Phase 3.

Yêu cầu:
- cảnh báo BHYT sắp hết hạn
- recalculation panel cho phụ cấp
- UI insurance/allowance/subsidy
- scaffold D02-TS export integration point

Sau khi xong:
- liệt kê file UI
- nêu logic warning
- nêu chỗ nối với M18
4. PROMPT CHO NGƯỜI CÓ CÔNG / HƯU TRÍ
4.1. Prompt mở đầu
/implement-from-design

Đọc:
- docs/design/module-m05-overview.md
- docs/design/module-m05-merit-retirement.md

Chưa code.

Hãy:
1. Tóm tắt UC-81, UC-82
2. Liệt kê models cần có
3. Liệt kê APIs/UI cần có
4. Chia phase triển khai
5. Chỉ ra phần nào là planner/calculation, phần nào là hồ sơ
4.2. Phase 1 schema
/m09-phase1-schema

Đọc docs/design/module-m05-merit-retirement.md.

Chỉ triển khai Phase 1 schema.

Yêu cầu:
- thêm:
  - MeritProfile
  - RetirementProfile
  - RetirementScenario
- enum MeritType, RetirementType dùng lại nếu đã có hoặc thêm theo thiết kế

Không làm API/UI.

Sau khi xong:
- liệt kê models/enums
- nêu relation với Personnel
- nêu fields cần index
4.3. Phase 2 APIs + planner service
Đọc docs/design/module-m05-merit-retirement.md.

Triển khai Phase 2.

Yêu cầu:
- tạo merit APIs
- tạo retirement calculate API
- tạo upcoming-24m API
- planner service phải:
  - tính đủ điều kiện nghỉ
  - mô phỏng 3 kịch bản
  - chuẩn bị checklist hồ sơ

Sau khi xong:
- nêu flow planner
- nêu response shape
- nêu phần nào configurable rule
4.4. Phase 3 UI
Đọc docs/design/module-m05-merit-retirement.md.

Triển khai Phase 3.

Yêu cầu:
- merit page
- retirement planner page
- scenario cards
- checklist UI

Sau khi xong:
- liệt kê file UI
- nêu UX flow chính
5. PROMPT CHO SELF-SERVICE & DASHBOARD
5.1. Prompt mở đầu
/implement-from-design

Đọc:
- docs/design/module-m05-overview.md
- docs/design/module-m05-selfservice-dashboard.md

Chưa code.

Hãy:
1. Tóm tắt UC-83, UC-84
2. Liệt kê self APIs và dashboard APIs
3. Liệt kê UI/pages cần có
4. Chia phase triển khai
5. Chỉ ra KPI bắt buộc ở phase đầu
5.2. Phase 1 self-service APIs
Đọc docs/design/module-m05-selfservice-dashboard.md.

Triển khai Phase 1.

Yêu cầu:
- tạo self profile APIs
- tạo self requests APIs
- tạo self insurance history / emulation score APIs
- scope SELF bắt buộc
- chưa làm dashboard UI

Sau khi xong:
- liệt kê endpoint
- nêu response shape
- nêu chỗ nào sẽ nối workflow M13
5.3. Phase 2 dashboard APIs
Đọc docs/design/module-m05-selfservice-dashboard.md.

Triển khai Phase 2.

Yêu cầu:
- tạo dashboard stats/trends APIs
- KPI tối thiểu:
  - tổng khen thưởng năm
  - hồ sơ chờ xử lý
  - BHYT sắp hết hạn
  - kỷ luật sắp xóa án
  - hưu trí 24 tháng tới
  - tổng chi phụ cấp/trợ cấp
- chừa report export integration point

Sau khi xong:
- nêu response shape
- nêu KPI từ bảng nào aggregate ra
5.4. Phase 3 UI
Đọc docs/design/module-m05-selfservice-dashboard.md.

Triển khai Phase 3.

Yêu cầu:
- tạo self-service page
- tạo dashboard page
- self-policy tabs
- self-request form
- KPI cards + trend chart + pending cases panel

Sau khi xong:
- liệt kê file UI
- nêu UX flow self-service
- nêu phần nào chờ notifications/report integration
6. PROMPT REVIEW TOÀN BỘ M05
/review-m09

Hãy review toàn bộ phần code M05 hiện có so với:
- docs/design/system-overview.md
- docs/design/system-module-map.md
- docs/design/system-integration-map.md
- docs/design/module-m05-overview.md
- docs/design/module-m05-award-discipline.md
- docs/design/module-m05-insurance-allowance.md
- docs/design/module-m05-merit-retirement.md
- docs/design/module-m05-selfservice-dashboard.md

Output:
1. phần đã đạt
2. phần còn thiếu
3. phần lệch kiến trúc
4. M05 đã phản ánh đủ 6 lĩnh vực nghiệp vụ chưa
5. integration với M01/M02/M13/M18/M19 đã đủ chưa
6. thứ tự sửa tối ưu

---

# Cách dùng ngay

Bắt đầu bằng prompt này:

```text
Đọc:
- docs/design/system-overview.md
- docs/design/system-module-map.md
- docs/design/system-integration-map.md
- docs/design/module-m05-overview.md

Chưa code.

Hãy tóm tắt:
1. Vai trò của M05 trong toàn hệ thống
2. 12 use case của M05
3. 6 lĩnh vực nghiệp vụ mà M05 hợp nhất
4. Vì sao M05 là module pháp lý phức tạp
5. M05 phụ thuộc vào M01, M02, M13, M18, M19 như thế nào
6. Thứ tự phase triển khai hợp lý