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
    const pubType = searchParams.get('pubType') || '';
    const year = searchParams.get('year') || '';
    const isISI = searchParams.get('isISI') || '';
    const isScopus = searchParams.get('isScopus') || '';
    const status = searchParams.get('status') || '';
    const authorId = searchParams.get('authorId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { titleEn: { contains: search, mode: 'insensitive' } },
        { journal: { contains: search, mode: 'insensitive' } },
        { doi: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (pubType) where.pubType = pubType;
    if (year) where.publishedYear = parseInt(year);
    if (isISI === 'true') where.isISI = true;
    if (isScopus === 'true') where.isScopus = true;
    if (status) where.status = status;
    if (authorId) where.authorId = authorId;

    const [total, publications] = await Promise.all([
      prisma.nckhPublication.count({ where }),
      prisma.nckhPublication.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ publishedYear: 'desc' }, { createdAt: 'desc' }],
        include: {
          author: {
            select: { id: true, name: true, rank: true, militaryId: true },
          },
          project: {
            select: { id: true, projectCode: true, title: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      data: publications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching NCKH publications:', error);
    return NextResponse.json({ error: 'Lỗi khi tải danh sách công bố' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireFunction(req, RESEARCH.CREATE);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const body = await req.json();
    const {
      title,
      titleEn,
      abstract,
      doi,
      isbn,
      issn,
      pubType,
      scopusQ,
      isISI,
      isScopus,
      journal,
      volume,
      issue,
      pages,
      publishedYear,
      publisher,
      projectId,
      authorId,
      coAuthors,
      fullTextUrl,
    } = body;

    if (!title || !pubType || !authorId) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc (tiêu đề, loại, tác giả)' }, { status: 400 });
    }

    const publication = await prisma.nckhPublication.create({
      data: {
        title,
        titleEn: titleEn || null,
        abstract: abstract || null,
        doi: doi || null,
        isbn: isbn || null,
        issn: issn || null,
        pubType,
        scopusQ: scopusQ || null,
        isISI: Boolean(isISI),
        isScopus: Boolean(isScopus),
        journal: journal || null,
        volume: volume || null,
        issue: issue || null,
        pages: pages || null,
        publishedYear: publishedYear ? parseInt(publishedYear) : null,
        publisher: publisher || null,
        projectId: projectId || null,
        authorId,
        coAuthors: coAuthors || null,
        fullTextUrl: fullTextUrl || null,
        status: 'DRAFT',
      },
      include: {
        author: {
          select: { id: true, name: true, rank: true },
        },
        project: {
          select: { id: true, projectCode: true, title: true },
        },
      },
    });

    return NextResponse.json(publication, { status: 201 });
  } catch (error) {
    console.error('Error creating NCKH publication:', error);
    return NextResponse.json({ error: 'Lỗi khi tạo công bố' }, { status: 500 });
  }
}
