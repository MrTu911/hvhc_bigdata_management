# M26 — Science Search, AI & Reports

## Tóm tắt
- **Mã module:** M26
- **Tên module:** Science Search, AI & Reports
- **Ưu tiên:** P3
- **Giai đoạn:** GĐ3
- **Module nền tái sử dụng:** M01, M18, M19

## Chức năng chính
Tra cứu 4 lớp, AI chatbot RAG, summarize, trends, duplicate check, báo cáo BQP, scheduled exports.

## Route UI chính
- app/(dashboard)/science/database/search
- reports
- ai-tools

## API / router trọng tâm
- /api/search
- /api/search/semantic
- /api/search/hybrid
- /api/search/save-filter
- /api/reports/activity
- /api/reports/capacity
- /api/reports/generate
- /api/ai/chat
- /api/ai/summarize
- /api/ai/research-trends
- /api/ai/duplicate-check

## Nguồn dữ liệu chính
- search indexes, vectors, report_jobs, ai_requests, approved_records

## Phụ thuộc chính
- M22, M25, M18

## Ràng buộc triển khai
- AI chỉ xử lý dữ liệu APPROVED; phải có redaction middleware trước khi gọi API ngoài.

## Prompt lập kế hoạch
```text
Focus only on M26 — Science Search, AI & Reports.

Context:
- priority: P3
- phase target: GĐ3
- reused base modules: M01, M18, M19
- dependencies: M22, M25, M18

Business scope:
Tra cứu 4 lớp, AI chatbot RAG, summarize, trends, duplicate check, báo cáo BQP, scheduled exports.

UI routes:
app/(dashboard)/science/database/search; reports; ai-tools

APIs:
/api/search; /api/search/semantic; /api/search/hybrid; /api/search/save-filter; /api/reports/activity; /api/reports/capacity; /api/reports/generate; /api/ai/chat; /api/ai/summarize; /api/ai/research-trends; /api/ai/duplicate-check

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
Focus only on M26 — Science Search, AI & Reports.

Before writing code:
1. summarize the business scope
2. list reused base modules: M01, M18, M19
3. map dependencies: M22, M25, M18
4. list UI routes: app/(dashboard)/science/database/search; reports; ai-tools
5. list APIs/routers: /api/search; /api/search/semantic; /api/search/hybrid; /api/search/save-filter; /api/reports/activity; /api/reports/capacity; /api/reports/generate; /api/ai/chat; /api/ai/summarize; /api/ai/research-trends; /api/ai/duplicate-check
6. propose data model and key enums
7. identify RBAC, audit, and sensitivity requirements

Do not write code yet.
```

### Phase 2 — schema + validation
```text
Implement only schema and validation for M26.

Constraints:
- reuse base modules: M01, M18, M19
- do not create parallel auth/workflow/export/master-data systems
- keep all names aligned with M26

Deliver:
1. Prisma model proposal
2. enums
3. validation schemas
4. migration notes
```

### Phase 3 — service + API/router
```text
Implement only service layer and API/router contracts for M26.

Use:
- business scope: Tra cứu 4 lớp, AI chatbot RAG, summarize, trends, duplicate check, báo cáo BQP, scheduled exports.
- APIs: /api/search; /api/search/semantic; /api/search/hybrid; /api/search/save-filter; /api/reports/activity; /api/reports/capacity; /api/reports/generate; /api/ai/chat; /api/ai/summarize; /api/ai/research-trends; /api/ai/duplicate-check

Deliver:
1. services
2. repositories if needed
3. API/router contracts
4. RBAC checks
5. audit hooks
```

### Phase 4 — UI
```text
Implement only UI for M26.

Routes:
- app/(dashboard)/science/database/search
- reports
- ai-tools

Requirements:
- use the existing App Router structure
- do not invent a new navigation system
- keep forms and tables aligned to the domain workflow
```

### Phase 5 — review
```text
Review the implementation of M26.

Check:
1. architecture violations
2. missing reuse of base modules
3. missing RBAC/audit/sensitivity checks
4. missing routes or API contracts from the design
5. next patch suggestions
```

## Gợi ý chuyên biệt
- Chỉ xử lý AI trên dữ liệu APPROVED.
- Phải có redaction middleware trước khi gọi API ngoài.
- Search nên tách rõ: keyword, semantic, hybrid, saved filters, reports, AI tools.
