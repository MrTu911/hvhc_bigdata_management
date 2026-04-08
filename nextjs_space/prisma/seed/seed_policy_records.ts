import {
  PrismaClient,
  PolicyRecordType,
  PolicyForm,
  PolicyLevel,
  PolicyRecordStatus,
  AwardWorkflowStatus,
} from '@prisma/client'

const prisma = new PrismaClient()

type SimpleUser = {
  id: string
  name: string
  unitId: string | null
  unit: string | null
}

type SimpleUnit = {
  id: string
  name: string
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function maybe<T>(value: T, probability = 0.5): T | undefined {
  return Math.random() < probability ? value : undefined
}

function randomDate(year: number, monthStart = 1, monthEnd = 12): Date {
  const month = randomInt(monthStart, monthEnd)
  const day = randomInt(1, 28)
  return new Date(year, month - 1, day)
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function slugifyDecisionPart(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toUpperCase()
}

function makeDecisionNumber(prefix: string, year: number, seq: number) {
  return `${prefix}-${year}-${String(seq).padStart(4, '0')}`
}

async function clearOldPolicySeedData() {
  const oldDecisionPrefixes = ['TD-', 'KT-', 'KL-', 'TT-']

  await prisma.policyRecord.deleteMany({
    where: {
      OR: oldDecisionPrefixes.map((prefix) => ({
        decisionNumber: {
          startsWith: prefix,
        },
      })),
    },
  })
}

async function main() {
  console.log('🚀 Bắt đầu seed PolicyRecord...')

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      unitId: true,
      unit: true,
    },
    take: 200,
  }) as SimpleUser[]

  const units = await prisma.unit.findMany({
    select: {
      id: true,
      name: true,
    },
    take: 50,
  }) as SimpleUnit[]

  if (users.length === 0) {
    throw new Error('Không có user để seed PolicyRecord')
  }

  const unitMap = new Map(units.map((u) => [u.id, u.name]))

  const emulationForms = [
    PolicyForm.LAO_DONG_TIEN_TIEN,
    PolicyForm.CHIEN_SI_THI_DUA_CO_SO,
    PolicyForm.CHIEN_SI_THI_DUA_CAP_BO,
    PolicyForm.DON_VI_TIEN_TIEN,
    PolicyForm.DON_VI_QUYET_THANG,
  ]

  const rewardForms = [
    PolicyForm.GIAY_KHEN,
    PolicyForm.BANG_KHEN,
    PolicyForm.HUY_CHUONG,
    PolicyForm.HUAN_CHUONG,
    PolicyForm.KHEN_THUONG_DOT_XUAT,
  ]

  const disciplineForms = [
    PolicyForm.KHIEN_TRACH,
    PolicyForm.CANH_CAO,
    PolicyForm.HA_BAC_LUONG,
    PolicyForm.GIANG_CHUC,
    PolicyForm.CACH_CHUC,
    PolicyForm.TUOC_DANH_HIEU,
    PolicyForm.BUOC_THOI_VIEC,
  ]

  const emulationLevels = [
    PolicyLevel.UNIT,
    PolicyLevel.DEPARTMENT,
    PolicyLevel.ACADEMY,
    PolicyLevel.MINISTRY,
  ]

  const rewardLevels = [
    PolicyLevel.UNIT,
    PolicyLevel.DEPARTMENT,
    PolicyLevel.ACADEMY,
    PolicyLevel.MINISTRY,
    PolicyLevel.GOVERNMENT,
    PolicyLevel.STATE,
  ]

  const disciplineLevels = [
    PolicyLevel.UNIT,
    PolicyLevel.DEPARTMENT,
    PolicyLevel.ACADEMY,
    PolicyLevel.MINISTRY,
  ]

  const emulationTitles: Partial<Record<PolicyForm, string[]>> = {
    [PolicyForm.LAO_DONG_TIEN_TIEN]: [
      'Danh hiệu Lao động tiên tiến',
      'Danh hiệu tiên tiến năm công tác',
    ],
    [PolicyForm.CHIEN_SI_THI_DUA_CO_SO]: [
      'Danh hiệu Chiến sĩ thi đua cơ sở',
    ],
    [PolicyForm.CHIEN_SI_THI_DUA_CAP_BO]: [
      'Danh hiệu Chiến sĩ thi đua cấp Bộ',
    ],
    [PolicyForm.DON_VI_TIEN_TIEN]: [
      'Danh hiệu Đơn vị tiên tiến',
    ],
    [PolicyForm.DON_VI_QUYET_THANG]: [
      'Danh hiệu Đơn vị quyết thắng',
    ],
  }

  const rewardTitles: Partial<Record<PolicyForm, string[]>> = {
    [PolicyForm.GIAY_KHEN]: [
      'Giấy khen hoàn thành xuất sắc nhiệm vụ',
      'Giấy khen thành tích đột xuất',
      'Giấy khen trong phong trào thi đua',
    ],
    [PolicyForm.BANG_KHEN]: [
      'Bằng khen có thành tích xuất sắc',
      'Bằng khen phong trào thi đua quyết thắng',
      'Bằng khen hoàn thành xuất sắc nhiệm vụ',
    ],
    [PolicyForm.HUY_CHUONG]: [
      'Huy chương vì sự nghiệp xây dựng đơn vị',
      'Huy chương thành tích phục vụ lâu dài',
    ],
    [PolicyForm.HUAN_CHUONG]: [
      'Huân chương chiến công',
      'Huân chương bảo vệ Tổ quốc',
    ],
    [PolicyForm.KHEN_THUONG_DOT_XUAT]: [
      'Khen thưởng đột xuất trong thực hiện nhiệm vụ',
      'Khen thưởng đột xuất do thành tích nổi bật',
    ],
  }

  const disciplineTitles: Partial<Record<PolicyForm, string[]>> = {
    [PolicyForm.KHIEN_TRACH]: ['Kỷ luật khiển trách'],
    [PolicyForm.CANH_CAO]: ['Kỷ luật cảnh cáo'],
    [PolicyForm.HA_BAC_LUONG]: ['Kỷ luật hạ bậc lương'],
    [PolicyForm.GIANG_CHUC]: ['Kỷ luật giáng chức'],
    [PolicyForm.CACH_CHUC]: ['Kỷ luật cách chức'],
    [PolicyForm.TUOC_DANH_HIEU]: ['Kỷ luật tước danh hiệu'],
    [PolicyForm.BUOC_THOI_VIEC]: ['Kỷ luật buộc thôi việc'],
  }

  const emulationReasons = [
    'Đạt thành tích nổi bật trong phong trào thi đua quyết thắng',
    'Hoàn thành toàn diện các chỉ tiêu công tác năm',
    'Có nhiều đóng góp trong xây dựng đơn vị vững mạnh toàn diện',
    'Gương mẫu, tiêu biểu trong thực hiện nhiệm vụ được giao',
    'Có sáng kiến, giải pháp nâng cao hiệu quả công tác',
  ]

  const rewardReasons = [
    'Hoàn thành xuất sắc nhiệm vụ năm công tác',
    'Có thành tích tiêu biểu trong giảng dạy và nghiên cứu',
    'Lập thành tích xuất sắc trong phong trào thi đua',
    'Có sáng kiến, cải tiến mang lại hiệu quả cao',
    'Có thành tích đột xuất trong thực hiện nhiệm vụ',
  ]

  const disciplineReasons = [
    'Vi phạm quy chế công tác',
    'Chưa chấp hành nghiêm điều lệnh, điều lệ',
    'Thiếu trách nhiệm trong thực hiện nhiệm vụ',
    'Vi phạm quy định nội bộ của đơn vị',
    'Chậm trễ, thiếu gương mẫu trong thực hiện công vụ',
  ]

  const issuingUnits = [
    'Bộ Quốc phòng',
    'Học viện',
    'Phòng Chính trị',
    'Phòng Tổ chức',
    'Khoa chuyên môn',
    'Đơn vị trực thuộc',
  ]

  const signerNames = [
    'Nguyễn Văn A',
    'Trần Văn B',
    'Lê Văn C',
    'Phạm Văn D',
    'Hoàng Văn E',
  ]

  const signerPositions = [
    'Bộ trưởng',
    'Giám đốc Học viện',
    'Chính ủy',
    'Trưởng phòng',
    'Chỉ huy đơn vị',
  ]

  const records: any[] = []
  let seq = 1

  await clearOldPolicySeedData()

  for (const year of [2022, 2023, 2024, 2025, 2026]) {
    // 1) THI ĐUA CÁ NHÂN
    for (let i = 0; i < 24; i++) {
      const user = pick(users)
      const form = pick([
        PolicyForm.LAO_DONG_TIEN_TIEN,
        PolicyForm.CHIEN_SI_THI_DUA_CO_SO,
        PolicyForm.CHIEN_SI_THI_DUA_CAP_BO,
      ])
      const decisionDate = randomDate(year, 6, 12)
      const workflowStatus = pick([
        AwardWorkflowStatus.APPROVED,
        AwardWorkflowStatus.APPROVED,
        AwardWorkflowStatus.UNDER_REVIEW,
        AwardWorkflowStatus.PROPOSED,
      ]) as AwardWorkflowStatus

      records.push({
        userId: user.id,
        unitId: user.unitId ?? undefined,
        recordType: PolicyRecordType.EMULATION,
        form,
        level: pick(emulationLevels),
        title: pick(emulationTitles[form] ?? ['Danh hiệu thi đua']),
        reason: pick(emulationReasons),
        decisionNumber: makeDecisionNumber('TD', year, seq++),
        decisionDate,
        effectiveDate: decisionDate,
        expiryDate: undefined,
        signerName: pick(signerNames),
        signerPosition: pick(signerPositions),
        issuingUnit:
          user.unit ??
          (user.unitId ? unitMap.get(user.unitId) : undefined) ??
          pick(issuingUnits),
        departmentName: undefined,
        attachmentUrl: maybe(`/uploads/policy/emulation-${year}-${seq}.pdf`, 0.35),
        status: PolicyRecordStatus.ACTIVE,
        isCollective: false,
        year,
        durationMonths: undefined,
        achievementSummary: pick(emulationReasons),
        violationSummary: undefined,
        legalBasis: 'Căn cứ quy chế thi đua, khen thưởng hiện hành',
        approvedAt: workflowStatus === AwardWorkflowStatus.APPROVED ? decisionDate : undefined,
        approvedBy: workflowStatus === AwardWorkflowStatus.APPROVED ? 'system' : undefined,
        approverNote: workflowStatus === AwardWorkflowStatus.APPROVED ? 'Đủ điều kiện phê duyệt' : undefined,
        proposedAt: decisionDate,
        proposedBy: 'system',
        reviewedAt:
          workflowStatus === AwardWorkflowStatus.UNDER_REVIEW || workflowStatus === AwardWorkflowStatus.APPROVED
            ? decisionDate
            : undefined,
        reviewedBy:
          workflowStatus === AwardWorkflowStatus.UNDER_REVIEW || workflowStatus === AwardWorkflowStatus.APPROVED
            ? 'system'
            : undefined,
        reviewerNote:
          workflowStatus === AwardWorkflowStatus.UNDER_REVIEW || workflowStatus === AwardWorkflowStatus.APPROVED
            ? 'Đã rà soát hồ sơ'
            : undefined,
        rejectReason: workflowStatus === AwardWorkflowStatus.REJECTED ? 'Hồ sơ chưa đủ điều kiện' : undefined,
        workflowStatus,
      })
    }

    // 2) KHEN THƯỞNG CÁ NHÂN
    for (let i = 0; i < 30; i++) {
      const user = pick(users)
      const form = pick(rewardForms)
      const decisionDate = randomDate(year, 1, 12)
      const workflowStatus = pick([
        AwardWorkflowStatus.APPROVED,
        AwardWorkflowStatus.APPROVED,
        AwardWorkflowStatus.APPROVED,
        AwardWorkflowStatus.UNDER_REVIEW,
      ]) as AwardWorkflowStatus

      records.push({
        userId: user.id,
        unitId: user.unitId ?? undefined,
        recordType: PolicyRecordType.REWARD,
        form,
        level: pick(rewardLevels),
        title: pick(rewardTitles[form] ?? ['Khen thưởng']),
        reason: pick(rewardReasons),
        decisionNumber: makeDecisionNumber('KT', year, seq++),
        decisionDate,
        effectiveDate: decisionDate,
        expiryDate: undefined,
        signerName: pick(signerNames),
        signerPosition: pick(signerPositions),
        issuingUnit:
          user.unit ??
          (user.unitId ? unitMap.get(user.unitId) : undefined) ??
          pick(issuingUnits),
        departmentName: undefined,
        attachmentUrl: maybe(`/uploads/policy/reward-${year}-${seq}.pdf`, 0.4),
        status: PolicyRecordStatus.ACTIVE,
        isCollective: false,
        year,
        durationMonths: undefined,
        achievementSummary: pick(rewardReasons),
        violationSummary: undefined,
        legalBasis: 'Căn cứ Luật Thi đua, Khen thưởng và quy định nội bộ',
        approvedAt: workflowStatus === AwardWorkflowStatus.APPROVED ? decisionDate : undefined,
        approvedBy: workflowStatus === AwardWorkflowStatus.APPROVED ? 'system' : undefined,
        approverNote: workflowStatus === AwardWorkflowStatus.APPROVED ? 'Phê duyệt khen thưởng' : undefined,
        proposedAt: decisionDate,
        proposedBy: 'system',
        reviewedAt:
          workflowStatus === AwardWorkflowStatus.UNDER_REVIEW || workflowStatus === AwardWorkflowStatus.APPROVED
            ? decisionDate
            : undefined,
        reviewedBy:
          workflowStatus === AwardWorkflowStatus.UNDER_REVIEW || workflowStatus === AwardWorkflowStatus.APPROVED
            ? 'system'
            : undefined,
        reviewerNote:
          workflowStatus === AwardWorkflowStatus.UNDER_REVIEW || workflowStatus === AwardWorkflowStatus.APPROVED
            ? 'Hồ sơ hợp lệ'
            : undefined,
        rejectReason: workflowStatus === AwardWorkflowStatus.REJECTED ? 'Thiếu minh chứng thành tích' : undefined,
        workflowStatus,
      })
    }

    // 3) KỶ LUẬT CÁ NHÂN
    for (let i = 0; i < 8; i++) {
      const user = pick(users)
      const form = pick(disciplineForms)
      const decisionDate = randomDate(year, 1, 12)
      const durationMonths = pick([3, 6, 12, 24])
      const terminalForms: PolicyForm[] = [
        PolicyForm.CACH_CHUC,
        PolicyForm.TUOC_DANH_HIEU,
        PolicyForm.BUOC_THOI_VIEC,
      ]
      const isTimeBound = !terminalForms.includes(form)

      records.push({
        userId: user.id,
        unitId: user.unitId ?? undefined,
        recordType: PolicyRecordType.DISCIPLINE,
        form,
        level: pick(disciplineLevels),
        title: pick(disciplineTitles[form] ?? ['Kỷ luật']),
        reason: pick(disciplineReasons),
        decisionNumber: makeDecisionNumber('KL', year, seq++),
        decisionDate,
        effectiveDate: decisionDate,
        expiryDate: isTimeBound ? addMonths(decisionDate, durationMonths) : undefined,
        signerName: pick(signerNames),
        signerPosition: pick(signerPositions),
        issuingUnit:
          user.unit ??
          (user.unitId ? unitMap.get(user.unitId) : undefined) ??
          pick(issuingUnits),
        departmentName: undefined,
        attachmentUrl: maybe(`/uploads/policy/discipline-${year}-${seq}.pdf`, 0.25),
        status: PolicyRecordStatus.ACTIVE,
        isCollective: false,
        year,
        durationMonths: isTimeBound ? durationMonths : undefined,
        achievementSummary: undefined,
        violationSummary: pick(disciplineReasons),
        legalBasis: 'Căn cứ điều lệnh, điều lệ và quy định xử lý kỷ luật hiện hành',
        approvedAt: decisionDate,
        approvedBy: 'system',
        approverNote: 'Phê duyệt quyết định kỷ luật',
        proposedAt: decisionDate,
        proposedBy: 'system',
        reviewedAt: decisionDate,
        reviewedBy: 'system',
        reviewerNote: 'Đã thẩm định hồ sơ vi phạm',
        rejectReason: undefined,
        workflowStatus: AwardWorkflowStatus.APPROVED,
      })
    }

    // 4) THI ĐUA / KHEN THƯỞNG TẬP THỂ
    for (let i = 0; i < Math.min(units.length, 10); i++) {
      const unit = units[i]
      const owner = pick(users)
      const form = pick([
        PolicyForm.DON_VI_TIEN_TIEN,
        PolicyForm.DON_VI_QUYET_THANG,
        PolicyForm.GIAY_KHEN,
        PolicyForm.BANG_KHEN,
      ])

      const recordType =
        form === PolicyForm.DON_VI_TIEN_TIEN || form === PolicyForm.DON_VI_QUYET_THANG
          ? PolicyRecordType.EMULATION
          : PolicyRecordType.REWARD

      const decisionDate = randomDate(year, 6, 12)

      records.push({
        userId: owner.id,
        unitId: unit.id,
        recordType,
        form,
        level: pick([PolicyLevel.UNIT, PolicyLevel.DEPARTMENT, PolicyLevel.ACADEMY, PolicyLevel.MINISTRY]),
        title:
          form === PolicyForm.DON_VI_TIEN_TIEN
            ? 'Danh hiệu Đơn vị tiên tiến'
            : form === PolicyForm.DON_VI_QUYET_THANG
            ? 'Danh hiệu Đơn vị quyết thắng'
            : form === PolicyForm.GIAY_KHEN
            ? 'Giấy khen tập thể'
            : 'Bằng khen tập thể',
        reason: 'Tập thể hoàn thành xuất sắc nhiệm vụ năm công tác',
        decisionNumber: makeDecisionNumber('TT', year, seq++),
        decisionDate,
        effectiveDate: decisionDate,
        expiryDate: undefined,
        signerName: pick(signerNames),
        signerPosition: 'Giám đốc Học viện',
        issuingUnit: unit.name,
        departmentName: undefined,
        attachmentUrl: maybe(`/uploads/policy/collective-${year}-${seq}.pdf`, 0.4),
        status: PolicyRecordStatus.ACTIVE,
        isCollective: true,
        year,
        durationMonths: undefined,
        achievementSummary: 'Tập thể đạt thành tích nổi bật, dẫn đầu phong trào thi đua',
        violationSummary: undefined,
        legalBasis: 'Căn cứ quy chế bình xét thi đua, khen thưởng tập thể',
        approvedAt: decisionDate,
        approvedBy: 'system',
        approverNote: 'Phê duyệt tập thể',
        proposedAt: decisionDate,
        proposedBy: 'system',
        reviewedAt: decisionDate,
        reviewedBy: 'system',
        reviewerNote: 'Đủ điều kiện xét duyệt',
        rejectReason: undefined,
        workflowStatus: AwardWorkflowStatus.APPROVED,
      })
    }
  }

  const invalidRecords = records.filter(
    (r) => !r.userId || !r.recordType || !r.level || !r.title || !r.reason
  )

  if (invalidRecords.length > 0) {
    console.error('❌ Có record không hợp lệ:')
    console.error(JSON.stringify(invalidRecords.slice(0, 10), null, 2))
    throw new Error(`Có ${invalidRecords.length} record thiếu field bắt buộc`)
  }

  await prisma.policyRecord.createMany({
    data: records,
  })

  const total = await prisma.policyRecord.count()
  const grouped = await prisma.policyRecord.groupBy({
    by: ['recordType'],
    _count: {
      _all: true,
    },
  })

  console.log('✅ Seed policy_records hoàn tất')
  console.log(`   - Đã thêm mới: ${records.length}`)
  console.log(`   - Tổng hiện có: ${total}`)
  console.log('   - Theo loại:', grouped)
}

main()
  .catch((error) => {
    console.error('❌ Seed policy_records thất bại')
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
