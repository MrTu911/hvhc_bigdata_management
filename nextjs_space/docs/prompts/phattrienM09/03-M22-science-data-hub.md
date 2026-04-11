# M22 — Science Data Hub

## Tóm tắt
- **Mã module:** M22
- **Tên module:** Science Data Hub
- **Ưu tiên:** P2
- **Giai đoạn:** GĐ2
- **Module nền tái sử dụng:** M01, M18, M19

## Chức năng chính
Kho dữ liệu khoa học hợp nhất: dashboard dữ liệu, hồ sơ hợp nhất, danh mục khoa học, data quality, data lineage.

## Route UI chính
- app/(dashboard)/science/database/overview
- records
- catalogs
- quality

## API / router trọng tâm
- /api/dashboard/data-overview
- /api/dashboard/academy
- /api/dashboard/unit/:id
- /api/dashboard/alerts
- /api/records/project/:id
- /api/records/scientist/:id
- /api/records/unit/:id
- /api/catalogs
- /api/catalogs/:id
- /api/catalogs/generate-code
- /api/data-quality/*

## Nguồn dữ liệu chính
- aggregates từ M20, M21, M23, M24, M25

## Phụ thuộc chính
- M20, M21, M19, M18

## Ràng buộc triển khai
- Đây là kho dữ liệu hợp nhất của miền khoa học; danh mục và mã định danh vẫn do M19 nền quản lý.

## Prompt lập kế hoạch
```text
Focus only on M22 — Science Data Hub.

Context:
- priority: P2
- phase target: GĐ2
- reused base modules: M01, M18, M19
- dependencies: M20, M21, M19, M18

Business scope:
Kho dữ liệu khoa học hợp nhất: dashboard dữ liệu, hồ sơ hợp nhất, danh mục khoa học, data quality, data lineage.

UI routes:
app/(dashboard)/science/database/overview; records; catalogs; quality

APIs:
/api/dashboard/data-overview; /api/dashboard/academy; /api/dashboard/unit/:id; /api/dashboard/alerts; /api/records/project/:id; /api/records/scientist/:id; /api/records/unit/:id; /api/catalogs; /api/catalogs/:id; /api/catalogs/generate-code; /api/data-quality/*

Before writing code:
1. summarize business flow
2. list reused base modules and why
3. propose data model
4. propose service boundaries
5. propose API/router contracts
6. propose UI pages/components
7. identify audit, RBAC, sensitivity, and background-job needs

Do not write code yet.
```

## Prompt thực thi theo phase

### Phase 1 — phân tích
```text
Focus only on M22 — Science Data Hub.

Before writing code:
1. summarize the business scope
2. list reused base modules: M01, M18, M19
3. map dependencies: M20, M21, M19, M18
4. list UI routes: app/(dashboard)/science/database/overview; records; catalogs; quality
5. list APIs/routers: /api/dashboard/data-overview; /api/dashboard/academy; /api/dashboard/unit/:id; /api/dashboard/alerts; /api/records/project/:id; /api/records/scientist/:id; /api/records/unit/:id; /api/catalogs; /api/catalogs/:id; /api/catalogs/generate-code; /api/data-quality/*
6. propose data model and key enums
7. identify RBAC, audit, and sensitivity requirements

Do not write code yet.
```

### Phase 2 — schema + validation
```text
Implement only schema and validation for M22.

Constraints:
- reuse base modules: M01, M18, M19
- do not create parallel auth/workflow/export/master-data systems
- keep all names aligned with M22

Deliver:
1. Prisma model proposal
2. enums
3. validation schemas
4. migration notes
```

### Phase 3 — service + API/router
```text
Implement only service layer and API/router contracts for M22.

Use:
- business scope: Kho dữ liệu khoa học hợp nhất: dashboard dữ liệu, hồ sơ hợp nhất, danh mục khoa học, data quality, data lineage.
- APIs: /api/dashboard/data-overview; /api/dashboard/academy; /api/dashboard/unit/:id; /api/dashboard/alerts; /api/records/project/:id; /api/records/scientist/:id; /api/records/unit/:id; /api/catalogs; /api/catalogs/:id; /api/catalogs/generate-code; /api/data-quality/*

Deliver:
1. services
2. repositories if needed
3. API/router contracts
4. RBAC checks
5. audit hooks
```

### Phase 4 — UI
```text
Implement only UI for M22.

Routes:
- app/(dashboard)/science/database/overview
- records
- catalogs
- quality

Requirements:
- use the existing App Router structure
- do not invent a new navigation system
- keep forms and tables aligned to the domain workflow
```

### Phase 5 — review
```text
Review the implementation of M22.

Check:
1. architecture violations
2. missing reuse of base modules
3. missing RBAC/audit/sensitivity checks
4. missing routes or API contracts from the design
5. next patch suggestions
```

## Gợi ý chuyên biệt
- Đây là kho dữ liệu hợp nhất của miền khoa học.
- Danh mục khoa học vẫn do M19 sở hữu.
- Data quality và lineage phải được mô tả rõ trước khi viết service.
