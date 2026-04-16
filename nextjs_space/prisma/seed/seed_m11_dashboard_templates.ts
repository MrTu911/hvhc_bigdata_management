/**
 * Seed: M11 Dashboard Role Templates
 *
 * Tạo DashboardRoleTemplate mặc định cho 6 role:
 *   EXECUTIVE, DEPARTMENT, EDUCATION, PARTY, FACULTY, STUDENT
 *
 * Layout format: { widgetId, x, y, w, h }
 * Grid 12 cột.
 *
 * Run: npx tsx --require dotenv/config prisma/seed/seed_m11_dashboard_templates.ts
 */

import { PrismaClient, DashboardRoleKey } from '@prisma/client'

const prisma = new PrismaClient()

// ─── Layout definitions ───────────────────────────────────────────────────────

type LayoutItem = { widgetId: string; x: number; y: number; w: number; h: number }

const EXECUTIVE_LAYOUT: LayoutItem[] = [
  // Row 0: 4 KPI cards
  { widgetId: 'WORKFLOW_PENDING',    x: 0,  y: 0, w: 3, h: 2 },
  { widgetId: 'SLA_OVERDUE',         x: 3,  y: 0, w: 3, h: 2 },
  { widgetId: 'ACADEMIC_WARNINGS',   x: 6,  y: 0, w: 3, h: 2 },
  { widgetId: 'PARTY_FEE_DEBT',      x: 9,  y: 0, w: 3, h: 2 },
  // Row 2: Personnel + Party
  { widgetId: 'personnel-total',     x: 0,  y: 2, w: 4, h: 2 },
  { widgetId: 'personnel-by-rank',   x: 4,  y: 2, w: 4, h: 4 },
  { widgetId: 'party-total',         x: 8,  y: 2, w: 2, h: 2 },
  { widgetId: 'BHYT_EXPIRING',       x: 10, y: 2, w: 2, h: 2 },
  // Row 4: Research + GPA
  { widgetId: 'research-total',      x: 0,  y: 4, w: 4, h: 2 },
  { widgetId: 'student-avg-gpa',     x: 8,  y: 4, w: 4, h: 2 },
  // Row 6: Research trend
  { widgetId: 'research-trend',      x: 0,  y: 6, w: 6, h: 4 },
  { widgetId: 'PERSONNEL_RETIRING',  x: 6,  y: 6, w: 6, h: 4 },
]

const DEPARTMENT_LAYOUT: LayoutItem[] = [
  { widgetId: 'WORKFLOW_PENDING',    x: 0,  y: 0, w: 3, h: 2 },
  { widgetId: 'SLA_OVERDUE',         x: 3,  y: 0, w: 3, h: 2 },
  { widgetId: 'PERSONNEL_RETIRING',  x: 6,  y: 0, w: 6, h: 2 },
  { widgetId: 'personnel-total',     x: 0,  y: 2, w: 4, h: 2 },
  { widgetId: 'faculty-total',       x: 4,  y: 2, w: 4, h: 2 },
  { widgetId: 'research-total',      x: 8,  y: 2, w: 4, h: 2 },
  { widgetId: 'awards-total',        x: 0,  y: 4, w: 6, h: 4 },
  { widgetId: 'faculty-by-degree',   x: 6,  y: 4, w: 6, h: 4 },
]

const EDUCATION_LAYOUT: LayoutItem[] = [
  { widgetId: 'student-total',       x: 0,  y: 0, w: 3, h: 2 },
  { widgetId: 'student-avg-gpa',     x: 3,  y: 0, w: 3, h: 2 },
  { widgetId: 'ACADEMIC_WARNINGS',   x: 6,  y: 0, w: 3, h: 2 },
  { widgetId: 'WORKFLOW_PENDING',    x: 9,  y: 0, w: 3, h: 2 },
  { widgetId: 'student-performance', x: 0,  y: 2, w: 6, h: 4 },
  { widgetId: 'student-gpa-trend',   x: 6,  y: 2, w: 6, h: 4 },
  { widgetId: 'student-by-class',    x: 0,  y: 6, w: 12, h: 4 },
]

