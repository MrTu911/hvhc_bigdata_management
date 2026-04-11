/**
 * Seed: M20 Science Activities – Workflow Templates (Sprint 02)
 *
 * Tạo 2 WorkflowTemplate cho module M20:
 *   1. M20-APPROVAL  – Phê duyệt đề tài NCKH (SUBMITTED → UNDER_REVIEW → APPROVED)
 *   2. M20-ACCEPTANCE – Nghiệm thu đề tài NCKH (PENDING_REVIEW → COMPLETED)
 *
 * Lưu ý Sprint 02:
 *   - Templates được seed với status DRAFT, không PUBLISHED.
 *   - Chưa wire WorkflowInstance vào project service (Sprint 03).
 *   - Khi Sprint 03 bắt đầu: publish M20-APPROVAL trước khi wiring.
 *
 * Run:
 *   npx tsx --require dotenv/config prisma/seed/seed_m20_workflow_template.ts
 */

import { PrismaClient, Prisma, WorkflowVersionStatus } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

const SEED_SYSTEM_USER = 'system-seed'

// ─── Step/transition helpers (copied from seed_m13_workflow_templates pattern) ─

const approverPolicy = {
  initiator: () => ({ approverPolicy: { type: 'INITIATOR' } }),
  byUnitRole: (
    role: 'HEAD' | 'DEPUTY_HEAD',
    scope: 'INITIATOR_UNIT' | 'FIXED' = 'INITIATOR_UNIT',
    fixedUnitId?: string,
  ) => ({
    approverPolicy: {
      type: 'BY_UNIT_ROLE',
      unitRole: role,
      unitScope: scope,
      ...(fixedUnitId ? { fixedUnitId } : {}),
    },
  }),
  byPosition: (positionCode: string) => ({
    approverPolicy: { type: 'BY_POSITION', positionCode, fallbackToInitiator: true },
  }),
}

interface StepDef {
  code: string
  name: string
  stepType: 'START' | 'TASK' | 'APPROVAL' | 'SIGNATURE' | 'END'
  orderIndex: number
  slaHours?: number
  requiresSignature?: boolean
  configJson?: Record<string, unknown>
}

interface TransitionDef {
  fromStepCode: string
  actionCode: string
  toStepCode: string
  priority?: number
}

interface WorkflowDef {
  code: string
  name: string
  moduleKey: string
  description: string
  entityType: string
  /** Sprint 02: DRAFT – not yet wired to live instances */
  initialStatus: WorkflowVersionStatus
  steps: StepDef[]
  transitions: TransitionDef[]
}

// ─── Template definitions ─────────────────────────────────────────────────────

