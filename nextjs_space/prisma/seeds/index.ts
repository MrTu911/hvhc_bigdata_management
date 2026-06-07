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
 *   all       — Chạy tất cả (required + demo + bigdata + realdata + backfill) [mặc định]
 *   required  — Chỉ chạy nhóm bắt buộc (01-08)
 *   demo      — Chỉ chạy nhóm demo (10-71)
 *   bigdata   — Chỉ chạy nhóm Big Data & Hạ tầng (80-86)
 *   realdata  — Chỉ chạy dữ liệu thật Viện B212 (87-89)
 *   backfill  — Chỉ chạy backfill (step 90)
 *   M02       — Module M02 (10,11,12,13,14)        M11 — (85,86)
 *   M03       — Module M03 (20,21,22)              M12 — (80,81,82,83,84)
 *   M09       — Module M09 (40,41,42)              M13 — (60,61,62)
 *   M10       — Module M10 (50,51,52,53,54,55,56)  M18 — (70)
 *   M20       — Science RBAC (71)
 *   10        — Chỉ chạy step số 10
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
import { seedMonHoc } from './54_mon_hoc'
import { seedWorkflowTemplates } from './60_workflow_templates'
import { seedWorkflowInstances } from './61_workflow_instances'
import { seedAdminDocTemplates } from './70_admin_doc_templates'
import { seedBackfill } from './90_backfill'
// ── CSDL bổ sung (mở rộng độ phủ) ──
import { seedAdminUnits } from './07_admin_units'
import { seedSalaryGrades } from './08_salary_grades'
import { seedOfficerHealth } from './13_officer_health'
import { seedPromotionRank } from './14_promotion_rank'
import { seedCivilStudents } from './55_civil_students'
import { seedThesis } from './56_thesis'
import { seedPromotionInstances } from './62_promotion_instances'
import { seedScienceRbac } from './71_science_rbac'
// ── Nhóm Big Data & Hạ tầng (CSDL lõi của dự án) ──
import { seedBigdataSources } from './80_bigdata_sources'
import { seedInfraRbac } from './81_infra_rbac'
import { seedInfraFull } from './82_infra_full'
import { seedEtlPipelines } from './83_etl_pipelines'
import { seedInfrastructureDemo } from './84_infrastructure_demo'
import { seedDashboardTemplates } from './85_dashboard_templates'
import { seedCommandDashboard } from './86_command_dashboard'
// ── Nhóm dữ liệu THẬT (Viện B212) ──
import { seedRealdataB212Units } from './87_realdata_b212_units'
import { seedRealdataB212Personnel } from './88_realdata_b212_personnel'
import { seedRealdataB212Rbac } from './89_realdata_b212_rbac'
// Phase 2 — file hard-code cuid, cần rewrite trước khi wire:
// import { seedPartyRecruitment } from './23_party_recruitment'

// ─── Danh sách step ──────────────────────────────────────────────────────────

type SeedGroup = 'required' | 'demo' | 'bigdata' | 'realdata' | 'backfill'

type SeedStep = {
  step: string
  name: string
  module: string
  group: SeedGroup
  /** true => lỗi chỉ cảnh báo và tiếp tục; mặc định (false) => fail-fast */
  optional?: boolean
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
  { step: '07', name: 'Administrative Units (Tỉnh/Huyện/Xã)', module: 'M19', group: 'required', fn: seedAdminUnits },
  { step: '08', name: 'Military Salary Grades (Bảng lương)',  module: 'M19', group: 'required', fn: seedSalaryGrades },

  // ══ NHÓM B: M02 Nhân sự ══
  { step: '10', name: 'Personnel (Hồ sơ cán bộ)',      module: 'M02',   group: 'demo', fn: seedPersonnel },
  { step: '11', name: 'Faculty Profiles',               module: 'M04',   group: 'demo', fn: seedFacultyProfiles },
  { step: '12', name: 'Officer & Soldier',              module: 'M02',   group: 'demo', fn: seedOfficerAndSoldier },
  { step: '13', name: 'Officer Health',                 module: 'M02',   group: 'demo', optional: true, fn: seedOfficerHealth },
  { step: '14', name: 'Promotion & Rank templates',     module: 'M02',   group: 'demo', optional: true, fn: seedPromotionRank },

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
  { step: '54', name: 'Môn học thật (danh mục HVHC)',   module: 'M10',   group: 'demo', fn: seedMonHoc },
  { step: '55', name: 'Civil Students & Admissions',    module: 'M10',   group: 'demo', optional: true, fn: seedCivilStudents },
  { step: '56', name: 'Thesis Projects',                module: 'M10',   group: 'demo', optional: true, fn: seedThesis },

  // ══ NHÓM G: M13 Workflow ══
  { step: '60', name: 'Workflow Templates',             module: 'M13',   group: 'demo', fn: seedWorkflowTemplates },
  { step: '61', name: 'Workflow Instances',             module: 'M13',   group: 'demo', fn: seedWorkflowInstances },
  { step: '62', name: 'Promotion Alert Instances',      module: 'M13',   group: 'demo', optional: true, fn: seedPromotionInstances },

  // ══ NHÓM G2: M18 Mẫu văn bản hành chính ══
  { step: '70', name: 'Mẫu văn bản hành chính (NĐ30)',  module: 'M18',   group: 'demo', fn: seedAdminDocTemplates },

  // ══ NHÓM G3: M20–M26 Science RBAC ══
  { step: '71', name: 'Science RBAC (M20–M26)',         module: 'M20',   group: 'demo', optional: true, fn: seedScienceRbac },

  // ══ NHÓM I: M11/M12 Big Data & Hạ tầng (CSDL lõi) ══
  { step: '80', name: 'Big Data Sources (DataSource)',  module: 'M12',   group: 'bigdata', fn: seedBigdataSources },
  { step: '81', name: 'Infra RBAC functions',           module: 'M12',   group: 'bigdata', optional: true, fn: seedInfraRbac },
  { step: '82', name: 'Infra Full (services/DR/backup)', module: 'M12',  group: 'bigdata', fn: seedInfraFull },
  { step: '83', name: 'ETL Pipelines',                  module: 'M12',   group: 'bigdata', fn: seedEtlPipelines },
  { step: '84', name: 'Infrastructure Demo (NAS/GPU)',  module: 'M12',   group: 'bigdata', optional: true, fn: seedInfrastructureDemo },
  { step: '85', name: 'Dashboard Role Templates',       module: 'M11',   group: 'bigdata', fn: seedDashboardTemplates },
  { step: '86', name: 'Command Dashboard',              module: 'M11',   group: 'bigdata', optional: true, fn: seedCommandDashboard },

  // ══ NHÓM J: Dữ liệu THẬT — Viện B212 (chạy trước backfill, KHÔNG trong 'demo') ══
  { step: '87', name: 'Real Data — B212 Units (4 Ban)', module: 'M02',   group: 'realdata', fn: seedRealdataB212Units },
  { step: '88', name: 'Real Data — B212 Personnel (31)', module: 'M02',  group: 'realdata', fn: seedRealdataB212Personnel },
  { step: '89', name: 'Real Data — B212 RBAC',          module: 'M02',   group: 'realdata', optional: true, fn: seedRealdataB212Rbac },

  // ══ NHÓM H: Backfill (luôn chạy cuối cùng) ══
  { step: '90', name: 'Backfill (cleanup & fix)',       module: 'CORE',  group: 'backfill', fn: seedBackfill },
]

