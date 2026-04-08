/**
 * M10 – UC-55: Tổng hợp chuyên cần
 * GET /api/education/attendance/summary?hocVienId=&classSectionId=&termId=
 *
 * Trả về tỷ lệ chuyên cần tổng hợp cho 1 học viên hoặc 1 lớp học phần.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.VIEW_ATTENDANCE);
    if (!auth.allowed) return auth.response!;

    const { searchParams } = new URL(req.url);
    const hocVienId      = searchParams.get('hocVienId');
    const classSectionId = searchParams.get('classSectionId');
    const termId         = searchParams.get('termId');

    if (!hocVienId && !classSectionId) {
      return NextResponse.json(
        { success: false, error: 'Cần ít nhất hocVienId hoặc classSectionId' },
        { status: 400 }
      );
    }

    // Build session filter
    const sessionWhere: any = {};
    if (classSectionId) sessionWhere.classSectionId = classSectionId;
    if (termId) sessionWhere.termId = termId;

    // Build enrollment filter
    const enrollmentWhere: any = {};
    if (hocVienId) enrollmentWhere.hocVienId = hocVienId;
    if (classSectionId) enrollmentWhere.classSectionId = classSectionId;

    const records = await prisma.sessionAttendance.findMany({
      where: {
        session: Object.keys(sessionWhere).length > 0 ? sessionWhere : undefined,
        enrollment: Object.keys(enrollmentWhere).length > 0 ? enrollmentWhere : undefined,
      },
      select: {
        attendanceType: true,
        isPresent: true,
        enrollment: {
          select: {
            hocVienId: true,
            hocVien: { select: { id: true, maHocVien: true, hoTen: true } },
            classSectionId: true,
          },
        },
      },
    });

    if (hocVienId) {
      // Tổng hợp cho 1 học viên
      const total = records.length;
      const present  = records.filter(r => r.attendanceType === 'PRESENT').length;
      const late     = records.filter(r => r.attendanceType === 'LATE').length;
      const excused  = records.filter(r => r.attendanceType === 'EXCUSED').length;
      const absent   = records.filter(r => r.attendanceType === 'ABSENT').length;
      const attended = present + late; // LATE vẫn coi là có mặt

      return NextResponse.json({
        success: true,
        data: {
          hocVienId,
          totalSessions: total,
          present,
          late,
          excused,
          absent,
          attendanceRate: total > 0 ? Math.round((attended / total) * 100) : null,
          excusedRate:    total > 0 ? Math.round((excused  / total) * 100) : null,
          absentRate:     total > 0 ? Math.round((absent   / total) * 100) : null,
        },
      });
    }

    // Tổng hợp theo lớp: nhóm theo hocVienId
    const byStudent = new Map<string, {
      hocVienId: string; maHocVien: string | null; hoTen: string;
      total: number; present: number; late: number; excused: number; absent: number;
    }>();

    for (const r of records) {
      const sv = r.enrollment.hocVien;
      const key = sv.id;
      if (!byStudent.has(key)) {
        byStudent.set(key, {
          hocVienId: sv.id,
          maHocVien: sv.maHocVien ?? null,
          hoTen: sv.hoTen,
          total: 0, present: 0, late: 0, excused: 0, absent: 0,
        });
      }
      const entry = byStudent.get(key)!;
      entry.total++;
      if      (r.attendanceType === 'PRESENT') entry.present++;
      else if (r.attendanceType === 'LATE')    entry.late++;
      else if (r.attendanceType === 'EXCUSED') entry.excused++;
      else if (r.attendanceType === 'ABSENT')  entry.absent++;
    }

    const summary = Array.from(byStudent.values()).map(s => ({
      ...s,
      attendanceRate: s.total > 0 ? Math.round(((s.present + s.late) / s.total) * 100) : null,
      absentRate:     s.total > 0 ? Math.round((s.absent / s.total) * 100) : null,
    }));

    return NextResponse.json({ success: true, data: summary });
  } catch (error: any) {
    console.error('GET /api/education/attendance/summary error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch summary' }, { status: 500 });
  }
}
