# M21 — Science Resources

## Tóm tắt
- **Mã module:** M21
- **Tên module:** Science Resources
- **Ưu tiên:** P1
- **Giai đoạn:** GĐ1
- **Module nền tái sử dụng:** M01, M02, M18, M19

## Chức năng chính
Quản lý hồ sơ nhà khoa học, năng lực đơn vị, chuyên gia, lịch sử hội đồng, chỉ số tiềm lực khoa học.

## Route UI chính
- app/(dashboard)/science/resources/scientists
- units
- experts
- capacity
- metrics

## API / router trọng tâm
- /api/scientists
- /api/scientists/:id
- /api/scientists/:id/sync-orcid
- /api/scientists/:id/export
- /api/units/:id/science-capacity
- /api/units/compare
- /api/experts
- /api/experts/:id/history
- /api/experts/suggest
- /api/metrics/*

## Nguồn dữ liệu chính
- scientists, scientist_education, scientist_career, scientist_awards, unit aggregates

## Phụ thuộc chính
- M25, M23, M22

## Ràng buộc triển khai
- Nguồn lực khoa học phải dựa trên hồ sơ nhân sự gốc M02; không tách user/personnel riêng cho miền khoa học.

## Prompt lập kế hoạch
```text
Focus only on M21 — Science Resources.

Context:
- priority: P1
- phase target: GĐ1
- reused base modules: M01, M02, M18, M19
- dependencies: M25, M23, M22

Business scope:
Quản lý hồ sơ nhà khoa học, năng lực đơn vị, chuyên gia, lịch sử hội đồng, chỉ số tiềm lực khoa học.

UI routes:
app/(dashboard)/science/resources/scientists; units; experts; capacity; metrics

APIs:
/api/scientists; /api/scientists/:id; /api/scientists/:id/sync-orcid; /api/scientists/:id/export; /api/units/:id/science-capacity; /api/units/compare; /api/experts; /api/experts/:id/history; /api/experts/suggest; /api/metrics/*

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
Focus only on M21 — Science Resources.

Before writing code:
1. summarize the business scope
2. list reused base modules: M01, M02, M18, M19
3. map dependencies: M25, M23, M22
4. list UI routes: app/(dashboard)/science/resources/scientists; units; experts; capacity; metrics
5. list APIs/routers: /api/scientists; /api/scientists/:id; /api/scientists/:id/sync-orcid; /api/scientists/:id/export; /api/units/:id/science-capacity; /api/units/compare; /api/experts; /api/experts/:id/history; /api/experts/suggest; /api/metrics/*
6. propose data model and key enums
7. identify RBAC, audit, and sensitivity requirements

Do not write code yet.
```

### Phase 2 — schema + validation
```text
Implement only schema and validation for M21.

Constraints:
- reuse base modules: M01, M02, M18, M19
- do not create parallel auth/workflow/export/master-data systems
- keep all names aligned with M21

Deliver:
1. Prisma model proposal
2. enums
3. validation schemas
4. migration notes
```

### Phase 3 — service + API/router
```text
Implement only service layer and API/router contracts for M21.

Use:
- business scope: Quản lý hồ sơ nhà khoa học, năng lực đơn vị, chuyên gia, lịch sử hội đồng, chỉ số tiềm lực khoa học.
- APIs: /api/scientists; /api/scientists/:id; /api/scientists/:id/sync-orcid; /api/scientists/:id/export; /api/units/:id/science-capacity; /api/units/compare; /api/experts; /api/experts/:id/history; /api/experts/suggest; /api/metrics/*

Deliver:
1. services
2. repositories if needed
3. API/router contracts
4. RBAC checks
5. audit hooks
```

### Phase 4 — UI
```text
Implement only UI for M21.

Routes:
- app/(dashboard)/science/resources/scientists
- units
- experts
- capacity
- metrics

Requirements:
- use the existing App Router structure
- do not invent a new navigation system
- keep forms and tables aligned to the domain workflow
```

### Phase 5 — review
```text
Review the implementation of M21.

Check:
1. architecture violations
2. missing reuse of base modules
3. missing RBAC/audit/sensitivity checks
4. missing routes or API contracts from the design
5. next patch suggestions
```

## Gợi ý chuyên biệt
- Hồ sơ nhà khoa học phải bám dữ liệu nhân sự gốc từ M02.
- ORCID sync nên tách qua job nền nếu cần.
- Metrics đơn vị nên ưu tiên aggregate/materialized view thay vì CRUD thuần.
