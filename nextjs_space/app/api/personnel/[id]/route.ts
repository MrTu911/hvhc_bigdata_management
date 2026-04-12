/**
 * CSDL Quân nhân - Personnel Detail API
 * Chi tiết và cập nhật hồ sơ cán bộ
 * 
 * RBAC: Function-based với Scope filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { PERSONNEL } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

// Helper: Lấy danh sách đơn vị con (recursive)
async function getSubordinateUnitIds(unitId: string): Promise<string[]> {
  const result: string[] = [unitId];
  const children = await prisma.unit.findMany({
    where: { parentId: unitId },
    select: { id: true },
  });
  for (const child of children) {
    const childUnits = await getSubordinateUnitIds(child.id);
    result.push(...childUnits);
  }
  return result;
}

// GET: Lấy chi tiết hồ sơ cán bộ
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // RBAC Check với Scope: VIEW_PERSONNEL_DETAIL
    const { user, scopedOptions, response } = await requireScopedFunction(request, PERSONNEL.VIEW_DETAIL);
    if (!user) {
      return response!;
    }

    const { id } = params;

    // Lấy thông tin cán bộ
    const personnel = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        militaryId: true,
        rank: true,
        position: true,
        phone: true,
        avatar: true,
        address: true,
        workStatus: true,
        personnelType: true,
        educationLevel: true,
        specialization: true,
        placeOfOrigin: true,
        dateOfBirth: true,
        gender: true,
        joinDate: true,
        startDate: true,
        endDate: true,
        unitId: true,
        createdAt: true,
        updatedAt: true,
        unitRelation: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
            level: true,
            parent: {
              select: { id: true, name: true, code: true },
            },
          },
        },
        scientificProfile: {
          select: {
            id: true,
            summary: true,
            isPublic: true,
          },
        },
        facultyProfile: {
          select: {
            id: true,
            academicRank: true,
            academicDegree: true,
            specialization: true,
            publications: true,
            researchProjects: true,
            citations: true,
          },
        },
        educationHistory: {
          orderBy: { endDate: 'desc' },
        },
        workExperience: {
          orderBy: { endDate: 'desc' },
        },
        awardsRecords: {
          orderBy: { year: 'desc' },
        },
        personnelAttachments: {
          orderBy: { uploadedAt: 'desc' },
        },
        scientificPublications: {
          orderBy: { year: 'desc' },
          take: 20,
          select: {
            id: true,
            type: true,
            title: true,
            year: true,
            role: true,
            publisher: true,
            organization: true,
            coAuthors: true,
          },
        },
        scientificResearch: {
          orderBy: { year: 'desc' },
          take: 20,
          select: {
            id: true,
            title: true,
            year: true,
            role: true,
            level: true,
            type: true,
            result: true,
          },
        },
        partyMember: {
          select: {
            id: true,
            partyCardNumber: true,
            joinDate: true,
            officialDate: true,
            partyCell: true,
            status: true,
            currentPosition: true,
            organization: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!personnel) {
      return NextResponse.json({ error: 'Không tìm thấy cán bộ' }, { status: 404 });
    }

    // Scope-based access check (already validated by RBAC, but double-check for unit restriction)
    const scope = scopedOptions?.scope || 'SELF';
    const isOwner = user.id === id;
    
    if (!isOwner && scope !== 'ACADEMY') {
      // DEPARTMENT or UNIT scope - check if target is in subordinate units
      if (user.unitId && personnel.unitId) {
        const subordinateUnitIds = await getSubordinateUnitIds(user.unitId);
        if (!subordinateUnitIds.includes(personnel.unitId)) {
          return NextResponse.json({ error: 'Không có quyền xem hồ sơ cán bộ này' }, { status: 403 });
        }
      }
    }

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.VIEW_DETAIL,
      action: 'VIEW',
      resourceType: 'PERSONNEL',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({ data: personnel });
  } catch (error) {
    console.error('Error fetching personnel detail:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy thông tin cán bộ' },
      { status: 500 }
    );
  }
}

// PATCH: Cập nhật hồ sơ cán bộ
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // RBAC Check với Scope: UPDATE_PERSONNEL
    const { user, scopedOptions, response } = await requireScopedFunction(request, PERSONNEL.UPDATE);
    if (!user) {
      return response!;
    }

    const { id } = params;
    const body = await request.json();

    // Lấy thông tin cán bộ cần cập nhật (oldValue for audit)
    const personnel = await prisma.user.findUnique({
      where: { id },
      select: { 
        id: true, 
        unitId: true, 
        name: true, 
        email: true,
        phone: true,
        address: true,
        rank: true,
        position: true,
        workStatus: true,
      },
    });

    if (!personnel) {
      return NextResponse.json({ error: 'Không tìm thấy cán bộ' }, { status: 404 });
    }

    // Scope-based permission check
    const scope = scopedOptions?.scope || 'SELF';
    const isOwner = user.id === id;
    const isAcademyScope = scope === 'ACADEMY';

    // Check unit-based access for non-ACADEMY scope
    if (!isOwner && !isAcademyScope) {
      if (user.unitId && personnel.unitId) {
        const subordinateUnitIds = await getSubordinateUnitIds(user.unitId);
        if (!subordinateUnitIds.includes(personnel.unitId)) {
          return NextResponse.json({ error: 'Không có quyền chỉnh sửa hồ sơ cán bộ này' }, { status: 403 });
        }
      }
    }

    // Các trường được phép cập nhật based on scope
    const allowedFields = isAcademyScope
      ? [
          'name', 'phone', 'address', 'avatar', 'dateOfBirth', 'gender',
          'placeOfOrigin', 'educationLevel', 'specialization', 'rank',
          'position', 'personnelType', 'workStatus', 'unitId',
          'joinDate', 'startDate', 'endDate',
        ]
      : isOwner
        ? ['phone', 'address', 'avatar', 'placeOfOrigin']
        : [
            'phone', 'address', 'avatar', 'placeOfOrigin', 'educationLevel',
            'specialization', 'rank', 'position', 'personnelType', 'workStatus',
          ];

    // DateTime fields that must not receive empty strings
    const DATE_FIELDS = new Set(['dateOfBirth', 'joinDate', 'startDate', 'endDate']);

    const updateData: any = {};
    for (const field of allowedFields) {
      const value = body[field];
      if (value === undefined) continue;
      // Convert empty string to null for DateTime fields; skip truly empty dates
      if (DATE_FIELDS.has(field)) {
        updateData[field] = value === '' ? null : new Date(value);
      } else if (field === 'unitId' && value === '') {
        // Empty unitId = unassign from unit
        updateData[field] = null;
      } else {
        updateData[field] = value;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Không có dữ liệu để cập nhật' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        rank: true,
        position: true,
        workStatus: true,
        unitRelation: {
          select: { id: true, name: true },
        },
      },
    });

    // Audit log with oldValue/newValue
    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.UPDATE,
      action: 'UPDATE',
      resourceType: 'PERSONNEL',
      resourceId: id,
      oldValue: personnel,
      newValue: { ...personnel, ...updateData },
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({ data: updated, message: 'Cập nhật thành công' });
  } catch (error) {
    console.error('Error updating personnel:', error);
    return NextResponse.json(
      { error: 'Lỗi khi cập nhật hồ sơ cán bộ' },
      { status: 500 }
    );
  }
}

// DELETE: Vô hiệu hóa hồ sơ cán bộ (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, scopedOptions, response } = await requireScopedFunction(request, PERSONNEL.UPDATE);
    if (!user) {
      return response!;
    }

    const { id } = params;

    const personnel = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, unitId: true, workStatus: true },
    });

    if (!personnel) {
      return NextResponse.json({ error: 'Không tìm thấy cán bộ' }, { status: 404 });
    }

    // Prevent self-deletion
    if (user.id === id) {
      return NextResponse.json({ error: 'Không thể vô hiệu hóa tài khoản của chính mình' }, { status: 400 });
    }

    // Scope check
    const scope = scopedOptions?.scope || 'SELF';
    if (scope !== 'ACADEMY' && user.unitId && personnel.unitId) {
      const subordinateUnitIds = await getSubordinateUnitIds(user.unitId);
      if (!subordinateUnitIds.includes(personnel.unitId)) {
        return NextResponse.json({ error: 'Không có quyền vô hiệu hóa cán bộ này' }, { status: 403 });
      }
    }

    await prisma.user.update({
      where: { id },
      data: { workStatus: 'RESIGNED' as any },
    });

    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.UPDATE,
      action: 'DELETE',
      resourceType: 'PERSONNEL',
      resourceId: id,
      oldValue: { workStatus: personnel.workStatus },
      newValue: { workStatus: 'RESIGNED' },
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({ success: true, message: 'Đã vô hiệu hóa hồ sơ cán bộ' });
  } catch (error) {
    console.error('Error deleting personnel:', error);
    return NextResponse.json(
      { error: 'Lỗi khi vô hiệu hóa hồ sơ cán bộ' },
      { status: 500 }
    );
  }
}
