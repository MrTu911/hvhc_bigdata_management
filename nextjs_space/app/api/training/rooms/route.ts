/**
 * TRAINING ROOMS API
 * Đã chuyển sang Function-based RBAC (19/02/2026)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { TRAINING, SYSTEM } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireFunction(req, TRAINING.VIEW);
    if (!auth.allowed) return auth.response!;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const building = searchParams.get('building') || '';
    const roomType = searchParams.get('roomType') || '';

    const where: any = { isActive: true };
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (building) where.building = building;
    if (roomType) where.roomType = roomType;

    const rooms = await prisma.room.findMany({
      where,
      include: { _count: { select: { courses: true, exams: true } } },
      orderBy: [{ building: 'asc' }, { floor: 'asc' }, { code: 'asc' }],
    });

    return NextResponse.json(rooms);
  } catch (error: any) {
    console.error('GET /api/training/rooms error:', error);
    return NextResponse.json({ error: 'Failed to fetch rooms', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireFunction(req, SYSTEM.MANAGE_UNITS);
    if (!auth.allowed) return auth.response!;
    
    const { user } = auth;
    const body = await req.json();
    const { code, name, building, floor, capacity, roomType, equipment } = body;

    if (!code || !name) {
      return NextResponse.json({ error: 'Missing required fields: code, name' }, { status: 400 });
    }

    const existing = await prisma.room.findUnique({ where: { code } });
    if (existing) return NextResponse.json({ error: `Room with code ${code} already exists` }, { status: 409 });

    const room = await prisma.room.create({
      data: {
        code, name, building: building || null,
        floor: floor ? parseInt(floor) : null, capacity: capacity ? parseInt(capacity) : 50,
        roomType: roomType || 'THEORY', equipment: equipment || null,
      },
    });

    await logAudit({
      userId: user!.id,
      functionCode: SYSTEM.MANAGE_UNITS,
      action: 'CREATE',
      resourceType: 'ROOM',
      resourceId: room.id,
      newValue: { code, name },
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/training/rooms error:', error);
    return NextResponse.json({ error: 'Failed to create room', details: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireFunction(req, TRAINING.UPDATE_COURSE);
    if (!auth.allowed) return auth.response!;
    
    const { user } = auth;
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) return NextResponse.json({ error: 'Room ID required' }, { status: 400 });

    const oldRoom = await prisma.room.findUnique({ where: { id } });
    const room = await prisma.room.update({ where: { id }, data: updateData });

    await logAudit({
      userId: user!.id,
      functionCode: TRAINING.UPDATE_COURSE,
      action: 'UPDATE',
      resourceType: 'ROOM',
      resourceId: id,
      oldValue: oldRoom,
      newValue: updateData,
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json(room);
  } catch (error: any) {
    console.error('PUT /api/training/rooms error:', error);
    return NextResponse.json({ error: 'Failed to update room', details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireFunction(req, SYSTEM.MANAGE_UNITS);
    if (!auth.allowed) return auth.response!;
    
    const { user } = auth;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Room ID required' }, { status: 400 });

    const roomToDelete = await prisma.room.findUnique({ where: { id } });
    if (!roomToDelete) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    const room = await prisma.room.update({ where: { id }, data: { isActive: false } });

    await logAudit({
      userId: user!.id,
      functionCode: SYSTEM.MANAGE_UNITS,
      action: 'DELETE',
      resourceType: 'ROOM',
      resourceId: id,
      oldValue: roomToDelete,
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({ message: 'Room deleted successfully' });
  } catch (error: any) {
    console.error('DELETE /api/training/rooms error:', error);
    return NextResponse.json({ error: 'Failed to delete room', details: error.message }, { status: 500 });
  }
}
