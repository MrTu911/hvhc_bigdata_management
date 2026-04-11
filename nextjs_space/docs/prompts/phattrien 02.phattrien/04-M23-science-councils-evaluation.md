# M23 — Science Councils & Evaluation

## Tóm tắt
- **Mã module:** M23
- **Tên module:** Science Councils & Evaluation
- **Ưu tiên:** P1
- **Giai đoạn:** GĐ1–GĐ2
- **Module nền tái sử dụng:** M01, M13, M18

## Chức năng chính
Quản lý hội đồng khoa học, phản biện kín, bỏ phiếu, biên bản, kết luận, hội đồng nghiệm thu.

## Route UI chính
- app/(dashboard)/science/activities/councils
- science/activities/acceptance

## API / router trọng tâm
- /api/councils
- /api/councils/:id/reviewers
- /api/councils/:id/reviews
- /api/councils/:id/votes
- /api/councils/:id/session

## Nguồn dữ liệu chính
- councils, council_members, council_reviews, council_votes, session_minutes

## Phụ thuộc chính
- M20, M21

## Ràng buộc triển khai
- Phải áp dụng phân quyền kín cho phản biện; không cho reviewer thấy nhận xét của reviewer khác.

## Prompt lập kế hoạch
```text
Focus only on M23 — Science Councils & Evaluation.

Context:
- priority: P1
- phase target: GĐ1–GĐ2
- reused base modules: M01, M13, M18
- dependencies: M20, M21

Business scope:
Quản lý hội đồng khoa học, phản biện kín, bỏ phiếu, biên bản, kết luận, hội đồng nghiệm thu.

UI routes:
app/(dashboard)/science/activities/councils; science/activities/acceptance

APIs:
/api/councils; /api/councils/:id/reviewers; /api/councils/:id/reviews; /api/councils/:id/votes; /api/councils/:id/session

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
Focus only on M23 — Science Councils & Evaluation.

Before writing code:
1. summarize the business scope
2. list reused base modules: M01, M13, M18
3. map dependencies: M20, M21
4. list UI routes: app/(dashboard)/science/activities/councils; science/activities/acceptance
5. list APIs/routers: /api/councils; /api/councils/:id/reviewers; /api/councils/:id/reviews; /api/councils/:id/votes; /api/councils/:id/session
6. propose data model and key enums
7. identify RBAC, audit, and sensitivity requirements

Do not write code yet.
```

### Phase 2 — schema + validation
```text
Implement only schema and validation for M23.

Constraints:
- reuse base modules: M01, M13, M18
- do not create parallel auth/workflow/export/master-data systems
- keep all names aligned with M23

Deliver:
1. Prisma model proposal
2. enums
3. validation schemas
4. migration notes
```

### Phase 3 — service + API/router
```text
Implement only service layer and API/router contracts for M23.

Use:
- business scope: Quản lý hội đồng khoa học, phản biện kín, bỏ phiếu, biên bản, kết luận, hội đồng nghiệm thu.
- APIs: /api/councils; /api/councils/:id/reviewers; /api/councils/:id/reviews; /api/councils/:id/votes; /api/councils/:id/session

Deliver:
1. services
2. repositories if needed
3. API/router contracts
4. RBAC checks
5. audit hooks
```

### Phase 4 — UI
```text
Implement only UI for M23.

Routes:
- app/(dashboard)/science/activities/councils
- science/activities/acceptance

Requirements:
- use the existing App Router structure
- do not invent a new navigation system
- keep forms and tables aligned to the domain workflow
```

### Phase 5 — review
```text
Review the implementation of M23.

Check:
1. architecture violations
2. missing reuse of base modules
3. missing RBAC/audit/sensitivity checks
4. missing routes or API contracts from the design
5. next patch suggestions
```

## Gợi ý chuyên biệt
- Reviewer không được thấy nhận xét của reviewer khác.
- Biên bản, phiếu, kết luận nên đi qua M18 khi xuất file.
- Cần kiểm tra xung đột lợi ích với dữ liệu chuyên gia/đơn vị.
