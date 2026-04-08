/**
 * M13 – Workflow Template Service (Phase 1)
 *
 * Quản lý vòng đời của WorkflowTemplate và WorkflowTemplateVersion.
 * Bao gồm: CRUD, validate definition, publish, archive.
 *
 * Quyền:
 *  - WF.DESIGN  → tạo/sửa draft
 *  - WF.OVERRIDE → publish / archive
 *  - WF.VIEW    → đọc
 */

import prisma from '@/lib/db';
import { authorize } from '@/lib/rbac/authorize';
import { WORKFLOW } from '@/lib/rbac/function-codes';
import { AuthUser } from '@/lib/rbac/types';
import { WorkflowVersionStatus } from '@prisma/client';
import { WorkflowError } from './workflow-engine.service';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateTemplateInput {
  code: string;
  name: string;
  moduleKey?: string;
  description?: string;
}

export interface UpsertVersionStepsInput {
  steps: Array<{
    code: string;
    name: string;
    stepType: 'START' | 'TASK' | 'APPROVAL' | 'SIGNATURE' | 'END';
    orderIndex: number;
    slaHours?: number;
    isParallel?: boolean;
    requiresSignature?: boolean;
    configJson?: Record<string, unknown>;
  }>;
  transitions: Array<{
    fromStepCode: string;
    actionCode: string;
    toStepCode: string;
    conditionExpression?: string;
    priority?: number;
  }>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class WorkflowTemplateServiceClass {

  /**
   * Tạo template mới (DRAFT, chưa có version).
   */
  async createTemplate(input: CreateTemplateInput, actor: AuthUser) {
    const auth = await authorize(actor, WORKFLOW.DESIGN);
    if (!auth.allowed) {
      throw new WorkflowError(auth.deniedReason ?? 'Không có quyền tạo workflow template', 'FORBIDDEN');
    }

    const existing = await prisma.workflowTemplate.findUnique({ where: { code: input.code } });
    if (existing) {
      throw new WorkflowError(`Template code "${input.code}" đã tồn tại`, 'INVALID_STATE');
    }

    return prisma.workflowTemplate.create({
      data: {
        code: input.code,
        name: input.name,
        moduleKey: input.moduleKey ?? '',
        description: input.description,
        createdBy: actor.id,
      },
    });
  }

  /**
   * Tạo version DRAFT mới cho template đã có.
   * Tự động tăng versionNo.
   */
  async createVersion(templateId: string, actor: AuthUser) {
    const auth = await authorize(actor, WORKFLOW.DESIGN);
    if (!auth.allowed) {
      throw new WorkflowError(auth.deniedReason ?? 'Không có quyền tạo version', 'FORBIDDEN');
    }

    const template = await prisma.workflowTemplate.findUnique({ where: { id: templateId } });
    if (!template) {
      throw new WorkflowError(`Template không tồn tại: ${templateId}`, 'NOT_FOUND');
    }

    const lastVersion = await prisma.workflowTemplateVersion.findFirst({
      where: { templateId },
      orderBy: { versionNo: 'desc' },
      select: { versionNo: true },
    });

    return prisma.workflowTemplateVersion.create({
      data: {
        templateId,
        versionNo: (lastVersion?.versionNo ?? 0) + 1,
        status: WorkflowVersionStatus.DRAFT,
      },
    });
  }

  /**
   * Lưu steps + transitions vào một DRAFT version.
   * Thay thế toàn bộ steps/transitions hiện có (upsert toàn version).
   */
  async saveVersionDefinition(
    versionId: string,
    input: UpsertVersionStepsInput,
    actor: AuthUser
  ) {
    const auth = await authorize(actor, WORKFLOW.DESIGN);
    if (!auth.allowed) {
      throw new WorkflowError(auth.deniedReason ?? 'Không có quyền sửa version', 'FORBIDDEN');
    }

    const version = await prisma.workflowTemplateVersion.findUnique({ where: { id: versionId } });
    if (!version) {
      throw new WorkflowError(`Version không tồn tại: ${versionId}`, 'NOT_FOUND');
    }
    if (version.status !== WorkflowVersionStatus.DRAFT) {
      throw new WorkflowError('Chỉ được sửa version đang ở trạng thái DRAFT', 'INVALID_STATE');
    }

    await prisma.$transaction([
      // Xóa steps/transitions cũ rồi tạo lại
      prisma.workflowStepTemplate.deleteMany({ where: { templateVersionId: versionId } }),
      prisma.workflowTransitionTemplate.deleteMany({ where: { templateVersionId: versionId } }),
      prisma.workflowStepTemplate.createMany({
        data: input.steps.map((s) => ({
          templateVersionId: versionId,
          code: s.code,
          name: s.name,
          stepType: s.stepType,
          orderIndex: s.orderIndex,
          slaHours: s.slaHours,
          isParallel: s.isParallel ?? false,
          requiresSignature: s.requiresSignature ?? false,
          configJson: s.configJson ?? undefined,
        })),
      }),
      prisma.workflowTransitionTemplate.createMany({
        data: input.transitions.map((t) => ({
          templateVersionId: versionId,
          fromStepCode: t.fromStepCode,
          actionCode: t.actionCode,
          toStepCode: t.toStepCode,
          conditionExpression: t.conditionExpression,
          priority: t.priority ?? 0,
        })),
      }),
    ]);

    return prisma.workflowTemplateVersion.findUnique({
      where: { id: versionId },
      include: { steps: true, transitions: true },
    });
  }

  /**
   * Validate definition trước khi publish.
   *
   * Kiểm tra:
   * 1. Có đúng 1 START step
   * 2. Có ít nhất 1 END step
   * 3. Không có step mồ côi (không có transition vào)
   * 4. Không có transition thiếu fromStep hoặc toStep thật sự tồn tại
   * 5. Mọi APPROVAL step phải có ít nhất 1 transition ra
   * 6. Mọi step code là unique trong version
   */
  async validateVersion(versionId: string, actor: AuthUser): Promise<ValidationResult> {
    const auth = await authorize(actor, WORKFLOW.DESIGN);
    if (!auth.allowed) {
      throw new WorkflowError(auth.deniedReason ?? 'Không có quyền validate', 'FORBIDDEN');
    }

    const version = await prisma.workflowTemplateVersion.findUnique({
      where: { id: versionId },
      include: { steps: true, transitions: true },
    });
    if (!version) {
      throw new WorkflowError(`Version không tồn tại: ${versionId}`, 'NOT_FOUND');
    }

    const errors: string[] = [];
    const steps = version.steps;
    const transitions = version.transitions;
    const stepCodes = new Set(steps.map((s) => s.code));

    // 1. Đúng 1 START step
    const startSteps = steps.filter((s) => s.stepType === 'START');
    if (startSteps.length !== 1) {
      errors.push(`Phải có đúng 1 START step (hiện có ${startSteps.length})`);
    }

    // 2. Ít nhất 1 END step
    const endSteps = steps.filter((s) => s.stepType === 'END');
    if (endSteps.length === 0) {
      errors.push('Phải có ít nhất 1 END step');
    }

    // 3. Không có transition trỏ đến step không tồn tại
    for (const t of transitions) {
      if (!stepCodes.has(t.fromStepCode)) {
        errors.push(`Transition từ bước không tồn tại: "${t.fromStepCode}"`);
      }
      if (!stepCodes.has(t.toStepCode)) {
        errors.push(`Transition đến bước không tồn tại: "${t.toStepCode}"`);
      }
    }

    // 4. Mọi step không phải END phải có ít nhất 1 transition đi ra
    const fromCodes = new Set(transitions.map((t) => t.fromStepCode));
    for (const step of steps) {
      if (step.stepType !== 'END' && !fromCodes.has(step.code)) {
        errors.push(`Bước "${step.code}" (${step.stepType}) không có transition đi ra`);
      }
    }

    // 5. Transition không được thiếu actionCode
    for (const t of transitions) {
      if (!t.actionCode) {
        errors.push(`Transition ${t.fromStepCode} → ${t.toStepCode} thiếu actionCode`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Publish một version DRAFT.
   * Tự động archive version PUBLISHED cũ nếu có.
   */
  async publishVersion(versionId: string, actor: AuthUser) {
    const auth = await authorize(actor, WORKFLOW.OVERRIDE);
    if (!auth.allowed) {
      throw new WorkflowError(auth.deniedReason ?? 'Không có quyền publish', 'FORBIDDEN');
    }

    const version = await prisma.workflowTemplateVersion.findUnique({ where: { id: versionId } });
    if (!version) {
      throw new WorkflowError(`Version không tồn tại: ${versionId}`, 'NOT_FOUND');
    }
    if (version.status !== WorkflowVersionStatus.DRAFT) {
      throw new WorkflowError('Chỉ publish được version ở trạng thái DRAFT', 'INVALID_STATE');
    }

    // Validate trước khi publish
    const validation = await this.validateVersion(versionId, actor);
    if (!validation.valid) {
      throw new WorkflowError(
        `Không thể publish: ${validation.errors.join('; ')}`,
        'INVALID_STATE'
      );
    }

    return prisma.$transaction(async (tx) => {
      // Archive version PUBLISHED cũ nếu có
      await tx.workflowTemplateVersion.updateMany({
        where: { templateId: version.templateId, status: WorkflowVersionStatus.PUBLISHED },
        data: { status: WorkflowVersionStatus.ARCHIVED },
      });

      // Publish version này
      return tx.workflowTemplateVersion.update({
        where: { id: versionId },
        data: {
          status: WorkflowVersionStatus.PUBLISHED,
          publishedAt: new Date(),
          publishedBy: actor.id,
        },
      });
    });
  }

  /**
   * Archive một version (PUBLISHED hoặc DRAFT).
   * Không archive version nếu còn workflow instance đang chạy dùng nó.
   */
  async archiveVersion(versionId: string, actor: AuthUser) {
    const auth = await authorize(actor, WORKFLOW.OVERRIDE);
    if (!auth.allowed) {
      throw new WorkflowError(auth.deniedReason ?? 'Không có quyền archive', 'FORBIDDEN');
    }

    const activeInstances = await prisma.workflowInstance.count({
      where: {
        templateVersionId: versionId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
    });
    if (activeInstances > 0) {
      throw new WorkflowError(
        `Không thể archive: còn ${activeInstances} workflow instance đang chạy dùng version này`,
        'INVALID_STATE'
      );
    }

    return prisma.workflowTemplateVersion.update({
      where: { id: versionId },
      data: { status: WorkflowVersionStatus.ARCHIVED },
    });
  }

  /** Danh sách templates với filter cơ bản */
  async listTemplates(actor: AuthUser, moduleKey?: string) {
    const auth = await authorize(actor, WORKFLOW.VIEW);
    if (!auth.allowed) {
      throw new WorkflowError(auth.deniedReason ?? 'Không có quyền xem templates', 'FORBIDDEN');
    }

    return prisma.workflowTemplate.findMany({
      where: {
        isActive: true,
        ...(moduleKey ? { moduleKey } : {}),
      },
      include: {
        versions: {
          where: { status: WorkflowVersionStatus.PUBLISHED },
          select: { id: true, versionNo: true, publishedAt: true },
          take: 1,
        },
      },
      orderBy: { moduleKey: 'asc' },
    });
  }
}

export const WorkflowTemplateService = new WorkflowTemplateServiceClass();
