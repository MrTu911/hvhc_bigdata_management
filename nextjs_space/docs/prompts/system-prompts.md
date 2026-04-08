
---

# 3) `docs/prompts/system-prompts.md`

```md
# SYSTEM PROMPTS – BỘ PROMPT CHUẨN TOÀN HỆ THỐNG HVHC BIGDATA

Tài liệu này dùng để điều khiển Claude ở mức toàn hệ thống trước khi đi vào từng module.

---

# 1. PROMPT ĐỌC TOÀN CẢNH HỆ THỐNG

## 1.1. Prompt mở đầu
```text
Đọc các file:
- docs/design/system-overview.md
- docs/design/system-module-map.md
- docs/design/system-integration-map.md

Chưa code.

Hãy tóm tắt:
1. Kiến trúc tổng thể hệ thống
2. Các nhóm module theo tầng
3. Module nền tảng nào là bắt buộc
4. Module nào là master data nguồn
5. Module nào là workflow/export/master-data infrastructure
6. Thứ tự ưu tiên triển khai hợp lý

1.2. Prompt phân tích kiến trúc
Đọc các file:
- docs/design/system-overview.md
- docs/design/system-module-map.md
- docs/design/system-integration-map.md

Chưa code.

Hãy phân tích theo góc nhìn system architect:
1. Kiến trúc hiện tại đã chia tầng hợp lý chưa
2. Module nào có độ rủi ro kiến trúc cao nhất
3. Module nào phải hoàn thiện trước để tránh technical debt lan rộng
4. Những phụ thuộc nào là cứng, những phụ thuộc nào có thể abstract
5. Những điểm nào cần lưu ý khi để Claude code theo từng module
1.3. Prompt tạo roadmap triển khai
Đọc các file:
- docs/design/system-overview.md
- docs/design/system-module-map.md
- docs/design/system-integration-map.md

Chưa code.

Hãy chuyển thành roadmap kỹ thuật cho toàn dự án:
- chia giai đoạn
- chia module theo mức ưu tiên
- nêu deliverable chính của từng giai đoạn
- nêu phụ thuộc giữa các module
- nêu risk nếu làm sai thứ tự
2. PROMPT XÁC ĐỊNH VAI TRÒ MỘT MODULE TRONG TOÀN HỆ THỐNG
Đọc:
- docs/design/system-module-map.md
- docs/design/system-integration-map.md
- docs/design/module-mxx-overview.md

Chưa code.

Hãy trả lời:
1. Module này thuộc tầng nào
2. Nó phụ thuộc vào module nào
3. Module nào phụ thuộc vào nó
4. Dữ liệu nguồn gốc của nó đến từ đâu
5. Nó có cần dùng M01 / M02 / M13 / M18 / M19 hay không
6. Những điểm phải giữ khi thiết kế module này để không phá kiến trúc tổng thể
3. PROMPT MAPPING MODULE VÀO CODEBASE
Đọc:
- docs/design/system-overview.md
- docs/design/system-module-map.md
- docs/design/system-integration-map.md
- docs/design/module-mxx-overview.md

Chưa code.

Hãy:
1. Mapping module mxx vào codebase hiện tại
2. Liệt kê file cần tạo và file nên tái sử dụng
3. Chỉ ra integration points với các module khác
4. Chỉ ra phần nào nên để adapter/service boundary
5. Chia phase triển khai
4. PROMPT KIỂM TRA TÍNH ĐÚNG KIẾN TRÚC TRƯỚC KHI CODE
Đọc:
- docs/design/system-module-map.md
- docs/design/system-integration-map.md
- docs/design/module-mxx-overview.md
- docs/design/module-mxx-core.md

Chưa code.

Hãy kiểm tra trước:
1. Module này có đang bị thiết kế quá cô lập không
2. Có phụ thuộc nào vào M01/M02/M13/M18/M19 bị bỏ sót không
3. Có dữ liệu nào đang đặt sai nguồn gốc không
4. Có phần nào nên đi qua internal API hoặc shared hook/component thay vì làm riêng không
5. Những rủi ro kiến trúc nếu code theo hướng hiện tại
5. PROMPT REVIEW KIẾN TRÚC TOÀN HỆ THỐNG
/review-m09

