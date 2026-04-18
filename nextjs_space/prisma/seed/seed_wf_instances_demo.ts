/**
 * seed_wf_instances_demo.ts
 *
 * Tạo workflow instances demo để test M13 Workflow Engine.
 * Mỗi workflow sẽ có instances ở các trạng thái khác nhau:
 *   - DRAFT, IN_PROGRESS, APPROVED, REJECTED, COMPLETED
 *
 * Seeds:
 *  - 5 REWARD_PROPOSAL instances (khen thưởng)
 *  - 4 PARTY_RECRUIT instances (kết nạp đảng)
 *  - 3 INSURANCE_CLAIM instances (BHXH)
 *  - 3 APPOINTMENT_TRANSFER instances (bổ nhiệm)
 *
 * Prerequisites: seed_m13_workflow_templates.ts đã chạy
 * Run: npx tsx --require dotenv/config prisma/seed/seed_wf_instances_demo.ts
 */

import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const db = new PrismaClient()

function genId(): string {
  return Math.random().toString(36).slice(2, 15) + Math.random().toString(36).slice(2, 10)
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

async function main() {
  console.log('⚙️  seed_wf_instances_demo.ts — Tạo workflow instances demo')

  // Xóa dữ liệu cũ
  await db.workflowStepInstance.deleteMany({})
  await db.workflowAction.deleteMany({})
  await db.workflowAuditLog.deleteMany({})
  await db.workflowNotification.deleteMany({})
  await db.workflowInstance.deleteMany({})
  console.log('  → Đã xóa instances cũ')

  // Lấy users
  const adminUser = await db.user.findFirst({
    where: { role: 'QUAN_TRI_HE_THONG' },
    select: { id: true, name: true },
  })
  const chiHuyUsers = await db.user.findMany({
    where: { role: { in: ['CHI_HUY_HOC_VIEN', 'CHI_HUY_KHOA_PHONG'] } },
    select: { id: true, name: true },
    take: 5,
  })
  const giangVienUsers = await db.user.findMany({
    where: { role: { in: ['GIANG_VIEN', 'NGHIEN_CUU_VIEN'] } },
    select: { id: true, name: true },
    take: 8,
  })

  if (!adminUser || chiHuyUsers.length < 2 || giangVienUsers.length < 3) {
    throw new Error('Cần có users trong DB — chạy seed_users.ts trước')
  }

  const initiatorId = giangVienUsers[0].id
  const approver1Id = chiHuyUsers[0].id
  const approver2Id = chiHuyUsers[1].id || adminUser.id

  // Lấy workflow templates và published versions
  interface WfTemplateVersion {
    templateId: string
    versionId: string
    templateCode: string
    steps: Array<{ id: string; code: string; stepType: string; orderIndex: number }>
  }

  async function getPublishedTemplate(code: string): Promise<WfTemplateVersion | null> {
    const template = await db.workflowTemplate.findUnique({
      where: { code },
      include: {
        versions: {
          where: { status: 'PUBLISHED' },
          orderBy: { versionNo: 'desc' },
          take: 1,
          include: {
            steps: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    })
    if (!template || template.versions.length === 0) return null
    const version = template.versions[0]
    return {
      templateId: template.id,
      versionId: version.id,
      templateCode: template.code,
      steps: version.steps.map(s => ({
        id: s.id,
        code: s.code,
        stepType: s.stepType,
        orderIndex: s.orderIndex,
      })),
    }
  }

  const rewardTpl = await getPublishedTemplate('REWARD_PROPOSAL')
  const partyTpl = await getPublishedTemplate('PARTY_RECRUIT')
  const insuranceTpl = await getPublishedTemplate('INSURANCE_CLAIM')
  const appointmentTpl = await getPublishedTemplate('APPOINTMENT_TRANSFER')

  if (!rewardTpl || !partyTpl || !insuranceTpl || !appointmentTpl) {
    throw new Error('Thiếu workflow templates — chạy seed_m13_workflow_templates.ts trước')
  }

  // Helper: tạo instance + step instances
  type WfStatus = 'DRAFT' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'PENDING'

  async function createInstance(
    tpl: WfTemplateVersion,
    title: string,
    entityType: string,
    entityId: string,
    status: WfStatus,
    currentStepIndex: number,
    daysBack: number,
    initiator: string,
    currentAssignee?: string,
  ) {
    const instanceId = genId()
    const startedAt = daysAgo(daysBack)
    const completedAt = ['APPROVED', 'REJECTED'].includes(status)
      ? daysAgo(Math.max(0, daysBack - 3))
      : undefined

    const instance = await db.workflowInstance.create({
      data: {
        id: instanceId,
        templateId: tpl.templateId,
        templateVersionId: tpl.versionId,
        entityType,
        entityId,
        title,
        status,
        currentStepCode: tpl.steps[currentStepIndex]?.code ?? tpl.steps[tpl.steps.length - 1].code,
        initiatorId: initiator,
        currentAssigneeId: currentAssignee ?? null,
        priority: 0,
        startedAt,
        completedAt: completedAt ?? null,
      },
    })

    // Tạo step instances cho các bước đã qua
    for (let i = 0; i <= currentStepIndex && i < tpl.steps.length; i++) {
      const step = tpl.steps[i]
      const isCurrentStep = i === currentStepIndex
      const stepStatus = isCurrentStep
        ? (status === 'IN_PROGRESS' ? 'IN_PROGRESS' : status === 'APPROVED' ? 'APPROVED' : 'WAITING')
        : 'APPROVED'

      await db.workflowStepInstance.create({
        data: {
          id: genId(),
          workflowInstanceId: instance.id,
          stepCode: step.code,
          status: stepStatus,
          assigneeId: isCurrentStep ? (currentAssignee ?? null) : (i === 0 ? initiator : approver1Id),
          startedAt: new Date(startedAt.getTime() + i * 24 * 3600 * 1000),
          completedAt: isCurrentStep && status === 'IN_PROGRESS'
            ? null
            : new Date(startedAt.getTime() + (i + 1) * 24 * 3600 * 1000),
        },
      })
    }

    return instance
  }

  let totalInstances = 0

  // ── 1. REWARD_PROPOSAL instances ─────────────────────────────────────────────
  console.log('  → Tạo REWARD_PROPOSAL instances...')

  // Instance 1: COMPLETED - đã hoàn thành
  await createInstance(
    rewardTpl,
    'Đề xuất khen thưởng: Thiếu tá Nguyễn Văn A - Hoàn thành xuất sắc nhiệm vụ Q4/2024',
    'AWARD',
    genId(),
    'APPROVED',
    rewardTpl.steps.length - 1,
    30,
    giangVienUsers[0].id,
    adminUser.id,
  )
  totalInstances++

  // Instance 2: IN_PROGRESS - đang ở bước phê duyệt
  await createInstance(
    rewardTpl,
    'Đề xuất khen thưởng tập thể: Bộ môn Hậu cần - Thành tích xuất sắc 2024',
    'AWARD',
    genId(),
    'IN_PROGRESS',
    2, // Đang ở PHONG_CHUC_NANG_REVIEW
    7,
    giangVienUsers[1].id,
    approver1Id,
  )
  totalInstances++

  // Instance 3: IN_PROGRESS - bước đầu
  await createInstance(
    rewardTpl,
    'Đề xuất khen thưởng cá nhân: Trung tá Lê Văn B - Sáng kiến kỹ thuật',
    'AWARD',
    genId(),
    'IN_PROGRESS',
    1, // DRAFT_PROPOSAL
    3,
    giangVienUsers[2].id,
    giangVienUsers[2].id,
  )
  totalInstances++

  // Instance 4: REJECTED
  await createInstance(
    rewardTpl,
    'Đề xuất khen thưởng: Thượng úy Trần Văn C - Thiếu hồ sơ minh chứng',
    'AWARD',
    genId(),
    'REJECTED',
    3,
    14,
    giangVienUsers[3].id,
    approver2Id,
  )
  totalInstances++

  // Instance 5: DRAFT
  await db.workflowInstance.create({
    data: {
      id: genId(),
      templateId: rewardTpl.templateId,
      templateVersionId: rewardTpl.versionId,
      entityType: 'AWARD',
      entityId: genId(),
      title: 'Đề xuất khen thưởng: Nhóm nghiên cứu M26 - Kết quả NCKH nổi bật',
      status: 'DRAFT',
      currentStepCode: 'DRAFT_PROPOSAL',
      initiatorId: giangVienUsers[4].id,
      currentAssigneeId: giangVienUsers[4].id,
      priority: 1,
      startedAt: daysAgo(1),
      completedAt: null,
    },
  })
  totalInstances++

  console.log(`     ✅ REWARD_PROPOSAL: 5 instances`)

  // ── 2. PARTY_RECRUIT instances ────────────────────────────────────────────────
  console.log('  → Tạo PARTY_RECRUIT instances...')

  for (let i = 0; i < 4; i++) {
    const statuses: Array<{ status: WfStatus; stepIdx: number; days: number }> = [
      { status: 'APPROVED', stepIdx: partyTpl.steps.length - 1, days: 45 },
      { status: 'IN_PROGRESS', stepIdx: 3, days: 10 },
      { status: 'IN_PROGRESS', stepIdx: 2, days: 5 },
      { status: 'REJECTED', stepIdx: 2, days: 20 },
    ]
    const s = statuses[i]
    await createInstance(
      partyTpl,
      `Kết nạp Đảng viên mới: ${giangVienUsers[i].name ?? `Học viên ${i + 1}`}`,
      'PARTY_MEMBER',
      genId(),
      s.status,
      s.stepIdx,
      s.days,
      giangVienUsers[i].id,
      s.status === 'IN_PROGRESS' ? approver1Id : undefined,
    )
    totalInstances++
  }
  console.log(`     ✅ PARTY_RECRUIT: 4 instances`)

  // ── 3. INSURANCE_CLAIM instances ─────────────────────────────────────────────
  console.log('  → Tạo INSURANCE_CLAIM instances...')

  const insuranceStatuses: Array<{ status: WfStatus; stepIdx: number; days: number; title: string }> = [
    { status: 'APPROVED', stepIdx: insuranceTpl.steps.length - 1, days: 60, title: 'Giải quyết chế độ thai sản: Thiếu úy Nguyễn Thị D' },
    { status: 'IN_PROGRESS', stepIdx: 3, days: 8, title: 'Giải quyết chế độ ốm đau dài ngày: Trung sĩ Lê Văn E' },
    { status: 'IN_PROGRESS', stepIdx: 2, days: 4, title: 'Giải quyết trợ cấp tai nạn lao động: Thượng sĩ Phạm Văn F' },
  ]

  for (let i = 0; i < insuranceStatuses.length; i++) {
    const s = insuranceStatuses[i]
    await createInstance(
      insuranceTpl,
      s.title,
      'INSURANCE_CLAIM',
      genId(),
      s.status,
      s.stepIdx,
      s.days,
      giangVienUsers[i % giangVienUsers.length].id,
      s.status === 'IN_PROGRESS' ? approver2Id : undefined,
    )
    totalInstances++
  }
  console.log(`     ✅ INSURANCE_CLAIM: 3 instances`)

  // ── 4. APPOINTMENT_TRANSFER instances ────────────────────────────────────────
  console.log('  → Tạo APPOINTMENT_TRANSFER instances...')

  const appointmentStatuses: Array<{ status: WfStatus; stepIdx: number; days: number; title: string }> = [
    { status: 'APPROVED', stepIdx: appointmentTpl.steps.length - 1, days: 30, title: 'Bổ nhiệm Chủ nhiệm Bộ môn Tin học: Trung tá Nguyễn Hoàng G' },
    { status: 'IN_PROGRESS', stepIdx: 2, days: 6, title: 'Điều động giảng viên: Thiếu tá Trần Đức H sang Khoa KTQS' },
    { status: 'IN_PROGRESS', stepIdx: 1, days: 2, title: 'Bổ nhiệm Phó Chủ nhiệm Bộ môn: Đại úy Lê Thị I' },
  ]

  for (let i = 0; i < appointmentStatuses.length; i++) {
    const s = appointmentStatuses[i]
    await createInstance(
      appointmentTpl,
      s.title,
      'PERSONNEL',
      genId(),
      s.status,
      s.stepIdx,
      s.days,
      chiHuyUsers[0].id,
      s.status === 'IN_PROGRESS' ? approver2Id : undefined,
    )
    totalInstances++
  }
  console.log(`     ✅ APPOINTMENT_TRANSFER: 3 instances`)

  // Thống kê
  const counts = await db.workflowInstance.groupBy({
    by: ['status'],
    _count: { id: true },
  })

  console.log(`\n  ✅ Tổng cộng: ${totalInstances} workflow instances`)
  console.log('  Phân bố trạng thái:')
  for (const c of counts) {
    console.log(`     ${c.status}: ${c._count.id}`)
  }

  const stepCount = await db.workflowStepInstance.count()
  console.log(`  Step instances: ${stepCount}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
