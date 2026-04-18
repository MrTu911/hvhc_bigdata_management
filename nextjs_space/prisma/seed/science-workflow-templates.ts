/**
 * Seed: Publish M20 Science Workflow Templates (P6B-01)
 *
 * Mục đích: Nâng cấp các template M20-APPROVAL và M20-ACCEPTANCE từ DRAFT
 * sang PUBLISHED để WorkflowEngineService (M13) bắt đầu tạo live instances
 * khi đề tài NCKH được tạo / chuyển trạng thái.
 *
 * Idempotent: chạy nhiều lần an toàn.
 *   - Nếu đã có version PUBLISHED → bỏ qua.
 *   - Nếu chỉ có DRAFT → cập nhật sang PUBLISHED.
 *   - Nếu không có version nào → tạo mới v1 PUBLISHED (cùng structure với
 *     seed_m20_workflow_template.ts).
 *
 * Điều kiện tiên quyết:
 *   npx tsx --require dotenv/config prisma/seed/seed_m20_workflow_template.ts
 *
 * Run:
 *   npx tsx --require dotenv/config prisma/seed/science-workflow-templates.ts
 */

import { PrismaClient, WorkflowVersionStatus, Prisma } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

const SEED_SYSTEM_USER = 'system-seed'

// ─── Approver policy helpers ───────────────────────────────────────────────────

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

// ─── Full step + transition definitions ──────────────────────────────────────

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

const APPROVAL_STEPS: StepDef[] = [
  { code: 'START',                       name: 'Bắt đầu',                                         stepType: 'START',    orderIndex: 0 },
  { code: 'PI_SUBMIT',                   name: 'Chủ nhiệm đề tài nộp hồ sơ',                      stepType: 'TASK',     orderIndex: 1, slaHours: 24,  configJson: approverPolicy.initiator() },
  { code: 'PHONG_KHCN_TIEP_NHAN',       name: 'Phòng Khoa học – Công nghệ tiếp nhận, thẩm tra',  stepType: 'APPROVAL', orderIndex: 2, slaHours: 120, configJson: approverPolicy.byPosition('TRUONG_PHONG_KHCN') },
  { code: 'HOI_DONG_THAM_DINH',         name: 'Hội đồng thẩm định sơ bộ',                        stepType: 'APPROVAL', orderIndex: 3, slaHours: 240, configJson: approverPolicy.byPosition('TRUONG_PHONG_KHCN') },
  { code: 'LANH_DAO_PHE_DUYET',         name: 'Lãnh đạo học viện phê duyệt',                     stepType: 'APPROVAL', orderIndex: 4, slaHours: 72,  configJson: approverPolicy.byUnitRole('HEAD', 'FIXED') },
  { code: 'KY_QUYET_DINH_GIAO_DE_TAI', name: 'Ký quyết định giao đề tài',                       stepType: 'SIGNATURE',orderIndex: 5, slaHours: 48,  requiresSignature: true, configJson: approverPolicy.byUnitRole('HEAD', 'FIXED') },
  { code: 'END',                         name: 'Đề tài được phê duyệt',                           stepType: 'END',      orderIndex: 6 },
]

const APPROVAL_TRANSITIONS: TransitionDef[] = [
  { fromStepCode: 'START',                       actionCode: 'SUBMIT',  toStepCode: 'PI_SUBMIT',                priority: 1 },
  { fromStepCode: 'PI_SUBMIT',                   actionCode: 'SUBMIT',  toStepCode: 'PHONG_KHCN_TIEP_NHAN',    priority: 1 },
  { fromStepCode: 'PHONG_KHCN_TIEP_NHAN',       actionCode: 'APPROVE', toStepCode: 'HOI_DONG_THAM_DINH',       priority: 1 },
  { fromStepCode: 'PHONG_KHCN_TIEP_NHAN',       actionCode: 'RETURN',  toStepCode: 'PI_SUBMIT',                priority: 2 },
  { fromStepCode: 'PHONG_KHCN_TIEP_NHAN',       actionCode: 'REJECT',  toStepCode: 'END',                      priority: 3 },
  { fromStepCode: 'HOI_DONG_THAM_DINH',         actionCode: 'APPROVE', toStepCode: 'LANH_DAO_PHE_DUYET',       priority: 1 },
  { fromStepCode: 'HOI_DONG_THAM_DINH',         actionCode: 'RETURN',  toStepCode: 'PI_SUBMIT',                priority: 2 },
  { fromStepCode: 'HOI_DONG_THAM_DINH',         actionCode: 'REJECT',  toStepCode: 'END',                      priority: 3 },
  { fromStepCode: 'LANH_DAO_PHE_DUYET',         actionCode: 'APPROVE', toStepCode: 'KY_QUYET_DINH_GIAO_DE_TAI', priority: 1 },
  { fromStepCode: 'LANH_DAO_PHE_DUYET',         actionCode: 'RETURN',  toStepCode: 'HOI_DONG_THAM_DINH',       priority: 2 },
  { fromStepCode: 'LANH_DAO_PHE_DUYET',         actionCode: 'REJECT',  toStepCode: 'END',                      priority: 3 },
  { fromStepCode: 'KY_QUYET_DINH_GIAO_DE_TAI', actionCode: 'SIGN',    toStepCode: 'END',                      priority: 1 },
  { fromStepCode: 'KY_QUYET_DINH_GIAO_DE_TAI', actionCode: 'RETURN',  toStepCode: 'LANH_DAO_PHE_DUYET',       priority: 2 },
]

