# 6) `docs/prompts/m11-prompts.md`

# M11 Prompt Pack

## Prompt 1 – Analyze module M11

Đọc:

* .claude/CLAUDE.md
* docs/design/system-overview.md
* docs/design/system-module-map.md
* docs/design/system-integration-map.md
* docs/design/module-m11-overview.md
* docs/design/module-m11-role-dashboards.md
* docs/design/module-m11-widget-system.md
* docs/design/module-m11-cache-realtime.md
* docs/design/module-m11-alerts-mobile-reporting.md

Chưa code.

Hãy:

1. tóm tắt vai trò M11 trong kiến trúc toàn hệ thống
2. xác định module nguồn nào cấp dữ liệu cho M11
3. tách rõ source of truth và read-model/cache model
4. đề xuất Phase 1 an toàn nhất cho dashboard
5. chỉ ra các rủi ro hiệu năng và rò rỉ scope

## Prompt 2 – Design schema/config for M11

Đọc toàn bộ design docs M11.

Chỉ làm schema/config design.

Yêu cầu:

1. đề xuất models cho dashboard definitions, role templates, user layouts, widget configs, alert rules, access logs
2. không biến M11 thành nơi lưu dữ liệu nghiệp vụ gốc
3. thiết kế widget registry/config theo hướng mở rộng được
4. thêm indexes cho layout lookup, widget data cache lookup, role-based retrieval
5. giải thích ngắn gọn vai trò từng model

## Prompt 3 – Build role dashboards backend

Đọc:

* module-m11-role-dashboards.md

Hãy:

1. xây service trả dashboard mặc định theo role
2. áp scope filter từ M01
3. build API summary dashboard cho executive/department/education trước
4. chỉ cho drill-down nếu user có quyền ở module nguồn
5. fail-closed nếu không xác định được scope

## Prompt 4 – Build widget system and customization

Đọc:

* module-m11-widget-system.md

Hãy:

1. xây widget registry typed
2. xây user layout save/reset logic
3. validate widget allowed by role before render/save
4. tách widget definition và widget data adapter
5. chưa cho tạo custom widget ngoài registry

## Prompt 5 – Build cache and real-time layer

Đọc:

* module-m11-cache-realtime.md

Hãy:

1. thiết kế cache key strategy chặt theo role/scope/unit/user
2. triển khai 3 tầng cache như design docs
3. dùng polling + cache refresh cho Phase 1
4. chỉ dùng SSE cho alert/tasks nhỏ nếu cần
5. tránh WebSocket diện rộng ở Phase 1

## Prompt 6 – Build alerts and reporting

Đọc:

* module-m11-alerts-mobile-reporting.md

Hãy:

1. xây alert aggregation service
2. phân biệt widget alerts và executive alerts
3. hỗ trợ acknowledge alert
4. chuẩn bị export hooks để nối M18
5. thêm logging cho dashboard view, export, manual refresh

## Prompt 7 – Review M11 architecture before implementation

Đọc toàn bộ M11 docs.

Chưa code.

Hãy review:

1. điểm nào của M11 dễ đè sang analytics module hoặc module nguồn
2. phần nào cần cache bắt buộc
3. phần nào nên real-time thật, phần nào không cần
4. nguy cơ rò rỉ dữ liệu theo role/scope
5. thứ tự implement an toàn và hiệu quả nhất
