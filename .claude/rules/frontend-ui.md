# Frontend UI Rules

## Mục tiêu
Xây UI rõ ràng, đúng use case, đúng luồng thao tác thực tế, không nhồi nghiệp vụ nặng vào frontend.

---

## Nguyên tắc
- UI phải bám actor và use case thật
- Một page phải có mục tiêu rõ ràng
- Component phải tách theo trách nhiệm hiển thị
- Không dùng component quá generic nếu làm UI khó hiểu hơn

---

## Structure
- Page:
  - layout
  - data loading chính
  - state điều hướng
- Component:
  - hiển thị
  - input nhỏ
  - section UI
- Modal/Drawer:
  - tác vụ nhanh
- Wizard:
  - quy trình nhiều bước
- Tabs:
  - hồ sơ hoặc detail nhiều nhóm thông tin

---

## State
- Phân biệt rõ:
  - server state
  - form state
  - UI state
- Không để state lộn xộn trong page quá lớn
- Với màn hình lớn, tách subcomponent + hook nếu cần

---

## Data loading
- Loading state rõ
- Empty state rõ
- Error state rõ
- Không để màn hình trắng nếu API lỗi

---

## Permission-aware UI
- Nút hành động phải theo quyền
- Trường nhạy cảm phải có guard
- Không chỉ ẩn nút ở UI mà quên backend check quyền

---

## Form
- Form lớn phải chia section
- Validation message rõ
- Với form dài nên có:
  - sticky action bar
  - autosave nếu phù hợp
  - draft/save later nếu nghiệp vụ cho phép

---

## Tables / grids
- Bảng lớn phải có:
  - filter
  - sort
  - pagination
  - empty state
- Nếu là dữ liệu vận hành, ưu tiên readability hơn “đẹp mắt”

---

## Charts / dashboards
- KPI card phải bám nghiệp vụ
- Chart phải trả lời được câu hỏi quản lý
- Không làm dashboard chỉ để “có biểu đồ”

---

## Không được làm
- Không nhét business rule phức tạp vào component
- Không tạo UI quá generic làm người dùng khó hiểu
- Không duplicate logic transform nếu backend nên làm