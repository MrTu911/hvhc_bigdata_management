/**
 * PersonalOverviewService — tổng hợp dữ liệu cho "Trung tâm cá nhân" (/dashboard/personal).
 *
 * Một round-trip duy nhất, scope SELF: chỉ đọc dữ liệu của chính người dùng phiên.
 * Mỗi phần (declaration / work / change-requests / KPI per-CSDL) chỉ được truy vấn khi
 * người dùng có function-code tương ứng → vừa permission-aware vừa tránh query thừa.
 *
 * Tái sử dụng module nền:
 *  - M01: getUserFunctionCodes (RBAC) để biết phần nào được phép trả về.
 *  - M02: profile-declaration (vòng đời khai báo HSCB), profile_evidence (minh chứng).
 *  - M13: WorkflowDashboardService (việc đang chờ / quá hạn).
 *  - M05/M06/M09: count nhẹ các bản ghi của chính người dùng cho KPI.
 */
import 'server-only';
import prisma from '@/lib/db';
import type { AuthUser } from '@/lib/rbac/types';
import { getUserFunctionCodes } from '@/lib/rbac/policy';
import { PERSONAL, PROFILE_CHANGE } from '@/lib/rbac/function-codes';
import { WorkflowDashboardService } from '@/lib/services/workflow/workflow-dashboard.service';
import { getDeclarationState } from '@/lib/services/personnel/profile-declaration.service';
import type {
  PersonalOverview,
  PersonalKpi,
  PersonalAttentionItem,
  PersonalActivityItem,
} from '@/lib/types/personal-overview';

/** Các trường tính độ hoàn thiện hồ sơ cơ bản (đồng bộ với trang /dashboard/profile). */
const COMPLETION_FIELDS = [
  'name', 'email', 'phone', 'rank', 'position', 'dateOfBirth',
  'militaryId', 'unitName', 'birthPlace', 'citizenId', 'bloodType', 'educationLevel',
] as const;

function calculateCompletionPct(values: Array<string | Date | null | undefined>): number {
  const filled = values.filter(Boolean).length;
  return Math.round((filled / COMPLETION_FIELDS.length) * 100);
}

