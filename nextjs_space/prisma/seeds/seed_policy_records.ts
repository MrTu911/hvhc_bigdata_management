import {
  PrismaClient,
  PolicyRecordType,
  PolicyForm,
  PolicyLevel,
  PolicyRecordStatus,
  AwardWorkflowStatus,
} from '@prisma/client'

const prisma = new PrismaClient()

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function maybe<T>(value: T, probability = 0.5): T | undefined {
  return Math.random() < probability ? value : undefined
}

function randomDate(year: number, monthStart = 1, monthEnd = 12): Date {
  const month = Math.floor(Math.random() * (monthEnd - monthStart + 1)) + monthStart
  const day = Math.floor(Math.random() * 28) + 1
  return new Date(year, month - 1, day)
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      unitId: true,
      unit: true,
    },
    take: 120,
  })

  const units = await prisma.unit.findMany({
    select: {
      id: true,
      name: true,
    },
    take: 30,
  })

  if (users.length === 0) {
    throw new Error('Không có user để seed PolicyRecord')
  }

  const unitMap = new Map(units.map((u) => [u.id, u.name]))

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

  const emulationForms = [
    PolicyForm.LAO_DONG_TIEN_TIEN,
    PolicyForm.CHIEN_SI_THI_DUA_CO_SO,
    PolicyForm.CHIEN_SI_THI_DUA_CAP_BO,
    PolicyForm.DON_VI_TIEN_TIEN,
    PolicyForm.DON_VI_QUYET_THANG,
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

  const emulationLevels = [
    PolicyLevel.UNIT,
    PolicyLevel.DEPARTMENT,
    PolicyLevel.ACADEMY,
    PolicyLevel.MINISTRY,
  ]

  const rewardTitles: Partial<Record<PolicyForm, string[]>> = {
    [PolicyForm.GIAY_KHEN]: [
      'Giấy khen hoàn thành xuất sắc nhiệm vụ',
      'Giấy khen thành tích đột xuất',
    ],
    [PolicyForm.BANG_KHEN]: [
      'Bằng khen có thành tích xuất sắc',
      'Bằng khen trong phong trào thi đua quyết thắng',
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

  const rewardReasons = [
    'Hoàn thành xuất sắc nhiệm vụ năm công tác',
    'Có thành tích tiêu biểu trong giảng dạy và nghiên cứu',
    'Lập thành tích xuất sắc trong phong trào thi đua',
    'Có sáng kiến, cải tiến mang lại hiệu quả cao',
  ]

  const disciplineReasons = [
    'Vi phạm quy chế công tác',
    'Chưa chấp hành nghiêm điều lệnh, điều lệ',
    'Thiếu trách nhiệm trong thực hiện nhiệm vụ',
    'Vi phạm quy định nội bộ của đơn vị',
  ]

  const emulationReasons = [
    'Đạt thành tích nổi bật trong phong trào thi đua quyết thắng',
    'Hoàn thành toàn diện các chỉ tiêu công tác',
    'Có nhiều đóng góp trong xây dựng đơn vị vững mạnh',
    'Gương mẫu, tiêu biểu trong thực hiện nhiệm vụ',
  ]

  const issuingUnits = [
    'Bộ Quốc phòng',
    'Học viện',
    'Phòng Chính trị',
    'Khoa chuyên môn',
    'Đơn vị trực thuộc',
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

  for (const year of [2022, 2023, 2024, 2025, 2026]) {
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
      ]) as AwardWorkflowStatus

      records.push({
        userId: user.id,
        unitId: user.unitId ?? undefined,
        recordType: PolicyRecordType.EMULATION,
        form,
        level: pick(emulationLevels),
        title: pick(rewardTitles[form] ?? ['Danh hiệu thi đua']),
        reason: pick(emulationReasons),
        decisionNumber: `TD-${year}-${String(seq++).padStart(4, '0')}`,
        decisionDate,
        effectiveDate: decisionDate,
        expiryDate: undefined,
        signerName: 'Nguyễn Văn A',
        signerPosition: pick(signerPositions),
        issuingUnit: user.unit ?? (user.unitId ? unitMap.get(user.unitId) : undefined) ?? pick(issuingUnits),
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
        reviewedAt: workflowStatus !== AwardWorkflowStatus.PROPOSED ? decisionDate : undefined,
        reviewedBy: workflowStatus !== AwardWorkflowStatus.PROPOSED ? 'system' : undefined,
        reviewerNote: workflowStatus !== AwardWorkflowStatus.PROPOSED ? 'Đã rà soát hồ sơ' : undefined,
        workflowStatus,
      })
    }

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
        decisionNumber: `KT-${year}-${String(seq++).padStart(4, '0')}`,
        decisionDate,
        effectiveDate: decisionDate,
        expiryDate: undefined,
        signerName: 'Trần Văn B',
        signerPosition: pick(signerPositions),
        issuingUnit: user.unit ?? (user.unitId ? unitMap.get(user.unitId) : undefined) ?? pick(issuingUnits),
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
        reviewedAt: workflowStatus !== AwardWorkflowStatus.PROPOSED ? decisionDate : undefined,
        reviewedBy: workflowStatus !== AwardWorkflowStatus.PROPOSED ? 'system' : undefined,
        reviewerNote: workflowStatus !== AwardWorkflowStatus.PROPOSED ? 'Hồ sơ hợp lệ' : undefined,
        workflowStatus,
      })
    }

    for (let i = 0; i < 8; i++) {
      const user = pick(users)
      const form = pick(disciplineForms)
      const decisionDate = randomDate(year, 1, 12)
      const durationMonths = pick([3, 6, 12, 24])
      const isTimeBound =
        form !== PolicyForm.CACH_CHUC &&
        form !== PolicyForm.TUOC_DANH_HIEU &&
        form !== PolicyForm.BUOC_THOI_VIEC

      records.push({
        userId: user.id,
        unitId: user.unitId ?? undefined,
        recordType: PolicyRecordType.DISCIPLINE,
        form,
        level: pick(disciplineLevels),
        title: `Kỷ luật ${String(form).toLowerCase()}`,
        reason: pick(disciplineReasons),
        decisionNumber: `KL-${year}-${String(seq++).padStart(4, '0')}`,
        decisionDate,
        effectiveDate: decisionDate,
        expiryDate: isTimeBound ? addMonths(decisionDate, durationMonths) : undefined,
        signerName: 'Lê Văn C',
        signerPosition: pick(signerPositions),
        issuingUnit: user.unit ?? (user.unitId ? unitMap.get(user.unitId) : undefined) ?? pick(issuingUnits),
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
        workflowStatus: AwardWorkflowStatus.APPROVED,
      })
    }

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
        decisionNumber: `TT-${year}-${String(seq++).padStart(4, '0')}`,
        decisionDate,
        effectiveDate: decisionDate,
        expiryDate: undefined,
        signerName: 'Phạm Văn D',
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
    skipDuplicates: false,
  })

  const total = await prisma.policyRecord.count()
  console.log(`✅ Seed policy_records hoàn tất. Tổng hiện có: ${total}`)
  console.log(`   - Đã thêm mới: ${records.length}`)
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
