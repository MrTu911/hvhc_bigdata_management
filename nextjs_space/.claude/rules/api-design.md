# API Design Rules

## Mục tiêu
Thiết kế API ổn định, dễ mở rộng, dễ test, dễ bảo vệ bằng RBAC/scope.

---

## Chuẩn response
Mọi API nên theo chuẩn:

```ts
{
  success: boolean;
  data: unknown;
  error: string | object | null;
}

Chuẩn route
  Danh từ số nhiều cho resource list:
  /api/personnel
  /api/education/students
  /api/policy/rewards
  Route hành động rõ ràng khi cần:
  /approve
  /recalculate
  /export
  /retry
  /confirm


Chuẩn method
  GET: đọc dữ liệu
  POST: tạo mới hoặc action có side-effect lớn
  PATCH: cập nhật một phần
  PUT: cập nhật thay thế gần đầy đủ
  DELETE: xóa mềm hoặc xóa logic theo thiết kế


Validation
  Tất cả input phải validate.
  Validation phải nằm trước business logic chính.
  Ưu tiên schema validation rõ ràng.
  Pagination/filter/sort phải được validate.


Pagination & filters
  List endpoints nên hỗ trợ:
  page
  pageSize
  keyword
  filter theo nghiệp vụ nếu phù hợp
  Không tải toàn bộ dữ liệu nếu dataset lớn.


Error handling
  Không trả stack trace ra client.
  Phân biệt rõ:
  validation error
  forbidden
  not found
  business conflict
  internal error

RBAC và scope
  API nhạy cảm phải check function code.
  API dữ liệu người dùng phải check scope.
  Scope filter phải nằm ở service/repository phù hợp, không chỉ ở UI.


Versioning / compatibility
  Không phá response contract cũ nếu route đang được dùng.
  Nếu cần thay đổi lớn:
    tạo route mới
    hoặc deprecate rõ ràng

Không được làm
  Không tạo route trùng chức năng khi route cũ có thể extend hợp lý
  Không nhét nhiều action khác bản chất vào một endpoint mơ hồ
  Không dùng tên route chung chung như /do-action