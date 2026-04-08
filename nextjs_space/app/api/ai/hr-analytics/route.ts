/**
 * API: AI HR Analytics - Phân tích nhân sự 6 chiều
 * Path: /api/ai/hr-analytics
 * Radar Chart 6D: Năng lực, Kinh nghiệm, Đào tạo, Khen thưởng, Nghiên cứu, Sức khỏe
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { AI, PERSONNEL } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';

interface Dimension {
  label: string;
  score: number;
  max: number;
  details: string;
}

async function calculatePersonnelScore(userId: string): Promise<{
  dimensions: Dimension[];
  overallScore: number;
  stabilityIndex: number;
  promotionReadiness: number;
}> {
  const [user, awards, disciplines, education, research, workHistory] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, militaryId: true, rank: true, position: true, unitId: true },
    }),
    prisma.policyRecord.count({
      where: { userId, deletedAt: null, recordType: { in: ['REWARD', 'EMULATION'] }, workflowStatus: 'APPROVED' },
    }),
    prisma.policyRecord.count({
      where: { userId, deletedAt: null, recordType: 'DISCIPLINE', workflowStatus: 'APPROVED' },
    }),
    prisma.educationHistory.findMany({
      where: { userId },
    }).catch(() => []),
    prisma.scientificResearch.findMany({
      where: { userId },
    }).catch(() => []),
    prisma.careerHistory.findMany({
      where: { userId },
      orderBy: { eventDate: 'asc' },
    }).catch(() => []),
  ]);

  if (!user) throw new Error('User not found');

  // Dimension 1: Năng lực (Competency) - based on rank/position
  const rankScores: Record<string, number> = {
    'Thượng tướng': 100, 'Trung tướng': 95, 'Thiếu tướng': 90,
    'Đại tá': 85, 'Thượng tá': 80, 'Trung tá': 75, 'Thiếu tá': 70,
    'Đại úy': 65, 'Thượng úy': 60, 'Trung úy': 55, 'Thiếu úy': 50,
    'Thượng sĩ': 45, 'Trung sĩ': 40, 'Hạ sĩ': 35, 'Binh nhì': 30,
  };
  const competencyScore = rankScores[user.rank || ''] || 50;

  // Dimension 2: Kinh nghiệm (Experience) - based on work history years
  const totalYears = workHistory.reduce((acc, wh) => {
    const start = wh.eventDate ? new Date(wh.eventDate) : new Date();
    const end = wh.effectiveDate ? new Date(wh.effectiveDate) : new Date();
    return acc + Math.max(0, end.getFullYear() - start.getFullYear());
  }, 0);
  const experienceScore = Math.min(100, totalYears * 5);

  // Dimension 3: Đào tạo (Education)
  const educationScore = Math.min(100, education.length * 20 + (education.some((e: any) => e.degree === 'TIEN_SI') ? 30 : education.some((e: any) => e.degree === 'THAC_SI') ? 20 : 0));

  // Dimension 4: Khen thưởng (Awards) - net score: awards - disciplines*2
  const awardScore = Math.min(100, Math.max(0, awards * 10 - disciplines * 20 + 50));

  // Dimension 5: Nghiên cứu (Research)
  const researchScore = Math.min(100, research.length * 15);

  // Dimension 6: Ổn định (Stability) - no disciplines, long service
  const stabilityScore = Math.min(100, Math.max(0, 100 - disciplines * 25 + Math.min(25, totalYears * 2)));

  const dimensions: Dimension[] = [
    { label: 'Năng lực', score: competencyScore, max: 100, details: `Cấp bậc: ${user.rank || 'N/A'}` },
    { label: 'Kinh nghiệm', score: experienceScore, max: 100, details: `${totalYears} năm công tác` },
    { label: 'Đào tạo', score: educationScore, max: 100, details: `${education.length} bằng cấp/chứng chỉ` },
    { label: 'Khen thưởng', score: awardScore, max: 100, details: `${awards} khen thưởng, ${disciplines} kỷ luật` },
    { label: 'Nghiên cứu', score: researchScore, max: 100, details: `${research.length} đề tài NCKH` },
    { label: 'Ổn định', score: stabilityScore, max: 100, details: `Chỉ số ổn định tổ chức` },
  ];

  const overallScore = parseFloat((dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length).toFixed(1));
  const stabilityIndex = parseFloat((stabilityScore / 100).toFixed(2));
  const promotionReadiness = parseFloat(((competencyScore + experienceScore + awardScore) / 3 / 100).toFixed(2));

  return { dimensions, overallScore, stabilityIndex, promotionReadiness };
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, AI.VIEW_PERSONNEL_INSIGHTS);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const user = authResult.user!;
    const body = await request.json();

    const { userId, unitId } = body;

    if (userId) {
      // Single user analysis
      const analysis = await calculatePersonnelScore(userId);
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, militaryId: true, rank: true, position: true, unitRelation: { select: { name: true } } },
      });

      await logAudit({ userId: user.id, functionCode: AI.VIEW_PERSONNEL_INSIGHTS, action: 'VIEW', resourceType: 'HR_ANALYTICS', resourceId: userId, result: 'SUCCESS' });

      return NextResponse.json({
        type: 'individual',
        subject: targetUser,
        analysis,
        generatedAt: new Date().toISOString(),
      });
    }

    if (unitId) {
      // Unit-level analysis - top N personnel
      const unitUsers = await prisma.user.findMany({
        where: { unitId, status: 'ACTIVE' },
        select: { id: true, name: true, militaryId: true, rank: true, position: true },
        take: 20,
      });

      const analyses = await Promise.all(
        unitUsers.map(async (u) => {
          try {
            const analysis = await calculatePersonnelScore(u.id);
            return { user: u, ...analysis };
          } catch {
            return null;
          }
        })
      );

      const valid = analyses.filter(Boolean);
      const avgScore = valid.length > 0
        ? parseFloat((valid.reduce((sum, a) => sum + a!.overallScore, 0) / valid.length).toFixed(1))
        : 0;

      await logAudit({ userId: user.id, functionCode: AI.VIEW_PERSONNEL_INSIGHTS, action: 'VIEW', resourceType: 'HR_ANALYTICS_UNIT', resourceId: unitId, result: 'SUCCESS' });

      return NextResponse.json({
        type: 'unit',
        unitId,
        personnelCount: unitUsers.length,
        averageScore: avgScore,
        topPerformers: valid.sort((a, b) => b!.overallScore - a!.overallScore).slice(0, 5),
        analyses: valid,
        generatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ error: 'userId hoặc unitId là bắt buộc' }, { status: 400 });
  } catch (error) {
    console.error('[HR Analytics POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, AI.VIEW_PERSONNEL_INSIGHTS);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '';

    if (!userId) return NextResponse.json({ error: 'userId là bắt buộc' }, { status: 400 });

    const analysis = await calculatePersonnelScore(userId);
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, militaryId: true, rank: true, position: true, unitRelation: { select: { name: true } } },
    });

    return NextResponse.json({
      type: 'individual',
      subject: targetUser,
      analysis,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[HR Analytics GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
