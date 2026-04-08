/**
 * Seed Script: Thi đua - Khen thưởng
 *
 * Mục tiêu:
 * - Tạo dữ liệu thi đua khen thưởng thực tế cho cán bộ
 * - Dùng đúng schema PolicyRecord hiện tại
 * - Chỉ seed recordType = REWARD
 * - Chạy lại nhiều lần không bị phình dữ liệu vô hạn
 */

import {
  PrismaClient,
  PolicyLevel,
  PolicyRecordStatus,
  PolicyRecordType,
  AwardWorkflowStatus,
  UserRole,
} from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

type RewardTemplate = {
  title: string;
  level: PolicyLevel;
  reason: string;
  signerPosition: string;
  issuingUnit: string;
  workflowStatus: AwardWorkflowStatus;
};

const REWARD_TEMPLATES: RewardTemplate[] = [
  {
    title: 'Chiến sĩ thi đua cấp cơ sở',
    level: 'UNIT',
    reason: 'Hoàn thành xuất sắc nhiệm vụ được giao trong năm học',
    signerPosition: 'Giám đốc Học viện',
    issuingUnit: 'Học viện Hậu cần',
    workflowStatus: 'APPROVED',
  },
  {
    title: 'Giấy khen hoàn thành tốt nhiệm vụ',
    level: 'DEPARTMENT',
    reason: 'Có thành tích tốt trong công tác chuyên môn và xây dựng đơn vị',
    signerPosition: 'Trưởng khoa / Trưởng phòng',
    issuingUnit: 'Khoa / Phòng',
    workflowStatus: 'APPROVED',
  },
  {
    title: 'Bằng khen Bộ Quốc phòng',
    level: 'MINISTRY',
    reason: 'Có thành tích tiêu biểu trong phong trào thi đua quyết thắng',
    signerPosition: 'Bộ trưởng Bộ Quốc phòng',
    issuingUnit: 'Bộ Quốc phòng',
    workflowStatus: 'APPROVED',
  },
  {
    title: 'Danh hiệu Lao động tiên tiến',
    level: 'UNIT',
    reason: 'Chấp hành tốt kỷ luật, hoàn thành tốt nhiệm vụ thường xuyên',
    signerPosition: 'Chỉ huy đơn vị',
    issuingUnit: 'Đơn vị',
    workflowStatus: 'APPROVED',
  },
  {
    title: 'Khen thưởng đột xuất',
    level: 'UNIT',
    reason: 'Lập thành tích đột xuất trong thực hiện nhiệm vụ',
    signerPosition: 'Chỉ huy đơn vị',
    issuingUnit: 'Học viện Hậu cần',
    workflowStatus: 'APPROVED',
  },
  {
    title: 'Đề nghị danh hiệu Chiến sĩ thi đua',
    level: 'DEPARTMENT',
    reason: 'Được đề xuất do thành tích nổi bật, chờ phê duyệt',
    signerPosition: 'Hội đồng thi đua khen thưởng',
    issuingUnit: 'Học viện Hậu cần',
    workflowStatus: 'UNDER_REVIEW',
  },
  {
    title: 'Đề nghị giấy khen cuối năm',
    level: 'UNIT',
    reason: 'Được đề nghị khen thưởng trong tổng kết năm',
    signerPosition: 'Hội đồng thi đua',
    issuingUnit: 'Đơn vị',
    workflowStatus: 'PROPOSED',
  },
];

const APPROVER_NAMES = [
  'Thiếu tướng Nguyễn Văn A',
  'Đại tá Trần Văn B',
  'Đại tá Lê Văn C',
  'Thượng tá Phạm Văn D',
];

function pick<T>(arr: readonly T[], seed: number): T {
  return arr[seed % arr.length];
}

function buildDecisionNumber(prefix: string, seed: number): string {
  return `${prefix}-${new Date().getFullYear()}-${String(1000 + seed)}`;
}

