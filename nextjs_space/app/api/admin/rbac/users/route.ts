/**
 * User Management API
 * Quản lý người dùng với pagination và filters
 * 
 * RBAC: Function-based với Scope filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { SYSTEM, PERSONNEL } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import bcrypt from 'bcryptjs';

/**
 * GET /api/admin/rbac/users
 * Lấy danh sách người dùng với pagination và filters
 */
export async function GET(request: NextRequest) {
  try {
    // RBAC Check với Scope: MANAGE_USERS (API quản trị tài khoản)
    const { user, response } = await requireScopedFunction(request, SYSTEM.MANAGE_USERS);
    if (!user) {
      return response!;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const unitId = searchParams.get('unitId') || '';
    const noUnit = searchParams.get('noUnit') === 'true';

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { militaryId: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) where.role = role;
    if (status) where.status = status;
    
    // Filter by unit - either specific unitId or users without any unit
    if (noUnit) {
      where.unitId = null;
    } else if (unitId) {
      where.unitId = unitId;
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          militaryId: true,
          rank: true,
          department: true,
          position: true,
          phone: true,
          unitId: true,
          lastLoginAt: true,
          createdAt: true,
          unitRelation: {
            select: {
              id: true,
              code: true,
              name: true,
              level: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('GET /api/admin/rbac/users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/rbac/users
 * Tạo người dùng mới
 */
export async function POST(request: NextRequest) {
  try {
    // RBAC Check với Scope: MANAGE_USERS
    const { user, response } = await requireScopedFunction(request, SYSTEM.MANAGE_USERS);
    if (!user) {
      return response!;
    }

    const body = await request.json();
    const {
      name,
      email,
      password,
      role,
      militaryId,
      rank,
      department,
      position,
      phone,
      unitId,
      status,
    } = body;

    // Validation
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc: Họ tên, Email, Mật khẩu, Vai trò' },
        { status: 400 }
      );
    }

    // BẮT BUỘC: Mỗi người dùng PHẢI thuộc một đơn vị
    if (!unitId) {
      return NextResponse.json(
        { 
          error: 'Đơn vị là bắt buộc', 
          message: 'Theo nguyên tắc quản lý, mọi nhân sự phải thuộc một đơn vị cụ thể. Vui lòng chọn đơn vị trước khi tạo tài khoản.' 
        },
        { status: 400 }
      );
    }

    // Kiểm tra đơn vị có tồn tại không
    const unit = await prisma.unit.findUnique({ 
      where: { id: unitId },
      select: { id: true, code: true, name: true, active: true }
    });
    
    if (!unit) {
      return NextResponse.json(
        { error: `Đơn vị với ID ${unitId} không tồn tại` },
        { status: 404 }
      );
    }

    if (!unit.active) {
      return NextResponse.json(
        { error: `Đơn vị "${unit.name}" (${unit.code}) đã bị vô hiệu hóa` },
        { status: 400 }
      );
    }

    // Kiểm tra email trùng
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: `Email ${email} đã tồn tại trong hệ thống` },
        { status: 409 }
      );
    }

    // Validate password
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu phải có ít nhất 6 ký tự' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        status: status || 'ACTIVE',
        militaryId: militaryId || null,
        rank: rank || null,
        department: department || null,
        position: position || null,
        phone: phone || null,
        unitId,
      },
      include: {
        unitRelation: {
          select: { 
            id: true,
            code: true, 
            name: true,
            level: true,
            type: true,
          },
        },
      },
    });

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: SYSTEM.MANAGE_USERS,
      action: 'CREATE',
      resourceType: 'USER',
      resourceId: newUser.id,
      newValue: { email, name, role, unitId },
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/admin/rbac/users error:', error);
    return NextResponse.json(
      { error: 'Failed to create user', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/rbac/users
 * Cập nhật thông tin người dùng
 * FIX: Whitelist fields để tránh lỗi 500 khi frontend gửi field không hợp lệ
 */
export async function PUT(request: NextRequest) {
  try {
    // RBAC Check với Scope: MANAGE_USERS
    const { user, response } = await requireScopedFunction(request, SYSTEM.MANAGE_USERS);
    if (!user) {
      return response!;
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Lấy thông tin hiện tại
    const existing = await prisma.user.findUnique({ 
      where: { id },
      select: { email: true, name: true, role: true, unitId: true, status: true }
    });
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // WHITELIST: Chỉ update các field hợp lệ, tránh lỗi 500 từ Prisma
    const dataToUpdate: any = {};
    
    // Các field được phép update
    if (body.name !== undefined) dataToUpdate.name = body.name;
    if (body.email !== undefined) dataToUpdate.email = body.email;
    if (body.role !== undefined) dataToUpdate.role = body.role;
    if (body.status !== undefined) dataToUpdate.status = body.status;
    if (body.militaryId !== undefined) dataToUpdate.militaryId = body.militaryId || null;
    if (body.rank !== undefined) dataToUpdate.rank = body.rank || null;
    if (body.department !== undefined) dataToUpdate.department = body.department || null;
    if (body.position !== undefined) dataToUpdate.position = body.position || null;
    if (body.phone !== undefined) dataToUpdate.phone = body.phone || null;
    if (body.unitId !== undefined) dataToUpdate.unitId = body.unitId || null;

    // Kiểm tra có gì để update không
    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ error: 'Không có thông tin nào để cập nhật' }, { status: 400 });
    }

    // Kiểm tra email trùng nếu có thay đổi email
    if (dataToUpdate.email && dataToUpdate.email !== existing.email) {
      const emailExists = await prisma.user.findUnique({ where: { email: dataToUpdate.email } });
      if (emailExists) {
        return NextResponse.json({ error: `Email ${dataToUpdate.email} đã tồn tại` }, { status: 409 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      include: {
        unitRelation: {
          select: { id: true, code: true, name: true, level: true },
        },
      },
    });

    // Audit log with oldValue/newValue
    await logAudit({
      userId: user.id,
      functionCode: SYSTEM.MANAGE_USERS,
      action: 'UPDATE',
      resourceType: 'USER',
      resourceId: id,
      oldValue: existing,
      newValue: dataToUpdate,
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error('PUT /api/admin/rbac/users error:', error);
    
    // Xử lý lỗi cụ thể từ Prisma
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Email đã tồn tại trong hệ thống' }, { status: 409 });
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: 'Lỗi khi cập nhật người dùng', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/rbac/users
 * Xóa người dùng (kiểm tra ràng buộc và thông báo lý do nếu không xóa được)
 */
export async function DELETE(request: NextRequest) {
  try {
    // RBAC Check với Scope: MANAGE_USERS
    const { user, response } = await requireScopedFunction(request, SYSTEM.MANAGE_USERS);
    if (!user) {
      return response!;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const forceDeactivate = searchParams.get('forceDeactivate') === 'true';

    if (!id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Không cho xóa chính mình
    if (id === user.id) {
      return NextResponse.json({ 
        error: 'Không thể xóa tài khoản của chính mình',
        reason: 'SELF_DELETE_FORBIDDEN',
        canDeactivate: false,
      }, { status: 400 });
    }

    // Lấy thông tin người dùng và các ràng buộc
    const existing = await prisma.user.findUnique({ 
      where: { id },
      select: { 
        id: true,
        email: true, 
        name: true, 
        role: true,
        status: true,
        _count: {
          select: {
            userPositions: true,
            commandedUnits: true,
            policyRecords: true,
            logs: true,
          }
        },
        personnelProfile: { select: { id: true } },
        studentProfile: { select: { id: true } },
        facultyProfile: { select: { id: true } }
      }
    });

    if (!existing) {
      return NextResponse.json({ 
        error: 'Không tìm thấy người dùng',
        reason: 'NOT_FOUND',
      }, { status: 404 });
    }

    // Kiểm tra các ràng buộc
    const constraints: string[] = [];
    
    if (existing._count.userPositions > 0) {
      constraints.push(`Đang giữ ${existing._count.userPositions} chức vụ trong hệ thống`);
    }
    if (existing._count.commandedUnits > 0) {
      constraints.push(`Đang là chỉ huy của ${existing._count.commandedUnits} đơn vị`);
    }
    if (existing._count.logs > 0) {
      constraints.push(`Có ${existing._count.logs} bản ghi nhật ký hoạt động`);
    }
    if (existing._count.policyRecords > 0) {
      constraints.push(`Có ${existing._count.policyRecords} hồ sơ chính sách liên quan`);
    }
    if (existing.personnelProfile) {
      constraints.push('Có hồ sơ cán bộ trong hệ thống');
    }
    if (existing.studentProfile) {
      constraints.push('Có hồ sơ học viên trong hệ thống');
    }
    if (existing.facultyProfile) {
      constraints.push('Có hồ sơ giảng viên trong hệ thống');
    }

    // Nếu có ràng buộc và không yêu cầu force deactivate
    if (constraints.length > 0 && !forceDeactivate) {
      return NextResponse.json({
        error: 'Không thể xóa tài khoản do có dữ liệu liên quan',
        reason: 'HAS_DEPENDENCIES',
        constraints,
        canDeactivate: true,
        suggestion: 'Bạn có thể vô hiệu hóa tài khoản này thay vì xóa. Vô hiệu hóa sẽ giữ nguyên dữ liệu lịch sử nhưng ngăn người dùng đăng nhập.',
        user: {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          role: existing.role,
          currentStatus: existing.status,
        }
      }, { status: 409 });
    }

    // Nếu có ràng buộc và yêu cầu force deactivate -> chỉ vô hiệu hóa
    if (constraints.length > 0 && forceDeactivate) {
      await prisma.user.update({
        where: { id },
        data: { status: 'INACTIVE' },
      });

      await logAudit({
        userId: user.id,
        functionCode: SYSTEM.MANAGE_USERS,
        action: 'DEACTIVATE',
        resourceType: 'USER',
        resourceId: id,
        oldValue: { email: existing.email, name: existing.name, status: existing.status },
        newValue: { status: 'INACTIVE' },
        result: 'SUCCESS',
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
      });

      return NextResponse.json({ 
        success: true,
        message: `Đã vô hiệu hóa tài khoản ${existing.name} (${existing.email})`,
        action: 'DEACTIVATED',
        constraints,
      });
    }

    // Không có ràng buộc -> có thể xóa hẳn
    await prisma.user.delete({
      where: { id },
    });

    await logAudit({
      userId: user.id,
      functionCode: SYSTEM.MANAGE_USERS,
      action: 'DELETE',
      resourceType: 'USER',
      resourceId: id,
      oldValue: { email: existing.email, name: existing.name },
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({ 
      success: true,
      message: `Đã xóa tài khoản ${existing.name} (${existing.email})`,
      action: 'DELETED',
    });
  } catch (error: any) {
    console.error('DELETE /api/admin/rbac/users error:', error);
    
    // Xử lý lỗi foreign key constraint
    if (error.code === 'P2003') {
      return NextResponse.json({
        error: 'Không thể xóa tài khoản do có dữ liệu liên quan trong hệ thống',
        reason: 'FOREIGN_KEY_CONSTRAINT',
        canDeactivate: true,
        suggestion: 'Vui lòng vô hiệu hóa tài khoản thay vì xóa.',
        details: error.meta?.field_name || 'unknown relation',
      }, { status: 409 });
    }

    return NextResponse.json(
      { error: 'Lỗi khi xóa tài khoản', details: error.message },
      { status: 500 }
    );
  }
}
