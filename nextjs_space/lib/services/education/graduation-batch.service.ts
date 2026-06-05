/**
 * Graduation Batch Service – M10 UC-60
 *
 * Orchestrates batch graduation audits, approve/reject state transitions,
 * and diploma issuance. Does NOT contain rule logic — calls graduation-engine.service.ts.
 */

import { prisma } from '@/lib/db';
import { GraduationAuditStatus, Prisma } from '@prisma/client';
import {
  runGraduationEngine,
  GraduationEngineResult,
} from './graduation-engine.service';

export type BatchCohortFilter = {
  khoaHoc?: string;   // e.g. "K50"
  unitId?: string;
  limit?: number;     // default 50 per run
};

export type BatchRunResult = {
  total: number;
  eligible: number;
  ineligible: number;
  skipped: number;    // already audited today
  errors: { hocVienId: string; message: string }[];
};

export type ApproveAuditInput = {
  decisionNo: string;
  notes?: string;
};

export type IssueDiplomaInput = {
  diplomaType: string;           // dai_hoc / thac_si / chung_chi
  classification?: string;       // Xuất sắc / Giỏi / Khá / Trung bình
  graduationDate: Date;
  issuedBy: string;              // userId of issuer
  fileUrl?: string;
};

// ===== BATCH AUDIT =====

/**
 * Chạy graduation engine cho nhiều học viên theo cohort filter.
 * Idempotent: bỏ qua học viên đã có audit PENDING/ELIGIBLE/INELIGIBLE hôm nay.
 * Sử dụng Promise.allSettled để không fail toàn batch khi 1 học viên lỗi.
 */
export async function batchRunGraduation(filter: BatchCohortFilter): Promise<BatchRunResult> {
  const limit = Math.min(filter.limit ?? 50, 200);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const where: Record<string, unknown> = {
    deletedAt: null,
    currentStatus: { in: ['ACTIVE', 'STUDYING'] },
  };
  if (filter.khoaHoc) where.khoaHoc = filter.khoaHoc;
  if (filter.unitId) where.unitId = filter.unitId;

  const hocViens = await prisma.hocVien.findMany({
    where,
    select: { id: true },
    take: limit,
  });

  // Load today's existing audits for these hocVienIds to support idempotency
  const existingAuditIds = new Set(
    (
      await prisma.graduationAudit.findMany({
        where: {
          hocVienId: { in: hocViens.map((h) => h.id) },
          auditDate: { gte: todayStart },
        },
        select: { hocVienId: true },
      })
    ).map((a) => a.hocVienId)
  );

  const result: BatchRunResult = { total: hocViens.length, eligible: 0, ineligible: 0, skipped: 0, errors: [] };

  const tasks = hocViens.map(async ({ id: hocVienId }) => {
    if (existingAuditIds.has(hocVienId)) {
      result.skipped++;
      return;
    }

    const engineResult: GraduationEngineResult | null = await runGraduationEngine(hocVienId);
    if (!engineResult) {
      result.errors.push({ hocVienId, message: 'HocVien not found by engine' });
      return;
    }

    await prisma.graduationAudit.create({
      data: {
        hocVienId,
        auditDate:          new Date(),
        totalCreditsEarned: engineResult.totalCreditsEarned,
        gpa:                engineResult.gpa,
        conductEligible:    engineResult.conductEligible,
        thesisEligible:     engineResult.thesisEligible,
        languageEligible:   engineResult.languageEligible,
        graduationEligible: engineResult.graduationEligible,
        // Json? field: dùng Prisma.JsonNull khi không có lý do trượt thay vì literal null
        failureReasonsJson:
          engineResult.failureReasonsJson ?? Prisma.JsonNull,
        status:             engineResult.graduationEligible
          ? GraduationAuditStatus.ELIGIBLE
          : GraduationAuditStatus.INELIGIBLE,
      },
    });

    if (engineResult.graduationEligible) {
      result.eligible++;
    } else {
      result.ineligible++;
    }
  });

  const settled = await Promise.allSettled(tasks);
  settled.forEach((r, i) => {
    if (r.status === 'rejected') {
      result.errors.push({ hocVienId: hocViens[i]?.id ?? 'unknown', message: String(r.reason) });
    }
  });

  return result;
}

// ===== STATE TRANSITIONS =====

/**
 * Phê duyệt GraduationAudit: ELIGIBLE → APPROVED.
 * Throws nếu trạng thái không hợp lệ.
 */