const ACCEPTANCE_STEPS: StepDef[] = [
  { code: 'START',                      name: 'Bắt đầu',                                            stepType: 'START',    orderIndex: 0 },
  { code: 'PI_BAO_CAO_HOAN_THANH',     name: 'Chủ nhiệm nộp báo cáo hoàn thành',                   stepType: 'TASK',     orderIndex: 1, slaHours: 24,  configJson: approverPolicy.initiator() },
  { code: 'PHONG_KHCN_KIEM_TRA_HO_SO', name: 'Phòng Khoa học kiểm tra hồ sơ nghiệm thu',          stepType: 'TASK',     orderIndex: 2, slaHours: 72,  configJson: approverPolicy.byPosition('TRUONG_PHONG_KHCN') },
  { code: 'HOI_DONG_NGHIEM_THU',       name: 'Hội đồng nghiệm thu đánh giá (M23)',                  stepType: 'APPROVAL', orderIndex: 3, slaHours: 480, configJson: approverPolicy.byPosition('TRUONG_PHONG_KHCN') },
  { code: 'LANH_DAO_CONG_NHAN',        name: 'Lãnh đạo học viện công nhận kết quả',                stepType: 'APPROVAL', orderIndex: 4, slaHours: 48,  configJson: approverPolicy.byUnitRole('HEAD', 'FIXED') },
  { code: 'KY_BIEN_BAN_NGHIEM_THU',   name: 'Ký biên bản nghiệm thu',                              stepType: 'SIGNATURE',orderIndex: 5, slaHours: 24,  requiresSignature: true, configJson: approverPolicy.byUnitRole('HEAD', 'FIXED') },
  { code: 'END',                        name: 'Nghiệm thu hoàn tất',                                 stepType: 'END',      orderIndex: 6 },
]

const ACCEPTANCE_TRANSITIONS: TransitionDef[] = [
  { fromStepCode: 'START',                      actionCode: 'SUBMIT',  toStepCode: 'PI_BAO_CAO_HOAN_THANH',      priority: 1 },
  { fromStepCode: 'PI_BAO_CAO_HOAN_THANH',     actionCode: 'SUBMIT',  toStepCode: 'PHONG_KHCN_KIEM_TRA_HO_SO', priority: 1 },
  { fromStepCode: 'PHONG_KHCN_KIEM_TRA_HO_SO', actionCode: 'APPROVE', toStepCode: 'HOI_DONG_NGHIEM_THU',        priority: 1 },
  { fromStepCode: 'PHONG_KHCN_KIEM_TRA_HO_SO', actionCode: 'RETURN',  toStepCode: 'PI_BAO_CAO_HOAN_THANH',     priority: 2 },
  { fromStepCode: 'HOI_DONG_NGHIEM_THU',        actionCode: 'APPROVE', toStepCode: 'LANH_DAO_CONG_NHAN',         priority: 1 },
  { fromStepCode: 'HOI_DONG_NGHIEM_THU',        actionCode: 'RETURN',  toStepCode: 'PI_BAO_CAO_HOAN_THANH',     priority: 2 },
  { fromStepCode: 'HOI_DONG_NGHIEM_THU',        actionCode: 'REJECT',  toStepCode: 'END',                        priority: 3 },
  { fromStepCode: 'LANH_DAO_CONG_NHAN',         actionCode: 'APPROVE', toStepCode: 'KY_BIEN_BAN_NGHIEM_THU',    priority: 1 },
  { fromStepCode: 'LANH_DAO_CONG_NHAN',         actionCode: 'RETURN',  toStepCode: 'HOI_DONG_NGHIEM_THU',        priority: 2 },
  { fromStepCode: 'KY_BIEN_BAN_NGHIEM_THU',    actionCode: 'SIGN',    toStepCode: 'END',                        priority: 1 },
  { fromStepCode: 'KY_BIEN_BAN_NGHIEM_THU',    actionCode: 'RETURN',  toStepCode: 'LANH_DAO_CONG_NHAN',        priority: 2 },
]

