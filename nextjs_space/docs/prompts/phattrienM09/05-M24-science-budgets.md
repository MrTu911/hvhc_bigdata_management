# M24 — Science Budgets

## Tóm tắt
- **Mã module:** M24
- **Tên module:** Science Budgets
- **Ưu tiên:** P2
- **Giai đoạn:** GĐ2
- **Module nền tái sử dụng:** M01, M18, M19

## Chức năng chính
Quản lý dự toán kinh phí khoa học, phê duyệt, giải ngân, theo dõi sử dụng, cảnh báo 90%/100%.

## Route UI chính
- app/(dashboard)/science/activities/execution
- progress
- budgets

## API / router trọng tâm
- /api/budgets
- /api/budgets/:id/approve
- /api/budgets/:id/disbursements
- /api/budgets/:id/usage

## Nguồn dữ liệu chính
- budgets, budget_lines, disbursements, spending snapshots

## Phụ thuộc chính
- M20, M22

## Ràng buộc triển khai
- Kinh phí gắn trực tiếp đề tài/hồ sơ khoa học; dùng M18 cho biểu mẫu quyết toán, M19 cho nguồn kinh phí và danh mục.

## Prompt lập kế hoạch
```text
Focus only on M24 — Science Budgets.

Context:
- priority: P2
- phase target: GĐ2
- reused base modules: M01, M18, M19
- dependencies: M20, M22

Business scope:
Quản lý dự toán kinh phí khoa học, phê duyệt, giải ngân, theo dõi sử dụng, cảnh báo 90%/100%.

UI routes:
app/(dashboard)/science/activities/execution; progress; budgets

APIs:
/api/budgets; /api/budgets/:id/approve; /api/budgets/:id/disbursements; /api/budgets/:id/usage

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
Focus only on M24 — Science Budgets.

Before writing code:
1. summarize the business scope
2. list reused base modules: M01, M18, M19
3. map dependencies: M20, M22
4. list UI routes: app/(dashboard)/science/activities/execution; progress; budgets
5. list APIs/routers: /api/budgets; /api/budgets/:id/approve; /api/budgets/:id/disbursements; /api/budgets/:id/usage
6. propose data model and key enums
7. identify RBAC, audit, and sensitivity requirements

Do not write code yet.
```

### Phase 2 — schema + validation
```text
Implement only schema and validation for M24.

Constraints:
- reuse base modules: M01, M18, M19
- do not create parallel auth/workflow/export/master-data systems
- keep all names aligned with M24

Deliver:
1. Prisma model proposal
2. enums
3. validation schemas
4. migration notes
```

### Phase 3 — service + API/router
```text
Implement only service layer and API/router contracts for M24.

Use:
- business scope: Quản lý dự toán kinh phí khoa học, phê duyệt, giải ngân, theo dõi sử dụng, cảnh báo 90%/100%.
- APIs: /api/budgets; /api/budgets/:id/approve; /api/budgets/:id/disbursements; /api/budgets/:id/usage

Deliver:
1. services
2. repositories if needed
3. API/router contracts
4. RBAC checks
5. audit hooks
```

### Phase 4 — UI
```text
Implement only UI for M24.

Routes:
- app/(dashboard)/science/activities/execution
- progress
- budgets

Requirements:
- use the existing App Router structure
- do not invent a new navigation system
- keep forms and tables aligned to the domain workflow
```

### Phase 5 — review
```text
Review the implementation of M24.

Check:
1. architecture violations
2. missing reuse of base modules
3. missing RBAC/audit/sensitivity checks
4. missing routes or API contracts from the design
5. next patch suggestions
```

## Gợi ý chuyên biệt
- Kinh phí gắn trực tiếp với hồ sơ khoa học.
- Cần có cảnh báo ngưỡng 90% và 100%.
- Quyết toán và biểu mẫu dùng M18; danh mục nguồn kinh phí dùng M19.
