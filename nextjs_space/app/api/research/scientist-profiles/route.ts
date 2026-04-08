import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { RESEARCH } from '@/lib/rbac/function-codes';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const authResult = await requireFunction(req, RESEARCH.VIEW);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const userWhere: any = {};
    if (search) {
      userWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { militaryId: { contains: search, mode: 'insensitive' } },
        { rank: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, profiles] = await Promise.all([
      prisma.nckhScientistProfile.count({
        where: {
          user: userWhere,
        },
      }),
      prisma.nckhScientistProfile.findMany({
        where: {
          user: userWhere,
        },
        skip,
        take: limit,
        orderBy: { totalCitations: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              rank: true,
              militaryId: true,
              department: true,
              academicTitle: true,
              unitRelation: {
                select: { id: true, name: true, code: true },
              },
            },
          },
        },
      }),
    ]);

    // Enrich with project and publication counts
    const enriched = await Promise.all(
      profiles.map(async (profile) => {
        const [projectCount, publicationCount] = await Promise.all([
          prisma.nckhProject.count({ where: { principalInvestigatorId: profile.userId } }),
          prisma.nckhPublication.count({ where: { authorId: profile.userId } }),
        ]);
        return { ...profile, projectCount, publicationCount };
      })
    );

    return NextResponse.json({
      data: enriched,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching scientist profiles:', error);
    return NextResponse.json({ error: 'Lỗi khi tải danh sách nhà khoa học' }, { status: 500 });
  }
}
