/**
 * FACULTY RESEARCH API
 * Đã chuyển sang Function-based RBAC (19/02/2026)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { RESEARCH } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

// GET: Lấy danh sách đề tài nghiên cứu
export async function GET(req: NextRequest) {
  try {
    // Function-based RBAC check: VIEW_RESEARCH
    const auth = await requireFunction(req, RESEARCH.VIEW);
    if (!auth.allowed) {
      return auth.response!;
    }
    
    const { user } = auth;

    const { searchParams } = new URL(req.url);
    const facultyId = searchParams.get('facultyId');

    if (!facultyId) {
      return NextResponse.json({ error: 'Faculty ID required' }, { status: 400 });
    }

    const projects = await prisma.researchProject.findMany({
      where: { facultyId },
      orderBy: { createdAt: 'desc' }
    });

    // Audit log
    await logAudit({
      userId: user!.id,
      functionCode: RESEARCH.VIEW,
      action: 'VIEW',
      resourceType: 'RESEARCH_PROJECT',
      resourceId: facultyId,
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({ projects });
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
    // Function-based RBAC check: CREATE_RESEARCH
    const auth = await requireFunction(req, RESEARCH.CREATE);
    if (!auth.allowed) {
      return auth.response!;
    }
    
    const { user } = auth;

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

    // Verify faculty profile exists
    const facultyProfile = await prisma.facultyProfile.findUnique({
      where: { id: facultyId }
    });

    if (!facultyProfile) {
      return NextResponse.json(
        { error: 'Faculty profile not found' },
        { status: 404 }
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

    // Audit log for CREATE
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
    // Function-based RBAC check: UPDATE_RESEARCH
    const auth = await requireFunction(req, RESEARCH.UPDATE);
    if (!auth.allowed) {
      return auth.response!;
    }
    
    const { user } = auth;

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Get old data for audit
    const oldProject = await prisma.researchProject.findUnique({
      where: { id }
    });

    const project = await prisma.researchProject.update({
      where: { id },
      data: updateData
    });

    // Audit log for UPDATE
    await logAudit({
      userId: user!.id,
      functionCode: RESEARCH.UPDATE,
      action: 'UPDATE',
      resourceType: 'RESEARCH_PROJECT',
      resourceId: id,
      oldValue: oldProject,
      newValue: updateData,
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

// DELETE: Xóa đề tài nghiên cứu
export async function DELETE(req: NextRequest) {
  try {
    // Function-based RBAC check: DELETE_RESEARCH (sensitive operation)
    const auth = await requireFunction(req, RESEARCH.DELETE);
    if (!auth.allowed) {
      return auth.response!;
    }
    
    const { user } = auth;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Get project info before delete for audit
    const projectToDelete = await prisma.researchProject.findUnique({
      where: { id }
    });

    if (!projectToDelete) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    await prisma.researchProject.delete({
      where: { id }
    });

    // Audit log for DELETE (critical operation)
    await logAudit({
      userId: user!.id,
      functionCode: RESEARCH.DELETE,
      action: 'DELETE',
      resourceType: 'RESEARCH_PROJECT',
      resourceId: id,
      oldValue: projectToDelete,
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