export class PersonalOverviewService {
  /**
   * Lấy toàn bộ dữ liệu tổng quan cá nhân cho người dùng phiên.
   * Caller (route) chịu trách nhiệm requireAuth; service enforce gating theo function-code.
   */
  static async getOverview(user: AuthUser): Promise<PersonalOverview> {
    const codes = new Set(await getUserFunctionCodes(user.id));
    const has = (code: string) => codes.has(code);

    const account = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true, name: true, email: true, phone: true, avatar: true,
        rank: true, position: true, militaryId: true,
        managementCategory: true, partyJoinDate: true,
        dateOfBirth: true, birthPlace: true, citizenId: true,
        bloodType: true, educationLevel: true,
        unitRelation: { select: { name: true } },
      },
    });
    if (!account) throw new Error('Không tìm thấy tài khoản người dùng');

    const unitName = account.unitRelation?.name ?? null;
    const completionPct = calculateCompletionPct([
      account.name, account.email, account.phone, account.rank, account.position,
      account.dateOfBirth, account.militaryId, unitName, account.birthPlace,
      account.citizenId, account.bloodType, account.educationLevel,
    ]);

    // Tất cả truy vấn phụ chạy song song; phần nào không có quyền → trả giá trị rỗng.
    const [
      declarationState,
      workStats,
      changeReqGroups,
      changeReqRecent,
      topTasksRaw,
      evidenceCount,
      awardCount,
      awardRecent,
      researchPiCount,
      researchMemberCount,
      publicationCount,
      policyRecordCount,
      policyRequestCount,
      insurance,
    ] = await Promise.all([
      has(PERSONAL.VIEW_CADRE_PROFILE)
        ? getDeclarationState(user.id).catch(() => null)
        : Promise.resolve(null),
      has(PERSONAL.VIEW_TASKS)
        ? WorkflowDashboardService.getMyWorkStats(user.id).catch(() => null)
        : Promise.resolve(null),
      has(PROFILE_CHANGE.VIEW_OWN)
        ? prisma.profileChangeRequest.groupBy({ by: ['status'], where: { userId: user.id }, _count: true }).catch(() => [])
        : Promise.resolve([] as Array<{ status: string; _count: number }>),
      has(PROFILE_CHANGE.VIEW_OWN)
        ? prisma.profileChangeRequest.findMany({
            where: { userId: user.id },
            orderBy: { updatedAt: 'desc' },
            take: 5,
            select: { id: true, title: true, status: true, updatedAt: true },
          }).catch(() => [])
        : Promise.resolve([] as Array<{ id: string; title: string | null; status: string; updatedAt: Date }>),
      has(PERSONAL.VIEW_TASKS)
        ? WorkflowDashboardService.getMyPendingTasks(user.id, 5).catch(() => [])
        : Promise.resolve([]),
      has(PERSONAL.VIEW_CADRE_PROFILE)
        ? prisma.profileEvidence.count({ where: { userId: user.id, deletedAt: null } }).catch(() => 0)
        : Promise.resolve(0),
      has(PERSONAL.VIEW_AWARD)
        ? prisma.awardsRecord.count({ where: { userId: user.id } }).catch(() => 0)
        : Promise.resolve(0),
      has(PERSONAL.VIEW_AWARD)
        ? prisma.awardsRecord.findMany({
            where: { userId: user.id },
            orderBy: { year: 'desc' },
            take: 3,
            select: { id: true, type: true, description: true, year: true },
          }).catch(() => [])
        : Promise.resolve([] as Array<{ id: string; type: string; description: string | null; year: number }>),
      has(PERSONAL.VIEW_RESEARCH)
        ? prisma.nckhProject.count({ where: { principalInvestigatorId: user.id } }).catch(() => 0)
        : Promise.resolve(0),
      has(PERSONAL.VIEW_RESEARCH)
        ? prisma.nckhMember.count({ where: { userId: user.id } }).catch(() => 0)
        : Promise.resolve(0),
      has(PERSONAL.VIEW_PUBLICATIONS)
        ? prisma.nckhPublication.count({ where: { publicationAuthors: { some: { userId: user.id } } } }).catch(() => 0)
        : Promise.resolve(0),
      has(PERSONAL.VIEW_POLICY)
        ? prisma.policyRecord.count({ where: { userId: user.id, deletedAt: null } }).catch(() => 0)
        : Promise.resolve(0),
      has(PERSONAL.VIEW_POLICY)
        ? prisma.policyRequest.count({ where: { requesterId: user.id, deletedAt: null } }).catch(() => 0)
        : Promise.resolve(0),
      has(PERSONAL.VIEW_INSURANCE)
        ? prisma.insuranceInfo.findUnique({ where: { userId: user.id }, select: { id: true } }).catch(() => null)
        : Promise.resolve(null),
    ]);

    const declaration = declarationState
      ? {
          declared: declarationState.declared,
          declaredAt: declarationState.declaredAt ? declarationState.declaredAt.toISOString() : null,
          completenessComplete: declarationState.completeness.complete,
          pendingChecks: declarationState.completeness.checks.filter((c) => !c.ok).map((c) => c.label),
        }
      : null;

    const work = workStats
      ? {
          pendingCount: workStats.pendingCount,
          nearDueCount: workStats.nearDueCount,
          overdueCount: workStats.overdueCount,
          completedRecentCount: workStats.completedRecentCount,
        }
      : null;

    const nowMs = Date.now();
    const topTasks = topTasksRaw.map((t) => ({
      workflowInstanceId: t.workflowInstanceId,
      title: t.instanceTitle,
      entityType: t.entityType,
      dueAt: t.dueAt ? t.dueAt.toISOString() : null,
      overdue: t.dueAt ? t.dueAt.getTime() < nowMs : false,
    }));

    let changeRequests: PersonalOverview['changeRequests'] = null;
    if (has(PROFILE_CHANGE.VIEW_OWN)) {
      const byStatus: Record<string, number> = {};
      for (const g of changeReqGroups) byStatus[g.status] = g._count;
      changeRequests = {
        total: Object.values(byStatus).reduce((sum, n) => sum + n, 0),
        draft: byStatus['DRAFT'] ?? 0,
        pending: (byStatus['SUBMITTED'] ?? 0) + (byStatus['UNIT_APPROVED'] ?? 0),
        returned: (byStatus['RETURNED'] ?? 0) + (byStatus['REJECTED'] ?? 0),
        approved: byStatus['APPROVED'] ?? 0,
      };
    }

    const kpis = buildKpis({
      has, work, completionPct, evidenceCount, changeRequests,
      researchCount: researchPiCount + researchMemberCount, researchPiCount,
      publicationCount, awardCount,
      policyCount: policyRecordCount + policyRequestCount, policyRequestCount,
      hasInsurance: Boolean(insurance),
    });

    const attention = buildAttention({ has, declaration, work, changeRequests, completionPct });

    const recentActivity = buildRecentActivity({ changeReqRecent, topTasks, awardRecent });

    return {
      identity: {
        id: account.id,
        name: account.name ?? '',
        email: account.email,
        phone: account.phone,
        avatar: account.avatar,
        rank: account.rank,
        position: account.position,
        unitName,
        militaryId: account.militaryId,
        managementCategory: account.managementCategory,
        isPartyMember: Boolean(account.partyJoinDate),
        completionPct,
      },
      permissions: Array.from(codes),
      declaration,
      work,
      topTasks,
      changeRequests,
      kpis,
      attention,
      recentActivity,
    };
  }
}

