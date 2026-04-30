/**
 * M12 – Backup, Restore & Disaster Recovery Service
 *
 * Quản lý vòng đời backup jobs, artifacts, restore requests và DR exercises.
 * Không tự chạy pg_dump — đó là trách nhiệm Airflow DAG backup.
 * Service chỉ theo dõi trạng thái, validate artifact và audit thao tác nhạy cảm.
 */

import prisma from '@/lib/db';
import type {
  BackupJob,
  BackupArtifact,
  RestoreJob,
  DisasterRecoveryPlan,
  DisasterRecoveryExercise,
  BackupType,
  BackupJobStatus,
  PipelineTrigger,
  RestoreJobStatus,
  RestoreVerifyStatus,
  DRExerciseOutcome,
} from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateBackupJobInput {
  backupType:     BackupType;
  targetPath:     string;
  triggeredBy:    PipelineTrigger;
  requestedById?: string;
}

export interface CompleteBackupJobInput {
  jobId:        string;
  status:       BackupJobStatus;
  sizeBytes?:   bigint;
  errorMessage?: string;
}

export interface RegisterArtifactInput {
  jobId:           string;
  storagePath:     string;
  sizeBytes:       bigint;
  checksumHash?:   string;
  retentionUntil?: Date;
  metadata?:       object;
}

export interface CreateRestoreJobInput {
  backupJobId:       string;
  targetEnvironment: string;
  requestedById:     string;
  notes?:            string;
}

export interface VerifyRestoreInput {
  restoreJobId:       string;
  verificationStatus: RestoreVerifyStatus;
  verificationNote?:  string;
}

export interface CreateDRPlanInput {
  name:          string;
  description?:  string;
  rtoTargetMin:  number;
  rpoTargetMin:  number;
  runbookPath?:  string;
  createdById:   string;
}

export interface RecordDRExerciseInput {
  planId:          string;
  exercisedAt:     Date;
  conductedById:   string;
  outcome:         DRExerciseOutcome;
  rtoAchievedMin?: number;
  rpoAchievedMin?: number;
  findings?:       string;
  nextReviewDate?: Date;
}

// ─── Backup Jobs ──────────────────────────────────────────────────────────────

export async function createBackupJob(input: CreateBackupJobInput): Promise<BackupJob> {
  return prisma.backupJob.create({
    data: {
      backupType:    input.backupType,
      targetPath:    input.targetPath,
      triggeredBy:   input.triggeredBy,
      requestedById: input.requestedById,
      status:        'PENDING',
    },
  });
}

export async function markBackupJobStarted(jobId: string): Promise<void> {
  await prisma.backupJob.update({
    where: { id: jobId },
    data:  { status: 'RUNNING', startedAt: new Date() },
  });
}

export async function completeBackupJob(input: CompleteBackupJobInput): Promise<void> {
  const completedAt = new Date();
  const job = await prisma.backupJob.findUnique({ where: { id: input.jobId } });
  if (!job) throw new Error(`BackupJob ${input.jobId} not found`);

  const durationMs = job.startedAt
    ? completedAt.getTime() - job.startedAt.getTime()
    : undefined;

  await prisma.backupJob.update({
    where: { id: input.jobId },
    data: {
      status:       input.status,
      completedAt,
      durationMs,
      sizeBytes:    input.sizeBytes,
      errorMessage: input.errorMessage,
    },
  });
}

export async function listBackupJobs(opts: {
  backupType?: BackupType;
  status?:     BackupJobStatus;
  page?:       number;
  pageSize?:   number;
}) {
  const page     = opts.page     ?? 1;
  const pageSize = opts.pageSize ?? 20;

  const where: Parameters<typeof prisma.backupJob.findMany>[0]['where'] = {};
  if (opts.backupType) where.backupType = opts.backupType;
  if (opts.status)     where.status     = opts.status;

  const [jobs, total] = await prisma.$transaction([
    prisma.backupJob.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      skip:    (page - 1) * pageSize,
      take:    pageSize,
      include: { _count: { select: { artifacts: true } } },
    }),
    prisma.backupJob.count({ where }),
  ]);

  return { jobs, total, page, pageSize };
}

/**
 * Kiểm tra backup freshness — dùng cho alert threshold policy.
 * Trả về số phút kể từ lần backup POSTGRESQL_FULL thành công gần nhất.
 */
