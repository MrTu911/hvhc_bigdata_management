/**
 * M12 – Pipeline Definition & Run Service
 *
 * Quản lý vòng đời pipeline: định nghĩa, trigger, theo dõi trạng thái,
 * retry và báo cáo kết quả.
 *
 * Không chứa business transformation logic — đó là trách nhiệm của
 * các Airflow DAG và ETL worker thực thi bên ngoài.
 */

import prisma from '@/lib/db';
import type {
  PipelineDefinition,
  PipelineRun,
  PipelineDefType,
  PipelineRunStatus,
  PipelineTrigger,
} from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreatePipelineDefinitionInput {
  name:          string;
  description?:  string;
  pipelineType:  PipelineDefType;
  sourceDataset: string;
  targetDataset?: string;
  scheduleCron?: string;
  steps:         object[];     // [{name, type, config}]
  parameters?:   object;
  createdById:   string;
}

export interface TriggerRunInput {
  definitionId:   string;
  triggeredBy:    PipelineTrigger;
  triggeredById?: string;
  metadata?:      object;
}

export interface CompleteRunInput {
  runId:           string;
  status:          PipelineRunStatus;
  recordsRead?:    number;
  recordsWritten?: number;
  recordsSkipped?: number;
  errorCount?:     number;
  errorMessage?:   string;
  logPath?:        string;
  metadata?:       object;
}

export interface ListPipelineRunsFilter {
  definitionId?: string;
  status?:       PipelineRunStatus;
  triggeredBy?:  PipelineTrigger;
  fromDate?:     Date;
  toDate?:       Date;
  page?:         number;
  pageSize?:     number;
}

// ─── Definition CRUD ──────────────────────────────────────────────────────────

export async function createPipelineDefinition(
  input: CreatePipelineDefinitionInput,
): Promise<PipelineDefinition> {
  return prisma.pipelineDefinition.create({
    data: {
      name:          input.name,
      description:   input.description,
      pipelineType:  input.pipelineType,
      sourceDataset: input.sourceDataset,
      targetDataset: input.targetDataset,
      scheduleCron:  input.scheduleCron,
      steps:         input.steps,
      parameters:    input.parameters ?? {},
      isActive:      true,
      createdById:   input.createdById,
    },
  });
}

export async function listPipelineDefinitions(activeOnly = true) {
  return prisma.pipelineDefinition.findMany({
    where:   activeOnly ? { isActive: true } : undefined,
    orderBy: { createdAt: 'desc' },
    select: {
      id:             true,
      name:           true,
      pipelineType:   true,
      sourceDataset:  true,
      targetDataset:  true,
      scheduleCron:   true,
      isActive:       true,
      lastRunAt:      true,
      lastRunStatus:  true,
    },
  });
}

export async function getPipelineDefinition(id: string): Promise<PipelineDefinition | null> {
  return prisma.pipelineDefinition.findUnique({ where: { id } });
}

export async function togglePipelineActive(id: string, isActive: boolean): Promise<void> {
  await prisma.pipelineDefinition.update({ where: { id }, data: { isActive } });
}

// ─── Run lifecycle ────────────────────────────────────────────────────────────

/**
 * Tạo một run record và trả về ngay để caller track được id.
 * Không tự chạy pipeline — việc chạy thực sự do Airflow/worker đảm nhiệm.
 */
export async function triggerPipelineRun(input: TriggerRunInput): Promise<PipelineRun> {
  const definition = await prisma.pipelineDefinition.findUnique({
    where: { id: input.definitionId },
  });
  if (!definition) throw new Error(`Pipeline definition ${input.definitionId} not found`);
  if (!definition.isActive) throw new Error(`Pipeline ${definition.name} is disabled`);

  // Không cho trigger khi đang có run RUNNING cùng definition (chống double-trigger)
  const running = await prisma.pipelineRun.findFirst({
    where: { definitionId: input.definitionId, status: 'RUNNING' },
  });
  if (running) {
    throw new Error(`Pipeline ${definition.name} is already running (runId: ${running.id})`);
  }

  const run = await prisma.pipelineRun.create({
    data: {
      definitionId:  input.definitionId,
      triggeredBy:   input.triggeredBy,
      triggeredById: input.triggeredById,
      status:        'PENDING',
      metadata:      input.metadata ?? {},
    },
  });

  return run;
}

