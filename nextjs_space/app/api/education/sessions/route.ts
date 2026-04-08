/**
 * TRAINING SESSIONS API - Quản lý buổi học & điểm danh
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.VIEW_SCHEDULE);
    if (!auth.allowed) return auth.response!;

    const { searchParams } = new URL(req.url);
    const classSectionId = searchParams.get('classSectionId');
    const termId = searchParams.get('termId');
    const facultyId = searchParams.get('facultyId');
    const status = searchParams.get('status');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const where: any = {};
    if (classSectionId) where.classSectionId = classSectionId;
    if (termId) where.termId = termId;
    if (facultyId) where.facultyId = facultyId;
    if (status) where.status = status;
    if (fromDate) where.sessionDate = { ...where.sessionDate, gte: new Date(fromDate) };
    if (toDate) where.sessionDate = { ...where.sessionDate, lte: new Date(toDate) };

    const sessions = await prisma.trainingSession.findMany({
      where,
      include: {
        classSection: { select: { id: true, code: true, name: true } },
        term: { select: { id: true, code: true, name: true } },
        room: { select: { id: true, code: true, name: true } },
        faculty: { select: { id: true, user: { select: { name: true } } } },
        _count: { select: { attendances: true } }
      },
      orderBy: [{ sessionDate: 'asc' }, { startTime: 'asc' }],
    });

    return NextResponse.json(sessions);
  } catch (error: any) {
    console.error('GET /api/education/sessions error:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.CREATE_SCHEDULE);
    if (!auth.allowed) return auth.response!;
    
    const { user } = auth;
    const body = await req.json();
    const { action } = body;

    // Generate sessions for a class section
    if (action === 'generate') {
      const { classSectionId, termId, numberOfSessions, startDate, dayOfWeek, startTime, endTime, sessionType, roomId, facultyId } = body;

      if (!classSectionId || !termId || !numberOfSessions) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      const sessions = [];
      let currentDate = new Date(startDate || new Date());
      
      // Find the first occurrence of dayOfWeek
      if (dayOfWeek) {
        while (currentDate.getDay() !== dayOfWeek) {
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }

      for (let i = 1; i <= numberOfSessions; i++) {
        sessions.push({
          classSectionId, termId,
          sessionNumber: i,
          sessionDate: new Date(currentDate),
          startTime: startTime || '07:00',
          endTime: endTime || '09:30',
          sessionType: sessionType || 'THEORY',
          roomId: roomId || null,
          facultyId: facultyId || null,
          status: 'SCHEDULED' as const,
        });
        currentDate.setDate(currentDate.getDate() + 7); // Next week
      }

      const created = await prisma.trainingSession.createMany({ data: sessions });

      await logAudit({
        userId: user!.id, functionCode: EDUCATION.CREATE_SCHEDULE,
        action: 'CREATE', resourceType: 'TRAINING_SESSION', resourceId: classSectionId,
        newValue: { count: numberOfSessions }, result: 'SUCCESS',
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      });

      return NextResponse.json({ created: created.count }, { status: 201 });
    }

    // Create single session
    const { classSectionId, termId, sessionNumber, sessionDate, startTime, endTime, sessionType, topic, roomId, facultyId, isMakeup, originalSessionId } = body;

    if (!classSectionId || !termId || !sessionDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const session = await prisma.trainingSession.create({
      data: {
        classSectionId, termId,
        sessionNumber: sessionNumber || 1,
        sessionDate: new Date(sessionDate),
        startTime: startTime || '07:00',
        endTime: endTime || '09:30',
        sessionType: sessionType || 'THEORY',
        topic: topic || null,
        roomId: roomId || null,
        facultyId: facultyId || null,
        status: 'SCHEDULED' as const,
        isMakeup: isMakeup || false,
        originalSessionId: originalSessionId || null,
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/education/sessions error:', error);
    return NextResponse.json({ error: 'Failed to create session', details: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.UPDATE_SCHEDULE);
    if (!auth.allowed) return auth.response!;
    
    const { user } = auth;
    const body = await req.json();
    const { id, action, ...updateData } = body;

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const existing = await prisma.trainingSession.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    // Handle attendance
    if (action === 'attendance') {
      const { attendances } = body; // [{ enrollmentId, isPresent, attendanceType }]
      
      for (const att of attendances) {
        await prisma.sessionAttendance.upsert({
          where: { sessionId_enrollmentId: { sessionId: id, enrollmentId: att.enrollmentId } },
          update: { isPresent: att.isPresent, attendanceType: att.attendanceType || 'PRESENT', checkInTime: new Date() },
          create: {
            sessionId: id, enrollmentId: att.enrollmentId,
            isPresent: att.isPresent, attendanceType: att.attendanceType || 'PRESENT',
            checkInTime: new Date(),
          },
        });
      }

      // Update session status to COMPLETED
      await prisma.trainingSession.update({ where: { id }, data: { status: 'COMPLETED' } });

      return NextResponse.json({ success: true, count: attendances.length });
    }

    // Regular update
    const session = await prisma.trainingSession.update({
      where: { id },
      data: {
        ...(updateData.sessionDate && { sessionDate: new Date(updateData.sessionDate) }),
        ...(updateData.startTime && { startTime: updateData.startTime }),
        ...(updateData.endTime && { endTime: updateData.endTime }),
        ...(updateData.sessionType && { sessionType: updateData.sessionType }),
        ...(updateData.topic !== undefined && { topic: updateData.topic }),
        ...(updateData.roomId !== undefined && { roomId: updateData.roomId }),
        ...(updateData.facultyId !== undefined && { facultyId: updateData.facultyId }),
        ...(updateData.status && { status: updateData.status }),
        ...(updateData.notes !== undefined && { notes: updateData.notes }),
      },
    });

    await logAudit({
      userId: user!.id, functionCode: EDUCATION.UPDATE_SCHEDULE,
      action: 'UPDATE', resourceType: 'TRAINING_SESSION', resourceId: id,
      oldValue: existing, newValue: session, result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json(session);
  } catch (error: any) {
    console.error('PUT /api/education/sessions error:', error);
    return NextResponse.json({ error: 'Failed to update session', details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.DELETE_SCHEDULE);
    if (!auth.allowed) return auth.response!;
    
    const { user } = auth;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const existing = await prisma.trainingSession.findUnique({ 
      where: { id }, include: { _count: { select: { attendances: true } } } 
    });
    if (!existing) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    if (existing._count.attendances > 0) {
      await prisma.trainingSession.update({ where: { id }, data: { status: 'CANCELLED' } });
    } else {
      await prisma.trainingSession.delete({ where: { id } });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/education/sessions error:', error);
    return NextResponse.json({ error: 'Failed to delete session', details: error.message }, { status: 500 });
  }
}
