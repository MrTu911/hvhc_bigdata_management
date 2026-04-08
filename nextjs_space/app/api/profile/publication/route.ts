import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/rbac/middleware';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(req);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const records = await prisma.scientificPublication.findMany({
      where: { userId: user.id },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });

    return NextResponse.json(records);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(req);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const user = authResult.user!;

    const data = await req.json();
    
    const record = await prisma.scientificPublication.create({
      data: {
        userId: user.id,
        type: data.type,
        title: data.title,
        year: data.year,
        month: data.month,
        role: data.role,
        publisher: data.publisher,
        organization: data.organization,
        issueNumber: data.issueNumber,
        pageNumbers: data.pageNumbers,
        targetUsers: data.targetUsers,
        coAuthors: data.coAuthors,
        notes: data.notes,
      },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error creating publication:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