export async function getBackupFreshnessMinutes(
  backupType: BackupType = 'POSTGRESQL_FULL',
): Promise<number | null> {
  const latest = await prisma.backupJob.findFirst({
    where:   { backupType, status: 'COMPLETED' },
    orderBy: { completedAt: 'desc' },
  });
  if (!latest?.completedAt) return null;
  return Math.floor((Date.now() - latest.completedAt.getTime()) / 60_000);
}

// ─── Artifacts ────────────────────────────────────────────────────────────────

export async function registerArtifact(input: RegisterArtifactInput): Promise<BackupArtifact> {
  return prisma.backupArtifact.create({
    data: {
      jobId:           input.jobId,
      storagePath:     input.storagePath,
      sizeBytes:       input.sizeBytes,
      checksumHash:    input.checksumHash,
      retentionUntil:  input.retentionUntil,
      metadata:        input.metadata ?? {},
      isVerified:      false,
    },
  });
}

export async function markArtifactVerified(artifactId: string): Promise<void> {
  await prisma.backupArtifact.update({
    where: { id: artifactId },
    data:  { isVerified: true, verifiedAt: new Date() },
  });
}

export async function listExpiredArtifacts(): Promise<BackupArtifact[]> {
  return prisma.backupArtifact.findMany({
    where: { retentionUntil: { lt: new Date() } },
    orderBy: { retentionUntil: 'asc' },
  });
}

// ─── Restore Jobs ─────────────────────────────────────────────────────────────

export async function createRestoreJob(input: CreateRestoreJobInput): Promise<RestoreJob> {
  // Kiểm tra backup job tồn tại và đã COMPLETED
  const backupJob = await prisma.backupJob.findUnique({ where: { id: input.backupJobId } });
  if (!backupJob) throw new Error(`BackupJob ${input.backupJobId} not found`);
  if (backupJob.status !== 'COMPLETED') {
    throw new Error(`BackupJob ${input.backupJobId} has status ${backupJob.status}, cannot restore`);
  }

  return prisma.restoreJob.create({
    data: {
      backupJobId:       input.backupJobId,
      targetEnvironment: input.targetEnvironment,
      requestedById:     input.requestedById,
      notes:             input.notes,
      status:            'REQUESTED',
      verificationStatus: 'NOT_VERIFIED',
    },
  });
}

export async function updateRestoreJobStatus(
  restoreJobId: string,
  status:        RestoreJobStatus,
  errorMessage?: string,
): Promise<void> {
  const data: Parameters<typeof prisma.restoreJob.update>[0]['data'] = { status };
  if (status === 'IN_PROGRESS') data.startedAt   = new Date();
  if (status === 'COMPLETED' || status === 'FAILED') data.completedAt = new Date();
  if (errorMessage) data.errorMessage = errorMessage;

  await prisma.restoreJob.update({ where: { id: restoreJobId }, data });
}

export async function verifyRestoreJob(input: VerifyRestoreInput): Promise<void> {
  await prisma.restoreJob.update({
    where: { id: input.restoreJobId },
    data: {
      verificationStatus: input.verificationStatus,
      verificationNote:   input.verificationNote,
    },
  });
}

export async function listRestoreJobs(opts: {
  status?:  RestoreJobStatus;
  page?:    number;
  pageSize?: number;
}) {
  const page     = opts.page     ?? 1;
  const pageSize = opts.pageSize ?? 20;

  const where: Parameters<typeof prisma.restoreJob.findMany>[0]['where'] = {};
  if (opts.status) where.status = opts.status;

  const [jobs, total] = await prisma.$transaction([
    prisma.restoreJob.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      skip:    (page - 1) * pageSize,
      take:    pageSize,
      include: { backupJob: { select: { backupType: true, completedAt: true, sizeBytes: true } } },
    }),
    prisma.restoreJob.count({ where }),
  ]);

  return { jobs, total, page, pageSize };
}

// ─── Disaster Recovery ────────────────────────────────────────────────────────

export async function createDRPlan(input: CreateDRPlanInput): Promise<DisasterRecoveryPlan> {
  return prisma.disasterRecoveryPlan.create({
    data: {
      name:          input.name,
      description:   input.description,
      rtoTargetMin:  input.rtoTargetMin,
      rpoTargetMin:  input.rpoTargetMin,
      runbookPath:   input.runbookPath,
      isActive:      true,
      createdById:   input.createdById,
    },
  });
}

