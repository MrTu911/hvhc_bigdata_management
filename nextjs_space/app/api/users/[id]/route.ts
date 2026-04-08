/**
 * API Route: User Management by ID
 * GET /api/users/[id] - Get user details
 * PATCH /api/users/[id] - Update user
 * DELETE /api/users/[id] - Delete user
 * 
 * RBAC: SYSTEM.VIEW_USERS, SYSTEM.MANAGE_USERS
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction, requireAuth } from '@/lib/rbac/middleware';
import { SYSTEM } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { hash } from 'bcryptjs';

export const dynamic = 'force-dynamic';

// GET user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // RBAC Check: SYSTEM.VIEW_USERS (or self-access)
    const authResult = await requireAuth(request);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const currentUser = authResult.user!;
    
    // Allow self-access or users with VIEW_USERS permission
    if (currentUser.id !== params.id) {
      const permCheck = await requireFunction(request, SYSTEM.VIEW_USERS);
      if (!permCheck.allowed) {
        return permCheck.response!;
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        militaryId: true,
        rank: true,
        department: true,
        unit: true,
        avatar: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // RBAC Check: Allow self-update or SYSTEM.MANAGE_USERS
    const authResult = await requireAuth(request);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const currentUser = authResult.user!;
    
    // Check permission: self or admin
    if (currentUser.id !== params.id) {
      const permCheck = await requireFunction(request, SYSTEM.MANAGE_USERS);
      if (!permCheck.allowed) {
        return permCheck.response!;
      }
    }

    const body = await request.json();
    const { password, ...updateData } = body;

    // If password is being updated, hash it
    if (password) {
      updateData.password = await hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        department: true,
        militaryId: true,
        rank: true,
        updatedAt: true,
      },
    });

    // Log update event
    await prisma.systemLog.create({
      data: {
        userId: currentUser.id,
        level: 'INFO',
        category: 'USER_MANAGEMENT',
        action: 'USER_UPDATE',
        description: `User ${user.email} updated by ${currentUser.email}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: user,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // RBAC Check: SYSTEM.MANAGE_USERS
    const authResult = await requireFunction(request, SYSTEM.MANAGE_USERS);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    await prisma.user.delete({
      where: { id: params.id },
    });

    // Log deletion event
    await prisma.systemLog.create({
      data: {
        userId: user.id,
        level: 'WARNING',
        category: 'USER_MANAGEMENT',
        action: 'USER_DELETE',
        description: `User deleted by ${user.email}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