// ─── Builders (tách nhỏ để mỗi hàm một việc) ─────────────────────────────────

function buildKpis(args: {
  has: (code: string) => boolean;
  work: PersonalOverview['work'];
  completionPct: number;
  evidenceCount: number;
  changeRequests: PersonalOverview['changeRequests'];
  researchCount: number;
  researchPiCount: number;
  publicationCount: number;
  awardCount: number;
  policyCount: number;
  policyRequestCount: number;
  hasInsurance: boolean;
}): PersonalKpi[] {
  const {
    has, work, completionPct, evidenceCount, changeRequests,
    researchCount, researchPiCount, publicationCount, awardCount,
    policyCount, policyRequestCount, hasInsurance,
  } = args;
  const kpis: PersonalKpi[] = [];

  if (work) {
    kpis.push({
      key: 'tasks', module: 'workflow', label: 'Việc chờ xử lý', value: work.pendingCount,
      hint: work.overdueCount > 0 ? `${work.overdueCount} quá hạn` : undefined,
      href: '/dashboard/workflow/my-work',
    });
  }
  if (has(PERSONAL.MANAGE_PROFILE)) {
    kpis.push({ key: 'completion', module: 'personnel', label: 'Hoàn thiện hồ sơ', value: `${completionPct}%`, href: '/dashboard/profile' });
  }
  if (has(PERSONAL.VIEW_CADRE_PROFILE)) {
    kpis.push({ key: 'evidence', module: 'personnel', label: 'Minh chứng', value: evidenceCount, href: '/dashboard/profile?tab=cadre' });
  }
  if (changeRequests) {
    kpis.push({
      key: 'change-requests', module: 'workflow', label: 'Đề nghị cập nhật', value: changeRequests.total,
      hint: changeRequests.pending > 0 ? `${changeRequests.pending} chờ duyệt` : undefined,
      href: '/dashboard/personal/my-profile-changes',
    });
  }
  if (has(PERSONAL.VIEW_RESEARCH)) {
    kpis.push({
      key: 'research', module: 'research', label: 'Đề tài NCKH', value: researchCount,
      hint: researchPiCount > 0 ? `${researchPiCount} chủ nhiệm` : undefined,
      href: '/dashboard/personal/my-research',
    });
  }
  if (has(PERSONAL.VIEW_PUBLICATIONS)) {
    kpis.push({ key: 'publications', module: 'research', label: 'Công bố KH', value: publicationCount, href: '/dashboard/personal/my-publications' });
  }
  if (has(PERSONAL.VIEW_AWARD)) {
    kpis.push({ key: 'awards', module: 'policy', label: 'Khen thưởng & Kỷ luật', value: awardCount, href: '/dashboard/personal/my-awards' });
  }
  if (has(PERSONAL.VIEW_POLICY)) {
    kpis.push({
      key: 'policy', module: 'policy', label: 'Chính sách của tôi', value: policyCount,
      hint: policyRequestCount > 0 ? `${policyRequestCount} yêu cầu` : undefined,
      href: '/dashboard/personal/my-policy',
    });
  }
  if (has(PERSONAL.VIEW_INSURANCE)) {
    kpis.push({ key: 'insurance', module: 'insurance', label: 'Bảo hiểm', value: hasInsurance ? 'Đã có hồ sơ' : 'Chưa có', href: '/dashboard/personal/my-insurance' });
  }

  return kpis;
}

const SEVERITY_ORDER: Record<PersonalAttentionItem['severity'], number> = { critical: 0, warning: 1, info: 2 };