const M20_WORKFLOW_DEFINITIONS: WorkflowDef[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // 1. M20-APPROVAL – Phê duyệt đề tài NCKH
  //
  // Lifecycle mapping:
  //   PI nộp (SUBMITTED) → Phòng KHCN tiếp nhận (UNDER_REVIEW) → Hội đồng thẩm định
  //   → Lãnh đạo học viện phê duyệt (APPROVED) hoặc trả lại/từ chối (REJECTED)
  //
  // Actor mapping:
  //   DEPT_REVIEW   – Trưởng phòng Khoa học (SCIENCE.PROJECT_APPROVE_DEPT)
  //   ACADEMY_APPROVE – Lãnh đạo học viện   (SCIENCE.PROJECT_APPROVE_ACADEMY)
  // ══════════════════════════════════════════════════════════════════════════
  {
    code: 'M20-APPROVAL',
    name: 'Phê duyệt đề tài nghiên cứu khoa học',
    moduleKey: 'M20',
    description: 'Quy trình tiếp nhận, thẩm định và phê duyệt đề tài NCKH cấp học viện',
    entityType: 'NckhProject',
    initialStatus: WorkflowVersionStatus.DRAFT, // Sprint 03: publish khi wiring live
    steps: [
      {
        code: 'START',
        name: 'Bắt đầu',
        stepType: 'START',
        orderIndex: 0,
      },
      {
        code: 'PI_SUBMIT',
        name: 'Chủ nhiệm đề tài nộp hồ sơ',
        stepType: 'TASK',
        orderIndex: 1,
        slaHours: 24,
        configJson: approverPolicy.initiator(),
      },
      {
        code: 'PHONG_KHCN_TIEP_NHAN',
        name: 'Phòng Khoa học – Công nghệ tiếp nhận và thẩm tra',
        stepType: 'APPROVAL',
        orderIndex: 2,
        slaHours: 120, // 5 ngày làm việc
        configJson: approverPolicy.byPosition('TRUONG_PHONG_KHCN'),
      },
      {
        code: 'HOI_DONG_THAM_DINH',
        name: 'Hội đồng thẩm định sơ bộ',
        stepType: 'APPROVAL',
        orderIndex: 3,
        slaHours: 240, // 10 ngày
        // Council review is handled by M23; this step confirms council conclusion
        configJson: approverPolicy.byPosition('TRUONG_PHONG_KHCN'),
      },
      {
        code: 'LANH_DAO_PHE_DUYET',
        name: 'Lãnh đạo học viện phê duyệt',
        stepType: 'APPROVAL',
        orderIndex: 4,
        slaHours: 72,
        configJson: approverPolicy.byUnitRole('HEAD', 'FIXED'),
      },
      {
        code: 'KY_QUYET_DINH_GIAO_DE_TAI',
        name: 'Ký quyết định giao đề tài',
        stepType: 'SIGNATURE',
        orderIndex: 5,
        slaHours: 48,
        requiresSignature: true,
        configJson: approverPolicy.byUnitRole('HEAD', 'FIXED'),
      },
      {
        code: 'END',
        name: 'Đề tài được phê duyệt',
        stepType: 'END',
        orderIndex: 6,
      },
    ],
    transitions: [
      { fromStepCode: 'START',                        actionCode: 'SUBMIT',  toStepCode: 'PI_SUBMIT',                priority: 1 },
      { fromStepCode: 'PI_SUBMIT',                    actionCode: 'SUBMIT',  toStepCode: 'PHONG_KHCN_TIEP_NHAN',    priority: 1 },
      { fromStepCode: 'PHONG_KHCN_TIEP_NHAN',        actionCode: 'APPROVE', toStepCode: 'HOI_DONG_THAM_DINH',       priority: 1 },
      { fromStepCode: 'PHONG_KHCN_TIEP_NHAN',        actionCode: 'RETURN',  toStepCode: 'PI_SUBMIT',                priority: 2 },
      { fromStepCode: 'PHONG_KHCN_TIEP_NHAN',        actionCode: 'REJECT',  toStepCode: 'END',                      priority: 3 },
      { fromStepCode: 'HOI_DONG_THAM_DINH',          actionCode: 'APPROVE', toStepCode: 'LANH_DAO_PHE_DUYET',       priority: 1 },
      { fromStepCode: 'HOI_DONG_THAM_DINH',          actionCode: 'RETURN',  toStepCode: 'PI_SUBMIT',                priority: 2 },
      { fromStepCode: 'HOI_DONG_THAM_DINH',          actionCode: 'REJECT',  toStepCode: 'END',                      priority: 3 },
      { fromStepCode: 'LANH_DAO_PHE_DUYET',          actionCode: 'APPROVE', toStepCode: 'KY_QUYET_DINH_GIAO_DE_TAI', priority: 1 },
      { fromStepCode: 'LANH_DAO_PHE_DUYET',          actionCode: 'RETURN',  toStepCode: 'HOI_DONG_THAM_DINH',       priority: 2 },
      { fromStepCode: 'LANH_DAO_PHE_DUYET',          actionCode: 'REJECT',  toStepCode: 'END',                      priority: 3 },
      { fromStepCode: 'KY_QUYET_DINH_GIAO_DE_TAI',  actionCode: 'SIGN',    toStepCode: 'END',                      priority: 1 },
      { fromStepCode: 'KY_QUYET_DINH_GIAO_DE_TAI',  actionCode: 'RETURN',  toStepCode: 'LANH_DAO_PHE_DUYET',       priority: 2 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 2. M20-ACCEPTANCE – Nghiệm thu đề tài NCKH
  //
  // Lifecycle mapping:
  //   Đề tài báo cáo hoàn thành (PENDING_REVIEW) → Phòng KHCN kiểm tra hồ sơ
  //   → Hội đồng nghiệm thu (M23) → Lãnh đạo công nhận (COMPLETED)
  //
  // Ghi chú: Hội đồng nghiệm thu (ScientificCouncil type=ACCEPTANCE) được tạo
  // bởi M23 trong luồng riêng. Bước HOI_DONG_NGHIEM_THU ở đây đợi kết quả từ M23.
  // ══════════════════════════════════════════════════════════════════════════
  {
    code: 'M20-ACCEPTANCE',
    name: 'Nghiệm thu đề tài nghiên cứu khoa học',
    moduleKey: 'M20',
    description: 'Quy trình tổ chức nghiệm thu, đánh giá kết quả và công nhận hoàn thành đề tài NCKH',
    entityType: 'NckhProject',
    initialStatus: WorkflowVersionStatus.DRAFT, // Sprint 05: publish khi M23 wiring hoàn chỉnh
    steps: [
      {
        code: 'START',
        name: 'Bắt đầu',
        stepType: 'START',
        orderIndex: 0,
      },
      {
        code: 'PI_BAO_CAO_HOAN_THANH',
        name: 'Chủ nhiệm đề tài nộp báo cáo hoàn thành',
        stepType: 'TASK',
        orderIndex: 1,
        slaHours: 24,
        configJson: approverPolicy.initiator(),
      },
      {
        code: 'PHONG_KHCN_KIEM_TRA_HO_SO',
        name: 'Phòng Khoa học kiểm tra hồ sơ nghiệm thu',
        stepType: 'TASK',
        orderIndex: 2,
        slaHours: 72,
        configJson: approverPolicy.byPosition('TRUONG_PHONG_KHCN'),
      },
      {
        code: 'HOI_DONG_NGHIEM_THU',
        name: 'Hội đồng nghiệm thu đánh giá (M23)',
        stepType: 'APPROVAL',
        orderIndex: 3,
        slaHours: 480, // 20 ngày
        // Kết quả hội đồng nghiệm thu đến từ ScientificCouncil.finalizeAcceptance (M23)
        configJson: approverPolicy.byPosition('TRUONG_PHONG_KHCN'),
      },
      {
        code: 'LANH_DAO_CONG_NHAN',
        name: 'Lãnh đạo học viện công nhận kết quả',
        stepType: 'APPROVAL',
        orderIndex: 4,
        slaHours: 48,
        configJson: approverPolicy.byUnitRole('HEAD', 'FIXED'),
      },
      {
        code: 'KY_BIEN_BAN_NGHIEM_THU',
        name: 'Ký biên bản nghiệm thu',
        stepType: 'SIGNATURE',
        orderIndex: 5,
        slaHours: 24,
        requiresSignature: true,
        configJson: approverPolicy.byUnitRole('HEAD', 'FIXED'),
      },
      {
        code: 'END',
        name: 'Nghiệm thu hoàn tất',
        stepType: 'END',
        orderIndex: 6,
      },
    ],
    transitions: [
      { fromStepCode: 'START',                     actionCode: 'SUBMIT',  toStepCode: 'PI_BAO_CAO_HOAN_THANH',      priority: 1 },
      { fromStepCode: 'PI_BAO_CAO_HOAN_THANH',    actionCode: 'SUBMIT',  toStepCode: 'PHONG_KHCN_KIEM_TRA_HO_SO',  priority: 1 },
      { fromStepCode: 'PHONG_KHCN_KIEM_TRA_HO_SO', actionCode: 'APPROVE', toStepCode: 'HOI_DONG_NGHIEM_THU',        priority: 1 },
      { fromStepCode: 'PHONG_KHCN_KIEM_TRA_HO_SO', actionCode: 'RETURN',  toStepCode: 'PI_BAO_CAO_HOAN_THANH',     priority: 2 },
      { fromStepCode: 'HOI_DONG_NGHIEM_THU',       actionCode: 'APPROVE', toStepCode: 'LANH_DAO_CONG_NHAN',         priority: 1 },
      { fromStepCode: 'HOI_DONG_NGHIEM_THU',       actionCode: 'RETURN',  toStepCode: 'PI_BAO_CAO_HOAN_THANH',     priority: 2 },
      { fromStepCode: 'HOI_DONG_NGHIEM_THU',       actionCode: 'REJECT',  toStepCode: 'END',                        priority: 3 },
      { fromStepCode: 'LANH_DAO_CONG_NHAN',        actionCode: 'APPROVE', toStepCode: 'KY_BIEN_BAN_NGHIEM_THU',    priority: 1 },
      { fromStepCode: 'LANH_DAO_CONG_NHAN',        actionCode: 'RETURN',  toStepCode: 'HOI_DONG_NGHIEM_THU',        priority: 2 },
      { fromStepCode: 'KY_BIEN_BAN_NGHIEM_THU',    actionCode: 'SIGN',    toStepCode: 'END',                        priority: 1 },
      { fromStepCode: 'KY_BIEN_BAN_NGHIEM_THU',    actionCode: 'RETURN',  toStepCode: 'LANH_DAO_CONG_NHAN',        priority: 2 },
    ],
  },
]

// ─── Seed function (same pattern as seed_m13_workflow_templates.ts) ───────────

async function seedWorkflow(def: WorkflowDef) {
  console.log(`\n  📋 Seeding: ${def.code} — ${def.name}`)

  const template = await prisma.workflowTemplate.upsert({
    where: { code: def.code },
    update: {
      name: def.name,
      moduleKey: def.moduleKey,
      description: def.description,
      isActive: true,
    },
    create: {
      code: def.code,
      name: def.name,
      moduleKey: def.moduleKey,
      description: def.description,
      isActive: true,
      createdBy: SEED_SYSTEM_USER,
    },
  })

  // Idempotent: skip if a version already exists (any status)
  const existingVersion = await prisma.workflowTemplateVersion.findFirst({
    where: { templateId: template.id },
  })

  if (existingVersion) {
    console.log(`    ⏩ Version đã tồn tại (v${existingVersion.versionNo}, ${existingVersion.status}) — bỏ qua`)
    return
  }

  const version = await prisma.workflowTemplateVersion.create({
    data: {
      templateId: template.id,
      versionNo: 1,
      status: def.initialStatus,
      ...(def.initialStatus === WorkflowVersionStatus.PUBLISHED
        ? { publishedAt: new Date(), publishedBy: SEED_SYSTEM_USER }
        : {}),
    },
  })

  await prisma.workflowStepTemplate.createMany({
    data: def.steps.map((s) => ({
      templateVersionId: version.id,
      code: s.code,
      name: s.name,
      stepType: s.stepType,
      orderIndex: s.orderIndex,
      slaHours: s.slaHours ?? null,
      requiresSignature: s.requiresSignature ?? false,
      isParallel: false,
      ...(s.configJson !== undefined ? { configJson: s.configJson as Prisma.InputJsonValue } : {}),
    })),
  })

  await prisma.workflowTransitionTemplate.createMany({
    data: def.transitions.map((t) => ({
      templateVersionId: version.id,
      fromStepCode: t.fromStepCode,
      actionCode: t.actionCode,
      toStepCode: t.toStepCode,
      priority: t.priority ?? 1,
      conditionExpression: null,
    })),
  })

  console.log(
    `    ✅ ${def.steps.length} bước, ${def.transitions.length} transitions → ${def.initialStatus}`,
  )
}

async function main() {
  console.log('\n🚀 M20 Science Activities – Workflow Template Seed (Sprint 02)')
  console.log('━'.repeat(60))
  console.log('Templates sẽ được tạo với status DRAFT.')
  console.log('Sprint 03: publish M20-APPROVAL trước khi wire WorkflowInstance.')
  console.log('Sprint 05: publish M20-ACCEPTANCE sau khi M23 wiring hoàn chỉnh.\n')

  for (const def of M20_WORKFLOW_DEFINITIONS) {
    await seedWorkflow(def)
  }

  console.log('\n✅ Seed M20 workflow templates hoàn tất.\n')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
