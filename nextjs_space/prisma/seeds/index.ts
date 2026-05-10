/**
 * HVHC BigData — Master Seed Orchestrator
 *
 * Chạy tất cả seed theo đúng thứ tự dependency.
 * File gốc trong prisma/seed/ GIỮ NGUYÊN — đây là lớp quản lý.
 *
 * Cách dùng:
 *   npx tsx --require dotenv/config prisma/seeds/index.ts [mode]
 *
 * mode:
 *   all       — Chạy tất cả (required + demo) [mặc định]
 *   required  — Chỉ chạy nhóm bắt buộc (01-06)
 *   demo      — Chỉ chạy nhóm demo (10+)
 *   M02       — Chỉ chạy module M02 (10,11,12)
 *   M03       — Chỉ chạy module M03 (20,21,22)
 *   M09       — Chỉ chạy module M09 (40,41,42)
 *   M10       — Chỉ chạy module M10 (50,51,52,53)
 *   M13       — Chỉ chạy module M13 (60,61)
 *   10        — Chỉ chạy step số 10
 *   backfill  — Chỉ chạy backfill (step 90)
 */

import { seedUnits } from './01_units'
import { seedPositionsAndFunctions } from './02_positions_functions'
import { seedMasterData } from './03_master_data'
import { seedUsers } from './04_users'
import { seedRbacGrants } from './05_rbac_grants'
import { seedCommanders } from './06_commanders'
import { seedPersonnel } from './10_personnel'
import { seedFacultyProfiles } from './11_faculty_profiles'
import { seedOfficerAndSoldier } from './12_officer_soldiers'
import { seedPartyOrganizations } from './20_party_organizations'
import { seedPartyMembers } from './21_party_members'
import { seedPartyActivities } from './22_party_activities'
import { seedInsurance } from './30_insurance'
import { seedPolicy } from './31_policy_welfare'
import { seedAwardsAndDiscipline } from './32_awards_discipline'
import { seedResearchScientists } from './40_research_scientists'
import { seedResearchProjects } from './41_research_projects'
import { seedPublications } from './42_publications'
import { seedEducationStructure } from './50_education_structure'
import { seedStudents } from './51_students'
import { seedTeaching } from './52_teaching'
import { seedExamsAndGrades } from './53_exams_grades'
import { seedWorkflowTemplates } from './60_workflow_templates'
import { seedWorkflowInstances } from './61_workflow_instances'
import { seedBackfill } from './90_backfill'

// ─── Danh sách step ──────────────────────────────────────────────────────────

type SeedStep = {
  step: string
  name: string
  module: string
  group: 'required' | 'demo' | 'backfill'
  fn: () => Promise<void>
}

const ALL_STEPS: SeedStep[] = [
  // ══ NHÓM A: BẮT BUỘC ══
  { step: '01', name: 'Units (Cơ cấu tổ chức)',       module: 'CORE',  group: 'required', fn: seedUnits },
  { step: '02', name: 'Positions & Functions (RBAC)',  module: 'M01',   group: 'required', fn: seedPositionsAndFunctions },
  { step: '03', name: 'Master Data (M19)',              module: 'M19',   group: 'required', fn: seedMasterData },
  { step: '04', name: 'Users',                          module: 'M01',   group: 'required', fn: seedUsers },
  { step: '05', name: 'RBAC Grants',                    module: 'M01',   group: 'required', fn: seedRbacGrants },
  { step: '06', name: 'Commanders',                     module: 'M01',   group: 'required', fn: seedCommanders },

  // ══ NHÓM B: M02 Nhân sự ══
  { step: '10', name: 'Personnel (Hồ sơ cán bộ)',      module: 'M02',   group: 'demo', fn: seedPersonnel },
  { step: '11', name: 'Faculty Profiles',               module: 'M04',   group: 'demo', fn: seedFacultyProfiles },
  { step: '12', name: 'Officer & Soldier',              module: 'M02',   group: 'demo', fn: seedOfficerAndSoldier },

  // ══ NHÓM C: M03 Đảng ══
  { step: '20', name: 'Party Organizations',            module: 'M03',   group: 'demo', fn: seedPartyOrganizations },
  { step: '21', name: 'Party Members',                  module: 'M03',   group: 'demo', fn: seedPartyMembers },
  { step: '22', name: 'Party Activities',               module: 'M03',   group: 'demo', fn: seedPartyActivities },

  // ══ NHÓM D: M05-08 Chính sách & BH ══
  { step: '30', name: 'Insurance / BHXH',               module: 'M05',   group: 'demo', fn: seedInsurance },
  { step: '31', name: 'Policy & Welfare',               module: 'M06',   group: 'demo', fn: seedPolicy },
  { step: '32', name: 'Awards & Discipline',            module: 'M08',   group: 'demo', fn: seedAwardsAndDiscipline },

  // ══ NHÓM E: M09 NCKH ══
  { step: '40', name: 'Research Scientists',            module: 'M09',   group: 'demo', fn: seedResearchScientists },
  { step: '41', name: 'Research Projects',              module: 'M09',   group: 'demo', fn: seedResearchProjects },
  { step: '42', name: 'Publications & Councils',        module: 'M09',   group: 'demo', fn: seedPublications },

  // ══ NHÓM F: M10 Đào tạo ══
  { step: '50', name: 'Education Structure',            module: 'M10',   group: 'demo', fn: seedEducationStructure },
  { step: '51', name: 'Students / HocVien',             module: 'M10',   group: 'demo', fn: seedStudents },
  { step: '52', name: 'Teaching',                       module: 'M10',   group: 'demo', fn: seedTeaching },
  { step: '53', name: 'Exams & Grades',                 module: 'M10',   group: 'demo', fn: seedExamsAndGrades },

  // ══ NHÓM G: M13 Workflow ══
  { step: '60', name: 'Workflow Templates',             module: 'M13',   group: 'demo', fn: seedWorkflowTemplates },
  { step: '61', name: 'Workflow Instances',             module: 'M13',   group: 'demo', fn: seedWorkflowInstances },

  // ══ NHÓM H: Backfill ══
  { step: '90', name: 'Backfill (cleanup & fix)',       module: 'CORE',  group: 'backfill', fn: seedBackfill },
]

