/**
 * Seed: 6 Workflow Templates ưu tiên cao nhất (M13)
 *
 * Mỗi template bao gồm:
 *  - WorkflowTemplate (code, name, moduleKey)
 *  - WorkflowTemplateVersion v1 PUBLISHED
 *  - WorkflowStepTemplate (START → steps → END)
 *  - WorkflowTransitionTemplate (transitions giữa các bước)
 *
 * ApproverPolicy format (trong step configJson):
 *  { approverPolicy: { type, positionCode?, unitRole?, unitScope?, fixedUnitId?, fallbackToInitiator? } }
 *
 * Run:
 *   npx tsx --require dotenv/config prisma/seed/seed_m13_workflow_templates.ts
 */

import { PrismaClient, WorkflowVersionStatus } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StepDef {
  code: string;
  name: string;
  stepType: 'START' | 'TASK' | 'APPROVAL' | 'SIGNATURE' | 'END';
  orderIndex: number;
  slaHours?: number;
  requiresSignature?: boolean;
  configJson?: Record<string, unknown>;
}

interface TransitionDef {
  fromStepCode: string;
  actionCode: string;
  toStepCode: string;
  priority?: number;
  conditionExpression?: string;
}

interface WorkflowDef {
  code: string;
  name: string;
  moduleKey: string;
  description: string;
  entityType: string;
  steps: StepDef[];
  transitions: TransitionDef[];
}

// ---------------------------------------------------------------------------
// Helper: approver policy config
// ---------------------------------------------------------------------------

const approverPolicy = {
  initiator: () => ({ approverPolicy: { type: 'INITIATOR' } }),
  byUnitRole: (
    role: 'HEAD' | 'DEPUTY_HEAD',
    scope: 'INITIATOR_UNIT' | 'FIXED' = 'INITIATOR_UNIT',
    fixedUnitId?: string
  ) => ({
    approverPolicy: {
      type: 'BY_UNIT_ROLE',
      unitRole: role,
      unitScope: scope,
      ...(fixedUnitId ? { fixedUnitId } : {}),
    },
  }),
  supervisor: () => ({ approverPolicy: { type: 'SUPERVISOR' } }),
  byPosition: (positionCode: string, scope: 'INITIATOR_UNIT' | 'FIXED' = 'INITIATOR_UNIT') =>
    ({ approverPolicy: { type: 'BY_POSITION', positionCode, unitScope: scope, fallbackToInitiator: true } }),
};

// ---------------------------------------------------------------------------
// 6 Workflow definitions
// ---------------------------------------------------------------------------

