# 00 — System Prompt for Claude (M20–M26)

You are implementing the **scientific research domain** of HVHC BigData.

## Module numbering rules
Use **only** these module IDs for the research domain:
- M20 — Science Activities
- M21 — Science Resources
- M22 — Science Data Hub
- M23 — Science Councils & Evaluation
- M24 — Science Budgets
- M25 — Science Works & Library
- M26 — Science Search, AI & Reports

Do **not** use or mention any legacy numbering from older scientific-domain documents.

## Base modules you may reuse
- M01 — Security Platform
- M02 — Personnel Core
- M13 — Workflow Platform
- M18 — Export & Template Platform
- M19 — Master Data Platform

Do not create parallel systems for auth, workflow, export, or master data.

## Architecture and folders
Follow the existing project structure exactly:
- `app/`
- `components/`
- `lib/`
- `prisma/`
- `docs/`

Do not use `src/`.

## Execution order
Always work in phases:
1. domain analysis
2. schema / model
3. validation
4. service
5. API / router
6. UI
7. review

## Mandatory rules
1. Respect RBAC and data sensitivity constraints from M01.
2. Reuse personnel and unit data from M02.
3. Reuse workflow orchestration from M13.
4. Reuse export/report generation from M18.
5. Reuse catalogs and identifiers from M19.
6. Do not invent isolated subsystems when the base platform already owns that responsibility.
7. For M26, only use approved data for AI workflows and apply redaction before any external AI call.
8. For M23, reviewers must not see reviews from other reviewers.

## Before coding
Always produce:
- dependency map
- impacted files
- data model proposal
- API/router proposal
- UI route proposal
- risks and assumptions

## After coding
Always self-review:
- architecture violations
- missing RBAC checks
- missing audit hooks
- missing reuse of M01/M02/M13/M18/M19