export async function listDRPlans(activeOnly = true) {
  return prisma.disasterRecoveryPlan.findMany({
    where:   activeOnly ? { isActive: true } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      exercises: {
        orderBy: { exercisedAt: 'desc' },
        take:    1,
      },
    },
  });
}

export async function recordDRExercise(
  input: RecordDRExerciseInput,
): Promise<DisasterRecoveryExercise> {
  const plan = await prisma.disasterRecoveryPlan.findUnique({ where: { id: input.planId } });
  if (!plan) throw new Error(`DR Plan ${input.planId} not found`);

  return prisma.disasterRecoveryExercise.create({
    data: {
      planId:          input.planId,
      exercisedAt:     input.exercisedAt,
      conductedById:   input.conductedById,
      outcome:         input.outcome,
      rtoAchievedMin:  input.rtoAchievedMin,
      rpoAchievedMin:  input.rpoAchievedMin,
      findings:        input.findings,
      nextReviewDate:  input.nextReviewDate,
    },
  });
}

// Backup quá 2 giờ không có bản mới → không đạt freshness (theo design doc)
const BACKUP_FRESHNESS_THRESHOLD_MIN = 120;

export interface DRReadiness {
  overallStatus:        'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
  planCount:            number;
  lastExercisedAt:      Date | null;
  lastOutcome:          DRExerciseOutcome | null;
  rtoGap:               number | null;   // >0 = vượt target, <0 = còn dư margin
  rpoGap:               number | null;
  backupFreshnessOk:    boolean;
  backupAgeMinutes:     number | null;
  lastRestoreVerifiedAt: Date | null;
  exerciseDaysAgo:      number | null;   // Số ngày kể từ lần diễn tập cuối
}

export async function getDRReadiness(): Promise<DRReadiness> {
  const [plans, backupFreshness, lastVerifiedRestore] = await Promise.all([
    prisma.disasterRecoveryPlan.findMany({
      where:   { isActive: true },
      include: { exercises: { orderBy: { exercisedAt: 'desc' }, take: 1 } },
    }),
    getBackupFreshnessMinutes('POSTGRESQL_FULL'),
    prisma.restoreJob.findFirst({
      where:   { verificationStatus: 'VERIFIED_OK', status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
      select:  { completedAt: true },
    }),
  ]);

  let lastExercisedAt: Date | null = null;
  let lastOutcome: DRExerciseOutcome | null = null;
  let rtoGap: number | null = null;
  let rpoGap: number | null = null;

  for (const plan of plans) {
    const ex = plan.exercises[0];
    if (!ex) continue;
    if (!lastExercisedAt || ex.exercisedAt > lastExercisedAt) {
      lastExercisedAt = ex.exercisedAt;
      lastOutcome     = ex.outcome;
      rtoGap = ex.rtoAchievedMin !== null ? ex.rtoAchievedMin - plan.rtoTargetMin : null;
      rpoGap = ex.rpoAchievedMin !== null ? ex.rpoAchievedMin - plan.rpoTargetMin : null;
    }
  }

  const backupAgeMinutes      = backupFreshness;
  const backupFreshnessOk     = backupAgeMinutes !== null && backupAgeMinutes <= BACKUP_FRESHNESS_THRESHOLD_MIN;
  const lastRestoreVerifiedAt = lastVerifiedRestore?.completedAt ?? null;

  const exerciseDaysAgo = lastExercisedAt
    ? Math.floor((Date.now() - lastExercisedAt.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Đánh giá overallStatus
  const exerciseStale  = exerciseDaysAgo === null || exerciseDaysAgo > 90;  // > 3 tháng
  const rtoBreached    = rtoGap !== null && rtoGap > 0;
  const rpoBreached    = rpoGap !== null && rpoGap > 0;
  const lastFailed     = lastOutcome === 'FAIL';

  let overallStatus: DRReadiness['overallStatus'];
  if (plans.length === 0) {
    overallStatus = 'UNKNOWN';
  } else if (!backupFreshnessOk || lastFailed || (rtoBreached && rpoBreached)) {
    overallStatus = 'CRITICAL';
  } else if (exerciseStale || rtoBreached || rpoBreached) {
    overallStatus = 'DEGRADED';
  } else {
    overallStatus = 'HEALTHY';
  }

  return {
    overallStatus,
    planCount:             plans.length,
    lastExercisedAt,
    lastOutcome,
    rtoGap,
    rpoGap,
    backupFreshnessOk,
    backupAgeMinutes,
    lastRestoreVerifiedAt,
    exerciseDaysAgo,
  };
}
