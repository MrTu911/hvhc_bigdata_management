# M10 PROMPTS – BỘ PROMPT CHUẨN CHO MODULE CSDL GIÁO DỤC ĐÀO TẠO

---

# 1. PROMPT MỞ ĐẦU M10

## 1.1. Đọc overview
```text
Đọc:
- docs/design/system-overview.md
- docs/design/system-module-map.md
- docs/design/system-integration-map.md
- docs/design/module-m10-overview.md
- docs/design/module-m10-overview.md
- docs/design/module-m10-student-lifecycle.md
- docs/design/module-m10-program-curriculum-planning.md
- docs/design/module-m10-course-grading-warning.md
- docs/design/module-m10-thesis-graduation-dashboard.md
Chưa code.

Hãy tóm tắt:
1. Vai trò của M10 trong toàn hệ thống
2. 12 use case của M10
3. Hai vòng đời song song mà M10 quản lý
4. 7 rủi ro bắt buộc phải kiểm soát
5. M10 phụ thuộc vào M01, M02, M18, M19 và các module khác như thế nào
6. Thứ tự phase triển khai hợp lý

1.2. Mapping codebase
Đọc:
- docs/design/module-m10-overview.md
- docs/design/module-m10-student-lifecycle.md
- docs/design/module-m10-program-curriculum-planning.md
- docs/design/module-m10-course-grading-warning.md
- docs/design/module-m10-thesis-graduation-dashboard.md

Chưa code.

Hãy:
1. Mapping M10 vào codebase hiện tại
2. Liệt kê file cần tạo/sửa
3. Chỉ ra integration points với M01/M02/M18/M19
4. Nêu chỗ nào phải tái sử dụng User/Personnel/Unit/academicYear hiện có
5. Chia phase triển khai
2. PROMPT CHO STUDENT LIFECYCLE
2.1. Prompt mở đầu
/implement-from-design

Đọc:
- docs/design/module-m10-overview.md
- docs/design/module-m10-student-lifecycle.md

Chưa code.

Hãy:
1. Tóm tắt UC-51, UC-58
2. Liệt kê models cần có
3. Liệt kê APIs chính
4. Chia phase triển khai
5. Chỉ ra lookup nào nên dùng từ M19
2.2. Phase 1 schema
/m10-phase1-schema

Đọc docs/design/module-m10-student-lifecycle.md.

Chỉ triển khai Phase 1 schema.

Yêu cầu:
- cập nhật prisma/schema.prisma
- thêm:
  - StudentProfile
  - StudentConductRecord
- nếu có thể map với User/Personnel hiện có thì chỉ ra rõ
- enum StudentStatus thêm nếu chưa có

Không làm API/UI.

Sau khi xong:
1. liệt kê models đã thêm
2. nêu relation chính
3. nêu unique/index quan trọng
4. đưa lệnh prisma tiếp theo


2.3. Phase 2 APIs + profile UI
Đọc docs/design/module-m10-student-lifecycle.md.

Triển khai Phase 2.

Yêu cầu:
- student CRUD cơ bản
- conduct APIs
- profile360/student detail shell
- chưa làm graduation/thesis

Sau khi xong:
- liệt kê endpoint
- nêu response shape
- nêu phần nào chờ integration phase sau


3. PROMPT CHO PROGRAM / CURRICULUM / PLANNING
3.1. Prompt mở đầu
/implement-from-design

Đọc:
- docs/design/module-m10-overview.md
- docs/design/module-m10-program-curriculum-planning.md

Chưa code.

Hãy:
1. Tóm tắt UC-52, UC-53, UC-54
2. Liệt kê models cần có
3. Liệt kê APIs cần có
4. Chỉ ra vì sao ProgramVersion là bắt buộc
5. Chia phase triển khai



## 3.2. Phase 1 schema
/m10-phase1-schema

Đọc docs/design/module-m10-program-curriculum-planning.md.

Chỉ triển khai Phase 1 schema.

Yêu cầu:
- thêm:
  - Program
  - ProgramVersion
  - Course
  - SemesterPlan
  - CourseSection
- relation và index phù hợp
- tuyệt đối không bỏ ProgramVersion

Không làm API/UI.

Sau khi xong:
- liệt kê models
- nêu relation chính
- nêu index cho conflict-check


3.3. Phase 2 APIs + scheduling scaffold
Đọc docs/design/module-m10-program-curriculum-planning.md.

Triển khai Phase 2.

Yêu cầu:
- program/version APIs
- semester plan APIs
- course section APIs
- scaffold conflict-check service

Sau khi xong:
- liệt kê endpoint
- nêu conflict-check inputs
- nêu phần nào cần Redis/cache sau

3.4. Phase 3 UI
Đọc docs/design/module-m10-program-curriculum-planning.md.

Triển khai Phase 3.

Yêu cầu:
- program page
- planning page
- course section scheduler UI
- conflict panel

Sau khi xong:
- liệt kê file UI
- nêu UX flow chính


4. PROMPT CHO ATTENDANCE / GRADE / WARNING
4.1. Prompt mở đầu
/implement-from-design

Đọc:
- docs/design/module-m10-overview.md
- docs/design/module-m10-course-grading-warning.md

Chưa code.

Hãy:
1. Tóm tắt UC-55, UC-56, UC-57
2. Liệt kê models cần có
3. Liệt kê APIs chính
4. Chỉ ra vì sao ScoreHistory là mandatory
5. Chia phase triển khai


4.2. Phase 1 schema
/m09-phase1-schema

Đọc docs/design/module-m10-course-grading-warning.md.

Chỉ triển khai Phase 1 schema.

Yêu cầu:
- thêm:
  - AttendanceRecord
  - GradeRecord
  - ScoreHistory
  - AcademicWarning
- không bỏ qua ScoreHistory

Không làm API/UI.

Sau khi xong:
- liệt kê models
- nêu relation với CourseSection/StudentProfile
- nêu index cần có

4.3. Phase 2 grade APIs + history
Đọc docs/design/module-m10-course-grading-warning.md.

Triển khai Phase 2.

Yêu cầu:
- attendance APIs
- grade APIs
- score history APIs
- mọi PATCH điểm phải tạo ScoreHistory
- chưa làm warning UI

Sau khi xong:
- liệt kê endpoint
- nêu flow update grade + write history


4.4. Phase 3 warning engine + UI
Đọc docs/design/module-m10-course-grading-warning.md.

Triển khai Phase 3.

Yêu cầu:
- warning engine service
- warning recalculate API
- warnings page
- warning summary cards

Sau khi xong:
- nêu inputs của warning engine
- nêu response shape
- nêu phần nào configurable

***************************************************************************************************************


5. PROMPT CHO THESIS / GRADUATION / REPOSITORY / DASHBOARD
5.1. Prompt mở đầu
/implement-from-design

Đọc:
- docs/design/module-m10-overview.md
- docs/design/module-m10-thesis-graduation-dashboard.md

Chưa code.

Hãy:
1. Tóm tắt UC-59, UC-60, UC-61, UC-62
2. Liệt kê models cần có
3. Liệt kê APIs/UI cần có
4. Chỉ ra vì sao graduation engine là phần rủi ro cao nhất
5. Chia phase triển khai
5.2. Phase 1 schema
/m10-phase1-schema

Đọc docs/design/module-m10-thesis-graduation-dashboard.md.

Chỉ triển khai Phase 1 schema.

Yêu cầu:
- thêm:
  - ThesisProject
  - GraduationAudit
  - DiplomaRecord
  - AcademicRepositoryItem
- relation phù hợp với StudentProfile

Không làm API/UI.

Sau khi xong:
- liệt kê models
- nêu index cần có
- nêu trường nào cần unique



5.3. Phase 2 APIs + engine
Đọc docs/design/module-m10-thesis-graduation-dashboard.md.

Triển khai Phase 2.

Yêu cầu:
- thesis APIs
- graduation audit APIs
- graduation-engine service
- repository search APIs
- dashboard stats/trends APIs
- chưa làm full UI

Sau khi xong:
- liệt kê endpoint
- nêu flow graduation audit
- nêu phần nào cần UAT kỹ trước go-live
5.4. Phase 3 UI
Đọc docs/design/module-m10-thesis-graduation-dashboard.md.

Triển khai Phase 3.

Yêu cầu:
- thesis page
- graduation page
- repository page
- dashboard page
- graduation result table
- education KPI cards + trend chart

Sau khi xong:
- liệt kê file UI
- nêu UX flow chính

6. PROMPT REVIEW TOÀN BỘ M10
/review-m09

Hãy review toàn bộ phần code M10 hiện có so với:
- docs/design/system-overview.md
- docs/design/system-module-map.md
- docs/design/system-integration-map.md
- docs/design/module-m10-overview.md
- docs/design/module-m10-student-lifecycle.md
- docs/design/module-m10-program-curriculum-planning.md
- docs/design/module-m10-course-grading-warning.md
- docs/design/module-m10-thesis-graduation-dashboard.md

Output:
1. phần đã đạt
2. phần còn thiếu
3. phần lệch kiến trúc
4. 7 rủi ro bắt buộc đã được xử lý đến đâu
5. integration với M01/M02/M18/M19 đã đủ chưa
6. thứ tự sửa tối ưu

---

# Cách dùng ngay

Bắt đầu bằng prompt này:

```text
Đọc:
- docs/design/system-overview.md
- docs/design/system-module-map.md
- docs/design/system-integration-map.md
- docs/design/module-m10-overview.md

Chưa code.

Hãy tóm tắt:
1. Vai trò của M10 trong toàn hệ thống
2. 12 use case của M10
3. Hai vòng đời song song mà M10 quản lý
4. 7 rủi ro bắt buộc phải kiểm soát
5. M10 phụ thuộc vào M01, M02, M18, M19 như thế nào
6. Thứ tự phase triển khai hợp lý

