# Logging & Observability Rules

## Mục tiêu
Giúp debug, audit, vận hành production dễ hơn.

---

## Phải log gì
- action nghiệp vụ quan trọng
- workflow transitions
- export jobs
- sync jobs
- warning engine runs
- graduation audit runs
- failed validations nghiêm trọng
- integration failures

---

## Phải phân biệt
- audit log
- application log
- debug log
- error log

Không trộn lẫn tất cả vào một chỗ.

---

## Log format
- phải có context:
  - module
  - action
  - entity id
  - user/session nếu phù hợp
  - timestamp
- log message phải giúp truy vết, không mơ hồ

---

## Metrics / dashboards
Nếu có thể, nên nghĩ tới:
- error rate
- render time
- job success/fail
- warning count
- graduation pass/fail count
- API latency cho route nặng

---

## Không được làm
- Không log tràn lan vô nghĩa
- Không log dữ liệu nhạy cảm không cần thiết
- Không để production lỗi mà không có dấu vết