const PARTY_LAYOUT: LayoutItem[] = [
  { widgetId: 'party-total',         x: 0,  y: 0, w: 3, h: 2 },
  { widgetId: 'party-official',      x: 3,  y: 0, w: 3, h: 2 },
  { widgetId: 'party-probationary',  x: 6,  y: 0, w: 3, h: 2 },
  { widgetId: 'PARTY_FEE_DEBT',      x: 9,  y: 0, w: 3, h: 2 },
  { widgetId: 'party-by-unit',       x: 0,  y: 2, w: 6, h: 4 },
  { widgetId: 'party-growth',        x: 6,  y: 2, w: 6, h: 4 },
]

const FACULTY_LAYOUT: LayoutItem[] = [
  { widgetId: 'faculty-total',       x: 0,  y: 0, w: 3, h: 2 },
  { widgetId: 'WORKFLOW_PENDING',    x: 3,  y: 0, w: 3, h: 2 },
  { widgetId: 'research-total',      x: 6,  y: 0, w: 3, h: 2 },
  { widgetId: 'research-publications', x: 9, y: 0, w: 3, h: 2 },
  { widgetId: 'faculty-eis-radar',   x: 0,  y: 2, w: 6, h: 4 },
  { widgetId: 'faculty-by-degree',   x: 6,  y: 2, w: 6, h: 4 },
]

const STUDENT_LAYOUT: LayoutItem[] = [
  { widgetId: 'student-avg-gpa',     x: 0,  y: 0, w: 4, h: 2 },
  { widgetId: 'ACADEMIC_WARNINGS',   x: 4,  y: 0, w: 4, h: 2 },
  { widgetId: 'WORKFLOW_PENDING',    x: 8,  y: 0, w: 4, h: 2 },
  { widgetId: 'student-gpa-trend',   x: 0,  y: 2, w: 12, h: 4 },
  { widgetId: 'student-performance', x: 0,  y: 6, w: 6, h: 4 },
  { widgetId: 'student-by-class',    x: 6,  y: 6, w: 6, h: 4 },
]

// ─── Seed data ────────────────────────────────────────────────────────────────

const TEMPLATES: Array<{
  roleKey: DashboardRoleKey
  layout: LayoutItem[]
  widgetKeys: string[]
}> = [
  {
    roleKey: 'EXECUTIVE',
    layout: EXECUTIVE_LAYOUT,
    widgetKeys: EXECUTIVE_LAYOUT.map(i => i.widgetId),
  },
  {
    roleKey: 'DEPARTMENT',
    layout: DEPARTMENT_LAYOUT,
    widgetKeys: DEPARTMENT_LAYOUT.map(i => i.widgetId),
  },
  {
    roleKey: 'EDUCATION',
    layout: EDUCATION_LAYOUT,
    widgetKeys: EDUCATION_LAYOUT.map(i => i.widgetId),
  },
  {
    roleKey: 'PARTY',
    layout: PARTY_LAYOUT,
    widgetKeys: PARTY_LAYOUT.map(i => i.widgetId),
  },
  {
    roleKey: 'FACULTY',
    layout: FACULTY_LAYOUT,
    widgetKeys: FACULTY_LAYOUT.map(i => i.widgetId),
  },
  {
    roleKey: 'STUDENT',
    layout: STUDENT_LAYOUT,
    widgetKeys: STUDENT_LAYOUT.map(i => i.widgetId),
  },
]

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding M11 DashboardRoleTemplates...')

  for (const t of TEMPLATES) {
    const result = await prisma.dashboardRoleTemplate.upsert({
      where: { roleKey: t.roleKey },
      create: {
        roleKey: t.roleKey,
        layoutJson: t.layout,
        widgetKeys: t.widgetKeys,
        isActive: true,
      },
      update: {
        layoutJson: t.layout,
        widgetKeys: t.widgetKeys,
        isActive: true,
        updatedAt: new Date(),
      },
    })
    console.log(`  ✓ ${t.roleKey} — id: ${result.id} — ${t.widgetKeys.length} widgets`)
  }

  console.log(`Done. ${TEMPLATES.length} templates seeded.`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
