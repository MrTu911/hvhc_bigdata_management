/**
 * API: AI Anomaly Detection - Phát hiện bất thường trong dữ liệu
 * Path: /api/ai/anomaly/detect
 * Uses statistical Z-score and IQR methods
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { AI } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';

function calculateZScore(values: number[]): number[] {
  if (values.length === 0) return [];
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const std = Math.sqrt(variance);
  return std > 0 ? values.map(v => Math.abs((v - mean) / std)) : values.map(() => 0);
}

function getSeverity(zScore: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (zScore >= 3.5) return 'CRITICAL';
  if (zScore >= 3.0) return 'HIGH';
  if (zScore >= 2.5) return 'MEDIUM';
  return 'LOW';
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, AI.ANALYZE_TRENDS);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const user = authResult.user!;
    const body = await request.json();

    const { domain, threshold = 2.5 } = body;
    // domain: 'grades' | 'awards' | 'personnel' | 'insurance'

    const anomalies: Array<{
      id: string; domain: string; entity: string; metric: string;
      value: number; zScore: number; severity: string; description: string;
    }> = [];

    if (!domain || domain === 'grades') {
      // Phát hiện điểm bất thường (quá cao/thấp so với lớp)
      const gradeGroups = await prisma.ketQuaHocTap.groupBy({
        by: ['maMon'],
        where: { workflowStatus: 'APPROVED', diemTongKet: { not: null } },
        _avg: { diemTongKet: true },
        _count: { id: true },
      });

      for (const group of gradeGroups) {
        if (!group.maMon || group._count.id < 5) continue;
        const grades = await prisma.ketQuaHocTap.findMany({
          where: { maMon: group.maMon, workflowStatus: 'APPROVED', diemTongKet: { not: null } },
          select: { id: true, diemTongKet: true, hocVienId: true, monHoc: true },
        });

        const scores = grades.map(g => g.diemTongKet!);
        const zScores = calculateZScore(scores);

        grades.forEach((g, i) => {
          if (zScores[i] >= threshold) {
            anomalies.push({
              id: g.id,
              domain: 'grades',
              entity: `HocVien:${g.hocVienId}`,
              metric: `Điểm ${g.monHoc}`,
              value: g.diemTongKet!,
              zScore: parseFloat(zScores[i].toFixed(2)),
              severity: getSeverity(zScores[i]),
              description: `Điểm ${g.diemTongKet} (Z=${zScores[i].toFixed(2)}) bất thường so với trung bình lớp ${group._avg.diemTongKet?.toFixed(1)}`,
            });
          }
        });
      }
    }

    if (!domain || domain === 'awards') {
      // Phát hiện khen thưởng bất thường (quá nhiều trong một thời gian ngắn)
      const recentAwards = await prisma.policyRecord.groupBy({
        by: ['userId'],
        where: {
          deletedAt: null,
          recordType: { in: ['REWARD', 'EMULATION'] },
          workflowStatus: 'APPROVED',
          decisionDate: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
        },
        _count: { id: true },
      });

      if (recentAwards.length > 0) {
        const counts = recentAwards.map(a => a._count.id);
        const zScores = calculateZScore(counts);

        for (let i = 0; i < recentAwards.length; i++) {
          if (zScores[i] >= threshold) {
            anomalies.push({
              id: recentAwards[i].userId,
              domain: 'awards',
              entity: `User:${recentAwards[i].userId}`,
              metric: 'Số khen thưởng/năm',
              value: recentAwards[i]._count.id,
              zScore: parseFloat(zScores[i].toFixed(2)),
              severity: getSeverity(zScores[i]),
              description: `${recentAwards[i]._count.id} khen thưởng trong 1 năm (Z=${zScores[i].toFixed(2)})`,
            });
          }
        }
      }
    }

    if (!domain || domain === 'insurance') {
      // Phát hiện yêu cầu bảo hiểm bất thường
      const claimGroups = await prisma.insuranceClaim.groupBy({
        by: ['insuranceInfoId'],
        where: { createdAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } },
        _count: { id: true },
      });

      if (claimGroups.length > 0) {
        const counts = claimGroups.map(c => c._count.id);
        const zScores = calculateZScore(counts);

        for (let i = 0; i < claimGroups.length; i++) {
          if (zScores[i] >= threshold) {
            anomalies.push({
              id: claimGroups[i].insuranceInfoId,
              domain: 'insurance',
              entity: `InsuranceInfo:${claimGroups[i].insuranceInfoId}`,
              metric: 'Số yêu cầu bảo hiểm/năm',
              value: claimGroups[i]._count.id,
              zScore: parseFloat(zScores[i].toFixed(2)),
              severity: getSeverity(zScores[i]),
              description: `${claimGroups[i]._count.id} yêu cầu bảo hiểm trong 1 năm (Z=${zScores[i].toFixed(2)})`,
            });
          }
        }
      }
    }

    // Sort by severity then zScore
    const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    anomalies.sort((a, b) => (severityOrder[b.severity as keyof typeof severityOrder] - severityOrder[a.severity as keyof typeof severityOrder]) || b.zScore - a.zScore);

    await logAudit({
      userId: user.id,
      functionCode: AI.ANALYZE_TRENDS,
      action: 'ANALYZE',
      resourceType: 'ANOMALY_DETECTION',
      result: 'SUCCESS',
      metadata: { domain, anomalyCount: anomalies.length, threshold },
    });

    const bySeverity = anomalies.reduce((acc, a) => {
      acc[a.severity] = (acc[a.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      threshold,
      domain: domain || 'all',
      totalAnomalies: anomalies.length,
      bySeverity,
      anomalies,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Anomaly Detect POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
