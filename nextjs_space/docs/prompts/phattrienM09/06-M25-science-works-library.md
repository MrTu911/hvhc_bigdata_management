# M25 — Science Works & Library

## Tóm tắt
- **Mã module:** M25
- **Tên module:** Science Works & Library
- **Ưu tiên:** P2
- **Giai đoạn:** GĐ2
- **Module nền tái sử dụng:** M01, M18, M19

## Chức năng chính
Quản lý công trình khoa học, xuất bản, DOI/ISBN/ISSN, CrossRef, duplicate check, thư viện số, semantic search, download phân quyền.

## Route UI chính
- app/(dashboard)/science/resources/works
- library

## API / router trọng tâm
- /api/scientific-works
- /api/scientific-works/check-duplicate
- /api/scientific-works/import-crossref
- /api/library/upload
- /api/library/search
- /api/library/:id/download
- /api/library/semantic-search
- /api/library/analytics

## Nguồn dữ liệu chính
- scientific_works, work_authors, library_items, library_metadata, embeddings

## Phụ thuộc chính
- M21, M22, M26

## Ràng buộc triển khai
- Không xây 2 kho tri thức tách rời; công trình và thư viện số phải liên thông để phục vụ tìm kiếm/AI.

## Prompt lập kế hoạch
```text
Focus only on M25 — Science Works & Library.

Context:
- priority: P2
- phase target: GĐ2
- reused base modules: M01, M18, M19
- dependencies: M21, M22, M26

Business scope:
Quản lý công trình khoa học, xuất bản, DOI/ISBN/ISSN, CrossRef, duplicate check, thư viện số, semantic search, download phân quyền.

UI routes:
app/(dashboard)/science/resources/works; library

APIs:
/api/scientific-works; /api/scientific-works/check-duplicate; /api/scientific-works/import-crossref; /api/library/upload; /api/library/search; /api/library/:id/download; /api/library/semantic-search; /api/library/analytics

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
Focus only on M25 — Science Works & Library.

Before writing code:
1. summarize the business scope
2. list reused base modules: M01, M18, M19
3. map dependencies: M21, M22, M26
4. list UI routes: app/(dashboard)/science/resources/works; library
5. list APIs/routers: /api/scientific-works; /api/scientific-works/check-duplicate; /api/scientific-works/import-crossref; /api/library/upload; /api/library/search; /api/library/:id/download; /api/library/semantic-search; /api/library/analytics
6. propose data model and key enums
7. identify RBAC, audit, and sensitivity requirements

Do not write code yet.
```

### Phase 2 — schema + validation
```text
Implement only schema and validation for M25.

Constraints:
- reuse base modules: M01, M18, M19
- do not create parallel auth/workflow/export/master-data systems
- keep all names aligned with M25

Deliver:
1. Prisma model proposal
2. enums
3. validation schemas
4. migration notes
```

### Phase 3 — service + API/router
```text
Implement only service layer and API/router contracts for M25.

Use:
- business scope: Quản lý công trình khoa học, xuất bản, DOI/ISBN/ISSN, CrossRef, duplicate check, thư viện số, semantic search, download phân quyền.
- APIs: /api/scientific-works; /api/scientific-works/check-duplicate; /api/scientific-works/import-crossref; /api/library/upload; /api/library/search; /api/library/:id/download; /api/library/semantic-search; /api/library/analytics

Deliver:
1. services
2. repositories if needed
3. API/router contracts
4. RBAC checks
5. audit hooks
```

### Phase 4 — UI
```text
Implement only UI for M25.

Routes:
- app/(dashboard)/science/resources/works
- library

Requirements:
- use the existing App Router structure
- do not invent a new navigation system
- keep forms and tables aligned to the domain workflow
```

### Phase 5 — review
```text
Review the implementation of M25.

Check:
1. architecture violations
2. missing reuse of base modules
3. missing RBAC/audit/sensitivity checks
4. missing routes or API contracts from the design
5. next patch suggestions
```

## Gợi ý chuyên biệt
- Không tách rời công trình khoa học và thư viện số thành 2 kho cô lập.
- Tìm kiếm và AI sau này cần đọc được cả works và library items.
- CrossRef/import/search/upload/download nên tách thành các cụm rõ ràng.
