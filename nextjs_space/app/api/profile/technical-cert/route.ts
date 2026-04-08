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

    const records = await prisma.technicalCertificate.findMany({
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
    
    const record = await prisma.technicalCertificate.create({
      data: {
        userId: user.id,
        certType: data.certType,
        certName: data.certName,
        certNumber: data.certNumber,
        classification: data.classification,
        issueDate: data.issueDate ? new Date(data.issueDate) : null,
        issuer: data.issuer,
        decisionNumber: data.decisionNumber,
        decisionDate: data.decisionDate ? new Date(data.decisionDate) : null,
        notes: data.notes,
      },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error creating technical cert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
