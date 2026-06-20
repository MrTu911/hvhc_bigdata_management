/**
 * Self-service: upload minh chứng cho đề nghị cập nhật hồ sơ.
 * POST /api/profile/change-requests/[id]/attachments  (multipart/form-data, field "file")
 *
 * Gate: CREATE_PROFILE_CHANGE. Chỉ chủ đề nghị, khi đề nghị còn ở nháp/trả lại.
 * Validate loại + kích thước file; lưu MinIO; trả presigned URL.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { authorize } from '@/lib/rbac/authorize';
import { PROFILE_CHANGE } from '@/lib/rbac/function-codes';
import { prisma } from '@/lib/db';
import { uploadFileToMinio, getPresignedUrl } from '@/lib/minio-client';
import { logAudit } from '@/lib/audit';

const EVIDENCE_BUCKET = 'hvhc-profile-evidence';
const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

function safeName(name: string): string {
  return name.replace(/[^\w.\-]+/g, '_').slice(0, 120);
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  if (!(await authorize(user, PROFILE_CHANGE.CREATE, {})).allowed) {
    return NextResponse.json({ success: false, error: 'Không có quyền tải minh chứng' }, { status: 403 });
  }

  const found = await prisma.profileChangeRequest.findUnique({
    where: { id: params.id },
    select: { id: true, userId: true, status: true },
  });
  if (!found) return NextResponse.json({ success: false, error: 'Không tìm thấy đề nghị' }, { status: 404 });
  if (found.userId !== user.id) {
    return NextResponse.json({ success: false, error: 'Không có quyền tải minh chứng cho đề nghị này' }, { status: 403 });
  }
  if (found.status !== 'DRAFT' && found.status !== 'RETURNED') {
    return NextResponse.json({ success: false, error: 'Chỉ tải minh chứng khi đề nghị ở trạng thái nháp/trả lại' }, { status: 409 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ success: false, error: 'Yêu cầu phải là multipart/form-data' }, { status: 400 });
  }
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: 'Thiếu file' }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ success: false, error: 'Kích thước file không hợp lệ (tối đa 10MB)' }, { status: 400 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ success: false, error: `Loại file không được phép: ${file.type}` }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const objectKey = `profile-change/${params.id}/${Date.now()}-${safeName(file.name)}`;

  try {
    await uploadFileToMinio(EVIDENCE_BUCKET, objectKey, buffer, { uploadedBy: user.id });
    const fileUrl = await getPresignedUrl(EVIDENCE_BUCKET, objectKey);

    const attachment = await prisma.profileChangeAttachment.create({
      data: {
        requestId: params.id,
        itemId: (form.get('itemId') as string) || null,
        fileName: file.name,
        objectKey,
        bucketName: EVIDENCE_BUCKET,
        fileUrl,
        mimeType: file.type,
        fileSize: file.size,
        uploadedBy: user.id,
      },
    });

    await logAudit({
      userId: user.id,
      functionCode: PROFILE_CHANGE.CREATE,
      action: 'UPLOAD_EVIDENCE',
      resourceType: 'PROFILE_CHANGE_REQUEST',
      resourceId: params.id,
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, data: attachment }, { status: 201 });
  } catch (err) {
    console.error('[POST profile-change attachment]', err);
    return NextResponse.json({ success: false, error: 'Lỗi tải minh chứng lên kho lưu trữ' }, { status: 500 });
  }
}
