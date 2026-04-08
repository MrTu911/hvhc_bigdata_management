/**
 * Workflow Engine - Xử lý chuyển trạng thái theo A3
 * 
 * A3.1: Điểm học tập - DRAFT → SUBMITTED → APPROVED
 * A3.2: Đề tài NCKH - DRAFT → SUBMITTED → APPROVED → COMPLETED
 * A3.3: Hồ sơ chính sách - DRAFT → SUBMITTED → APPROVED / REJECTED
 * A3.4: Khen thưởng/Kỷ luật - PROPOSED → APPROVED
 */

import { GradeWorkflowStatus, ResearchWorkflowStatus, PolicyRequestStatus, AwardWorkflowStatus } from '@prisma/client';

// =====================================================
// WORKFLOW TRANSITIONS
// =====================================================

// A3.1: Điểm học tập
export const GRADE_TRANSITIONS: Record<GradeWorkflowStatus, GradeWorkflowStatus[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['APPROVED', 'REJECTED'],
  APPROVED: [],  // Final state
  REJECTED: ['DRAFT', 'SUBMITTED'],  // Có thể sửa và nộp lại
};

// A3.2: Đề tài NCKH
export const RESEARCH_TRANSITIONS: Record<ResearchWorkflowStatus, ResearchWorkflowStatus[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['UNDER_REVIEW', 'REJECTED'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED: ['IN_PROGRESS'],
  REJECTED: ['DRAFT'],  // Có thể sửa và nộp lại
  IN_PROGRESS: ['PENDING_REVIEW', 'CANCELLED'],
  PENDING_REVIEW: ['COMPLETED', 'IN_PROGRESS'],
  COMPLETED: [],  // Final state
  CANCELLED: [],  // Final state
};

// A3.3: Hồ sơ chính sách
export const POLICY_REQUEST_TRANSITIONS: Record<PolicyRequestStatus, PolicyRequestStatus[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['UNDER_REVIEW', 'REJECTED', 'CANCELLED'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED: ['COMPLETED'],
  REJECTED: ['DRAFT'],  // Có thể sửa và nộp lại
  CANCELLED: [],  // Final state
  COMPLETED: [],  // Final state
};

// A3.4: Khen thưởng/Kỷ luật
export const AWARD_TRANSITIONS: Record<AwardWorkflowStatus, AwardWorkflowStatus[]> = {
  PROPOSED: ['UNDER_REVIEW', 'CANCELLED'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED: [],  // Final state
  REJECTED: ['PROPOSED'],  // Có thể đề xuất lại
  CANCELLED: [],  // Final state
};

// =====================================================
// VALIDATION FUNCTIONS
// =====================================================

export function canTransitionGrade(from: GradeWorkflowStatus, to: GradeWorkflowStatus): boolean {
  return GRADE_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canTransitionResearch(from: ResearchWorkflowStatus, to: ResearchWorkflowStatus): boolean {
  return RESEARCH_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canTransitionPolicyRequest(from: PolicyRequestStatus, to: PolicyRequestStatus): boolean {
  return POLICY_REQUEST_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canTransitionAward(from: AwardWorkflowStatus, to: AwardWorkflowStatus): boolean {
  return AWARD_TRANSITIONS[from]?.includes(to) ?? false;
}

// =====================================================
// RBAC FUNCTION CODES FOR WORKFLOW
// =====================================================

export const WORKFLOW_FUNCTION_CODES = {
  // A3.1: Điểm học tập
  GRADE: {
    SUBMIT: 'TRAINING.SUBMIT_GRADE',    // Giảng viên nộp điểm
    APPROVE: 'TRAINING.APPROVE_GRADE',  // Trưởng khoa duyệt
    REJECT: 'TRAINING.APPROVE_GRADE',   // Trưởng khoa từ chối
  },
  // A3.2: NCKH
  RESEARCH: {
    SUBMIT: 'RESEARCH.SUBMIT',
    REVIEW: 'RESEARCH.REVIEW',
    APPROVE: 'RESEARCH.APPROVE',
    COMPLETE: 'RESEARCH.APPROVE',
  },
  // A3.3: Chính sách
  POLICY: {
    SUBMIT: 'POLICY.CREATE_POLICY_REQUEST',
    REVIEW: 'POLICY.REVIEW_POLICY',
    APPROVE: 'POLICY.APPROVE_POLICY',
    REJECT: 'POLICY.REJECT_POLICY',
  },
  // A3.4: Khen thưởng
  AWARD: {
    PROPOSE: 'AWARD.CREATE',
    REVIEW: 'AWARD.REVIEW',
    APPROVE: 'AWARD.APPROVE',
  },
};

// =====================================================
// STATUS DISPLAY NAMES
// =====================================================

export const GRADE_STATUS_NAMES: Record<GradeWorkflowStatus, string> = {
  DRAFT: 'Nháp',
  SUBMITTED: 'Đã nộp',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
};

export const RESEARCH_STATUS_NAMES: Record<ResearchWorkflowStatus, string> = {
  DRAFT: 'Nháp',
  SUBMITTED: 'Đã nộp',
  UNDER_REVIEW: 'Đang xét duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  IN_PROGRESS: 'Đang thực hiện',
  PENDING_REVIEW: 'Chờ nghiệm thu',
  COMPLETED: 'Đã nghiệm thu',
  CANCELLED: 'Đã hủy',
};

export const POLICY_REQUEST_STATUS_NAMES: Record<PolicyRequestStatus, string> = {
  DRAFT: 'Nháp',
  SUBMITTED: 'Đã trình',
  UNDER_REVIEW: 'Đang xét duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  CANCELLED: 'Đã hủy',
  COMPLETED: 'Hoàn thành',
};

export const AWARD_STATUS_NAMES: Record<AwardWorkflowStatus, string> = {
  PROPOSED: 'Đề xuất',
  UNDER_REVIEW: 'Đang xét duyệt',
  APPROVED: 'Đã phê duyệt',
  REJECTED: 'Từ chối',
  CANCELLED: 'Đã hủy',
};
