/**
 * API: Policy Categories - Danh mục chính sách
 * Routes: GET, POST, PUT, DELETE
 * RBAC: POLICY.VIEW, POLICY.CREATE, POLICY.UPDATE, POLICY.DELETE
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { POLICY } from '@/lib/rbac/function-codes';
import { requireFunction } from '@/lib/rbac/middleware';
import { logAudit } from '@/lib/audit';

// GET - Lấy danh sách danh mục
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // RBAC check
    const authResult = await requireFunction(request, POLICY.VIEW);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const parentId = searchParams.get('parentId');

    const categories = await prisma.policyCategory.findMany({
      where: {
        ...(includeInactive ? {} : { isActive: true }),
        ...(parentId ? { parentId } : {}),
      },
      include: {
        parent: { select: { id: true, code: true, name: true } },
        children: { select: { id: true, code: true, name: true, isActive: true } },
        _count: { select: { requests: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    // Log audit
    await logAudit({
      userId: session.user.id,
      functionCode: POLICY.VIEW,
      action: 'VIEW',
      resourceType: 'POLICY_CATEGORY',
      result: 'SUCCESS',
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching policy categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Tạo danh mục mới
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // RBAC check
    const authResult = await requireFunction(request, POLICY.CREATE);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const body = await request.json();
    const { code, name, description, parentId, requiresApproval, approvalLevels, sortOrder } = body;

    // Validate required fields
    if (!code || !name) {
      return NextResponse.json(
        { error: 'Code và Name là bắt buộc' },
        { status: 400 }
      );
    }

    // Check duplicate code
    const existing = await prisma.policyCategory.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json(
        { error: 'Mã danh mục đã tồn tại' },
        { status: 400 }
      );
    }

    const category = await prisma.policyCategory.create({
      data: {
        code,
        name,
        description,
        parentId,
        requiresApproval: requiresApproval ?? true,
        approvalLevels: approvalLevels ?? 1,
        sortOrder: sortOrder ?? 0,
      },
    });

    // Log audit
    await logAudit({
      userId: session.user.id,
      functionCode: POLICY.CREATE,
      action: 'CREATE',
      resourceType: 'POLICY_CATEGORY',
      resourceId: category.id,
      newValue: JSON.stringify(category),
      result: 'SUCCESS',
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating policy category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Cập nhật danh mục
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // RBAC check
    const authResult = await requireFunction(request, POLICY.UPDATE);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const body = await request.json();
    const { id, code, name, description, parentId, requiresApproval, approvalLevels, sortOrder, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID là bắt buộc' }, { status: 400 });
    }

    // Get old data for audit
    const oldCategory = await prisma.policyCategory.findUnique({ where: { id } });
    if (!oldCategory) {
      return NextResponse.json({ error: 'Không tìm thấy danh mục' }, { status: 404 });
    }

    // Check duplicate code if changed
    if (code && code !== oldCategory.code) {
      const existing = await prisma.policyCategory.findUnique({ where: { code } });
      if (existing) {
        return NextResponse.json({ error: 'Mã danh mục đã tồn tại' }, { status: 400 });
      }
    }

    const category = await prisma.policyCategory.update({
      where: { id },
      data: {
        ...(code && { code }),
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(parentId !== undefined && { parentId }),
        ...(requiresApproval !== undefined && { requiresApproval }),
        ...(approvalLevels !== undefined && { approvalLevels }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    // Log audit
    await logAudit({
      userId: session.user.id,
      functionCode: POLICY.UPDATE,
      action: 'UPDATE',
      resourceType: 'POLICY_CATEGORY',
      resourceId: category.id,
      oldValue: JSON.stringify(oldCategory),
      newValue: JSON.stringify(category),
      result: 'SUCCESS',
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating policy category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Xóa danh mục (soft delete bằng isActive)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // RBAC check
    const authResult = await requireFunction(request, POLICY.DELETE);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID là bắt buộc' }, { status: 400 });
    }

    // Check if has requests
    const requestCount = await prisma.policyRequest.count({
      where: { categoryId: id },
    });

    if (requestCount > 0) {
      // Soft delete
      const category = await prisma.policyCategory.update({
        where: { id },
        data: { isActive: false },
      });

      await logAudit({
        userId: session.user.id,
        functionCode: POLICY.DELETE,
        action: 'SOFT_DELETE',
        resourceType: 'POLICY_CATEGORY',
        resourceId: id,
        result: 'SUCCESS',
      });

      return NextResponse.json({ message: 'Đã vô hiệu hóa danh mục', category });
    }

    // Hard delete if no requests
    await prisma.policyCategory.delete({ where: { id } });

    await logAudit({
      userId: session.user.id,
      functionCode: POLICY.DELETE,
      action: 'DELETE',
      resourceType: 'POLICY_CATEGORY',
      resourceId: id,
      result: 'SUCCESS',
    });

    return NextResponse.json({ message: 'Đã xóa danh mục' });
  } catch (error) {
    console.error('Error deleting policy category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