Hãy review phần code/module hiện có theo:
- docs/design/system-overview.md
- docs/design/system-module-map.md
- docs/design/system-integration-map.md
- các file design module liên quan

Output:
1. phần đã đúng kiến trúc tổng thể
2. phần còn thiếu integration
3. phần đang duplicate chức năng lẽ ra phải dùng module nền
4. phần đang vi phạm ranh giới module
5. rủi ro production nếu giữ nguyên
6. thứ tự sửa ưu tiên
6. PROMPT CHO MODULE NỀN TẢNG
6.1. Khi làm M01
Đọc:
- docs/design/system-module-map.md
- docs/design/system-integration-map.md
- docs/design/module-m01-overview.md

Chưa code.

Hãy tập trung phân tích:
1. M01 đang cấp gì cho toàn hệ thống
2. Function code / scope / audit / MFA / SSO tác động thế nào đến các module khác
3. Những API/hook nào của M01 cần hoàn thiện trước để các module khác dùng được
6.2. Khi làm M02
Đọc:
- docs/design/system-module-map.md
- docs/design/system-integration-map.md
- docs/design/module-m02-overview.md

Chưa code.

Hãy tập trung phân tích:
1. M02 là nguồn dữ liệu gốc cho những module nào
2. Bảng Personnel / User / Unit cần giữ ổn định thế nào
3. Những module nào aggregate dữ liệu ngược vào profile360
4. Những relation nào không được làm sai
6.3. Khi làm M13
Đọc:
- docs/design/system-module-map.md
- docs/design/system-integration-map.md
- docs/design/module-m13-overview.md

Chưa code.

Hãy tập trung phân tích:
1. M13 được dùng bởi những module nào
2. Workflow engine nào cần generic hóa
3. Những điểm nào phải dùng M01 và M02
4. Những entity nào nên được workflow hóa trước
6.4. Khi làm M18
Đọc:
- docs/design/system-module-map.md
- docs/design/system-integration-map.md
- docs/design/module-m18-overview.md

Chưa code.

Hãy tập trung phân tích:
1. M18 đang thay thế những logic export rải rác nào
2. Những module nào sẽ gọi M18
3. Data resolver phải nối với những module nào
4. Internal APIs nào cần có để AI/chatbot/workflow dùng lại
6.5. Khi làm M19
Đọc:
- docs/design/system-module-map.md
- docs/design/system-integration-map.md
- docs/design/module-m19-overview.md

Chưa code.

Hãy tập trung phân tích:
1. M19 đang chuẩn hóa những category/enum nào
2. Những module nào dùng lookup của M19 nhiều nhất
3. Hook/component dùng chung nào cần làm sớm
4. Những enum hard-code nào nên ưu tiên chuyển sang M19 trước
7. PROMPT TẠO BACKLOG TOÀN HỆ THỐNG
Đọc:
- docs/design/system-overview.md
- docs/design/system-module-map.md
- docs/design/system-integration-map.md

Chưa code.

Hãy tạo backlog kỹ thuật toàn hệ thống:
- chia theo giai đoạn
- chia theo module
- mỗi module nêu:
  - objective
  - dependency
  - deliverables
  - risk
  - priority
- kết quả ở dạng có thể dùng để lập kế hoạch sprint
8. PROMPT KIỂM TRA TRƯỚC KHI MERGE MỘT MODULE
Đọc:
- docs/design/system-module-map.md
- docs/design/system-integration-map.md
- docs/design/module-mxx-overview.md
- các file chi tiết của module đó

Hãy đánh giá module mxx trước khi merge:
1. Đã bám đúng kiến trúc tổng hệ thống chưa
2. Đã dùng đúng module nền chưa
3. Có vi phạm ranh giới module không
4. Có còn hard-code lookup / export / workflow sai chỗ không
5. Có thiếu integration points không
6. Kết luận mức độ sẵn sàng merge