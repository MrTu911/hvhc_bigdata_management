/**
 * API: Acceptance Docs – Live System Evidence Stats
 * Path: /api/admin/acceptance-docs/stats
 * Returns live counts from DB to prove system modules are operational.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const [
      partyTotal,
      partyByStatus,
      facultyTotal,
      studentTotal,
      auditTotal,
      policyTotal,
      researchTotal,
      userTotal,
      unitTotal,
    ] = await Promise.all([
      prisma.partyMember.count({ where: { deletedAt: null } }),
      prisma.partyMember.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { id: true },
      }),
      prisma.facultyProfile.count({ where: { isActive: true } }),
      prisma.hocVien.count(),
      prisma.auditLog.count(),
      prisma.policyRecord.count({ where: { deletedAt: null } }),
      prisma.nckhProject.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.unit.count({ where: { active: true } }),
    ]);

    const partyStatusMap = partyByStatus.reduce((acc, s) => {
      acc[s.status] = s._count.id;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      party: {
        total: partyTotal,
        chinhThuc: partyStatusMap['CHINH_THUC'] || 0,
        duBi: partyStatusMap['DU_BI'] || 0,
        quanChung: partyStatusMap['QUAN_CHUNG'] || 0,
        camTinh: partyStatusMap['CAM_TINH'] || 0,
        doiTuong: partyStatusMap['DOI_TUONG'] || 0,
      },
      faculty: facultyTotal,
      students: studentTotal,
      auditLogs: auditTotal,
      policies: policyTotal,
      research: researchTotal,
      users: userTotal,
      units: unitTotal,
    });
  } catch (error) {
    console.error('[AcceptanceDocs Stats GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
