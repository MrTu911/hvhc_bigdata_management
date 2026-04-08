/**
 * API: Medical Facilities - Cơ sở khám chữa bệnh ban đầu
 * CRUD operations
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { INSURANCE } from '@/lib/rbac/function-codes';
import { requireFunction } from '@/lib/rbac/middleware';
import { logAudit } from '@/lib/audit';

const FACILITY_TYPE_LABELS: Record<string, string> = {
  MILITARY_HOSPITAL: 'Bệnh viện quân đội',
  CENTRAL_HOSPITAL: 'Bệnh viện TW',
  PROVINCIAL_HOSPITAL: 'Bệnh viện tỉnh',
  DISTRICT_HOSPITAL: 'Bệnh viện huyện',
  CLINIC: 'Phòng khám',
  HEALTH_CENTER: 'Trạm y tế',
  OTHER: 'Khác',
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const province = searchParams.get('province') || '';
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (type) where.type = type;
    if (province) where.province = province;
    if (isActive === 'true') where.isActive = true;
    else if (isActive === 'false') where.isActive = false;

    const [records, total, provinces] = await Promise.all([
      prisma.medicalFacility.findMany({
        where,
        orderBy: [{ level: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.medicalFacility.count({ where }),
      prisma.medicalFacility.findMany({
        where: { deletedAt: null },
        select: { province: true },
        distinct: ['province'],
      }),
    ]);

    return NextResponse.json({
      records: records.map(r => ({
        ...r,
        typeLabel: FACILITY_TYPE_LABELS[r.type] || r.type,
      })),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      filters: {
        provinces: provinces.map(p => p.province).filter(Boolean).sort(),
        types: Object.entries(FACILITY_TYPE_LABELS).map(([value, label]) => ({ value, label })),
      },
    });
  } catch (error) {
    console.error('[MedicalFacilities GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, INSURANCE.UPDATE);
    if (!authResult.allowed) return authResult.response!;
    const currentUser = authResult.user!;

    const body = await request.json();
    const { code, name, type, address, province, district, phone, level, contractStartDate, contractEndDate, notes } = body;

    // Check code unique
    const existing = await prisma.medicalFacility.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: 'Mã cơ sở y tế đã tồn tại' }, { status: 409 });
    }

    const record = await prisma.medicalFacility.create({
      data: {
        code,
        name,
        type,
        address,
        province,
        district,
        phone,
        level: level || 1,
        contractStartDate: contractStartDate ? new Date(contractStartDate) : null,
        contractEndDate: contractEndDate ? new Date(contractEndDate) : null,
        notes,
      },
    });

    await logAudit({
      userId: currentUser.id,
      functionCode: INSURANCE.UPDATE,
      action: 'CREATE',
      resourceType: 'MEDICAL_FACILITY',
      resourceId: record.id,
      newValue: record,
      result: 'SUCCESS',
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('[MedicalFacilities POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, INSURANCE.UPDATE);
    if (!authResult.allowed) return authResult.response!;
    const currentUser = authResult.user!;

    const body = await request.json();
    const { id, ...data } = body;

    const existing = await prisma.medicalFacility.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy cơ sở y tế' }, { status: 404 });
    }

    const record = await prisma.medicalFacility.update({
      where: { id },
      data: {
        ...data,
        contractStartDate: data.contractStartDate ? new Date(data.contractStartDate) : undefined,
        contractEndDate: data.contractEndDate ? new Date(data.contractEndDate) : undefined,
      },
    });

    await logAudit({
      userId: currentUser.id,
      functionCode: INSURANCE.UPDATE,
      action: 'UPDATE',
      resourceType: 'MEDICAL_FACILITY',
      resourceId: record.id,
      oldValue: existing,
      newValue: record,
      result: 'SUCCESS',
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('[MedicalFacilities PUT]', error);
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

    const existing = await prisma.medicalFacility.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy cơ sở y tế' }, { status: 404 });
    }

    await prisma.medicalFacility.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: currentUser.id },
    });

    await logAudit({
      userId: currentUser.id,
      functionCode: INSURANCE.DELETE,
      action: 'DELETE',
      resourceType: 'MEDICAL_FACILITY',
      resourceId: id,
      oldValue: existing,
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[MedicalFacilities DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