// ─── Publish helper ───────────────────────────────────────────────────────────

async function ensurePublished(
  templateCode: string,
  templateName: string,
  steps: StepDef[],
  transitions: TransitionDef[],
) {
  console.log(`\n  📋 ${templateCode} — ${templateName}`)

  const template = await prisma.workflowTemplate.findUnique({ where: { code: templateCode } })
  if (!template) {
    console.log('    ❌ Template không tồn tại. Chạy seed_m20_workflow_template.ts trước.')
    return
  }

  // Check for existing PUBLISHED version
  const publishedVersion = await prisma.workflowTemplateVersion.findFirst({
    where: { templateId: template.id, status: WorkflowVersionStatus.PUBLISHED },
  })
  if (publishedVersion) {
    console.log(`    ⏩ Version v${publishedVersion.versionNo} đã PUBLISHED — bỏ qua`)
    return
  }

  // Upgrade existing DRAFT to PUBLISHED
  const draftVersion = await prisma.workflowTemplateVersion.findFirst({
    where: { templateId: template.id, status: WorkflowVersionStatus.DRAFT },
    orderBy: { versionNo: 'desc' },
  })

  if (draftVersion) {
    await prisma.workflowTemplateVersion.update({
      where: { id: draftVersion.id },
      data: {
        status: WorkflowVersionStatus.PUBLISHED,
        publishedAt: new Date(),
        publishedBy: SEED_SYSTEM_USER,
      },
    })
    console.log(`    ✅ Nâng cấp DRAFT v${draftVersion.versionNo} → PUBLISHED`)
    return
  }

  // No version at all — create fresh v1 PUBLISHED
  const version = await prisma.workflowTemplateVersion.create({
    data: {
      templateId: template.id,
      versionNo: 1,
      status: WorkflowVersionStatus.PUBLISHED,
      publishedAt: new Date(),
      publishedBy: SEED_SYSTEM_USER,
    },
  })

  await prisma.workflowStepTemplate.createMany({
    data: steps.map((s) => ({
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
    data: transitions.map((t) => ({
      templateVersionId: version.id,
      fromStepCode: t.fromStepCode,
      actionCode: t.actionCode,
      toStepCode: t.toStepCode,
      priority: t.priority ?? 1,
      conditionExpression: null,
    })),
  })

  console.log(`    ✅ Tạo mới v1 PUBLISHED — ${steps.length} bước, ${transitions.length} transitions`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀 Science Workflow Templates – Publish (P6B-01)')
  console.log('━'.repeat(60))
  console.log('Nâng cấp M20-APPROVAL và M20-ACCEPTANCE sang PUBLISHED.\n')

  await ensurePublished('M20-APPROVAL',   'Phê duyệt đề tài nghiên cứu khoa học',   APPROVAL_STEPS,   APPROVAL_TRANSITIONS)
  await ensurePublished('M20-ACCEPTANCE', 'Nghiệm thu đề tài nghiên cứu khoa học',   ACCEPTANCE_STEPS, ACCEPTANCE_TRANSITIONS)

  // Summary
  const templates = await prisma.workflowTemplate.findMany({
    where: { code: { in: ['M20-APPROVAL', 'M20-ACCEPTANCE'] } },
    include: {
      versions: {
        orderBy: { versionNo: 'desc' },
        take: 1,
        include: { _count: { select: { steps: true, transitions: true } } },
      },
    },
  })

  console.log('\n📊 Trạng thái sau seed:')
  for (const t of templates) {
    const v = t.versions[0]
    if (v) {
      const statusIcon = v.status === 'PUBLISHED' ? '✅' : '⚠️ '
      console.log(`  ${statusIcon} ${t.code.padEnd(20)} v${v.versionNo} ${v.status.padEnd(12)} — ${v._count.steps} bước / ${v._count.transitions} transitions`)
    } else {
      console.log(`  ❌ ${t.code} — không có version`)
    }
  }

  console.log('\n✅ Xong. Adapter M20↔M13 sẽ kích hoạt khi tạo đề tài tiếp theo.\n')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