// ─── Module grouping ─────────────────────────────────────────────────────────

const MODULE_MAP: Record<string, string[]> = {
  M02: ['10', '11', '12', '13', '14'],
  M03: ['20', '21', '22'],
  M05: ['30'],
  M06: ['31'],
  M08: ['32'],
  M09: ['40', '41', '42'],
  M10: ['50', '51', '52', '53', '54', '55', '56'],
  M11: ['85', '86'],
  M12: ['80', '81', '82', '83', '84'],
  M13: ['60', '61', '62'],
  M18: ['70'],
  M20: ['71'],
  // Lưu ý: nhóm 'realdata' (87–89) chạy bằng mode 'realdata', không vào MODULE_MAP.
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
    // Gồm tất cả (required + demo + bigdata + realdata + backfill).
    // realdata (87–89) nằm trước backfill (90) trong ALL_STEPS nên thứ tự vẫn đúng.
    stepsToRun = ALL_STEPS
  } else if (mode === 'required') {
    stepsToRun = ALL_STEPS.filter(s => s.group === 'required')
  } else if (mode === 'demo') {
    stepsToRun = ALL_STEPS.filter(s => s.group === 'demo')
  } else if (mode === 'bigdata') {
    stepsToRun = ALL_STEPS.filter(s => s.group === 'bigdata')
  } else if (mode === 'realdata') {
    stepsToRun = ALL_STEPS.filter(s => s.group === 'realdata')
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
    console.error('   Hợp lệ: all | required | demo | bigdata | realdata | backfill | ' +
      'M02 | M03 | M09 | M10 | M11 | M12 | M13 | M18 | M20 | <step_number>')
    process.exit(1)
  }

  console.log(`\n📋 Sẽ chạy ${stepsToRun.length} step(s):`)
  stepsToRun.forEach(s => console.log(`   [${s.step}] ${s.name} [${s.module}]`))
  console.log()

  const startTime = Date.now()
  let successCount = 0
  let warnCount = 0

  for (const step of stepsToRun) {
    const stepStart = Date.now()
    try {
      await step.fn()
      const elapsed = ((Date.now() - stepStart) / 1000).toFixed(1)
      console.log(`   ✅ [${step.step}] ${step.name} (${elapsed}s)`)
      successCount++
    } catch (err) {
      const elapsed = ((Date.now() - stepStart) / 1000).toFixed(1)
      const message = (err as Error).message?.split('\n')[0] ?? String(err)
      if (step.optional) {
        // Step optional: log có ngữ cảnh rồi tiếp tục (không nuốt lỗi ngầm).
        console.warn(`   ⚠️  [${step.step}] ${step.name} OPTIONAL FAILED (${elapsed}s) — bỏ qua: ${message}`)
        warnCount++
        continue
      }
      // Step bắt buộc: fail-fast.
      console.error(`\n❌ [${step.step}] ${step.name} REQUIRED FAILED (${elapsed}s):`)
      console.error('   ', message)
      console.error('\n💥 Dừng seed do lỗi ở step bắt buộc. Kiểm tra dữ liệu và thử lại.')
      console.error(`   Đã hoàn thành: ${successCount}/${stepsToRun.length}`)
      process.exit(1)
    }
  }

  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log('\n' + '═'.repeat(64))
  console.log(`  ✅ SEED HOÀN THÀNH — ${successCount} steps thành công` +
    (warnCount > 0 ? `, ${warnCount} step optional bỏ qua` : '') +
    ` — ${totalElapsed}s`)
  console.log('═'.repeat(64) + '\n')
}

main().catch(e => {
  console.error('\n❌ FATAL:', e)
  process.exit(1)
})
