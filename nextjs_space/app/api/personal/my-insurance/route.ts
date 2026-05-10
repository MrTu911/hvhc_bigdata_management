/**
 * GET /api/personal/my-insurance
 * Trả về thông tin BHXH/BHYT đầy đủ của bản thân (SELF scope):
 *   - InsuranceInfo (không lộ số sổ nhạy cảm trừ khi có VIEW_INSURANCE_SENSITIVE)
 *   - InsuranceClaim gần nhất + thống kê trạng thái
 *   - InsuranceDependent (người thân)
 *   - InsuranceHistory (lịch sử đóng/hưởng)
 *   - Cảnh báo thẻ BHYT sắp hết hạn
 *
 * POST /api/personal/my-insurance
 * Khai báo dữ liệu ban đầu (tạo InsuranceInfo) nếu chưa có.
 * Sau khi khai báo, gửi thông báo tới quản lý CSDL bảo hiểm xã hội.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { authorize } from '@/lib/rbac/authorize';
import { PERSONAL } from '@/lib/rbac/function-codes';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  const perm = await authorize(user, PERSONAL.VIEW_INSURANCE, {});
  if (!perm.allowed) {
    return NextResponse.json(
      { success: false, error: perm.deniedReason ?? 'Không có quyền xem thông tin bảo hiểm' },
      { status: 403 },
    );
  }

  try {
    const insurance = await prisma.insuranceInfo.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        userId: true,
        // Không trả số sổ BHXH/BHYT nhạy cảm — cần VIEW_INSURANCE_SENSITIVE
        insuranceStartDate: true,
        insuranceEndDate: true,
        healthInsuranceStartDate: true,
        healthInsuranceEndDate: true,
        healthInsuranceHospital: true,
        beneficiaryName: true,
        beneficiaryRelation: true,
        beneficiaryPhone: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        claims: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            claimType: true,
            status: true,
            amount: true,
            calculatedAmount: true,
            startDate: true,
            endDate: true,
            reason: true,
            description: true,
            hospitalName: true,
            diagnosis: true,
            submittedAt: true,
            reviewedAt: true,
            approvedAt: true,
            rejectedAt: true,
            rejectReason: true,
            paidAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        dependents: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            fullName: true,
            relationship: true,
            dateOfBirth: true,
            gender: true,
            healthInsuranceNumber: true,
            healthInsuranceStartDate: true,
            healthInsuranceEndDate: true,
            healthInsuranceHospital: true,
            status: true,
            statusReason: true,
            createdAt: true,
          },
        },
        histories: {
          where: { deletedAt: null },
          orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
          take: 24,
          select: {
            id: true,
            transactionType: true,
            periodMonth: true,
            periodYear: true,
            baseSalary: true,
            amount: true,
            employeeShare: true,
            employerShare: true,
            benefitType: true,
            benefitReason: true,
            documentNumber: true,
            documentDate: true,
            createdAt: true,
          },
        },
      },
    });

    // ── Tính thống kê claims ──────────────────────────────────────────────────
    let claimStats = {
      total: 0, draft: 0, pending: 0, underReview: 0,
      approved: 0, rejected: 0, paid: 0, cancelled: 0,
    };
    let contributionStats = { totalMonths: 0, totalAmount: 0, lastYear: 0 };
    let expiryWarning: string | null = null;

    if (insurance) {
      const statusGroups = await prisma.insuranceClaim.groupBy({
        by: ['status'],
        where: { insuranceInfoId: insurance.id, deletedAt: null },
        _count: true,
      });
      for (const g of statusGroups) {
        claimStats.total += g._count;
        const key = g.status.toLowerCase() as keyof typeof claimStats;
        if (key in claimStats) (claimStats as any)[key] = g._count;
      }

      // Thống kê đóng BHXH
      const contribAgg = await prisma.insuranceHistory.aggregate({
        where: { insuranceInfoId: insurance.id, transactionType: 'CONTRIBUTION', deletedAt: null },
        _count: true,
        _sum: { amount: true, employeeShare: true },
      });
      const currentYear = new Date().getFullYear();
      const thisYearAgg = await prisma.insuranceHistory.aggregate({
        where: {
          insuranceInfoId: insurance.id,
          transactionType: 'CONTRIBUTION',
          periodYear: currentYear,
          deletedAt: null,
        },
        _sum: { amount: true },
      });
      contributionStats = {
        totalMonths: contribAgg._count,
        totalAmount: Number(contribAgg._sum?.employeeShare ?? 0),
        lastYear: Number(thisYearAgg._sum?.amount ?? 0),
      };

      // Cảnh báo thẻ BHYT sắp hết hạn (30 ngày)
      if (insurance.healthInsuranceEndDate) {
        const daysLeft = Math.floor(
          (new Date(insurance.healthInsuranceEndDate).getTime() - Date.now()) / 86400000,
        );
        if (daysLeft <= 30 && daysLeft >= 0) {
          expiryWarning = `Thẻ BHYT sắp hết hạn sau ${daysLeft} ngày`;
        } else if (daysLeft < 0) {
          expiryWarning = 'Thẻ BHYT đã hết hạn';
        }
      }
    }

    await logAudit({
      userId: user.id,
      functionCode: PERSONAL.VIEW_INSURANCE,
      action: 'VIEW',
      resourceType: 'MY_INSURANCE',
      result: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      data: {
        insurance,
        claimStats,
        contributionStats,
        expiryWarning,
        hasInsurance: !!insurance,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[GET /api/personal/my-insurance]', error);
    return NextResponse.json({ success: false, error: 'Lỗi server: ' + msg }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
// Khai báo dữ liệu ban đầu (tạo hoặc cập nhật InsuranceInfo).
// Sau khi lưu, tạo InsuranceClaim với status PENDING để gửi tới bộ phận quản lý.
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  const perm = await authorize(user, PERSONAL.VIEW_INSURANCE, {});
  if (!perm.allowed) {
    return NextResponse.json(
      { success: false, error: perm.deniedReason ?? 'Không có quyền khai báo bảo hiểm' },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const {
      insuranceStartDate,
      insuranceEndDate,
      healthInsuranceStartDate,
      healthInsuranceEndDate,
      healthInsuranceHospital,
      beneficiaryName,
      beneficiaryRelation,
      beneficiaryPhone,
      notes,
      // Khai báo yêu cầu gửi tới quản lý CSDL
      requestType,       // 'REGISTER' | 'UPDATE' | 'CONFIRM'
      requestDescription,
    } = body;

    // Upsert InsuranceInfo
    const insurance = await prisma.insuranceInfo.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        insuranceStartDate: insuranceStartDate ? new Date(insuranceStartDate) : null,
        insuranceEndDate: insuranceEndDate ? new Date(insuranceEndDate) : null,
        healthInsuranceStartDate: healthInsuranceStartDate ? new Date(healthInsuranceStartDate) : null,
        healthInsuranceEndDate: healthInsuranceEndDate ? new Date(healthInsuranceEndDate) : null,
        healthInsuranceHospital: healthInsuranceHospital || null,
        beneficiaryName: beneficiaryName || null,
        beneficiaryRelation: beneficiaryRelation || null,
        beneficiaryPhone: beneficiaryPhone || null,
        notes: notes || null,
      },
      update: {
        insuranceStartDate: insuranceStartDate ? new Date(insuranceStartDate) : undefined,
        insuranceEndDate: insuranceEndDate ? new Date(insuranceEndDate) : undefined,
        healthInsuranceStartDate: healthInsuranceStartDate ? new Date(healthInsuranceStartDate) : undefined,
        healthInsuranceEndDate: healthInsuranceEndDate ? new Date(healthInsuranceEndDate) : undefined,
        healthInsuranceHospital: healthInsuranceHospital ?? undefined,
        beneficiaryName: beneficiaryName ?? undefined,
        beneficiaryRelation: beneficiaryRelation ?? undefined,
        beneficiaryPhone: beneficiaryPhone ?? undefined,
        notes: notes ?? undefined,
      },
      select: { id: true },
    });

    // Tạo InsuranceClaim PENDING để gửi tới bộ phận quản lý CSDL BHXH
    const claimTypeMap: Record<string, string> = {
      REGISTER: 'OTHER',
      UPDATE: 'OTHER',
      CONFIRM: 'OTHER',
    };
    const reasonMap: Record<string, string> = {
      REGISTER: 'Đăng ký khai báo dữ liệu BHXH ban đầu',
      UPDATE: 'Yêu cầu cập nhật thông tin BHXH',
      CONFIRM: 'Xác nhận thông tin BHXH hiện tại',
    };

    const claim = await prisma.insuranceClaim.create({
      data: {
        insuranceInfoId: insurance.id,
        claimType: (claimTypeMap[requestType] ?? 'OTHER') as any,
        status: 'PENDING',
        reason: reasonMap[requestType] ?? requestType,
        description: requestDescription || null,
        submittedAt: new Date(),
        submittedBy: user.id,
      },
      select: { id: true, status: true, createdAt: true },
    });

    await logAudit({
      userId: user.id,
      functionCode: PERSONAL.VIEW_INSURANCE,
      action: 'SUBMIT',
      resourceType: 'MY_INSURANCE_CLAIM',
      resourceId: claim.id,
      newValue: { requestType, insuranceInfoId: insurance.id },
      result: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      data: {
        insuranceInfoId: insurance.id,
        claimId: claim.id,
        status: claim.status,
        message: 'Đã lưu khai báo và gửi yêu cầu tới quản lý CSDL bảo hiểm xã hội',
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[POST /api/personal/my-insurance]', error);
    return NextResponse.json({ success: false, error: 'Lỗi server: ' + msg }, { status: 500 });
  }
}
