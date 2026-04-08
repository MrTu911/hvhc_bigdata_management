/**
 * API: Document Full-Text Search – Tìm kiếm toàn văn
 * Path: GET /api/documents/search?q=...&fileType=...&department=...
 * Uses PostgreSQL ILIKE for full-text matching across title, description, keywords, tags.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { DIGITAL_DOCS } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, DIGITAL_DOCS.SEARCH);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const fileType = searchParams.get('fileType') || '';
    const department = searchParams.get('department') || '';
    const classification = searchParams.get('classification') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    if (!q.trim()) return NextResponse.json({ results: [], total: 0, query: q });

    const terms = q.trim().split(/\s+/).filter(Boolean);

    // Build WHERE: match ANY term in title/description/tags/keywords
    const textConditions = terms.flatMap(term => [
      { title: { contains: term, mode: 'insensitive' as const } },
      { description: { contains: term, mode: 'insensitive' as const } },
      { fileName: { contains: term, mode: 'insensitive' as const } },
      { researchArea: { contains: term, mode: 'insensitive' as const } },
      { department: { contains: term, mode: 'insensitive' as const } },
      { tags: { has: term } },
      { keywords: { has: term } },
    ]);

    const where: any = {
      OR: textConditions,
      ...(fileType && { fileType: fileType as any }),
      ...(department && { department: { contains: department, mode: 'insensitive' } }),
      ...(classification && { classification: classification as any }),
    };

    const [results, total] = await Promise.all([
      prisma.researchFile.findMany({
        where,
        orderBy: [{ viewCount: 'desc' }, { uploadedAt: 'desc' }],
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          fileName: true,
          description: true,
          fileType: true,
          fileSize: true,
          department: true,
          classification: true,
          tags: true,
          keywords: true,
          uploadedBy: true,
          uploadedAt: true,
          downloadCount: true,
          viewCount: true,
        },
      }),
      prisma.researchFile.count({ where }),
    ]);

    // Score results by term frequency (simple ranking)
    const scored = results.map(r => {
      let score = 0;
      const text = `${r.title} ${r.description || ''} ${r.keywords.join(' ')} ${r.tags.join(' ')}`.toLowerCase();
      terms.forEach(t => {
        const matches = (text.match(new RegExp(t.toLowerCase(), 'g')) || []).length;
        score += matches;
      });
      // Boost by views/downloads
      score += r.viewCount * 0.01 + r.downloadCount * 0.05;
      return { ...r, relevanceScore: parseFloat(score.toFixed(2)) };
    });

    scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Facets for filtering
    const facets = await prisma.researchFile.groupBy({
      by: ['fileType'],
      where,
      _count: { id: true },
    }).catch(() => []);

    return NextResponse.json({
      query: q,
      results: scored,
      total,
      pagination: { page, limit, totalPages: Math.ceil(total / limit) },
      facets: facets.reduce((acc: any, f: any) => { acc[f.fileType] = f._count.id; return acc; }, {}),
    });
  } catch (error) {
    console.error('[Document Search GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