function buildAttention(args: {
  has: (code: string) => boolean;
  declaration: PersonalOverview['declaration'];
  work: PersonalOverview['work'];
  changeRequests: PersonalOverview['changeRequests'];
  completionPct: number;
}): PersonalAttentionItem[] {
  const { has, declaration, work, changeRequests, completionPct } = args;
  const items: PersonalAttentionItem[] = [];

  if (declaration && !declaration.declared) {
    items.push({
      key: 'declaration',
      severity: 'warning',
      title: 'Chưa hoàn tất khai báo hồ sơ cán bộ',
      description: declaration.pendingChecks.length > 0
        ? `Còn thiếu: ${declaration.pendingChecks.join(', ')}`
        : 'Hồ sơ đang ở giai đoạn khai báo lần đầu — kiểm tra và xác nhận hoàn tất.',
      href: '/dashboard/profile?tab=cadre',
      actionLabel: 'Tiếp tục khai báo',
    });
  }

  // Việc: chỉ hiện 1 mục đại diện theo mức độ khẩn (quá hạn > sắp hạn > đang chờ).
  if (work && work.overdueCount > 0) {
    items.push({
      key: 'overdue', severity: 'critical',
      title: `${work.overdueCount} công việc đã quá hạn`,
      description: 'Có bước phê duyệt/nhiệm vụ đã vượt thời hạn xử lý.',
      href: '/dashboard/workflow/my-work', actionLabel: 'Xử lý ngay',
    });
  } else if (work && work.nearDueCount > 0) {
    items.push({
      key: 'neardue', severity: 'warning',
      title: `${work.nearDueCount} công việc sắp đến hạn`,
      description: 'Có nhiệm vụ cần xử lý trong 24 giờ tới.',
      href: '/dashboard/workflow/my-work', actionLabel: 'Xem',
    });
  } else if (work && work.pendingCount > 0) {
    items.push({
      key: 'pending', severity: 'info',
      title: `${work.pendingCount} công việc đang chờ bạn`,
      description: 'Inbox phê duyệt và nhiệm vụ đang chờ xử lý.',
      href: '/dashboard/workflow/my-work', actionLabel: 'Mở inbox',
    });
  }

  if (changeRequests && changeRequests.returned > 0) {
    items.push({
      key: 'cr-returned', severity: 'warning',
      title: `${changeRequests.returned} đề nghị cập nhật bị trả lại`,
      description: 'Cần chỉnh sửa và gửi lại đề nghị thay đổi hồ sơ.',
      href: '/dashboard/personal/my-profile-changes', actionLabel: 'Chỉnh sửa',
    });
  }

  if (has(PERSONAL.MANAGE_PROFILE) && completionPct < 80) {
    items.push({
      key: 'completion', severity: 'info',
      title: `Hồ sơ mới đạt ${completionPct}%`,
      description: 'Bổ sung thông tin còn thiếu để hoàn thiện hồ sơ cá nhân.',
      href: '/dashboard/profile', actionLabel: 'Cập nhật hồ sơ',
    });
  }

  return items.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

function buildRecentActivity(args: {
  changeReqRecent: Array<{ id: string; title: string | null; status: string; updatedAt: Date }>;
  topTasks: PersonalOverview['topTasks'];
  awardRecent: Array<{ id: string; type: string; description: string | null; year: number }>;
}): PersonalActivityItem[] {
  const { changeReqRecent, topTasks, awardRecent } = args;
  const items: PersonalActivityItem[] = [];

  for (const cr of changeReqRecent) {
    items.push({
      id: `cr-${cr.id}`, kind: 'CHANGE_REQUEST', module: 'workflow',
      title: cr.title ?? 'Đề nghị cập nhật hồ sơ', status: cr.status,
      at: cr.updatedAt.toISOString(), href: '/dashboard/personal/my-profile-changes',
    });
  }
  for (const t of topTasks) {
    items.push({
      id: `task-${t.workflowInstanceId}`, kind: 'TASK', module: 'workflow',
      title: t.title, status: t.overdue ? 'Quá hạn' : 'Đang chờ',
      at: t.dueAt ?? new Date().toISOString(), href: '/dashboard/workflow/my-work',
    });
  }
  for (const a of awardRecent) {
    items.push({
      id: `award-${a.id}`, kind: 'AWARD', module: 'policy',
      title: a.description ?? a.type, status: String(a.year),
      at: `${a.year}-01-01T00:00:00.000Z`, href: '/dashboard/personal/my-awards',
    });
  }

  return items
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 6);
}
