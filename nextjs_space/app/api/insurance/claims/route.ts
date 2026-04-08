/**
 * API: Insurance Claims - Yêu cầu chế độ bảo hiểm
 * CRUD với workflow: DRAFT -> PENDING -> UNDER_REVIEW -> APPROVED/REJECTED -> PAID
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { INSURANCE } from '@/lib/rbac/function-codes';
import { requireFunction } from '@/lib/rbac/middleware';
import { logAudit } from '@/lib/audit';

const CLAIM_TYPE_LABELS: Record<string, string> = {
  SICK_LEAVE: 'Ốm đau',
  MATERNITY: 'Thai sản',
  OCCUPATIONAL_DISEASE: 'Bệnh nghề nghiệp',
  WORK_ACCIDENT: 'Tai nạn lao động',
  RETIREMENT: 'Hưu trí',
  SURVIVORSHIP: 'Tử tuất',
  UNEMPLOYMENT: 'Thất nghiệp',
  MEDICAL_EXPENSE: 'Chi phí KCB',
  OTHER: 'Khác',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp',
  PENDING: 'Chờ duyệt',
  UNDER_REVIEW: 'Đang xét duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  PAID: 'Đã chi trả',
  CANCELLED: 'Đã hủy',
};

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, INSURANCE.VIEW);
    if (!authResult.allowed) return authResult.response!;
    const user = authResult.user!;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const claimType = searchParams.get('claimType') || '';
    const status = searchParams.get('status') || '';
    const unitId = searchParams.get('unitId') || '';
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = { deletedAt: null };

    if (claimType) where.claimType = claimType;
    if (status) where.status = status;
    
    if (year) {
      where.createdAt = {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${parseInt(year) + 1}-01-01`),
      };
    }

    if (search || unitId) {
      where.insuranceInfo = {
        user: {
          ...(search ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { militaryId: { contains: search, mode: 'insensitive' } },
            ],
          } : {}),
          ...(unitId ? { unitId } : {}),
        },
      };
    }

    const [records, total] = await Promise.all([
      prisma.insuranceClaim.findMany({
        where,
        include: {
          insuranceInfo: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  militaryId: true,
                  rank: true,
                  position: true,
                  unitRelation: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.insuranceClaim.count({ where }),
    ]);

    // Stats by status
    const statsByStatus = await prisma.insuranceClaim.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: true,
      _sum: { amount: true },
    });

    await logAudit({
      userId: user.id,
      functionCode: INSURANCE.VIEW,
      action: 'VIEW',
      resourceType: 'INSURANCE_CLAIM',
      result: 'SUCCESS',
    });

    return NextResponse.json({
      records: records.map(r => ({
        ...r,
        claimTypeLabel: CLAIM_TYPE_LABELS[r.claimType] || r.claimType,
        statusLabel: STATUS_LABELS[r.status] || r.status,
      })),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      stats: {
        byStatus: statsByStatus.map(s => ({
          status: s.status,
          label: STATUS_LABELS[s.status] || s.status,
          count: s._count,
          amount: s._sum?.amount ? Number(s._sum.amount) : 0,
        })),
      },
    });
  } catch (error) {
    console.error('[InsuranceClaims GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, INSURANCE.UPDATE);
    if (!authResult.allowed) return authResult.response!;
    const currentUser = authResult.user!;

    const body = await request.json();
    const {
      insuranceInfoId,
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
      attachments,
      notes,
      submitNow,
    } = body;

    // Validate insuranceInfo exists
    const insuranceInfo = await prisma.insuranceInfo.findUnique({
      where: { id: insuranceInfoId },
    });
    if (!insuranceInfo) {
      return NextResponse.json({ error: 'Không tìm thấy hồ sơ bảo hiểm' }, { status: 404 });
    }

    const record = await prisma.insuranceClaim.create({
      data: {
        insuranceInfoId,
        claimType,
        status: submitNow ? 'PENDING' : 'DRAFT',
        amount: amount ? parseFloat(amount) : null,
        benefitDays,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        reason,
        description,
        hospitalName,
        diagnosisCode,
        diagnosis,
        attachments: attachments || [],
        notes,
        ...(submitNow ? { submittedAt: new Date(), submittedBy: currentUser.id } : {}),
      },
      include: {
        insuranceInfo: {
          include: {
            user: { select: { name: true, militaryId: true } },
          },
        },
      },
    });

    await logAudit({
      userId: currentUser.id,
      functionCode: INSURANCE.UPDATE,
      action: 'CREATE',
      resourceType: 'INSURANCE_CLAIM',
      resourceId: record.id,
      newValue: record,
      result: 'SUCCESS',
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('[InsuranceClaims POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, INSURANCE.UPDATE);
    if (!authResult.allowed) return authResult.response!;
    const currentUser = authResult.user!;

    const body = await request.json();
    const { id, action, ...data } = body;

    const existing = await prisma.insuranceClaim.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy yêu cầu' }, { status: 404 });
    }

    let updateData: any = {};

    // Handle workflow actions
    switch (action) {
      case 'submit':
        updateData = { status: 'PENDING', submittedAt: new Date(), submittedBy: currentUser.id };
        break;
      case 'review':
        updateData = { status: 'UNDER_REVIEW', reviewedAt: new Date(), reviewedBy: currentUser.id };
        break;
      case 'approve':
        updateData = {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: currentUser.id,
          calculatedAmount: data.calculatedAmount ? parseFloat(data.calculatedAmount) : existing.amount,
          documentNumber: data.documentNumber,
          documentDate: data.documentDate ? new Date(data.documentDate) : null,
        };
        break;
      case 'reject':
        updateData = {
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectedBy: currentUser.id,
          rejectReason: data.rejectReason,
        };
        break;
      case 'pay':
        updateData = {
          status: 'PAID',
          paidAt: new Date(),
          paidBy: currentUser.id,
          paymentReference: data.paymentReference,
        };
        // Also create benefit history record
        await prisma.insuranceHistory.create({
          data: {
            insuranceInfoId: existing.insuranceInfoId,
            transactionType: 'BENEFIT',
            periodMonth: new Date().getMonth() + 1,
            periodYear: new Date().getFullYear(),
            amount: existing.calculatedAmount || existing.amount || 0,
            benefitType: existing.claimType as any,
            benefitReason: existing.reason,
            documentNumber: existing.documentNumber,
            documentDate: existing.documentDate,
          },
        });
        break;
      case 'cancel':
        updateData = { status: 'CANCELLED' };
        break;
      default:
        // Regular update
        updateData = {
          ...data,
          amount: data.amount ? parseFloat(data.amount) : undefined,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
        };
    }

    const record = await prisma.insuranceClaim.update({
      where: { id },
      data: updateData,
      include: {
        insuranceInfo: {
          include: {
            user: { select: { name: true, militaryId: true } },
          },
        },
      },
    });

    await logAudit({
      userId: currentUser.id,
      functionCode: INSURANCE.UPDATE,
      action: action?.toUpperCase() || 'UPDATE',
      resourceType: 'INSURANCE_CLAIM',
      resourceId: record.id,
      oldValue: existing,
      newValue: record,
      result: 'SUCCESS',
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('[InsuranceClaims PUT]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, INSURANCE.DELETE);
    if (!authResult.allowed) return authResult.response!;
    const currentUser = authResult.user!;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const existing = await prisma.insuranceClaim.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy yêu cầu' }, { status: 404 });
    }

    // Soft delete
    await prisma.insuranceClaim.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: currentUser.id },
    });

    await logAudit({
      userId: currentUser.id,
      functionCode: INSURANCE.DELETE,
      action: 'DELETE',
      resourceType: 'INSURANCE_CLAIM',
      resourceId: id,
      oldValue: existing,
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[InsuranceClaims DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
