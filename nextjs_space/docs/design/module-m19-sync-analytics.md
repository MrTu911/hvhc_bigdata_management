# MODULE M19 – SYNC / CACHE / ANALYTICS

---

## 1. Mục tiêu

Xây dựng các chức năng vận hành và giám sát của M19:
- sync với BQP / National sources,
- dashboard cache,
- usage analytics,
- manual flush cache,
- sync monitor.

---

## 2. Chức năng chính

### 2.1. Sync Monitor
- theo dõi trạng thái sync từng category
- hiển thị:
  - last sync
  - source
  - hasPending
  - diff summary
- cho phép trigger sync thủ công

### 2.2. Cache Dashboard
- hit rate theo category
- misses
- TTL còn lại
- last refresh
- flush toàn bộ hoặc từng category

### 2.3. Usage Analytics
- item nào được dùng nhiều nhất
- item nào ít dùng hoặc không còn dùng
- gợi ý cleanup
- thống kê xu hướng sử dụng

---

## 3. Sync API

- `GET /api/admin/master-data/sync/status`
- `POST /api/admin/master-data/{categoryCode}/sync`

Rule:
- chỉ category có `sourceType = BQP | NATIONAL` mới được sync ngoài
- hỗ trợ `dryRun` nếu có
- sync phải ghi `MasterDataSyncLog`

---

## 4. Cache API

- `POST /api/admin/master-data/cache/flush`
- `GET /api/admin/master-data/cache/stats`

Rule:
- flush là thao tác admin
- sau khi sync/import/update lớn, cache liên quan phải được invalidate

---

## 5. Analytics API

- `GET /api/admin/master-data/analytics/usage`

Response tối thiểu:
- categoryCode
- code
- usageCount
- lastUsed
- unusedCandidates

---

## 6. Kiến trúc code

### Pages
- `app/dashboard/admin/master-data/sync/page.tsx`
- `app/dashboard/admin/master-data/cache/page.tsx`
- `app/dashboard/admin/master-data/analytics/page.tsx`

### Components
- `components/master-data/admin/sync-monitor.tsx`
- `components/master-data/admin/cache-dashboard.tsx`
- `components/master-data/admin/usage-analytics.tsx`

### Services
- `lib/services/master-data/master-data-sync.service.ts`
- `lib/services/master-data/master-data-cache.service.ts`
- `lib/services/master-data/master-data-analytics.service.ts`

### Repositories
- `lib/repositories/master-data/master-data-sync.repo.ts`

---

## 7. Business Rules

- Sync phải có audit log
- Cache stats không được lấy từ cache của chính nó nếu gây sai số nghiêm trọng
- Usage analytics nên có time range filter
- Cleanup suggestions chỉ là gợi ý, không tự động deactivate item

---

## 8. Phase triển khai cho Claude

### Phase 1
- sync status + sync log model usage

### Phase 2
- cache stats + flush

### Phase 3
- usage analytics

### Phase 4
- dashboard UI cho sync/cache/analytics

---

## 9. Notes for Claude

- Đây là nhóm chức năng vận hành hệ thống, không phải CRUD thuần
- Phải ưu tiên audit, monitoring, performance visibility
- Sync thật với BQP có thể cần adapter hoặc stub tùy giai đoạn