/**
 * Đánh dấu run đã bắt đầu chạy. Worker gọi sau khi nhận job.
 */
export async function markRunStarted(runId: string): Promise<void> {
  await prisma.pipelineRun.update({
    where: { id: runId },
    data:  { status: 'RUNNING', startedAt: new Date() },
  });
}

/**
 * Ghi kết quả hoàn thành (success hoặc failure).
 * Đồng thời cập nhật lastRunAt và lastRunStatus trên definition.
 */
export async function completeRun(input: CompleteRunInput): Promise<void> {
  const completedAt = new Date();

  const run = await prisma.pipelineRun.findUnique({ where: { id: input.runId } });
  if (!run) throw new Error(`PipelineRun ${input.runId} not found`);

  const durationMs = run.startedAt
    ? completedAt.getTime() - run.startedAt.getTime()
    : undefined;

  await prisma.$transaction([
    prisma.pipelineRun.update({
      where: { id: input.runId },
      data: {
        status:          input.status,
        completedAt,
        durationMs,
        recordsRead:     input.recordsRead,
        recordsWritten:  input.recordsWritten,
        recordsSkipped:  input.recordsSkipped,
        errorCount:      input.errorCount ?? 0,
        errorMessage:    input.errorMessage,
        logPath:         input.logPath,
        metadata:        input.metadata ?? {},
      },
    }),
    prisma.pipelineDefinition.update({
      where: { id: run.definitionId },
      data: {
        lastRunAt:     completedAt,
        lastRunStatus: input.status,
      },
    }),
  ]);
}

/**
 * Cancel một run đang PENDING (chưa bắt đầu).
 */
export async function cancelRun(runId: string, reason?: string): Promise<void> {
  const run = await prisma.pipelineRun.findUnique({ where: { id: runId } });
  if (!run) throw new Error(`PipelineRun ${runId} not found`);
  if (run.status !== 'PENDING') {
    throw new Error(`Cannot cancel run with status ${run.status}`);
  }
  await prisma.pipelineRun.update({
    where: { id: runId },
    data:  { status: 'CANCELLED', errorMessage: reason, completedAt: new Date() },
  });
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function listPipelineRuns(filter: ListPipelineRunsFilter) {
  const page     = filter.page     ?? 1;
  const pageSize = filter.pageSize ?? 20;

  const where: Parameters<typeof prisma.pipelineRun.findMany>[0]['where'] = {};
  if (filter.definitionId) where.definitionId = filter.definitionId;
  if (filter.status)       where.status       = filter.status;
  if (filter.triggeredBy)  where.triggeredBy  = filter.triggeredBy;
  if (filter.fromDate || filter.toDate) {
    where.startedAt = {};
    if (filter.fromDate) where.startedAt.gte = filter.fromDate;
    if (filter.toDate)   where.startedAt.lte = filter.toDate;
  }

  const [runs, total] = await prisma.$transaction([
    prisma.pipelineRun.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      skip:    (page - 1) * pageSize,
      take:    pageSize,
      include: { definition: { select: { name: true, pipelineType: true } } },
    }),
    prisma.pipelineRun.count({ where }),
  ]);

  return { runs, total, page, pageSize };
}

export async function getPipelineRunSummary(definitionId: string) {
  const [totalRuns, successRuns, failedRuns, lastRun] = await prisma.$transaction([
    prisma.pipelineRun.count({ where: { definitionId } }),
    prisma.pipelineRun.count({ where: { definitionId, status: 'COMPLETED' } }),
    prisma.pipelineRun.count({ where: { definitionId, status: 'FAILED' } }),
    prisma.pipelineRun.findFirst({
      where:   { definitionId },
      orderBy: { startedAt: 'desc' },
    }),
  ]);

  return { totalRuns, successRuns, failedRuns, lastRun };
}
