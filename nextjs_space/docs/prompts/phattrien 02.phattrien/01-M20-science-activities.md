# M20 — Science Activities

## Tóm tắt
- **Mã module:** M20
- **Tên module:** Science Activities
- **Ưu tiên:** P1
- **Giai đoạn:** GĐ1–GĐ2
- **Module nền tái sử dụng:** M01, M02, M13, M18, M19

## Chức năng chính
Quản lý đề xuất, tiếp nhận, sơ kiểm, thẩm định, phê duyệt, giao thực hiện, tiến độ, nghiệm thu, lưu trữ hồ sơ khoa học.

## Route UI chính
- app/(dashboard)/science/activities/proposals
- intake
- review
- execution
- progress
- acceptance
- archive

## API / router trọng tâm
- /api/research-projects
- /api/research-projects/:id/submit
- /api/research-projects/:id/workflow
- /api/research-projects/:id/assign-reviewer
- /api/research-projects/:id/review
- /api/research-projects/:id/approve
- /api/research-projects/:id/activate
- /api/research-projects/:id/milestones
- /api/research-projects/:id/acceptance
- /api/research-projects/:id/archive

## Nguồn dữ liệu chính
- research_projects, project_attachments, workflow_logs, milestones, acceptance_records

## Phụ thuộc chính
- M21, M23, M24, M25

## Ràng buộc triển khai
- Không tạo workflow engine riêng; dùng M13. Mã hồ sơ, lookup, export đều tái sử dụng nền gốc.

## Prompt lập kế hoạch
```text
Focus only on M20 — Science Activities.

Context:
- priority: P1
- phase target: GĐ1–GĐ2
- reused base modules: M01, M02, M13, M18, M19
- dependencies: M21, M23, M24, M25

Business scope:
Quản lý đề xuất, tiếp nhận, sơ kiểm, thẩm định, phê duyệt, giao thực hiện, tiến độ, nghiệm thu, lưu trữ hồ sơ khoa học.

UI routes:
app/(dashboard)/science/activities/proposals; intake; review; execution; progress; acceptance; archive

APIs:
/api/research-projects; /api/research-projects/:id/submit; /api/research-projects/:id/workflow; /api/research-projects/:id/assign-reviewer; /api/research-projects/:id/review; /api/research-projects/:id/approve; /api/research-projects/:id/activate; /api/research-projects/:id/milestones; /api/research-projects/:id/acceptance; /api/research-projects/:id/archive

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
Focus only on M20 — Science Activities.

Before writing code:
1. summarize the business scope
2. list reused base modules: M01, M02, M13, M18, M19
3. map dependencies: M21, M23, M24, M25
4. list UI routes: app/(dashboard)/science/activities/proposals; intake; review; execution; progress; acceptance; archive
5. list APIs/routers: /api/research-projects; /api/research-projects/:id/submit; /api/research-projects/:id/workflow; /api/research-projects/:id/assign-reviewer; /api/research-projects/:id/review; /api/research-projects/:id/approve; /api/research-projects/:id/activate; /api/research-projects/:id/milestones; /api/research-projects/:id/acceptance; /api/research-projects/:id/archive
6. propose data model and key enums
7. identify RBAC, audit, and sensitivity requirements

Do not write code yet.
```

### Phase 2 — schema + validation
```text
Implement only schema and validation for M20.

Constraints:
- reuse base modules: M01, M02, M13, M18, M19
- do not create parallel auth/workflow/export/master-data systems
- keep all names aligned with M20

Deliver:
1. Prisma model proposal
2. enums
3. validation schemas
4. migration notes
```

### Phase 3 — service + API/router
```text
Implement only service layer and API/router contracts for M20.

Use:
- business scope: Quản lý đề xuất, tiếp nhận, sơ kiểm, thẩm định, phê duyệt, giao thực hiện, tiến độ, nghiệm thu, lưu trữ hồ sơ khoa học.
- APIs: /api/research-projects; /api/research-projects/:id/submit; /api/research-projects/:id/workflow; /api/research-projects/:id/assign-reviewer; /api/research-projects/:id/review; /api/research-projects/:id/approve; /api/research-projects/:id/activate; /api/research-projects/:id/milestones; /api/research-projects/:id/acceptance; /api/research-projects/:id/archive

Deliver:
1. services
2. repositories if needed
3. API/router contracts
4. RBAC checks
5. audit hooks
```

### Phase 4 — UI
```text
Implement only UI for M20.

Routes:
- app/(dashboard)/science/activities/proposals
- intake
- review
- execution
- progress
- acceptance
- archive

Requirements:
- use the existing App Router structure
- do not invent a new navigation system
- keep forms and tables aligned to the domain workflow
```

### Phase 5 — review
```text
Review the implementation of M20.

Check:
1. architecture violations
2. missing reuse of base modules
3. missing RBAC/audit/sensitivity checks
4. missing routes or API contracts from the design
5. next patch suggestions
```

## Gợi ý chuyên biệt
- Workflow phải dùng M13, không tự dựng engine riêng.
- Mã hồ sơ, lookup và export phải đi qua M19 và M18.
- Nên chia thành các cụm: proposal, intake/review, execution/progress, acceptance/archive.
