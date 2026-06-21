/**
 * Self-service: minh chứng (ảnh/PDF) cho hồ sơ điện tử cá nhân.
 *
 * GET  /api/profile/evidence?targetType=&targetId=&sectionSlug=&fieldKey=
 *      — liệt kê minh chứng (kèm presigned viewUrl) của một trường/bản ghi.
 * POST /api/profile/evidence  (multipart/form-data: file + targetType + targetId [+ sectionSlug, fieldKey, note])
 *      — upload minh chứng. Minh chứng là tài liệu bổ trợ, KHÔNG đổi giá trị trường gốc nên
 *        cho đính kèm bất cứ lúc nào (kể cả sau khi đã chốt khai báo) — vẫn SELF + audit.
 *
 * Gate: VIEW_MY_CADRE_PROFILE (đọc) / MANAGE_MY_PROFILE (ghi). Luôn scope SELF theo session user.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { authorize } from '@/lib/rbac/authorize';
import { PERSONAL } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import { ProfileEvidenceTarget } from '@prisma/client';
import {
  ProfileEvidenceService,
  validateEvidenceFile,
  type EvidenceTarget,
} from '@/lib/services/personnel/profile-evidence.service';

const VALID_TARGETS = new Set<string>(Object.values(ProfileEvidenceTarget));

function isValidTarget(value: string | null): value is ProfileEvidenceTarget {
  return value !== null && VALID_TARGETS.has(value);
}

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  if (!(await authorize(user, PERSONAL.VIEW_CADRE_PROFILE, {})).allowed) {
    return NextResponse.json({ success: false, error: 'Không có quyền xem minh chứng hồ sơ' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const targetType = searchParams.get('targetType');
  const targetId = searchParams.get('targetId');
  if (!isValidTarget(targetType) || !targetId) {
    return NextResponse.json({ success: false, error: 'Thiếu hoặc sai targetType/targetId' }, { status: 400 });
  }

  const target: EvidenceTarget = {
    targetType,
    targetId,
    sectionSlug: searchParams.get('sectionSlug'),
    // fieldKey chỉ đưa vào filter khi client truyền (phân biệt "field-level" vs "toàn bản ghi")
    ...(searchParams.has('fieldKey') ? { fieldKey: searchParams.get('fieldKey') } : {}),
  };

  const data = await ProfileEvidenceService.list(user.id, target);
  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  if (!(await authorize(user, PERSONAL.MANAGE_PROFILE, {})).allowed) {
    return NextResponse.json({ success: false, error: 'Không có quyền tải minh chứng' }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ success: false, error: 'Yêu cầu phải là multipart/form-data' }, { status: 400 });
  }

  const targetType = form.get('targetType') as string | null;
  const targetId = form.get('targetId') as string | null;
  if (!isValidTarget(targetType) || !targetId) {
    return NextResponse.json({ success: false, error: 'Thiếu hoặc sai targetType/targetId' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: 'Thiếu file' }, { status: 400 });
  }
  const validationError = validateEvidenceFile(file.type, file.size);
  if (validationError) {
    return NextResponse.json({ success: false, error: validationError.message }, { status: 400 });
  }

  const target: EvidenceTarget = {
    targetType,
    targetId,
    sectionSlug: (form.get('sectionSlug') as string) || null,
    fieldKey: (form.get('fieldKey') as string) || null,
  };

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const created = await ProfileEvidenceService.create(user.id, user.id, target, {
      fileName: file.name,
      buffer,
      mimeType: file.type,
      fileSize: file.size,
      note: (form.get('note') as string) || null,
    });

    await logAudit({
      userId: user.id,
      functionCode: PERSONAL.MANAGE_PROFILE,
      action: 'UPLOAD_PROFILE_EVIDENCE',
      resourceType: 'PROFILE_EVIDENCE',
      resourceId: created.id,
      newValue: JSON.stringify({ targetType, targetId, fieldKey: target.fieldKey, fileName: file.name }),
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/profile/evidence]', err);
    return NextResponse.json({ success: false, error: 'Lỗi tải minh chứng lên kho lưu trữ' }, { status: 500 });
  }
}
