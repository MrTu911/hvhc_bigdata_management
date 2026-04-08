/**
 * API: Export 2A-LLDV – Xuất lý lịch quân nhân dạng 2A
 * Path: /api/personnel/export-2a?userId=xxx
 * Generates an HTML document formatted as the Vietnamese military 2A-LLDV (Lý lịch quân nhân)
 * Returns HTML (for preview) or PDF (via ?format=pdf)
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { PERSONNEL } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import prisma from '@/lib/db';

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '....../....../..........';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '....../....../..........';
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
}

function buildHtml(personnel: any): string {
  const p = personnel;
  const edu = p.educationHistory || [];
  const work = p.workExperiences || [];
  const awards = p.policyRecords?.filter((r: any) => ['REWARD', 'EMULATION'].includes(r.recordType)) || [];
  const disciplines = p.policyRecords?.filter((r: any) => r.recordType === 'DISCIPLINE') || [];
  const party = p.partyMember;
  const family = p.familyRelations || [];

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>Lý lịch quân nhân – ${p.name}</title>
<style>
  body { font-family: 'Times New Roman', serif; font-size: 13pt; margin: 20mm 25mm; color: #000; }
  .header { text-align: center; margin-bottom: 10px; }
  .header h2 { font-size: 16pt; font-weight: bold; text-transform: uppercase; margin: 4px 0; }
  .header p { font-size: 11pt; margin: 2px 0; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  td, th { border: 1px solid #000; padding: 4px 6px; font-size: 12pt; vertical-align: top; }
  th { background: #f0f0f0; font-weight: bold; text-align: left; }
  .field-label { font-weight: bold; width: 35%; }
  .section-title { font-weight: bold; font-size: 13pt; margin-top: 12px; margin-bottom: 4px;
                   background: #e8e8e8; padding: 3px 6px; border: 1px solid #000; }
  .no-data { font-style: italic; color: #666; }
  .signature-block { margin-top: 30px; display: flex; justify-content: space-between; }
  .signature-col { text-align: center; width: 30%; }
  @media print { body { margin: 15mm 20mm; } }
</style>
</head>
<body>
<div class="header">
  <p>CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
  <p><strong>Độc lập – Tự do – Hạnh phúc</strong></p>
  <h2>Lý lịch quân nhân</h2>
  <p>(Mẫu 2A-LLDV)</p>
</div>

<div class="section-title">I. THÔNG TIN CÁ NHÂN</div>
<table>
  <tr><td class="field-label">Họ và tên (chữ in hoa):</td><td><strong>${(p.name || '').toUpperCase()}</strong></td>
      <td class="field-label">Ngày sinh:</td><td>${formatDate(p.dateOfBirth)}</td></tr>
  <tr><td class="field-label">Cấp bậc/Hàm:</td><td>${p.rank || '—'}</td>
      <td class="field-label">Số quân:</td><td>${p.militaryId || '—'}</td></tr>
  <tr><td class="field-label">Chức vụ hiện tại:</td><td>${p.position || '—'}</td>
      <td class="field-label">Đơn vị:</td><td>${p.unitRelation?.name || p.unit || '—'}</td></tr>
  <tr><td class="field-label">Giới tính:</td><td>${p.gender === 'MALE' ? 'Nam' : p.gender === 'FEMALE' ? 'Nữ' : '—'}</td>
      <td class="field-label">Dân tộc:</td><td>${p.ethnicity || 'Kinh'}</td></tr>
  <tr><td class="field-label">Tôn giáo:</td><td>${p.religion || 'Không'}</td>
      <td class="field-label">Quê quán:</td><td>${p.homeTown || '—'}</td></tr>
  <tr><td class="field-label">Nơi sinh:</td><td>${p.birthPlace || '—'}</td>
      <td class="field-label">Trình độ học vấn:</td><td>${p.educationLevel || '—'}</td></tr>
  <tr><td class="field-label">Email:</td><td>${p.email || '—'}</td>
      <td class="field-label">Số điện thoại:</td><td>${p.phone || '—'}</td></tr>
  <tr><td class="field-label">Ngày nhập ngũ:</td><td>${formatDate(p.enlistmentDate)}</td>
      <td class="field-label">Ngày vào biên chế:</td><td>${formatDate(p.enlistmentDate)}</td></tr>
</table>

<div class="section-title">II. THÔNG TIN ĐẢNG</div>
<table>
  <tr><td class="field-label">Ngày vào Đảng dự bị:</td><td>${party ? formatDate(party.joinDate) : '—'}</td>
      <td class="field-label">Ngày vào Đảng chính thức:</td><td>${party ? formatDate(party.officialDate) : '—'}</td></tr>
  <tr><td class="field-label">Số thẻ Đảng:</td><td>${party?.partyCardNumber || '—'}</td>
      <td class="field-label">Trạng thái:</td><td>${party ? (party.status === 'ACTIVE' ? 'Đảng viên chính thức' : party.status) : 'Chưa vào Đảng'}</td></tr>
</table>

<div class="section-title">III. TRÌNH ĐỘ ĐÀO TẠO</div>
${edu.length > 0 ? `
<table>
  <tr><th>Thời gian</th><th>Trường/Cơ sở đào tạo</th><th>Chuyên ngành</th><th>Bằng cấp</th></tr>
  ${edu.map((e: any) => `<tr>
    <td>${formatDate(e.startDate)} – ${formatDate(e.endDate)}</td>
    <td>${e.institution || '—'}</td>
    <td>${e.major || e.fieldOfStudy || '—'}</td>
    <td>${e.degree || '—'}</td>
  </tr>`).join('')}
</table>` : '<p class="no-data">Chưa có thông tin đào tạo</p>'}

<div class="section-title">IV. QUÁ TRÌNH CÔNG TÁC</div>
${work.length > 0 ? `
<table>
  <tr><th>Thời gian</th><th>Chức vụ</th><th>Đơn vị</th><th>Ghi chú</th></tr>
  ${work.map((w: any) => `<tr>
    <td>${formatDate(w.startDate)} – ${w.endDate ? formatDate(w.endDate) : 'Nay'}</td>
    <td>${w.position || w.jobTitle || '—'}</td>
    <td>${w.organization || w.company || '—'}</td>
    <td>${w.description || ''}</td>
  </tr>`).join('')}
</table>` : '<p class="no-data">Chưa có thông tin công tác</p>'}

<div class="section-title">V. KHEN THƯỞNG</div>
${awards.length > 0 ? `
<table>
  <tr><th>Số quyết định</th><th>Hình thức khen thưởng</th><th>Cấp</th><th>Ngày quyết định</th></tr>
  ${awards.map((a: any) => `<tr>
    <td>${a.decisionNumber || '—'}</td>
    <td>${a.title || '—'}</td>
    <td>${a.level || '—'}</td>
    <td>${formatDate(a.decisionDate)}</td>
  </tr>`).join('')}
</table>` : '<p class="no-data">Không có khen thưởng</p>'}

<div class="section-title">VI. KỶ LUẬT</div>
${disciplines.length > 0 ? `
<table>
  <tr><th>Số quyết định</th><th>Hình thức kỷ luật</th><th>Lý do</th><th>Ngày quyết định</th></tr>
  ${disciplines.map((d: any) => `<tr>
    <td>${d.decisionNumber || '—'}</td>
    <td>${d.title || d.level || '—'}</td>
    <td>${d.reason || '—'}</td>
    <td>${formatDate(d.decisionDate)}</td>
  </tr>`).join('')}
</table>` : '<p class="no-data">Không có kỷ luật</p>'}

<div class="section-title">VII. QUAN HỆ GIA ĐÌNH</div>
${family.length > 0 ? `
<table>
  <tr><th>Quan hệ</th><th>Họ và tên</th><th>Ngày sinh</th><th>Nơi ở</th><th>Nghề nghiệp</th></tr>
  ${family.map((f: any) => `<tr>
    <td>${f.relationship || '—'}</td>
    <td>${f.name || '—'}</td>
    <td>${formatDate(f.dateOfBirth)}</td>
    <td>${f.address || '—'}</td>
    <td>${f.occupation || '—'}</td>
  </tr>`).join('')}
</table>` : '<p class="no-data">Chưa có thông tin gia đình</p>'}

<div class="signature-block">
  <div class="signature-col">
    <p>Xác nhận của đơn vị</p>
    <br/><br/><br/>
    <p>(Ký, đóng dấu)</p>
  </div>
  <div class="signature-col">
    <p>........., ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</p>
    <p><strong>Người khai</strong></p>
    <br/><br/><br/>
    <p>(Ký và ghi rõ họ tên)</p>
  </div>
</div>
</body>
</html>`;
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.EXPORT);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const user = authResult.user!;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'Thiếu userId' }, { status: 400 });

    const personnel = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        unitRelation: { select: { name: true } },
        educationHistory: { orderBy: { startDate: 'desc' } },
        workExperience: { orderBy: { startDate: 'desc' } },
        policyRecords: {
          where: { deletedAt: null, workflowStatus: 'APPROVED' },
          orderBy: { decisionDate: 'desc' },
          select: { id: true, recordType: true, title: true, level: true, decisionNumber: true, decisionDate: true, reason: true },
        },
        partyMember: { select: { joinDate: true, officialDate: true, partyCardNumber: true, status: true } },
        familyRelations: true,
      },
    });

    if (!personnel) return NextResponse.json({ error: 'Không tìm thấy cán bộ' }, { status: 404 });

    const html = buildHtml(personnel);

    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.EXPORT,
      action: 'EXPORT',
      resourceType: 'PERSONNEL',
      resourceId: userId,
      result: 'SUCCESS',
      metadata: { format: '2A-LLDV', targetUser: personnel.name },
    });

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="2A_LLDV_${personnel.militaryId || personnel.id}.html"`,
      },
    });
  } catch (error) {
    console.error('[Export 2A-LLDV GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