export async function approveAudit(
  auditId: string,
  actorId: string,
  input: ApproveAuditInput
): Promise<{ id: string; status: GraduationAuditStatus }> {
  const audit = await prisma.graduationAudit.findUnique({ where: { id: auditId } });
  if (!audit) throw new Error('GraduationAudit không tồn tại');
  if (audit.status !== GraduationAuditStatus.ELIGIBLE) {
    throw new Error(
      `Không thể phê duyệt khi trạng thái là ${audit.status}. Chỉ ELIGIBLE mới được phê duyệt.`
    );
  }

  const updated = await prisma.graduationAudit.update({
    where: { id: auditId },
    data: {
      status:     GraduationAuditStatus.APPROVED,
      approvedBy: actorId,
      approvedAt: new Date(),
      decisionNo: input.decisionNo,
      notes:      input.notes ?? audit.notes,
    },
    select: { id: true, status: true },
  });

  return updated;
}

/**
 * Từ chối GraduationAudit: ELIGIBLE | PENDING → REJECTED.
 */
export async function rejectAudit(
  auditId: string,
  actorId: string,
  rejectReason: string
): Promise<{ id: string; status: GraduationAuditStatus }> {
  const audit = await prisma.graduationAudit.findUnique({ where: { id: auditId } });
  if (!audit) throw new Error('GraduationAudit không tồn tại');
  if (!['ELIGIBLE', 'PENDING'].includes(audit.status)) {
    throw new Error(`Không thể từ chối khi trạng thái là ${audit.status}.`);
  }

  const updated = await prisma.graduationAudit.update({
    where: { id: auditId },
    data: {
      status:     GraduationAuditStatus.REJECTED,
      approvedBy: actorId,
      approvedAt: new Date(),
      notes:      rejectReason,
    },
    select: { id: true, status: true },
  });

  return updated;
}

// ===== DIPLOMA ISSUANCE =====

/**
 * Cấp bằng tốt nghiệp cho GraduationAudit đã APPROVED.
 * - Không tạo duplicate diploma cho cùng 1 auditId.
 * - Auto-generate diplomaNo theo format BV-{năm}-{sequence padded 5 chữ số}.
 */
export async function issueDiploma(
  auditId: string,
  input: IssueDiplomaInput
): Promise<{ id: string; diplomaNo: string }> {
  const audit = await prisma.graduationAudit.findUnique({
    where: { id: auditId },
    include: { diplomaRecord: true },
  });

  if (!audit) throw new Error('GraduationAudit không tồn tại');
  if (audit.status !== GraduationAuditStatus.APPROVED) {
    throw new Error(
      `Chỉ được cấp bằng khi trạng thái APPROVED. Trạng thái hiện tại: ${audit.status}.`
    );
  }
  if (audit.diplomaRecord) {
    throw new Error(`Bằng đã được cấp (diplomaNo: ${audit.diplomaRecord.diplomaNo}). Không tạo duplicate.`);
  }

  const diplomaNo = await generateDiplomaNo(input.graduationDate.getFullYear());

  const diploma = await prisma.diplomaRecord.create({
    data: {
      hocVienId:         audit.hocVienId,
      graduationAuditId: auditId,
      diplomaNo,
      diplomaType:       input.diplomaType,
      classification:    input.classification ?? null,
      graduationDate:    input.graduationDate,
      issuedAt:          new Date(),
      issuedBy:          input.issuedBy,
      fileUrl:           input.fileUrl ?? null,
    },
    select: { id: true, diplomaNo: true },
  });

  return { id: diploma.id, diplomaNo: diploma.diplomaNo! };
}

/**
 * Sinh diplomaNo theo format BV-{năm}-{seq 5 chữ số}.
 * Tìm max sequence trong năm hiện tại và tăng thêm 1.
 */
async function generateDiplomaNo(year: number): Promise<string> {
  const prefix = `BV-${year}-`;
  const last = await prisma.diplomaRecord.findFirst({
    where: { diplomaNo: { startsWith: prefix } },
    orderBy: { diplomaNo: 'desc' },
    select: { diplomaNo: true },
  });

  let seq = 1;
  if (last?.diplomaNo) {
    const parts = last.diplomaNo.split('-');
    const lastSeq = parseInt(parts[parts.length - 1] ?? '0', 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }

  return `${prefix}${String(seq).padStart(5, '0')}`;
}