const WORKFLOW_DEFINITIONS: WorkflowDef[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // 1. KẾT NẠP ĐẢNG VIÊN MỚI
  // Module: PARTY (M03)  EntityType: PartyMember
  // Luồng: Đương sự nộp → Chi bộ bộ môn xét → Chi ủy khoa duyệt → Đảng ủy HV phê duyệt → Ký số → Hoàn tất
  // ══════════════════════════════════════════════════════════════════════════
  {
    code: 'PARTY_RECRUIT',
    name: 'Kết nạp Đảng viên mới',
    moduleKey: 'PARTY',
    description: 'Quy trình xét duyệt kết nạp đảng viên mới từ cấp bộ môn đến Đảng ủy học viện',
    entityType: 'PartyMember',
    steps: [
      {
        code: 'START',
        name: 'Bắt đầu',
        stepType: 'START',
        orderIndex: 0,
      },
      {
        code: 'SUBMIT_APPLICATION',
        name: 'Nộp hồ sơ kết nạp',
        stepType: 'TASK',
        orderIndex: 1,
        slaHours: 24,
        configJson: approverPolicy.initiator(),
      },
      {
        code: 'BO_MON_REVIEW',
        name: 'Chi bộ bộ môn xét duyệt',
        stepType: 'APPROVAL',
        orderIndex: 2,
        slaHours: 168, // 7 ngày
        configJson: approverPolicy.byUnitRole('HEAD'),
      },
      {
        code: 'CHI_UY_KHOA_REVIEW',
        name: 'Chi ủy khoa phê duyệt',
        stepType: 'APPROVAL',
        orderIndex: 3,
        slaHours: 168,
        configJson: approverPolicy.supervisor(),
      },
      {
        code: 'DANG_UY_HV_APPROVE',
        name: 'Đảng ủy học viện phê duyệt',
        stepType: 'APPROVAL',
        orderIndex: 4,
        slaHours: 240, // 10 ngày
        // TODO: cập nhật fixedUnitId thành ID thật của Đảng ủy HV sau khi tạo unit đó.
        // Hiện tạm dùng unit gốc HVHC (cmmuk87n100018i5tcde3ln6w).
        configJson: approverPolicy.byUnitRole('HEAD', 'FIXED', 'cmmuk87n100018i5tcde3ln6w'),
      },
      {
        code: 'KY_QUYET_DINH',
        name: 'Ký quyết định kết nạp',
        stepType: 'SIGNATURE',
        orderIndex: 5,
        slaHours: 72,
        requiresSignature: true,
        configJson: approverPolicy.byUnitRole('HEAD', 'FIXED'),
      },
      {
        code: 'END',
        name: 'Hoàn tất kết nạp',
        stepType: 'END',
        orderIndex: 6,
      },
    ],
    transitions: [
      { fromStepCode: 'START',              actionCode: 'SUBMIT',  toStepCode: 'SUBMIT_APPLICATION',  priority: 1 },
      { fromStepCode: 'SUBMIT_APPLICATION', actionCode: 'SUBMIT',  toStepCode: 'BO_MON_REVIEW',       priority: 1 },
      { fromStepCode: 'BO_MON_REVIEW',      actionCode: 'APPROVE', toStepCode: 'CHI_UY_KHOA_REVIEW',  priority: 1 },
      { fromStepCode: 'BO_MON_REVIEW',      actionCode: 'RETURN',  toStepCode: 'SUBMIT_APPLICATION',  priority: 2 },
      { fromStepCode: 'BO_MON_REVIEW',      actionCode: 'REJECT',  toStepCode: 'END',                 priority: 3 },
      { fromStepCode: 'CHI_UY_KHOA_REVIEW', actionCode: 'APPROVE', toStepCode: 'DANG_UY_HV_APPROVE', priority: 1 },
      { fromStepCode: 'CHI_UY_KHOA_REVIEW', actionCode: 'RETURN',  toStepCode: 'BO_MON_REVIEW',       priority: 2 },
      { fromStepCode: 'CHI_UY_KHOA_REVIEW', actionCode: 'REJECT',  toStepCode: 'END',                 priority: 3 },
      { fromStepCode: 'DANG_UY_HV_APPROVE', actionCode: 'APPROVE', toStepCode: 'KY_QUYET_DINH',       priority: 1 },
      { fromStepCode: 'DANG_UY_HV_APPROVE', actionCode: 'RETURN',  toStepCode: 'CHI_UY_KHOA_REVIEW', priority: 2 },
      { fromStepCode: 'DANG_UY_HV_APPROVE', actionCode: 'REJECT',  toStepCode: 'END',                 priority: 3 },
      { fromStepCode: 'KY_QUYET_DINH',      actionCode: 'SIGN',    toStepCode: 'END',                 priority: 1 },
      { fromStepCode: 'KY_QUYET_DINH',      actionCode: 'RETURN',  toStepCode: 'DANG_UY_HV_APPROVE', priority: 2 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 2. ĐỀ XUẤT KHEN THƯỞNG
  // Module: POLICY (M05)  EntityType: PolicyRecord
  // Luồng: Lập đề xuất → Bộ môn/Chi bộ xét → Phòng chức năng tổng hợp → Lãnh đạo duyệt → Ký quyết định
  // ══════════════════════════════════════════════════════════════════════════
  {
    code: 'REWARD_PROPOSAL',
    name: 'Đề xuất khen thưởng',
    moduleKey: 'POLICY',
    description: 'Quy trình xét duyệt và ký ban hành quyết định khen thưởng cán bộ/học viên',
    entityType: 'PolicyRecord',
    steps: [
      { code: 'START', name: 'Bắt đầu', stepType: 'START', orderIndex: 0 },
      {
        code: 'DRAFT_PROPOSAL',
        name: 'Lập đề xuất khen thưởng',
        stepType: 'TASK',
        orderIndex: 1,
        slaHours: 48,
        configJson: approverPolicy.initiator(),
      },
      {
        code: 'BO_MON_XET',
        name: 'Bộ môn / đơn vị cơ sở xét duyệt',
        stepType: 'APPROVAL',
        orderIndex: 2,
        slaHours: 48,
        configJson: approverPolicy.byUnitRole('HEAD'),
      },
      {
        code: 'PHONG_CHUC_NANG_REVIEW',
        name: 'Phòng chức năng tổng hợp, thẩm định',
        stepType: 'APPROVAL',
        orderIndex: 3,
        slaHours: 72,
        configJson: approverPolicy.byPosition('CHU_NHIEM_BO_MON', 'FIXED'),
      },
      {
        code: 'LANH_DAO_APPROVE',
        name: 'Lãnh đạo học viện phê duyệt',
        stepType: 'APPROVAL',
        orderIndex: 4,
        slaHours: 48,
        configJson: approverPolicy.byUnitRole('HEAD', 'FIXED'),
      },
      {
        code: 'KY_QUYET_DINH',
        name: 'Ký quyết định khen thưởng',
        stepType: 'SIGNATURE',
        orderIndex: 5,
        slaHours: 24,
        requiresSignature: true,
        configJson: approverPolicy.byUnitRole('HEAD', 'FIXED'),
      },
      { code: 'END', name: 'Ban hành quyết định', stepType: 'END', orderIndex: 6 },
    ],
    transitions: [
      { fromStepCode: 'START',                   actionCode: 'SUBMIT',  toStepCode: 'DRAFT_PROPOSAL',         priority: 1 },
      { fromStepCode: 'DRAFT_PROPOSAL',          actionCode: 'SUBMIT',  toStepCode: 'BO_MON_XET',            priority: 1 },
      { fromStepCode: 'BO_MON_XET',              actionCode: 'APPROVE', toStepCode: 'PHONG_CHUC_NANG_REVIEW', priority: 1 },
      { fromStepCode: 'BO_MON_XET',              actionCode: 'RETURN',  toStepCode: 'DRAFT_PROPOSAL',         priority: 2 },
      { fromStepCode: 'BO_MON_XET',              actionCode: 'REJECT',  toStepCode: 'END',                   priority: 3 },
      { fromStepCode: 'PHONG_CHUC_NANG_REVIEW',  actionCode: 'APPROVE', toStepCode: 'LANH_DAO_APPROVE',       priority: 1 },
      { fromStepCode: 'PHONG_CHUC_NANG_REVIEW',  actionCode: 'RETURN',  toStepCode: 'BO_MON_XET',            priority: 2 },
      { fromStepCode: 'PHONG_CHUC_NANG_REVIEW',  actionCode: 'REJECT',  toStepCode: 'END',                   priority: 3 },
      { fromStepCode: 'LANH_DAO_APPROVE',         actionCode: 'APPROVE', toStepCode: 'KY_QUYET_DINH',          priority: 1 },
      { fromStepCode: 'LANH_DAO_APPROVE',         actionCode: 'RETURN',  toStepCode: 'PHONG_CHUC_NANG_REVIEW', priority: 2 },
      { fromStepCode: 'LANH_DAO_APPROVE',         actionCode: 'REJECT',  toStepCode: 'END',                   priority: 3 },
      { fromStepCode: 'KY_QUYET_DINH',            actionCode: 'SIGN',    toStepCode: 'END',                   priority: 1 },
      { fromStepCode: 'KY_QUYET_DINH',            actionCode: 'RETURN',  toStepCode: 'LANH_DAO_APPROVE',       priority: 2 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 3. GIẢI QUYẾT CHẾ ĐỘ BHXH
  // Module: POLICY/INSURANCE (M05)  EntityType: InsuranceInfo
  // Luồng: Cán bộ nộp đơn → Phòng Chính sách xác nhận → Trưởng phòng duyệt → Phó CHV ký
  // ══════════════════════════════════════════════════════════════════════════
  {
    code: 'INSURANCE_CLAIM',
    name: 'Giải quyết chế độ BHXH',
    moduleKey: 'POLICY',
    description: 'Quy trình xét duyệt và giải quyết các chế độ bảo hiểm xã hội cho cán bộ',
    entityType: 'InsuranceInfo',
    steps: [
      { code: 'START', name: 'Bắt đầu', stepType: 'START', orderIndex: 0 },
      {
        code: 'SUBMIT_REQUEST',
        name: 'Nộp đơn đề nghị BHXH',
        stepType: 'TASK',
        orderIndex: 1,
        slaHours: 24,
        configJson: approverPolicy.initiator(),
      },
      {
        code: 'PHONG_CS_XAC_NHAN',
        name: 'Phòng Chính sách xác nhận hồ sơ',
        stepType: 'TASK',
        orderIndex: 2,
        slaHours: 72,
        configJson: approverPolicy.byPosition('TRO_LY', 'FIXED'),
      },
      {
        code: 'TRUONG_PHONG_DUYET',
        name: 'Trưởng phòng Chính sách duyệt',
        stepType: 'APPROVAL',
        orderIndex: 3,
        slaHours: 48,
        configJson: approverPolicy.byUnitRole('HEAD', 'FIXED'),
      },
      {
        code: 'PHO_CHV_KY',
        name: 'Phó Chỉ huy học viện ký quyết định',
        stepType: 'SIGNATURE',
        orderIndex: 4,
        slaHours: 48,
        requiresSignature: true,
        configJson: approverPolicy.byUnitRole('DEPUTY_HEAD', 'FIXED'),
      },
      { code: 'END', name: 'Giải quyết hoàn tất', stepType: 'END', orderIndex: 5 },
    ],
    transitions: [
      { fromStepCode: 'START',              actionCode: 'SUBMIT',  toStepCode: 'SUBMIT_REQUEST',    priority: 1 },
      { fromStepCode: 'SUBMIT_REQUEST',     actionCode: 'SUBMIT',  toStepCode: 'PHONG_CS_XAC_NHAN', priority: 1 },
      { fromStepCode: 'PHONG_CS_XAC_NHAN', actionCode: 'APPROVE', toStepCode: 'TRUONG_PHONG_DUYET', priority: 1 },
      { fromStepCode: 'PHONG_CS_XAC_NHAN', actionCode: 'RETURN',  toStepCode: 'SUBMIT_REQUEST',    priority: 2 },
      { fromStepCode: 'PHONG_CS_XAC_NHAN', actionCode: 'REJECT',  toStepCode: 'END',               priority: 3 },
      { fromStepCode: 'TRUONG_PHONG_DUYET', actionCode: 'APPROVE', toStepCode: 'PHO_CHV_KY',         priority: 1 },
      { fromStepCode: 'TRUONG_PHONG_DUYET', actionCode: 'RETURN',  toStepCode: 'PHONG_CS_XAC_NHAN', priority: 2 },
      { fromStepCode: 'TRUONG_PHONG_DUYET', actionCode: 'REJECT',  toStepCode: 'END',               priority: 3 },
      { fromStepCode: 'PHO_CHV_KY',          actionCode: 'SIGN',    toStepCode: 'END',               priority: 1 },
      { fromStepCode: 'PHO_CHV_KY',          actionCode: 'RETURN',  toStepCode: 'TRUONG_PHONG_DUYET', priority: 2 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 4. BỔ NHIỆM / ĐIỀU ĐỘNG CÁN BỘ
  // Module: PERSONNEL (M02)  EntityType: FacultyProfile
  // Luồng: Đề xuất → Phòng TCNS thẩm định → Ban chỉ huy duyệt → CHV ký quyết định
  // ══════════════════════════════════════════════════════════════════════════
  {
    code: 'APPOINTMENT_TRANSFER',
    name: 'Bổ nhiệm / Điều động cán bộ',
    moduleKey: 'PERSONNEL',
    description: 'Quy trình xét duyệt bổ nhiệm chức vụ hoặc điều động công tác của cán bộ nhân sự',
    entityType: 'FacultyProfile',
    steps: [
      { code: 'START', name: 'Bắt đầu', stepType: 'START', orderIndex: 0 },
      {
        code: 'SUBMIT_PROPOSAL',
        name: 'Lập tờ trình đề xuất',
        stepType: 'TASK',
        orderIndex: 1,
        slaHours: 24,
        configJson: approverPolicy.initiator(),
      },
      {
        code: 'PHONG_TCNS_THAM_DINH',
        name: 'Phòng TCNS thẩm định hồ sơ',
        stepType: 'APPROVAL',
        orderIndex: 2,
        slaHours: 72,
        configJson: approverPolicy.byUnitRole('HEAD', 'FIXED'),
      },
      {
        code: 'BAN_CHI_HUY_DUYET',
        name: 'Ban Chỉ huy học viện phê duyệt',
        stepType: 'APPROVAL',
        orderIndex: 3,
        slaHours: 48,
        configJson: approverPolicy.byUnitRole('HEAD', 'FIXED'),
      },
      {
        code: 'CHV_KY_QUYET_DINH',
        name: 'Chỉ huy học viện ký quyết định',
        stepType: 'SIGNATURE',
        orderIndex: 4,
        slaHours: 24,
        requiresSignature: true,
        configJson: approverPolicy.byUnitRole('HEAD', 'FIXED'),
      },
      { code: 'END', name: 'Quyết định có hiệu lực', stepType: 'END', orderIndex: 5 },
    ],
    transitions: [
      { fromStepCode: 'START',                  actionCode: 'SUBMIT',  toStepCode: 'SUBMIT_PROPOSAL',      priority: 1 },
      { fromStepCode: 'SUBMIT_PROPOSAL',        actionCode: 'SUBMIT',  toStepCode: 'PHONG_TCNS_THAM_DINH', priority: 1 },
      { fromStepCode: 'PHONG_TCNS_THAM_DINH',   actionCode: 'APPROVE', toStepCode: 'BAN_CHI_HUY_DUYET',    priority: 1 },
      { fromStepCode: 'PHONG_TCNS_THAM_DINH',   actionCode: 'RETURN',  toStepCode: 'SUBMIT_PROPOSAL',      priority: 2 },
      { fromStepCode: 'PHONG_TCNS_THAM_DINH',   actionCode: 'REJECT',  toStepCode: 'END',                  priority: 3 },
      { fromStepCode: 'BAN_CHI_HUY_DUYET',      actionCode: 'APPROVE', toStepCode: 'CHV_KY_QUYET_DINH',    priority: 1 },
      { fromStepCode: 'BAN_CHI_HUY_DUYET',      actionCode: 'RETURN',  toStepCode: 'PHONG_TCNS_THAM_DINH', priority: 2 },
      { fromStepCode: 'BAN_CHI_HUY_DUYET',      actionCode: 'REJECT',  toStepCode: 'END',                  priority: 3 },
      { fromStepCode: 'CHV_KY_QUYET_DINH',       actionCode: 'SIGN',    toStepCode: 'END',                  priority: 1 },
      { fromStepCode: 'CHV_KY_QUYET_DINH',       actionCode: 'RETURN',  toStepCode: 'BAN_CHI_HUY_DUYET',    priority: 2 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 5. BẢO LƯU / THÔI HỌC HỌC VIÊN
  // Module: EDUCATION (M10)  EntityType: HocVien
  // Luồng: HV nộp đơn → GVCN xét → Khoa phê duyệt → Phòng đào tạo xác nhận → END
  // ══════════════════════════════════════════════════════════════════════════
  {
    code: 'STUDENT_DEFERRAL',
    name: 'Bảo lưu / Thôi học học viên',
    moduleKey: 'EDUCATION',
    description: 'Quy trình xét duyệt đơn bảo lưu kết quả học tập hoặc thôi học của học viên',
    entityType: 'HocVien',
    steps: [
      { code: 'START', name: 'Bắt đầu', stepType: 'START', orderIndex: 0 },
      {
        code: 'SUBMIT_REQUEST',
        name: 'Học viên nộp đơn',
        stepType: 'TASK',
        orderIndex: 1,
        slaHours: 24,
        configJson: approverPolicy.initiator(),
      },
      {
        code: 'GVCN_XET',
        name: 'Giáo viên chủ nhiệm xét duyệt',
        stepType: 'APPROVAL',
        orderIndex: 2,
        slaHours: 48,
        configJson: approverPolicy.byPosition('GIANG_VIEN'),
      },
      {
        code: 'KHOA_DUYET',
        name: 'Khoa phê duyệt',
        stepType: 'APPROVAL',
        orderIndex: 3,
        slaHours: 72,
        configJson: approverPolicy.byUnitRole('HEAD'),
      },
      {
        code: 'PHONG_DAO_TAO_XAC_NHAN',
        name: 'Phòng Đào tạo xác nhận và cập nhật',
        stepType: 'TASK',
        orderIndex: 4,
        slaHours: 48,
        configJson: approverPolicy.byPosition('TRO_LY', 'FIXED'),
      },
      { code: 'END', name: 'Xử lý hoàn tất', stepType: 'END', orderIndex: 5 },
    ],
    transitions: [
      { fromStepCode: 'START',                   actionCode: 'SUBMIT',  toStepCode: 'SUBMIT_REQUEST',         priority: 1 },
      { fromStepCode: 'SUBMIT_REQUEST',          actionCode: 'SUBMIT',  toStepCode: 'GVCN_XET',              priority: 1 },
      { fromStepCode: 'GVCN_XET',               actionCode: 'APPROVE', toStepCode: 'KHOA_DUYET',             priority: 1 },
      { fromStepCode: 'GVCN_XET',               actionCode: 'RETURN',  toStepCode: 'SUBMIT_REQUEST',         priority: 2 },
      { fromStepCode: 'GVCN_XET',               actionCode: 'REJECT',  toStepCode: 'END',                   priority: 3 },
      { fromStepCode: 'KHOA_DUYET',             actionCode: 'APPROVE', toStepCode: 'PHONG_DAO_TAO_XAC_NHAN', priority: 1 },
      { fromStepCode: 'KHOA_DUYET',             actionCode: 'RETURN',  toStepCode: 'GVCN_XET',              priority: 2 },
      { fromStepCode: 'KHOA_DUYET',             actionCode: 'REJECT',  toStepCode: 'END',                   priority: 3 },
      { fromStepCode: 'PHONG_DAO_TAO_XAC_NHAN', actionCode: 'APPROVE', toStepCode: 'END',                   priority: 1 },
      { fromStepCode: 'PHONG_DAO_TAO_XAC_NHAN', actionCode: 'RETURN',  toStepCode: 'KHOA_DUYET',             priority: 2 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 6. XÉT TỐT NGHIỆP
  // Module: EDUCATION (M10)  EntityType: HocVien
  // Luồng: Giáo vụ kiểm tra học phần → Khoa xác nhận → Hội đồng nhà trường duyệt → CHV ký bằng
  // ══════════════════════════════════════════════════════════════════════════
  {
    code: 'GRADUATION_REVIEW',
    name: 'Xét tốt nghiệp',
    moduleKey: 'EDUCATION',
    description: 'Quy trình xét duyệt công nhận tốt nghiệp và ký ban hành bằng cho học viên',
    entityType: 'HocVien',
    steps: [
      { code: 'START', name: 'Bắt đầu', stepType: 'START', orderIndex: 0 },
      {
        code: 'GIAO_VU_KIEM_TRA',
        name: 'Giáo vụ kiểm tra điều kiện tốt nghiệp',
        stepType: 'TASK',
        orderIndex: 1,
        slaHours: 72,
        configJson: approverPolicy.byPosition('TRO_LY', 'FIXED'),
      },
      {
        code: 'KHOA_XAC_NHAN',
        name: 'Khoa xác nhận kết quả học tập',
        stepType: 'APPROVAL',
        orderIndex: 2,
        slaHours: 72,
        configJson: approverPolicy.byUnitRole('HEAD'),
      },
      {
        code: 'HOI_DONG_XET',
        name: 'Hội đồng nhà trường xét duyệt',
        stepType: 'APPROVAL',
        orderIndex: 3,
        slaHours: 168, // 7 ngày
        configJson: approverPolicy.byUnitRole('DEPUTY_HEAD', 'FIXED'),
      },
      {
        code: 'LANH_DAO_PHE_DUYET',
        name: 'Lãnh đạo học viện phê duyệt danh sách',
        stepType: 'APPROVAL',
        orderIndex: 4,
        slaHours: 48,
        configJson: approverPolicy.byUnitRole('HEAD', 'FIXED'),
      },
      {
        code: 'KY_BANG',
        name: 'Chỉ huy học viện ký bằng tốt nghiệp',
        stepType: 'SIGNATURE',
        orderIndex: 5,
        slaHours: 48,
        requiresSignature: true,
        configJson: approverPolicy.byUnitRole('HEAD', 'FIXED'),
      },
      { code: 'END', name: 'Công nhận tốt nghiệp', stepType: 'END', orderIndex: 6 },
    ],
    transitions: [
      { fromStepCode: 'START',                actionCode: 'SUBMIT',  toStepCode: 'GIAO_VU_KIEM_TRA',   priority: 1 },
      { fromStepCode: 'GIAO_VU_KIEM_TRA',    actionCode: 'APPROVE', toStepCode: 'KHOA_XAC_NHAN',       priority: 1 },
      { fromStepCode: 'GIAO_VU_KIEM_TRA',    actionCode: 'RETURN',  toStepCode: 'GIAO_VU_KIEM_TRA',   priority: 2 }, // bổ sung hồ sơ
      { fromStepCode: 'GIAO_VU_KIEM_TRA',    actionCode: 'REJECT',  toStepCode: 'END',                 priority: 3 },
      { fromStepCode: 'KHOA_XAC_NHAN',       actionCode: 'APPROVE', toStepCode: 'HOI_DONG_XET',         priority: 1 },
      { fromStepCode: 'KHOA_XAC_NHAN',       actionCode: 'RETURN',  toStepCode: 'GIAO_VU_KIEM_TRA',   priority: 2 },
      { fromStepCode: 'KHOA_XAC_NHAN',       actionCode: 'REJECT',  toStepCode: 'END',                 priority: 3 },
      { fromStepCode: 'HOI_DONG_XET',         actionCode: 'APPROVE', toStepCode: 'LANH_DAO_PHE_DUYET',  priority: 1 },
      { fromStepCode: 'HOI_DONG_XET',         actionCode: 'RETURN',  toStepCode: 'KHOA_XAC_NHAN',       priority: 2 },
      { fromStepCode: 'HOI_DONG_XET',         actionCode: 'REJECT',  toStepCode: 'END',                 priority: 3 },
      { fromStepCode: 'LANH_DAO_PHE_DUYET',  actionCode: 'APPROVE', toStepCode: 'KY_BANG',              priority: 1 },
      { fromStepCode: 'LANH_DAO_PHE_DUYET',  actionCode: 'RETURN',  toStepCode: 'HOI_DONG_XET',         priority: 2 },
      { fromStepCode: 'LANH_DAO_PHE_DUYET',  actionCode: 'REJECT',  toStepCode: 'END',                 priority: 3 },
      { fromStepCode: 'KY_BANG',              actionCode: 'SIGN',    toStepCode: 'END',                 priority: 1 },
      { fromStepCode: 'KY_BANG',              actionCode: 'RETURN',  toStepCode: 'LANH_DAO_PHE_DUYET',  priority: 2 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

/** Seed system user id — dùng cho các bản ghi do seed tạo ra */
const SEED_SYSTEM_USER = 'system-seed';

async function seedWorkflow(def: WorkflowDef) {
  console.log(`\n  📋 Seeding: ${def.code} — ${def.name}`);

  // 1. Upsert WorkflowTemplate
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
  });

  // 2. Check if PUBLISHED version already exists
  const existingPublished = await prisma.workflowTemplateVersion.findFirst({
    where: { templateId: template.id, status: WorkflowVersionStatus.PUBLISHED },
  });

  if (existingPublished) {
    console.log(`    ⏩ Đã có version PUBLISHED (v${existingPublished.versionNo}) — bỏ qua`);
    return;
  }

  // 3. Create version v1 PUBLISHED
  const version = await prisma.workflowTemplateVersion.create({
    data: {
      templateId: template.id,
      versionNo: 1,
      status: WorkflowVersionStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  // 4. Create steps
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
      configJson: s.configJson ?? undefined,
    })),
  });

  // 5. Create transitions
  await prisma.workflowTransitionTemplate.createMany({
    data: def.transitions.map((t) => ({
      templateVersionId: version.id,
      fromStepCode: t.fromStepCode,
      actionCode: t.actionCode,
      toStepCode: t.toStepCode,
      priority: t.priority ?? 1,
      conditionExpression: t.conditionExpression ?? null,
    })),
  });

  console.log(`    ✅ Tạo ${def.steps.length} bước, ${def.transitions.length} transitions → PUBLISHED`);
}

async function main() {
  console.log('\n🚀 M13 Workflow Templates Seed');
  console.log('━'.repeat(60));
  console.log(`Seeding ${WORKFLOW_DEFINITIONS.length} workflow templates...`);

  for (const def of WORKFLOW_DEFINITIONS) {
    await seedWorkflow(def);
  }

  // Summary
  console.log('\n\n📊 Tóm tắt sau seed:');
  const templates = await prisma.workflowTemplate.findMany({
    include: {
      versions: {
        where: { status: WorkflowVersionStatus.PUBLISHED },
        include: {
          _count: { select: { steps: true, transitions: true } },
        },
      },
    },
    orderBy: { moduleKey: 'asc' },
  });

  for (const t of templates) {
    const pub = t.versions[0];
    if (pub) {
      console.log(`  [${t.moduleKey.padEnd(12)}] ${t.code.padEnd(28)} v${pub.versionNo} PUBLISHED — ${pub._count.steps} steps / ${pub._count.transitions} transitions`);
    }
  }

  console.log('\n✅ Seed workflow templates hoàn tất.\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
