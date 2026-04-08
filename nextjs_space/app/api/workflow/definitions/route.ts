/**
 * @deprecated LEGACY WORKFLOW — Chưa migrate sang M13 engine.
 * Route này vẫn được giữ để không phá module cũ.
 * Mục tiêu: migrate sang /api/workflows/* sau khi module nghiệp vụ dùng M13 engine.
 * Xem: docs/design/module-m13-overview.md và migration plan.
 */
/**
 * API: Workflow Definitions – Danh sách định nghĩa quy trình
 * Path: /api/workflow/definitions
 * Returns all 4 workflow type definitions with states, transitions, and RBAC codes
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { WORKFLOW } from '@/lib/rbac/function-codes';
import {
  GRADE_TRANSITIONS,
  RESEARCH_TRANSITIONS,
  POLICY_REQUEST_TRANSITIONS,
  AWARD_TRANSITIONS,
  GRADE_STATUS_NAMES,
  RESEARCH_STATUS_NAMES,
  POLICY_REQUEST_STATUS_NAMES,
  AWARD_STATUS_NAMES,
} from '@/lib/workflow';

const WORKFLOW_DEFINITIONS = [
  {
    id: 'GRADE',
    name: 'Quy trình duyệt điểm học tập',
    code: 'A3.1',
    description: 'Giảng viên tạo bảng điểm → nộp lên → Trưởng bộ môn phê duyệt',
    category: 'education',
    states: Object.keys(GRADE_TRANSITIONS).map(s => ({
      key: s,
      label: GRADE_STATUS_NAMES[s as keyof typeof GRADE_STATUS_NAMES],
      isFinal: GRADE_TRANSITIONS[s as keyof typeof GRADE_TRANSITIONS].length === 0,
    })),
    transitions: Object.entries(GRADE_TRANSITIONS).flatMap(([from, tos]) =>
      tos.map(to => ({ from, to }))
    ),
    rbacCodes: { submit: 'SUBMIT_GRADE', approve: 'APPROVE_GRADE', reject: 'REJECT_GRADE' },
    color: 'blue',
  },
  {
    id: 'RESEARCH',
    name: 'Quy trình đề tài NCKH',
    code: 'A3.2',
    description: 'Đăng ký → Thẩm định → Phê duyệt → Thực hiện → Nghiệm thu',
    category: 'research',
    states: Object.keys(RESEARCH_TRANSITIONS).map(s => ({
      key: s,
      label: RESEARCH_STATUS_NAMES[s as keyof typeof RESEARCH_STATUS_NAMES],
      isFinal: RESEARCH_TRANSITIONS[s as keyof typeof RESEARCH_TRANSITIONS].length === 0,
    })),
    transitions: Object.entries(RESEARCH_TRANSITIONS).flatMap(([from, tos]) =>
      tos.map(to => ({ from, to }))
    ),
    rbacCodes: { submit: 'SUBMIT_RESEARCH', review: 'REVIEW_RESEARCH', approve: 'APPROVE_RESEARCH' },
    color: 'pink',
  },
  {
    id: 'POLICY_REQUEST',
    name: 'Quy trình hồ sơ chính sách',
    code: 'A3.3',
    description: 'Cán bộ đề xuất → Xét duyệt → Phê duyệt → Hoàn thành',
    category: 'policy',
    states: Object.keys(POLICY_REQUEST_TRANSITIONS).map(s => ({
      key: s,
      label: POLICY_REQUEST_STATUS_NAMES[s as keyof typeof POLICY_REQUEST_STATUS_NAMES],
      isFinal: POLICY_REQUEST_TRANSITIONS[s as keyof typeof POLICY_REQUEST_TRANSITIONS].length === 0,
    })),
    transitions: Object.entries(POLICY_REQUEST_TRANSITIONS).flatMap(([from, tos]) =>
      tos.map(to => ({ from, to }))
    ),
    rbacCodes: { submit: 'CREATE_POLICY_REQUEST', review: 'REVIEW_POLICY', approve: 'APPROVE_POLICY' },
    color: 'amber',
  },
  {
    id: 'AWARD',
    name: 'Quy trình khen thưởng/kỷ luật',
    code: 'A3.4',
    description: 'Đề xuất → Xét duyệt → Phê duyệt (có kiểm tra SoD)',
    category: 'awards',
    states: Object.keys(AWARD_TRANSITIONS).map(s => ({
      key: s,
      label: AWARD_STATUS_NAMES[s as keyof typeof AWARD_STATUS_NAMES],
      isFinal: AWARD_TRANSITIONS[s as keyof typeof AWARD_TRANSITIONS].length === 0,
    })),
    transitions: Object.entries(AWARD_TRANSITIONS).flatMap(([from, tos]) =>
      tos.map(to => ({ from, to }))
    ),
    rbacCodes: { propose: 'CREATE_AWARD', review: 'UPDATE_AWARD', approve: 'APPROVE_AWARD' },
    sodEnabled: true,
    sodNote: 'Người đề xuất không được tự phê duyệt (SoD)',
    color: 'yellow',
  },
];

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, WORKFLOW.VIEW_DEFINITIONS);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const definitions = category
      ? WORKFLOW_DEFINITIONS.filter(d => d.category === category)
      : WORKFLOW_DEFINITIONS;

    return NextResponse.json({
      definitions,
      total: definitions.length,
    });
  } catch (error) {
    console.error('[Workflow Definitions GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