// ─── Module grouping ─────────────────────────────────────────────────────────

const MODULE_MAP: Record<string, string[]> = {
  M02: ['10', '11', '12'],
  M03: ['20', '21', '22'],
  M05: ['30'],
  M06: ['31'],
  M08: ['32'],
  M09: ['40', '41', '42'],
  M10: ['50', '51', '52', '53'],
  M13: ['60', '61'],
}

// ─── Main runner ─────────────────────────────────────────────────────────────

async function main() {
  const mode = process.argv[2] || 'all'

  console.log('\n' + '═'.repeat(64))
  console.log('  HVHC BigData — Seed Orchestrator')
  console.log(`  Mode: ${mode}`)
  console.log('═'.repeat(64))

  let stepsToRun: SeedStep[]

  if (mode === 'all') {
    stepsToRun = ALL_STEPS
  } else if (mode === 'required') {
    stepsToRun = ALL_STEPS.filter(s => s.group === 'required')
  } else if (mode === 'demo') {
    stepsToRun = ALL_STEPS.filter(s => s.group === 'demo')
  } else if (mode === 'backfill') {
    stepsToRun = ALL_STEPS.filter(s => s.group === 'backfill')
  } else if (MODULE_MAP[mode]) {
    // Chạy theo module code (M02, M03, M09, M10, M13...)
    const stepNums = MODULE_MAP[mode]
    stepsToRun = ALL_STEPS.filter(s => stepNums.includes(s.step))
  } else if (/^\d+$/.test(mode)) {
    // Chạy một step cụ thể theo số
    stepsToRun = ALL_STEPS.filter(s => s.step === mode)
    if (stepsToRun.length === 0) {
      console.error(`\n❌ Không tìm thấy step '${mode}'. Steps hợp lệ: ${ALL_STEPS.map(s => s.step).join(', ')}`)
      process.exit(1)
    }
  } else {
    console.error(`\n❌ Mode không hợp lệ: '${mode}'`)
    console.error('   Hợp lệ: all | required | demo | backfill | M02 | M03 | M09 | M10 | M13 | <step_number>')
    process.exit(1)
  }

  console.log(`\n📋 Sẽ chạy ${stepsToRun.length} step(s):`)
  stepsToRun.forEach(s => console.log(`   [${s.step}] ${s.name} [${s.module}]`))
  console.log()

  const startTime = Date.now()
  let successCount = 0
  let failCount = 0

  for (const step of stepsToRun) {
    const stepStart = Date.now()
    try {
      await step.fn()
      const elapsed = ((Date.now() - stepStart) / 1000).toFixed(1)
      console.log(`   ✅ [${step.step}] ${step.name} (${elapsed}s)`)
      successCount++
    } catch (err) {
      const elapsed = ((Date.now() - stepStart) / 1000).toFixed(1)
      console.error(`\n❌ [${step.step}] ${step.name} FAILED (${elapsed}s):`)
      console.error('   ', (err as Error).message)
      failCount++
      // Fail-fast: dừng ngay khi có lỗi
      console.error('\n💥 Dừng seed do lỗi. Kiểm tra dữ liệu và thử lại.')
      console.error(`   Đã hoàn thành: ${successCount}/${stepsToRun.length}`)
      process.exit(1)
    }
  }

  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log('\n' + '═'.repeat(64))
  console.log(`  ✅ SEED HOÀN THÀNH — ${successCount} steps — ${totalElapsed}s`)
  console.log('═'.repeat(64) + '\n')
}

main().catch(e => {
  console.error('\n❌ FATAL:', e)
  process.exit(1)
})
