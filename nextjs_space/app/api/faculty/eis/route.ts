/**
 * API: Faculty Education Impact Score (EIS)
 * RBAC v8.8: Migrated to function-based RBAC
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

/**
 * Calculate Education Impact Score (EIS)
 * Formula:
 * - Research Projects: 10 points each
 * - Publications: 5 points each
 * - Citations: 0.5 points each (max 50)
 * - Teaching Experience: 3 points per year (max 30)
 * - Industry Experience: 2 points per year (max 20)
 * - Academic Rank: PGS = 20, GS = 30
 * - Academic Degree: TS = 15, ThS = 10
 * 
 * Total possible: 100+ points (normalized to 100)
 */
function calculateEIS(profile: any): number {
  let score = 0;

  // Research Projects (10 points each)
  score += (profile.researchProjects || 0) * 10;

  // Publications (5 points each)
  score += (profile.publications || 0) * 5;

  // Citations (0.5 points each, max 50)
  const citationScore = Math.min((profile.citations || 0) * 0.5, 50);
  score += citationScore;

  // Teaching Experience (3 points per year, max 30)
  const teachingScore = Math.min((profile.teachingExperience || 0) * 3, 30);
  score += teachingScore;

  // Industry Experience (2 points per year, max 20)
  const industryScore = Math.min((profile.industryExperience || 0) * 2, 20);
  score += industryScore;

  // Academic Rank bonus
  if (profile.academicRank) {
    const rank = profile.academicRank.toLowerCase();
    if (rank.includes('gs') || rank.includes('giáo sư')) {
      score += 30;
    } else if (rank.includes('pgs') || rank.includes('phó giáo sư')) {
      score += 20;
    }
  }

  // Academic Degree bonus
  if (profile.academicDegree) {
    const degree = profile.academicDegree.toLowerCase();
    if (degree.includes('tiến sĩ') || degree.includes('ts') || degree.includes('phd')) {
      score += 15;
    } else if (degree.includes('thạc sĩ') || degree.includes('ths') || degree.includes('master')) {
      score += 10;
    }
  }

  // Normalize to 100 (if score > 100)
  return Math.min(Math.round(score), 100);
}

function getEISLevel(score: number): { level: string; color: string; description: string } {
  if (score >= 80) {
    return {
      level: 'Xuất sắc',
      color: 'emerald',
      description: 'Giảng viên có ảnh hưởng lớn trong giảng dạy và nghiên cứu'
    };
  } else if (score >= 60) {
    return {
      level: 'Tốt',
      color: 'blue',
      description: 'Giảng viên có năng lực tốt, đóng góp hiệu quả'
    };
  } else if (score >= 40) {
    return {
      level: 'Trung bình',
      color: 'yellow',
      description: 'Giảng viên đang phát triển, cần nâng cao hơn'
    };
  } else {
    return {
      level: 'Cần cải thiện',
      color: 'orange',
      description: 'Nên tăng cường hoạt động nghiên cứu và giảng dạy'
    };
  }
}

// GET: Calculate EIS for a faculty or all faculty
export async function GET(req: NextRequest) {
  try {
    // RBAC: Yêu cầu quyền xem hiệu suất giảng viên
    const authResult = await requireFunction(req, FACULTY.VIEW_PERFORMANCE);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(req.url);
    const facultyId = searchParams.get('facultyId');
    const calculateAll = searchParams.get('all') === 'true';

    if (facultyId) {
      // Calculate EIS for specific faculty
      const profile = await prisma.facultyProfile.findUnique({
        where: { id: facultyId },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          },
          unit: {
            select: {
              name: true
            }
          }
        }
      });

      if (!profile) {
        return NextResponse.json(
          { error: 'Faculty profile not found' },
          { status: 404 }
        );
      }

      const score = calculateEIS(profile);
      const level = getEISLevel(score);

      // Audit log
      await logAudit({
        userId: user!.id,
        functionCode: FACULTY.VIEW_PERFORMANCE,
        action: 'VIEW',
        resourceType: 'FACULTY_EIS',
        resourceId: facultyId,
        result: 'SUCCESS',
      });

      return NextResponse.json({
        facultyId: profile.id,
        facultyName: profile.user.name,
        department: profile.unit?.name,
        score,
        level: level.level,
        color: level.color,
        description: level.description,
        breakdown: {
          researchProjects: profile.researchProjects,
          publications: profile.publications,
          citations: profile.citations,
          teachingExperience: profile.teachingExperience,
          industryExperience: profile.industryExperience,
          academicRank: profile.academicRank,
          academicDegree: profile.academicDegree
        }
      });
    } else if (calculateAll) {
      // Calculate EIS for all faculty
      const profiles = await prisma.facultyProfile.findMany({
        where: {
          isActive: true
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          },
          unit: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          user: {
            name: 'asc'
          }
        }
      });

      const results = profiles.map(profile => {
        const score = calculateEIS(profile);
        const level = getEISLevel(score);

        return {
          facultyId: profile.id,
          facultyName: profile.user.name,
          department: profile.unit?.name,
          score,
          level: level.level,
          color: level.color
        };
      });

      // Sort by score descending
      results.sort((a, b) => b.score - a.score);

      // Calculate statistics
      const averageScore = results.length > 0
        ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
        : 0;

      const distribution = {
        excellent: results.filter(r => r.score >= 80).length,
        good: results.filter(r => r.score >= 60 && r.score < 80).length,
        average: results.filter(r => r.score >= 40 && r.score < 60).length,
        needsImprovement: results.filter(r => r.score < 40).length
      };

      // Audit log
      await logAudit({
        userId: user!.id,
        functionCode: FACULTY.VIEW_PERFORMANCE,
        action: 'VIEW',
        resourceType: 'FACULTY_EIS_ALL',
        result: 'SUCCESS',
      });

      return NextResponse.json({
        faculty: results,
        statistics: {
          total: results.length,
          averageScore,
          distribution
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Either facultyId or all=true parameter is required' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error calculating EIS:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