function buildDecisionDate(seed: number): Date {
  const year = 2025;
  const month = seed % 12;
  const day = 1 + (seed % 27);
  return new Date(year, month, day);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function userPriorityScore(user: {
  role: UserRole;
  rank: string | null;
  workStatus?: string | null;
}): number {
  let score = 0;

  if (
    user.role === 'CHI_HUY_HOC_VIEN' ||
    user.role === 'CHI_HUY_KHOA_PHONG' ||
    user.role === 'CHI_HUY_BO_MON' ||
    user.role === 'CHU_NHIEM_BO_MON'
  ) {
    score += 30;
  }

  if (user.role === 'GIANG_VIEN' || user.role === 'NGHIEN_CUU_VIEN') {
    score += 20;
  }

  if (user.rank) {
    if (user.rank.includes('Đại tá')) score += 20;
    else if (user.rank.includes('Thượng tá')) score += 15;
    else if (user.rank.includes('Trung tá')) score += 12;
    else if (user.rank.includes('Thiếu tá')) score += 10;
    else if (user.rank.includes('Đại úy')) score += 8;
    else if (user.rank.includes('Thượng úy')) score += 6;
    else score += 4;
  }

  return score;
}

function shouldReceiveReward(
  user: {
    role: UserRole;
    rank: string | null;
  },
  seed: number,
): boolean {
  if (
    user.role === 'CHI_HUY_HOC_VIEN' ||
    user.role === 'CHI_HUY_KHOA_PHONG' ||
    user.role === 'CHI_HUY_BO_MON' ||
    user.role === 'CHU_NHIEM_BO_MON'
  ) {
    return true;
  }

  if (user.role === 'GIANG_VIEN' || user.role === 'NGHIEN_CUU_VIEN') {
    return seed % 5 !== 0; // 80%
  }

  return seed % 3 === 0; // ~33%
}

async function ensureRewardRecord(params: {
  userId: string;
  level: PolicyLevel;
  title: string;
  reason: string;
  decisionNumber: string;
  decisionDate: Date;
  effectiveDate: Date;
  expiryDate?: Date | null;
  signerName: string;
  signerPosition: string;
  issuingUnit: string;
  status: PolicyRecordStatus;
  workflowStatus: AwardWorkflowStatus;
  proposedAt?: Date | null;
  proposedBy?: string | null;
  reviewedAt?: Date | null;
  reviewedBy?: string | null;
  reviewerNote?: string | null;
  approvedAt?: Date | null;
  approvedBy?: string | null;
  approverNote?: string | null;
  rejectReason?: string | null;
}) {
  const existing = await prisma.policyRecord.findFirst({
    where: {
      userId: params.userId,
      recordType: 'REWARD',
      title: params.title,
      decisionNumber: params.decisionNumber,
      deletedAt: null,
    },
  });

  const payload = {
    userId: params.userId,
    recordType: 'REWARD' as PolicyRecordType,
    level: params.level,
    title: params.title,
    reason: params.reason,
    decisionNumber: params.decisionNumber,
    decisionDate: params.decisionDate,
    effectiveDate: params.effectiveDate,
    expiryDate: params.expiryDate ?? null,
    signerName: params.signerName,
    signerPosition: params.signerPosition,
    issuingUnit: params.issuingUnit,
    attachmentUrl: null as string | null,
    status: params.status,
    voidedAt: null as Date | null,
    voidedBy: null as string | null,
    voidReason: null as string | null,
    deletedAt: null as Date | null,
    deletedBy: null as string | null,
    approvedAt: params.approvedAt ?? null,
    approvedBy: params.approvedBy ?? null,
    approverNote: params.approverNote ?? null,
    proposedAt: params.proposedAt ?? null,
    proposedBy: params.proposedBy ?? null,
    rejectReason: params.rejectReason ?? null,
    reviewedAt: params.reviewedAt ?? null,
    reviewedBy: params.reviewedBy ?? null,
    reviewerNote: params.reviewerNote ?? null,
    workflowStatus: params.workflowStatus,
  };

  if (!existing) {
    await prisma.policyRecord.create({ data: payload });
    return 'created';
  }

  await prisma.policyRecord.update({
    where: { id: existing.id },
    data: payload,
  });
  return 'updated';
}

async function main() {
  console.log('🏅 Seeding thi đua khen thưởng...');

  const users = await prisma.user.findMany({
    where: {
      status: 'ACTIVE',
      role: {
        in: [
          'ADMIN',
          'QUAN_TRI_HE_THONG',
          'CHI_HUY_HOC_VIEN',
          'CHI_HUY_KHOA_PHONG',
          'CHI_HUY_BO_MON',
          'CHU_NHIEM_BO_MON',
          'GIANG_VIEN',
          'NGHIEN_CUU_VIEN',
          'TRO_LY',
          'NHAN_VIEN',
          'KY_THUAT_VIEN',
        ],
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      rank: true,
      unit: true,
      department: true,
      workStatus: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  if (users.length === 0) {
    throw new Error('Không có user ACTIVE phù hợp để seed thi đua khen thưởng.');
  }

  const sortedUsers = [...users].sort((a, b) => {
    return userPriorityScore(b) - userPriorityScore(a);
  });

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < sortedUsers.length; i++) {
    const user = sortedUsers[i];
    const seed = i + 1;

    if (!shouldReceiveReward(user, seed)) {
      skipped++;
      continue;
    }

    const template = pick(REWARD_TEMPLATES, seed);
    const decisionDate = buildDecisionDate(seed);
    const effectiveDate = addDays(decisionDate, 3);
    const signerName = pick(APPROVER_NAMES, seed);
    const proposedAt = addDays(decisionDate, -15);
    const reviewedAt = template.workflowStatus !== 'PROPOSED' ? addDays(decisionDate, -7) : null;
    const approvedAt =
      template.workflowStatus === 'APPROVED' ? addDays(decisionDate, -1) : null;

    const decisionPrefix =
      template.level === 'MINISTRY'
        ? 'BK'
        : template.level === 'DEPARTMENT'
        ? 'GK'
        : 'KT';

    const result = await ensureRewardRecord({
      userId: user.id,
      level: template.level,
      title: template.title,
      reason: `${template.reason}${user.unit ? ` tại ${user.unit}` : ''}`,
      decisionNumber: buildDecisionNumber(decisionPrefix, seed),
      decisionDate,
      effectiveDate,
      expiryDate: null,
      signerName,
      signerPosition: template.signerPosition,
      issuingUnit: user.unit || user.department || template.issuingUnit,
      status: 'ACTIVE',
      workflowStatus: template.workflowStatus,
      proposedAt,
      proposedBy: 'system-seed',
      reviewedAt,
      reviewedBy: reviewedAt ? 'hoi-dong-thi-dua' : null,
      reviewerNote: reviewedAt ? 'Hồ sơ đầy đủ, đủ điều kiện xem xét' : null,
      approvedAt,
      approvedBy: approvedAt ? signerName : null,
      approverNote:
        template.workflowStatus === 'APPROVED'
          ? 'Đồng ý khen thưởng theo đề nghị'
          : null,
      rejectReason:
        template.workflowStatus === 'REJECTED'
          ? 'Chưa đủ điều kiện khen thưởng'
          : null,
    });

    result === 'created' ? created++ : updated++;

    console.log(
      `✅ ${user.email} | ${template.title} | level=${template.level} | workflow=${template.workflowStatus}`,
    );
  }

  const total = await prisma.policyRecord.count({
    where: {
      recordType: 'REWARD',
      deletedAt: null,
    },
  });

  const totalApproved = await prisma.policyRecord.count({
    where: {
      recordType: 'REWARD',
      workflowStatus: 'APPROVED',
      deletedAt: null,
    },
  });

  const totalProposed = await prisma.policyRecord.count({
    where: {
      recordType: 'REWARD',
      workflowStatus: 'PROPOSED',
      deletedAt: null,
    },
  });

  const totalUnderReview = await prisma.policyRecord.count({
    where: {
      recordType: 'REWARD',
      workflowStatus: 'UNDER_REVIEW',
      deletedAt: null,
    },
  });

  console.log('\n================ THI ĐUA KHEN THƯỞNG ================');
  console.log(`Created       : ${created}`);
  console.log(`Updated       : ${updated}`);
  console.log(`Skipped       : ${skipped}`);
  console.log(`Total reward  : ${total}`);
  console.log(`Approved      : ${totalApproved}`);
  console.log(`Proposed      : ${totalProposed}`);
  console.log(`Under review  : ${totalUnderReview}`);
  console.log('=====================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });