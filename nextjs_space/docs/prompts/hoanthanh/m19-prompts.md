# M19 PROMPTS – BỘ PROMPT CHUẨN CHO MODULE MASTER DATA MANAGEMENT

---

# 1. PROMPT MỞ ĐẦU M19

## 1.1. Đọc overview
```text
Đọc docs/design/system-overview.md và docs/design/module-m19-overview.md.

Chưa code.

Hãy tóm tắt:
1. Vai trò của M19 trong toàn hệ thống
2. Các vấn đề kỹ thuật M19 giải quyết
3. 4 bảng lõi của M19
4. 3 nhóm chức năng lớn:
   - core read layer
   - admin UI
   - sync/cache/analytics
5. Kiến trúc code cần dùng trong project hiện tại
6. Thứ tự phase triển khai hợp lý

1.2. Mapping codebase
Đọc docs/design/system-overview.md và docs/design/module-m19-overview.md.

Chưa code.

Hãy:
1. Mapping M19 vào codebase hiện tại
2. Liệt kê file cần tạo và file có thể tái sử dụng
3. Nêu hook/component dùng chung nào nên tạo từ sớm
4. Chỉ ra điểm nào cần xác minh trong schema hiện tại trước khi viết Prisma
2. PROMPT CHO M19 CORE MDM
2.1. Prompt mở đầu core
/implement-from-design

Đọc docs/design/module-m19-overview.md và docs/design/module-m19-core-mdm.md.

Chưa code.

Hãy:
1. Tóm tắt core MDM
2. Liệt kê model Prisma cần có
3. Liệt kê public APIs cần có
4. Liệt kê hook/component dùng chung cần có
5. Chia phase triển khai
2.2. Phase 1 schema
/m09-phase1-schema

Đọc docs/design/module-m19-core-mdm.md.

Chỉ triển khai Phase 1 schema.

Yêu cầu:
- cập nhật prisma/schema.prisma
- thêm model:
  - MasterCategory
  - MasterDataItem
  - MasterDataChangeLog
  - MasterDataSyncLog
- thêm enum nếu cần cho cacheType, sourceType, syncStatus
- thêm relation và index phù hợp

Không làm API.
Không làm UI.
Không làm hook.

Sau khi xong:
1. liệt kê models đã thêm
2. liệt kê index/unique quan trọng
3. nêu relation chính
4. đưa lệnh prisma tiếp theo
2.3. Phase 2 read repository + service + API
Đọc docs/design/module-m19-core-mdm.md.

Triển khai Phase 2.

Yêu cầu:
- tạo repository read layer
- tạo service read layer
- tạo API:
  - GET /api/master-data/[categoryCode]
  - GET /api/master-data/[categoryCode]/tree
- response chuẩn: { success, data, error }
- hỗ trợ cache hook-point nhưng chưa cần sync logic đầy đủ

Chưa làm UI admin.
Chưa làm analytics.

Sau khi xong:
- liệt kê endpoint
- nêu shape response
- nêu nơi sẽ cắm Redis cache
2.4. Phase 3 hook + component dùng chung
Đọc docs/design/module-m19-core-mdm.md.

Triển khai Phase 3.

Yêu cầu:
- tạo hook hooks/useMasterData.ts
- tạo component components/shared/MasterDataSelect.tsx
- hook dùng react-query
- component hỗ trợ:
  - category
  - placeholder
  - searchable
  - multiple
  - hierarchical nếu có

Sau khi xong:
- liệt kê props chính
- nêu cách các module khác sẽ dùng hook/component này
2.5. Review core
/review-m09

Hãy review phần M19 core hiện có theo:
- docs/design/module-m19-overview.md
- docs/design/module-m19-core-mdm.md

Kiểm tra:
- schema có đúng không
- read API có generic chưa
- hook useMasterData có đủ tái sử dụng chưa
- MasterDataSelect có đủ linh hoạt chưa
3. PROMPT CHO M19 ADMIN UI
3.1. Prompt mở đầu admin UI
/implement-from-design

Đọc docs/design/module-m19-overview.md và docs/design/module-m19-admin-ui.md.

Chưa code.

Hãy:
1. Tóm tắt phần admin UI của M19
2. Liệt kê màn hình cần có
3. Liệt kê admin APIs cần có
4. Chia phase triển khai
3.2. Phase 1 category + item CRUD
Đọc docs/design/module-m19-admin-ui.md.

Triển khai Phase 1.

Yêu cầu:
- tạo API cho category list và item CRUD
- tạo page admin category list
- tạo page category detail + item grid
- soft delete thay vì hard delete
- mọi thay đổi phải có hook cho change log

Chưa làm import wizard.
Chưa làm tree view.

Sau khi xong:
- liệt kê endpoint admin
- liệt kê file UI
- nêu phần change log còn thiếu nếu chưa làm xong
3.3. Phase 2 change log + tree view
Đọc docs/design/module-m19-admin-ui.md.

Triển khai Phase 2.

Yêu cầu:
- hoàn thiện change log viewer
- tạo tree page cho danh mục phân cấp
- hỗ trợ sort / drag-drop / inline edit ở mức hợp lý
- nếu chưa làm full drag-drop, tạo cấu trúc component đúng để mở rộng sau

Sau khi xong:
- liệt kê endpoint và component liên quan
- nêu phần nào production-ready
- nêu phần nào là scaffold


****24/03/2026
Dang lam ------------------------------------------


3.4. Phase 3 import/export
Đọc docs/design/module-m19-admin-ui.md.

Triển khai Phase 3.

Yêu cầu:
- tạo import wizard flow:
  1. upload
  2. preview validate
  3. confirm
- tạo export endpoint
- validate file và schema import rõ ràng

Sau khi xong:
- nêu flow import
- nêu import session / importId handling
- nêu các file UI + API đã tạo
3.5. Review admin UI
/review-m09

Hãy review phần M19 admin UI theo:
- docs/design/module-m19-overview.md
- docs/design/module-m19-admin-ui.md

Kiểm tra:
- admin CRUD có đúng soft delete + change log không
- import wizard có đúng flow 3 bước không
- tree view có đúng tinh thần quản trị danh mục phân cấp không

5. Đề xuất ưu tiên sửa
Ưu tiên 1 — Trước khi production:

Fix debounce timer leak trong ChangeLogDrawer (dùng useRef) — bug hiện tại, dễ sửa
Fix useMemo → useEffect trong TreeView — correctness issue
Thêm RBAC guard trên ít nhất sort + import + toggle routes — security
Enum validation cho cacheType/sourceType trong updateCategory — tránh Prisma 500

Ưu tiên 2 — Sau khi stable:
5. Refactor sort route vào masterDataAdminService + thêm change log cho sort
6. Ghi change log cho deactivateCategory
7. Import batching — chunk 5000 dòng thành batch nhỏ hơn + wrap trong transaction

Ưu tiên 3 — Phase sau:
8. Drag-drop thực sự với @dnd-kit (thay [DND_HOOK] scaffold)
9. validFrom/validTo enforcement trong read API
10. Metadata viewer/editor trong item form
11. Trang danh sách category bổ sung filter groupTag/sourceType/cacheType



4. PROMPT CHO M19 SYNC / CACHE / ANALYTICS
4.1. Prompt mở đầu
/implement-from-design

Đọc docs/design/module-m19-overview.md và docs/design/module-m19-sync-analytics.md.

Chưa code.

Hãy:
1. Tóm tắt các chức năng sync/cache/analytics
2. Liệt kê API cần có
3. Liệt kê pages/components cần có
4. Chia phase triển khai


4.2. Phase 1 sync
Đọc docs/design/module-m19-sync-analytics.md.

Triển khai Phase 1.

Yêu cầu:
- tạo service sync
- tạo API:
  - GET /api/admin/master-data/sync/status
  - POST /api/admin/master-data/[categoryCode]/sync
- chỉ category có sourceType phù hợp mới được sync
- ghi sync log

Chưa làm dashboard UI.

Sau khi xong:
- nêu flow sync
- nêu cách log kết quả
- nêu chỗ nào cần adapter nguồn ngoài
4.3. Phase 2 cache
Đọc docs/design/module-m19-sync-analytics.md.

Triển khai Phase 2.

Yêu cầu:
- tạo cache service
- tạo API:
  - POST /api/admin/master-data/cache/flush
  - GET /api/admin/master-data/cache/stats
- thể hiện rõ chỗ tích hợp Redis

Sau khi xong:
- nêu cách flush theo category hoặc all
- nêu các trường stats chính
4.4. Phase 3 analytics
Đọc docs/design/module-m19-sync-analytics.md.

Triển khai Phase 3.

Yêu cầu:
- tạo API usage analytics
- trả các trường:
  - categoryCode
  - code
  - usageCount
  - lastUsed
  - unusedCandidates nếu có
- tạo dashboard UI cơ bản

Sau khi xong:
- nêu response shape
- nêu component tree
- nêu giới hạn hiện tại của usage tracking
4.5. Review sync/cache/analytics
/review-m09

Hãy review phần M19 sync/cache/analytics theo:
- docs/design/module-m19-overview.md
- docs/design/module-m19-sync-analytics.md

Kiểm tra:
- sync có audit log chưa
- cache stats có rõ ràng chưa
- usage analytics có đúng vai trò gợi ý cleanup chưa
5. PROMPT CHO M19 SEED STRATEGY
5.1. Prompt seed strategy
Đọc docs/design/module-m19-seed-strategy.md.

Chưa code.

Hãy:
1. Tóm tắt chiến lược seed M19
2. Chia nhóm category cần seed trước
3. Đề xuất cấu trúc file seed phù hợp cho project hiện tại
4. Nêu cách version / replay / rollback
5. Nêu cách phối hợp giữa seed chuẩn và import Excel



11.00 pm - Lam tiep

5.2. Prompt seed implementation
Đọc docs/design/module-m19-seed-strategy.md.

Triển khai seed framework cho M19.

Yêu cầu:
- đề xuất cấu trúc thư mục seed
- tạo abstraction seed version
- hỗ trợ audit/replay/rollback ở mức thiết kế hoặc scaffold
- chưa cần seed đủ 1.200 item, chỉ dựng khung chuẩn

Sau khi xong:
- nêu cấu trúc file seed
- nêu flow chạy seed
- nêu cách mở rộng cho 68 category
6. PROMPT REVIEW TOÀN BỘ M19
/review-m09

Hãy review toàn bộ phần code M19 hiện có so với:
- docs/design/system-overview.md
- docs/design/module-m19-overview.md
- docs/design/module-m19-core-mdm.md
- docs/design/module-m19-admin-ui.md
- docs/design/module-m19-sync-analytics.md
- docs/design/module-m19-seed-strategy.md

Output:
1. phần đã đạt
2. phần còn thiếu
3. phần lệch kiến trúc
4. rủi ro production
5. thứ tự sửa tối ưu



Cách chạy:


# Replay an toàn (default — bảo vệ admin edit)
npx tsx --require dotenv/config prisma/seed/seed_master_data.ts

# Bỏ qua category đã ở đúng version
SEED_SKIP_VERSION=true npx tsx --require dotenv/config prisma/seed/seed_master_data.ts

# Ghi đè tất cả (reset có chủ ý)
SEED_OVERWRITE=true npx tsx --require dotenv/config prisma/seed/seed_master_data.ts
Rollback strategy: Vì mọi item được tạo bởi seed đều có changedBy='seed_script' trong ChangeLog, có thể query MasterDataChangeLog WHERE changedBy='seed_script' AND changeType='CREATE' để lấy danh sách item do bundle tạo ra, rồi deactivate chúng.

5. Thứ tự sửa tối ưu
Ngay (trước UAT / production):

P0-FIX-1: SEMI TTL: 3600 → 43200
  lib/master-data-cache.ts dòng 46: SEMI: 3600 → 43200

P0-FIX-2: Verify import-session-store.ts tồn tại và Redis-backed
  Nếu in-memory → migrate sang ioredis với 15min TTL

P0-FIX-3: BQP stub thêm log warning rõ ràng
  callExternalAdapter() → console.warn('[BQP STUB] Real integration not yet available')
  Cân nhắc trả syncStatus='PARTIAL' thay vì 'SUCCESS' khi stub
Sprint tới:

P1-FIX-4: Gọi warmMasterDataCache() từ instrumentation.ts
  export async function register() { await warmMasterDataCache() }

P1-FIX-5: Chuẩn hóa public API response
  GET /api/master-data/[categoryCode]/items → wrap thành { success, data: items[] }
  (Breaking change cần update hooks/use-master-data.ts)

P1-FIX-6: Xác nhận và hoàn thiện [categoryCode]/items admin page
  Kiểm tra app/(dashboard)/dashboard/admin/master-data/[categoryCode]/page.tsx có item grid chưa

P1-FIX-7: MasterDataSelect prop `multiple`
  Thêm multi-select support nếu chưa có
Backlog (không blocking):

P2-FIX-8: Seed items còn thiếu (~940 items cần thêm)
  Ưu tiên: MD_DISTRICT (quận/huyện chuẩn 2025), MD_MAJOR, MD_COUNTRY, MD_ACADEMIC_YEAR

P2-FIX-9: Thêm filter sourceType + cacheType ở category list admin UI

P2-FIX-10: redis.del batching (chunk 500 keys)

P2-FIX-11: Date range filter cho analytics usage (startDate/endDate)

P2-FIX-12: Rename MasterDataChangeLog.createdAt → note trong code "design gọi là changedAt"
Tóm tắt tình trạng M19:

Cốt lõi (read layer + admin CRUD + sync/cache/analytics): hoàn chỉnh, đúng kiến trúc
Điểm nguy hiểm nhất: SEMI TTL sai (1h vs 12h) + import-session-store chưa xác nhận tồn tại
Phần còn thiếu lớn nhất: ~940 seed items chưa có + item list admin page cần xác nhận
Sửa SEMI TTL: 1 dòng code, impact cao nhất / effort thấp nhất → làm ngay