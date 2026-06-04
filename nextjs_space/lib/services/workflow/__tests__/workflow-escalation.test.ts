/**
 * Tests – WorkflowEscalationWorker (M13)
 *
 * Test: idempotency, limit, step filtering, duplicate prevention.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ===== MOCKS =====

const mockPrisma = vi.hoisted(() => ({
  workflowStepInstance: {
    findMany: vi.fn(),
  },
  workflowEscalation: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  user: { findUnique: vi.fn() },
  unit: { findUnique: vi.fn() },
}));

vi.mock('@/lib/db', () => ({ default: mockPrisma, prisma: mockPrisma }));
vi.mock('server-only', () => ({}));

const mockNotificationSend = vi.hoisted(() => vi.fn());
vi.mock('@/lib/services/workflow/workflow-notification.service', () => ({
  WorkflowNotificationService: { send: mockNotificationSend },
  WF_EVENT: { ESCALATED: 'ESCALATED' },
}));

import { WorkflowEscalationWorker } from '@/lib/workers/workflow-escalation-worker';

function makeStep(id: string, instanceId: string) {
  return {
    id,
    stepCode: `STEP_${id}`,
    workflowInstanceId: instanceId,
    workflowInstance: { id: instanceId, title: `Workflow ${instanceId}`, initiatorId: 'user-init' },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockNotificationSend.mockResolvedValue(undefined);
});

describe('WorkflowEscalationWorker.processExpiredSteps', () => {
  it('tạo escalation và gửi thông báo cho step EXPIRED chưa escalate', async () => {
    const step = makeStep('step-1', 'inst-1');
    mockPrisma.workflowStepInstance.findMany.mockResolvedValue([step]);
    mockPrisma.workflowEscalation.findFirst.mockResolvedValue(null); // chưa có escalation
    mockPrisma.workflowEscalation.create.mockResolvedValue({ id: 'esc-1' });

    const worker = new WorkflowEscalationWorker();
    const result = await worker.processExpiredSteps();

    expect(result.escalated).toBe(1);
    expect(result.alreadyEscalated).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(mockPrisma.workflowEscalation.create).toHaveBeenCalledOnce();
    expect(mockNotificationSend).toHaveBeenCalledOnce();
  });

  it('idempotent: không tạo duplicate escalation khi chạy lần 2', async () => {
    const step = makeStep('step-2', 'inst-2');
    mockPrisma.workflowStepInstance.findMany.mockResolvedValue([step]);
    // Lần 2: đã có escalation SYSTEM
    mockPrisma.workflowEscalation.findFirst.mockResolvedValue({ id: 'existing-esc' });

    const worker = new WorkflowEscalationWorker();
    const result = await worker.processExpiredSteps();

    expect(result.escalated).toBe(0);
    expect(result.alreadyEscalated).toBe(1);
    expect(mockPrisma.workflowEscalation.create).not.toHaveBeenCalled();
    expect(mockNotificationSend).not.toHaveBeenCalled();
  });

  it('xử lý mix: 1 step mới + 1 step đã escalate', async () => {
    const steps = [makeStep('step-3', 'inst-3'), makeStep('step-4', 'inst-3')];
    mockPrisma.workflowStepInstance.findMany.mockResolvedValue(steps);
    // step-3 chưa có, step-4 đã có
    mockPrisma.workflowEscalation.findFirst
      .mockResolvedValueOnce(null)           // step-3: không có escalation
      .mockResolvedValueOnce({ id: 'esc-4' }); // step-4: đã escalate
    mockPrisma.workflowEscalation.create.mockResolvedValue({ id: 'new-esc' });

    const worker = new WorkflowEscalationWorker();
    const result = await worker.processExpiredSteps();

    expect(result.escalated).toBe(1);
    expect(result.alreadyEscalated).toBe(1);
    expect(mockPrisma.workflowEscalation.create).toHaveBeenCalledOnce();
  });

  it('giới hạn take tối đa 100', async () => {
    mockPrisma.workflowStepInstance.findMany.mockResolvedValue([]);

    const worker = new WorkflowEscalationWorker();
    // Gọi với limit 9999
    await worker.processExpiredSteps(9999);

    const call = mockPrisma.workflowStepInstance.findMany.mock.calls[0][0];
    expect(call.take).toBe(100); // capped at 100
  });

  it('ghi lỗi vào result.errors khi một step throw exception', async () => {
    const step = makeStep('step-err', 'inst-err');
    mockPrisma.workflowStepInstance.findMany.mockResolvedValue([step]);
    mockPrisma.workflowEscalation.findFirst.mockResolvedValue(null);
    mockPrisma.workflowEscalation.create.mockRejectedValue(new Error('DB timeout'));

    const worker = new WorkflowEscalationWorker();
    const result = await worker.processExpiredSteps();

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].stepId).toBe('step-err');
    expect(result.errors[0].message).toContain('DB timeout');
    expect(result.escalated).toBe(0);
  });

  it('trả về runAt dạng ISO string', async () => {
    mockPrisma.workflowStepInstance.findMany.mockResolvedValue([]);
    const worker = new WorkflowEscalationWorker();
    const result = await worker.processExpiredSteps();
    expect(() => new Date(result.runAt)).not.toThrow();
    expect(result.runAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
