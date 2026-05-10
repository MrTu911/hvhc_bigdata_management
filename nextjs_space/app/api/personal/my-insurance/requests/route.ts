/**
 * GET  /api/personal/my-insurance/requests
 * Danh sách yêu cầu chế độ BHXH của bản thân, có phân trang + filter.
 *
 * POST /api/personal/my-insurance/requests
 * Tạo yêu cầu chế độ mới (InsuranceClaim) cho bản thân.
 * Status ban đầu là DRAFT, người dùng có thể submitNow=true để gửi ngay.
 *
 * PATCH /api/personal/my-insurance/requests
 * Hủy (cancel) một yêu cầu ở trạng thái DRAFT.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { authorize } from '@/lib/rbac/authorize';
import { PERSONAL } from '@/lib/rbac/function-codes';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const CLAIM_TYPE_LABELS: Record<string, string> = {
  SICK_LEAVE: 'Ốm đau',
  MATERNITY: 'Thai sản',
  OCCUPATIONAL_DISEASE: 'Bệnh nghề nghiệp',
  WORK_ACCIDENT: 'Tai nạn lao động',
  RETIREMENT: 'Hưu trí',
  SURVIVORSHIP: 'Tử tuất',
  UNEMPLOYMENT: 'Thất nghiệp',
  MEDICAL_EXPENSE: 'Chi phí khám chữa bệnh',
  OTHER: 'Khác',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp',
  PENDING: 'Đã gửi — Chờ tiếp nhận',
  UNDER_REVIEW: 'Đang xét duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  PAID: 'Đã chi trả',
  CANCELLED: 'Đã hủy',
};

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  const perm = await authorize(user, PERSONAL.VIEW_INSURANCE, {});
  if (!perm.allowed) {
    return NextResponse.json(
      { success: false, error: 'Không có quyền xem yêu cầu bảo hiểm' },
      { status: 403 },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const claimType = searchParams.get('claimType') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(50, parseInt(searchParams.get('pageSize') || '10'));

    // Lấy insuranceInfo của bản thân
    const insuranceInfo = await prisma.insuranceInfo.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!insuranceInfo) {
      return NextResponse.json({
        success: true,
        data: { items: [], pagination: { total: 0, page, pageSize, totalPages: 0 } },
      });
    }

    const where: Record<string, unknown> = {
      insuranceInfoId: insuranceInfo.id,
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(claimType ? { claimType } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.insuranceClaim.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          claimType: true,
          status: true,
          amount: true,
          calculatedAmount: true,
          benefitDays: true,
          startDate: true,
          endDate: true,
          reason: true,
          description: true,
          hospitalName: true,
          diagnosis: true,
          rejectReason: true,
          submittedAt: true,
          reviewedAt: true,
          approvedAt: true,
          rejectedAt: true,
          paidAt: true,
          paymentReference: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.insuranceClaim.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: items.map((item) => ({
          ...item,
          claimTypeLabel: CLAIM_TYPE_LABELS[item.claimType] ?? item.claimType,
          statusLabel: STATUS_LABELS[item.status] ?? item.status,
          amount: item.amount ? Number(item.amount) : null,
          calculatedAmount: item.calculatedAmount ? Number(item.calculatedAmount) : null,
        })),
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[GET /api/personal/my-insurance/requests]', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  const perm = await authorize(user, PERSONAL.VIEW_INSURANCE, {});
  if (!perm.allowed) {
    return NextResponse.json(
      { success: false, error: 'Không có quyền tạo yêu cầu bảo hiểm' },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const {
      claimType,
      amount,
      benefitDays,
      startDate,
      endDate,
      reason,
      description,
      hospitalName,
      diagnosisCode,
      diagnosis,
      notes,
      submitNow = false,
    } = body;

    if (!claimType) {
      return NextResponse.json(
        { success: false, error: 'claimType là bắt buộc' },
        { status: 400 },
      );
    }

    // Tìm hoặc tạo InsuranceInfo
    let insuranceInfo = await prisma.insuranceInfo.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!insuranceInfo) {
      insuranceInfo = await prisma.insuranceInfo.create({
        data: { userId: user.id },
        select: { id: true },
      });
    }

    const claim = await prisma.insuranceClaim.create({
      data: {
        insuranceInfoId: insuranceInfo.id,
        claimType,
        status: submitNow ? 'PENDING' : 'DRAFT',
        amount: amount ? parseFloat(String(amount)) : null,
        benefitDays: benefitDays ? parseInt(String(benefitDays)) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        reason: reason || null,
        description: description || null,
        hospitalName: hospitalName || null,
        diagnosisCode: diagnosisCode || null,
        diagnosis: diagnosis || null,
        notes: notes || null,
        ...(submitNow
          ? { submittedAt: new Date(), submittedBy: user.id }
          : {}),
      },
      select: {
        id: true,
        claimType: true,
        status: true,
        amount: true,
        reason: true,
        submittedAt: true,
        createdAt: true,
      },
    });

    await logAudit({
      userId: user.id,
      functionCode: PERSONAL.VIEW_INSURANCE,
      action: submitNow ? 'SUBMIT' : 'CREATE',
      resourceType: 'MY_INSURANCE_CLAIM',
      resourceId: claim.id,
      newValue: { claimType, submitNow },
      result: 'SUCCESS',
    });

    const message = submitNow
      ? 'Đã gửi yêu cầu tới quản lý CSDL bảo hiểm xã hội'
      : 'Đã lưu nháp yêu cầu';

    return NextResponse.json(
      {
        success: true,
        data: {
          ...claim,
          claimTypeLabel: CLAIM_TYPE_LABELS[claim.claimType] ?? claim.claimType,
          statusLabel: STATUS_LABELS[claim.status] ?? claim.status,
          amount: claim.amount ? Number(claim.amount) : null,
          message,
        },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[POST /api/personal/my-insurance/requests]', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────
// Người dùng hủy yêu cầu đang ở DRAFT hoặc submit DRAFT lên PENDING
export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  const perm = await authorize(user, PERSONAL.VIEW_INSURANCE, {});
  if (!perm.allowed) {
    return NextResponse.json(
      { success: false, error: 'Không có quyền' },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const { id, action } = body as { id: string; action: 'submit' | 'cancel' };

    if (!id || !action) {
      return NextResponse.json(
        { success: false, error: 'id và action là bắt buộc' },
        { status: 400 },
      );
    }

    const insuranceInfo = await prisma.insuranceInfo.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!insuranceInfo) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy hồ sơ bảo hiểm' }, { status: 404 });
    }

    const existing = await prisma.insuranceClaim.findFirst({
      where: { id, insuranceInfoId: insuranceInfo.id, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy yêu cầu' }, { status: 404 });
    }

    if (action === 'cancel') {
      if (!['DRAFT', 'PENDING'].includes(existing.status)) {
        return NextResponse.json(
          { success: false, error: 'Chỉ được hủy yêu cầu ở trạng thái Nháp hoặc Chờ duyệt' },
          { status: 400 },
        );
      }
      await prisma.insuranceClaim.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });
    } else if (action === 'submit') {
      if (existing.status !== 'DRAFT') {
        return NextResponse.json(
          { success: false, error: 'Chỉ được gửi yêu cầu từ trạng thái Nháp' },
          { status: 400 },
        );
      }
      await prisma.insuranceClaim.update({
        where: { id },
        data: { status: 'PENDING', submittedAt: new Date(), submittedBy: user.id },
      });
    }

    await logAudit({
      userId: user.id,
      functionCode: PERSONAL.VIEW_INSURANCE,
      action: action.toUpperCase(),
      resourceType: 'MY_INSURANCE_CLAIM',
      resourceId: id,
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, data: { id, action } });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[PATCH /api/personal/my-insurance/requests]', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
