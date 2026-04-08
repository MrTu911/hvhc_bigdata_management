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

    const records = await prisma.educationHistory.findMany({
      where: { userId: user.id },
      orderBy: { startDate: 'asc' },
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
    
    const record = await prisma.educationHistory.create({
      data: {
        userId: user.id,
        level: data.level,
        trainingSystem: data.trainingSystem,
        major: data.major,
        institution: data.institution,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        thesisTitle: data.thesisTitle,
        supervisor: data.supervisor,
        defenseDate: data.defenseDate ? new Date(data.defenseDate) : null,
        defenseLocation: data.defenseLocation,
        examSubject: data.examSubject,
        classification: data.classification,
        certificateCode: data.certificateCode,
        certificateDate: data.certificateDate ? new Date(data.certificateDate) : null,
        notes: data.notes,
      },
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    console.error('Error creating education:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
