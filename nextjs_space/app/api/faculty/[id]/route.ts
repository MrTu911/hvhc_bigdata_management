/**
 * API: Faculty Profile by ID (Admin operations)
 * GET  /api/faculty/[id] — xem chi tiết một giảng viên
 * PATCH /api/faculty/[id] — cập nhật thông tin giảng viên (admin/department)
 * DELETE /api/faculty/[id] — gỡ bỏ giảng viên khỏi danh sách (soft: isActive=false)
 *
 * RBAC:
 *   GET   → FACULTY.VIEW_DETAIL
 *   PATCH → FACULTY.UPDATE
 *   DELETE → FACULTY.DELETE
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireScopedFunction, requireFunction } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

type RouteParams = { params: { id: string } };

// GET: Xem chi tiết profile giảng viên theo facultyProfileId
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireScopedFunction(req, FACULTY.VIEW_DETAIL);
    if (!authResult.allowed) return authResult.response!;

    const profile = await prisma.facultyProfile.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            militaryId: true,
            rank: true,
            phone: true,
            workStatus: true,
          },
        },
        unit: { select: { id: true, name: true, code: true } },
        teachingSubjectsList: { select: { id: true, subjectCode: true, subjectName: true } },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Không tìm thấy hồ sơ giảng viên' }, { status: 404 });
    }

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    console.error('[Faculty GET by ID] Error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi hệ thống' }, { status: 500 });
  }
}

// PATCH: Cập nhật thông tin giảng viên (admin/bộ môn/phòng đào tạo)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireFunction(req, FACULTY.UPDATE);
    if (!authResult.allowed) return authResult.response!;
    const { user } = authResult;

    const existing = await prisma.facultyProfile.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy hồ sơ giảng viên' }, { status: 404 });
    }

    const body = await req.json();
    const {
      unitId,
      academicRank,
      academicDegree,
      specialization,
      researchInterests,
      researchProjects,
      publications,
      citations,
      teachingExperience,
      industryExperience,
      biography,
      linkedinUrl,
      googleScholarUrl,
      researchGateUrl,
      orcidId,
      isActive,
      isPublic,
    } = body;

    const updated = await prisma.facultyProfile.update({
      where: { id: params.id },
      data: {
        ...(unitId !== undefined && { unitId }),
        ...(academicRank !== undefined && { academicRank }),
        ...(academicDegree !== undefined && { academicDegree }),
        ...(specialization !== undefined && { specialization }),
        ...(researchInterests !== undefined && { researchInterests }),
        ...(researchProjects !== undefined && { researchProjects }),
        ...(publications !== undefined && { publications }),
        ...(citations !== undefined && { citations }),
        ...(teachingExperience !== undefined && { teachingExperience }),
        ...(industryExperience !== undefined && { industryExperience }),
        ...(biography !== undefined && { biography }),
        ...(linkedinUrl !== undefined && { linkedinUrl }),
        ...(googleScholarUrl !== undefined && { googleScholarUrl }),
        ...(researchGateUrl !== undefined && { researchGateUrl }),
        ...(orcidId !== undefined && { orcidId }),
        ...(isActive !== undefined && { isActive }),
        ...(isPublic !== undefined && { isPublic }),
        updatedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true, email: true, militaryId: true } },
        unit: { select: { id: true, name: true } },
      },
    });

    await logAudit({
      userId: user!.id,
      functionCode: FACULTY.UPDATE,
      action: 'UPDATE',
      resourceType: 'FACULTY_PROFILE',
      resourceId: params.id,
      oldValue: existing,
      newValue: updated,
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, profile: updated });
  } catch (error: any) {
    console.error('[Faculty PATCH by ID] Error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi hệ thống' }, { status: 500 });
  }
}

// DELETE: Vô hiệu hóa giảng viên (soft delete: isActive = false)
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireFunction(req, FACULTY.DELETE);
    if (!authResult.allowed) return authResult.response!;
    const { user } = authResult;

    const existing = await prisma.facultyProfile.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy hồ sơ giảng viên' }, { status: 404 });
    }

    const updated = await prisma.facultyProfile.update({
      where: { id: params.id },
      data: { isActive: false, updatedAt: new Date() },
    });

    await logAudit({
      userId: user!.id,
      functionCode: FACULTY.DELETE,
      action: 'DELETE',
      resourceType: 'FACULTY_PROFILE',
      resourceId: params.id,
      oldValue: existing,
      newValue: updated,
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, message: 'Đã vô hiệu hóa giảng viên' });
  } catch (error: any) {
    console.error('[Faculty DELETE by ID] Error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi hệ thống' }, { status: 500 });
  }
}
