/**
 * Tests – Workflow Engine Service (M13)
 *
 * Test: WorkflowError codes, state machine invalid transitions, REJECT requires comment.
 * Mock prisma và authorize để test business logic thuần.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkflowActionCode, WorkflowInstanceStatus, WorkflowVersionStatus } from '@prisma/client';

// ===== MOCKS =====

const mockAuthorize = vi.hoisted(() => vi.fn());
const mockPrisma = vi.hoisted(() => ({
  workflowTemplate: { findUnique: vi.fn() },
  workflowTemplateVersion: { findFirst: vi.fn() },
  workflowStepTemplate: { findMany: vi.fn(), findFirst: vi.fn() },
  workflowTransitionTemplate: { findFirst: vi.fn() },
  workflowInstance: { findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn() },
  workflowStepInstance: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
  workflowAction: { create: vi.fn(), findMany: vi.fn() },
  workflowAuditLog: { create: vi.fn() },
  workflowNotification: { create: vi.fn() },
  workflowEscalation: { findFirst: vi.fn(), create: vi.fn() },
  user: { findUnique: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock('@/lib/db', () => ({ default: mockPrisma, prisma: mockPrisma }));
vi.mock('@/lib/rbac/authorize', () => ({ authorize: mockAuthorize }));
vi.mock('server-only', () => ({}));

// Stub notification service
vi.mock('@/lib/services/workflow/workflow-notification.service', () => ({
  WorkflowNotificationService: { send: vi.fn() },
  WF_EVENT: { ASSIGNED: 'ASSIGNED', APPROVED: 'APPROVED', REJECTED: 'REJECTED' },
}));

import { WorkflowEngineService as workflowEngine, WorkflowError } from '@/lib/services/workflow/workflow-engine.service';

function makeActor() {
  return { id: 'user-1', email: 'test@hvhc.edu.vn', name: 'Test', role: 'CAN_BO' } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
  // Default: authorize allows
  mockAuthorize.mockResolvedValue({ allowed: true });
});

// ===== START WORKFLOW =====

describe('WorkflowEngineService.startWorkflow', () => {
  it('throw FORBIDDEN khi user không có quyền INITIATE', async () => {
    mockAuthorize.mockResolvedValue({ allowed: false, deniedReason: 'Không có quyền' });
    const engine = workflowEngine;
    await expect(
      engine.startWorkflow({ templateCode: 'TEST', entityType: 'Policy', entityId: 'e-1', title: 'T' }, makeActor())
    ).rejects.toThrow(WorkflowError);

    try {
      await engine.startWorkflow({ templateCode: 'TEST', entityType: 'Policy', entityId: 'e-1', title: 'T' }, makeActor());
    } catch (e) {
      expect((e as WorkflowError).code).toBe('FORBIDDEN');
    }
  });

  it('throw NOT_FOUND khi template không tồn tại', async () => {
    mockPrisma.workflowTemplate.findUnique.mockResolvedValue(null);
    const engine = workflowEngine;
    await expect(
      engine.startWorkflow({ templateCode: 'GHOST', entityType: 'Policy', entityId: 'e-2', title: 'T' }, makeActor())
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('throw TEMPLATE_NOT_PUBLISHED khi không có version PUBLISHED', async () => {
    mockPrisma.workflowTemplate.findUnique.mockResolvedValue({ id: 'tmpl-1', isActive: true });
    mockPrisma.workflowTemplateVersion.findFirst.mockResolvedValue(null);
    const engine = workflowEngine;
    await expect(
      engine.startWorkflow({ templateCode: 'UNPUBLISHED', entityType: 'Policy', entityId: 'e-3', title: 'T' }, makeActor())
    ).rejects.toMatchObject({ code: 'TEMPLATE_NOT_PUBLISHED' });
  });
});

// ===== ACT ON WORKFLOW =====

describe('WorkflowEngineService.actOnWorkflow', () => {
  function makeInstance(status: WorkflowInstanceStatus) {
    return {
      id: 'inst-1',
      status,
      currentStepCode: 'STEP_REVIEW',
      templateVersionId: 'ver-1',
      currentAssigneeId: 'user-1',
      initiatorId: 'user-1',
      entityType: 'Policy',
      entityId: 'pol-1',
      title: 'Test Workflow',
    };
  }

  function makeStep() {
    return {
      id: 'step-inst-1',
      status: 'IN_PROGRESS',
      stepCode: 'STEP_REVIEW',
      workflowInstanceId: 'inst-1',
      assigneeId: 'user-1',
    };
  }

  function makeStepTemplate() {
    return {
      stepCode: 'STEP_REVIEW',
      stepType: 'APPROVAL',
      requiredActionCodes: ['APPROVE', 'REJECT'],
      requiresComment: false,
      formSchemaJson: null,
    };
  }

  it('throw NOT_FOUND khi instance không tồn tại', async () => {
    mockPrisma.workflowInstance.findUnique.mockResolvedValue(null);
    const engine = workflowEngine;
    await expect(
      engine.actOnWorkflow({ workflowInstanceId: 'ghost', actionCode: WorkflowActionCode.APPROVE }, makeActor())
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('throw INVALID_STATE khi instance đã APPROVED', async () => {
    mockPrisma.workflowInstance.findUnique.mockResolvedValue(makeInstance(WorkflowInstanceStatus.APPROVED));
    const engine = workflowEngine;
    await expect(
      engine.actOnWorkflow({ workflowInstanceId: 'inst-1', actionCode: WorkflowActionCode.APPROVE }, makeActor())
    ).rejects.toMatchObject({ code: 'INVALID_STATE' });
  });

  it('throw COMMENT_REQUIRED khi REJECT không có comment', async () => {
    const instance = makeInstance(WorkflowInstanceStatus.IN_PROGRESS);
    mockPrisma.workflowInstance.findUnique.mockResolvedValue(instance);
    mockPrisma.workflowStepInstance.findFirst.mockResolvedValue(makeStep());
    // REJECT cần transition record để không throw INVALID_TRANSITION trước
    mockPrisma.workflowTransitionTemplate.findFirst.mockResolvedValue({
      id: 'trans-1',
      toStepCode: null,
      actionCode: 'REJECT',
    });

    const engine = workflowEngine;
    await expect(
      engine.actOnWorkflow(
        { workflowInstanceId: 'inst-1', actionCode: WorkflowActionCode.REJECT, comment: '' },
        makeActor()
      )
    ).rejects.toMatchObject({ code: 'COMMENT_REQUIRED' });
  });

  it('WorkflowError là instanceof Error', () => {
    const err = new WorkflowError('test', 'FORBIDDEN');
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe('FORBIDDEN');
    expect(err.name).toBe('WorkflowError');
  });
});

// ===== ERROR CODE COVERAGE =====

describe('WorkflowError codes', () => {
  const codes = ['FORBIDDEN', 'NOT_FOUND', 'INVALID_TRANSITION', 'INVALID_STATE', 'TEMPLATE_NOT_PUBLISHED', 'COMMENT_REQUIRED'] as const;

  codes.forEach((code) => {
    it(`có thể tạo WorkflowError với code: ${code}`, () => {
      const err = new WorkflowError(`msg ${code}`, code);
      expect(err.code).toBe(code);
      expect(err.message).toContain(code);
    });
  });
});
