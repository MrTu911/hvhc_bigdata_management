# Code Style Rules

## Mục tiêu
Giữ code nhất quán, dễ đọc, dễ review, dễ mở rộng, giảm lỗi khi Claude sinh code.

---

## Nguyên tắc chung
- Ưu tiên code rõ ràng hơn code ngắn.
- Không viết code “thông minh quá mức”.
- Tên biến, hàm, type, interface phải thể hiện đúng ý nghĩa nghiệp vụ.
- Một hàm chỉ nên làm một việc chính.
- Một file không nên chứa quá nhiều trách nhiệm.
- Ưu tiên early return để giảm nesting sâu.
- Không dùng magic number hoặc magic string nếu giá trị đó có ý nghĩa nghiệp vụ.

---

## Quy tắc đặt tên
- Dùng tên tiếng Anh rõ nghĩa.
- `camelCase` cho biến và hàm.
- `PascalCase` cho component, type, interface, class, enum.
- `UPPER_SNAKE_CASE` cho constant toàn cục.
- Tên phải phản ánh miền nghiệp vụ, ví dụ:
  - `calculateRetirementEligibility`
  - `checkScopeAccess`
  - `programVersionId`
  - `disciplineClearDate`

### Không dùng tên mơ hồ
Tránh:
- `data`
- `temp`
- `info`
- `handleStuff`
- `list2`

---

## Hàm
- Hàm phải ngắn và có mục tiêu rõ.
- Nếu hàm vượt quá khoảng 40–60 dòng, xem xét tách nhỏ.
- Nếu một hàm vừa validate, vừa transform, vừa query DB, vừa ghi log thì phải tách.
- Tên hàm nên bắt đầu bằng động từ:
  - `get...`
  - `list...`
  - `create...`
  - `update...`
  - `delete...`
  - `calculate...`
  - `validate...`
  - `map...`
  - `build...`

---

## Comment
- Chỉ comment khi logic không hiển nhiên.
- Không comment kiểu lặp lại đúng điều code đang làm.
- Khi cần, comment:
  - lý do nghiệp vụ
  - ràng buộc kỹ thuật
  - workaround tạm thời
  - migration/deprecation notes

Ví dụ tốt:
- `// Keep legacy field for backward compatibility with old LAN import`

Ví dụ xấu:
- `// set value to true`

---

## TypeScript
- Ưu tiên type rõ ràng, không lạm dụng `any`.
- Nếu buộc phải dùng `any`, phải có lý do rõ và giới hạn phạm vi.
- Ưu tiên:
  - `type`
  - `interface`
  - `enum`
  - utility types
- Không trả object “mập mờ” từ service; nên define response type rõ ràng.

---

## Error handling
- Không nuốt lỗi silently.
- Error message phải đủ để debug nhưng không lộ thông tin nhạy cảm.
- Ở service: throw error có ý nghĩa.
- Ở route: convert error về response chuẩn.

---

## Formatting
- Giữ format đồng nhất toàn repo.
- Không tự sáng tạo style khác với project hiện có.
- Nếu project đã có lint/prettier config, phải tuân thủ tuyệt đối.

---

## Không được làm
- Không nhét nhiều business logic vào một route/component.
- Không duplicate code nếu có thể trích utility/service.
- Không tạo helper vô nghĩa chỉ để “cho đẹp”.