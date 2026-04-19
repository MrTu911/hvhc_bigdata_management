/**
 * FACULTY RESEARCH API
 * Đã chuyển sang Function-based RBAC (19/02/2026)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction, requireAuth } from '@/lib/rbac/middleware';
import { RESEARCH } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

async function getFacultyProfileForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { facultyProfile: true }
  });
  return user?.facultyProfile ?? null;
}

// GET: Lấy danh sách đề tài nghiên cứu (có pagination)
export async function GET(req: NextRequest) {
  try {
    const auth = await requireFunction(req, RESEARCH.VIEW);
    if (!auth.allowed) {
      return auth.response!;
    }

    const { user } = auth;
    const { searchParams } = new URL(req.url);
    const facultyId = searchParams.get('facultyId');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10)));

    if (!facultyId) {
      return NextResponse.json({ error: 'Faculty ID required' }, { status: 400 });
    }

    const where = { facultyId, isDeleted: false };

    const [projects, total] = await prisma.$transaction([
      prisma.researchProject.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.researchProject.count({ where })
    ]);

    await logAudit({
      userId: user!.id,
      functionCode: RESEARCH.VIEW,
      action: 'VIEW',
      resourceType: 'RESEARCH_PROJECT',
      resourceId: facultyId,
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({
      projects,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    });
  } catch (error: any) {
    console.error('Error fetching research projects:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Thêm đề tài nghiên cứu mới
export async function POST(req: NextRequest) {
  try {
    const auth = await requireFunction(req, RESEARCH.CREATE);
    if (!auth.allowed) {
      return auth.response!;
    }

    const { user } = auth;

    // Verify user chỉ tạo đề tài cho chính mình
    const ownProfile = await getFacultyProfileForUser(user!.id);
    if (!ownProfile) {
      return NextResponse.json({ error: 'Faculty profile not found for current user' }, { status: 404 });
    }

    const body = await req.json();
    const {
      facultyId,
      projectName,
      projectCode,
      field,
      level,
      fundingAmount,
      startYear,
      endYear,
      status,
      description,
      outcomes,
      publications
    } = body;

    if (!facultyId || !projectName) {
      return NextResponse.json(
        { error: 'Faculty ID and project name are required' },
        { status: 400 }
      );
    }

    if (facultyId !== ownProfile.id) {
      return NextResponse.json(
        { error: 'Forbidden: cannot create project for another faculty' },
        { status: 403 }
      );
    }

    const project = await prisma.researchProject.create({
      data: {
        facultyId,
        projectName,
        projectCode,
        field,
        level,
        fundingAmount: fundingAmount || 0,
        startYear,
        endYear,
        status: status || 'Đang thực hiện',
        description,
        outcomes,
        publications: publications || 0
      }
    });

    await logAudit({
      userId: user!.id,
      functionCode: RESEARCH.CREATE,
      action: 'CREATE',
      resourceType: 'RESEARCH_PROJECT',
      resourceId: project.id,
      newValue: { projectName, projectCode, field },
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating research project:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Cập nhật đề tài nghiên cứu
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireFunction(req, RESEARCH.UPDATE);
    if (!auth.allowed) {
      return auth.response!;
    }

    const { user } = auth;

    const ownProfile = await getFacultyProfileForUser(user!.id);
    if (!ownProfile) {
      return NextResponse.json({ error: 'Faculty profile not found' }, { status: 404 });
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const existingProject = await prisma.researchProject.findUnique({
      where: { id }
    });

    if (!existingProject || existingProject.isDeleted) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (existingProject.facultyId !== ownProfile.id) {
      return NextResponse.json(
        { error: 'Forbidden: cannot update project of another faculty' },
        { status: 403 }
      );
    }

    // Không cho phép client tự set soft-delete fields qua PUT
    const { isDeleted, deletedAt, deletedBy, ...safeUpdateData } = updateData;

    const project = await prisma.researchProject.update({
      where: { id },
      data: safeUpdateData
    });

    await logAudit({
      userId: user!.id,
      functionCode: RESEARCH.UPDATE,
      action: 'UPDATE',
      resourceType: 'RESEARCH_PROJECT',
      resourceId: id,
      oldValue: existingProject,
      newValue: safeUpdateData,
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({ project });
  } catch (error: any) {
    console.error('Error updating research project:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Soft delete đề tài nghiên cứu
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireFunction(req, RESEARCH.DELETE);
    if (!auth.allowed) {
      return auth.response!;
    }

    const { user } = auth;

    const ownProfile = await getFacultyProfileForUser(user!.id);
    if (!ownProfile) {
      return NextResponse.json({ error: 'Faculty profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const existingProject = await prisma.researchProject.findUnique({
      where: { id }
    });

    if (!existingProject || existingProject.isDeleted) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (existingProject.facultyId !== ownProfile.id) {
      return NextResponse.json(
        { error: 'Forbidden: cannot delete project of another faculty' },
        { status: 403 }
      );
    }

    await prisma.researchProject.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: user!.id
      }
    });

    await logAudit({
      userId: user!.id,
      functionCode: RESEARCH.DELETE,
      action: 'DELETE',
      resourceType: 'RESEARCH_PROJECT',
      resourceId: id,
      oldValue: existingProject,
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting research project:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
