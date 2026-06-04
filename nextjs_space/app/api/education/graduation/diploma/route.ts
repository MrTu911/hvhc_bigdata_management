/**
 * POST /api/education/graduation/diploma
 * Cấp bằng tốt nghiệp sau khi GraduationAudit đã APPROVED.
 * Requires: EDUCATION.EXPORT_GRADUATION (issuing diploma = export-level permission)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { issueDiploma } from '@/lib/services/education/graduation-batch.service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.EXPORT_GRADUATION);
    if (!auth.allowed) return auth.response!;
    const { user } = auth;

    const body = await req.json().catch(() => ({}));
    const { auditId, diplomaType, classification, graduationDate, fileUrl } = body as {
      auditId?: string;
      diplomaType?: string;
      classification?: string;
      graduationDate?: string;
      fileUrl?: string;
    };

    if (!auditId || !diplomaType || !graduationDate) {
      return NextResponse.json(
        { success: false, data: null, error: 'auditId, diplomaType, graduationDate là bắt buộc' },
        { status: 400 }
      );
    }

    const diploma = await issueDiploma(auditId, {
      diplomaType,
      classification,
      graduationDate: new Date(graduationDate),
      issuedBy: user!.id,
      fileUrl,
    });

    await logAudit({
      userId: user!.id,
      functionCode: EDUCATION.EXPORT_GRADUATION,
      action: 'CREATE',
      resourceType: 'DIPLOMA_RECORD',
      resourceId: diploma.id,
      newValue: { auditId, diplomaNo: diploma.diplomaNo, diplomaType },
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ success: true, data: diploma, error: null }, { status: 201 });
  } catch (error: any) {
    const is400 = error.message?.includes('APPROVED')
      || error.message?.includes('duplicate')
      || error.message?.includes('Chỉ được');
    return NextResponse.json(
      { success: false, data: null, error: error.message },
      { status: is400 ? 400 : 500 }
    );
  }
}
