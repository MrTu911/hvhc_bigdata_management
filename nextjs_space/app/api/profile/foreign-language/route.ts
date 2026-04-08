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

    const records = await prisma.foreignLanguageCert.findMany({
      where: { userId: user.id },
      orderBy: { sortOrder: 'asc' },
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
    
    const record = await prisma.foreignLanguageCert.create({
      data: {
        userId: user.id,
        language: data.language,
        certType: data.certType,
        certLevel: data.certLevel,
        framework: data.framework,
        certNumber: data.certNumber,
        issueDate: data.issueDate ? new Date(data.issueDate) : null,
        issuer: data.issuer,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        notes: data.notes,
      },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error creating foreign language cert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
