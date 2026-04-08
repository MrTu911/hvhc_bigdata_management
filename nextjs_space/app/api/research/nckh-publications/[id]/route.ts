import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { RESEARCH } from '@/lib/rbac/function-codes';
import { prisma } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireFunction(req, RESEARCH.UPDATE);
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
      coAuthors,
      fullTextUrl,
      status,
      citationCount,
    } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (titleEn !== undefined) updateData.titleEn = titleEn;
    if (abstract !== undefined) updateData.abstract = abstract;
    if (doi !== undefined) updateData.doi = doi;
    if (isbn !== undefined) updateData.isbn = isbn;
    if (issn !== undefined) updateData.issn = issn;
    if (pubType !== undefined) updateData.pubType = pubType;
    if (scopusQ !== undefined) updateData.scopusQ = scopusQ;
    if (isISI !== undefined) updateData.isISI = Boolean(isISI);
    if (isScopus !== undefined) updateData.isScopus = Boolean(isScopus);
    if (journal !== undefined) updateData.journal = journal;
    if (volume !== undefined) updateData.volume = volume;
    if (issue !== undefined) updateData.issue = issue;
    if (pages !== undefined) updateData.pages = pages;
    if (publishedYear !== undefined) updateData.publishedYear = publishedYear ? parseInt(publishedYear) : null;
    if (publisher !== undefined) updateData.publisher = publisher;
    if (projectId !== undefined) updateData.projectId = projectId || null;
    if (coAuthors !== undefined) updateData.coAuthors = coAuthors;
    if (fullTextUrl !== undefined) updateData.fullTextUrl = fullTextUrl;
    if (status !== undefined) updateData.status = status;
    if (citationCount !== undefined) updateData.citationCount = parseInt(citationCount);

    const publication = await prisma.nckhPublication.update({
      where: { id: params.id },
      data: updateData,
      include: {
        author: {
          select: { id: true, name: true, rank: true },
        },
        project: {
          select: { id: true, projectCode: true, title: true },
        },
      },
    });

    return NextResponse.json(publication);
  } catch (error) {
    console.error('Error updating NCKH publication:', error);
    return NextResponse.json({ error: 'Lỗi khi cập nhật công bố' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireFunction(req, RESEARCH.DELETE);
  if (!authResult.allowed) {
    return authResult.response!;
  }

  try {
    const pub = await prisma.nckhPublication.findUnique({ where: { id: params.id } });
    if (!pub) {
      return NextResponse.json({ error: 'Không tìm thấy công bố' }, { status: 404 });
    }

    await prisma.nckhPublication.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting NCKH publication:', error);
    return NextResponse.json({ error: 'Lỗi khi xóa công bố' }, { status: 500 });
  }
}
