/**
 * Kiểu dữ liệu cho "Trung tâm cá nhân" — tổng quan không gian cá nhân.
 *
 * File chỉ chứa type (không runtime, không import server) để dùng được cả ở
 * service (server-only) lẫn page client. Nguồn dữ liệu: GET /api/personal/overview.
 */
import type { ModuleId } from '@/lib/constants/module-tokens';

/** Danh tính rút gọn của người dùng phiên (luôn trả về). */
export interface PersonalIdentity {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  rank: string | null;
  position: string | null;
  unitName: string | null;
  militaryId: string | null;
  managementCategory: string | null; // CAN_BO | (Quân lực)
  isPartyMember: boolean;
  completionPct: number; // % hoàn thiện hồ sơ cơ bản (0–100)
}

/** Tổng hợp công việc/luồng phê duyệt (M13) — chỉ khi có VIEW_MY_TASKS. */
export interface PersonalWorkSummary {
  pendingCount: number;
  nearDueCount: number;
  overdueCount: number;
  completedRecentCount: number;
}

/** Một việc đang chờ tôi xử lý (top tasks). */
export interface PersonalTaskItem {
  workflowInstanceId: string;
  title: string;
  entityType: string;
  dueAt: string | null;
  overdue: boolean;
}

/** Trạng thái vòng đời khai báo HSCB — chỉ khi có VIEW_MY_CADRE_PROFILE. */
export interface PersonalDeclarationSummary {
  declared: boolean;
  declaredAt: string | null;
  completenessComplete: boolean;
  pendingChecks: string[]; // nhãn các mục tối thiểu chưa đạt
}

/** Tổng hợp đề nghị cập nhật hồ sơ (2 cấp) — chỉ khi có VIEW_OWN_PROFILE_CHANGE. */
export interface PersonalChangeRequestSummary {
  total: number;
  draft: number;
  pending: number; // SUBMITTED + UNIT_APPROVED (đang chờ duyệt)
  returned: number; // RETURNED + REJECTED (cần xử lý lại)
  approved: number;
}

/** Một thẻ KPI theo loại CSDL (đã lọc theo quyền). */
export interface PersonalKpi {
  key: string;
  module: ModuleId;
  label: string;
  value: number | string;
  hint?: string;
  href: string;
}

/** Mục "Cần xử lý" — việc cần hành động ngay, sắp theo mức độ ưu tiên. */
export interface PersonalAttentionItem {
  key: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  href: string;
  actionLabel: string;
}

/** Một mục hoạt động gần đây (gộp từ đề nghị, công việc, khen thưởng...). */
export interface PersonalActivityItem {
  id: string;
  kind: 'CHANGE_REQUEST' | 'TASK' | 'AWARD';
  module: ModuleId;
  title: string;
  status: string | null;
  at: string; // ISO
  href: string;
}

/** Toàn bộ payload tổng quan cá nhân. */
export interface PersonalOverview {
  identity: PersonalIdentity;
  /** Danh sách function code đã được cấp — UI dùng để lọc lưới điều hướng + nút hành động. */
  permissions: string[];
  declaration: PersonalDeclarationSummary | null;
  work: PersonalWorkSummary | null;
  topTasks: PersonalTaskItem[];
  changeRequests: PersonalChangeRequestSummary | null;
  kpis: PersonalKpi[];
  attention: PersonalAttentionItem[];
  recentActivity: PersonalActivityItem[];
}
