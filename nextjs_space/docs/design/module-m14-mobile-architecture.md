

## 2) `docs/design/module-m14-mobile-architecture.md`

# Module M14 – Kiến trúc Mobile Client và API Reuse

## 1. Mục tiêu

Tài liệu này mô tả kiến trúc client-side của M14. Trọng tâm là triển khai ứng dụng React Native/Expo dùng chung backend hiện có. Tài liệu gốc xác định stack chính gồm React Native (Expo), TypeScript, Redux Toolkit, React Query, Expo Notifications. fileciteturn4file0L7-L18

## 2. Kiến trúc tổng thể

M14 nên chia thành 6 lớp:

1. App shell / navigation
2. Auth/session layer
3. API client layer
4. Local cache & offline sync layer
5. Feature screens theo domain
6. Notifications/security/device layer

## 3. API client layer

Vì tài liệu gốc quy định không tạo backend mới, cần chuẩn hóa:

* dùng cùng API contracts như web,
* chia SDK client theo domain module,
* tận dụng auth tokens, refresh flows và error contracts chuẩn.

### Các mobile domain clients gợi ý

* `personnelApiClient`
* `policyApiClient`
* `educationApiClient`
* `workflowApiClient`
* `dashboardApiClient`
* `facultyStudentApiClient`

## 4. State management

### Redux Toolkit

Dùng cho:

* auth/session state
* app preferences
* offline queue state
* push notification state
* security/device state

### React Query

Dùng cho:

* remote fetching
* caching theo endpoint
* revalidation
* mutation lifecycle

## 5. Navigation strategy

Navigation nên chia theo role-based app shells:

* staff shell
* faculty shell
* student shell
* commander shell

Mỗi shell dùng cùng backend nhưng khác tab defaults và feature entry points.

## 6. Shared UI primitives

* KPI cards
* schedule cards
* score list items
* alert banners
* workflow task cards
* QR scan/result sheet
* offline sync status banner

## 7. Bảo mật client

Tài liệu gốc nêu ba lớp chính:

* biometric auth
* JWT refresh
* certificate pinning. fileciteturn4file0L14-L18

Nguyên tắc:

1. Biometric chỉ để mở khóa ứng dụng hoặc phiên local.
2. JWT/refresh vẫn do backend và M01 kiểm soát.
3. Certificate pinning chỉ nên triển khai khi hạ tầng chứng thư nội bộ ổn định.

## 8. Rủi ro cần kiểm soát

* Logic phân quyền nhúng quá nhiều ở app thay vì backend.
* API contracts web thay đổi nhưng mobile không theo kịp.
* Local storage giữ token/sensitive data không đúng chuẩn.

---