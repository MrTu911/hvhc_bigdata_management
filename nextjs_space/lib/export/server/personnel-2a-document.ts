/**
 * Dựng lý lịch quân nhân Mẫu 2A-LLDV cho một cá nhân.
 *
 * Nguồn dữ liệu: model Personnel (backbone M02). Các dữ liệu gắn với tài khoản
 * (đảng viên, khen thưởng/kỷ luật) lấy qua quan hệ Personnel.account (User).
 *
 * SERVER-ONLY. Hàm dựng HTML là thuần (dễ test); hàm dựng PDF lazy-import puppeteer.
 */

import prisma from '@/lib/db';
import {
  ISSUING_AUTHORITY,
  NATIONAL_HEADER,
  formatDateVi,
  formatPlaceAndDate,
} from './official-document';
import {
  GENDER_LABELS,
  FAMILY_RELATION_LABELS,
  EDUCATION_LEVEL_LABELS,
  POLICY_LEVEL_LABELS,
  getRankLabel,
  getLabel,
} from '@/lib/export/labels';

// ─── Kiểu dữ liệu lý lịch 2A (tối thiểu cần để render) ────────────────────────

export interface Personnel2aEducation {
  level: string;
  institution: string | null;
  major: string | null;
  startDate: Date | string | null;
  endDate: Date | string | null;
}

export interface Personnel2aCareer {
  eventDate: Date | string | null;
  endDate: Date | string | null;
  title: string | null;
  newPosition: string | null;
  newUnit: string | null;
  notes: string | null;
}

export interface Personnel2aPolicy {
  recordType: string;
  title: string | null;
  level: string | null;
  decisionNumber: string | null;
  decisionDate: Date | string | null;
  reason: string | null;
}

export interface Personnel2aFamily {
  relation: string;
  fullName: string | null;
  dateOfBirth: Date | string | null;
  address: string | null;
  occupation: string | null;
}

export interface Personnel2aParty {
  joinDate: Date | string | null;
  officialDate: Date | string | null;
  partyCardNumber: string | null;
  status: string | null;
}

export interface Personnel2aData {
  fullName: string | null;
  dateOfBirth: Date | string | null;
  militaryRank: string | null;
  militaryIdNumber: string | null;
  position: string | null;
  unitName: string | null;
  gender: string | null;
  ethnicity: string | null;
  religion: string | null;
  placeOfOrigin: string | null;
  birthPlace: string | null;
  educationLevel: string | null;
  enlistmentDate: Date | string | null;
  email: string | null;
  phone: string | null;
  educationHistories: Personnel2aEducation[];
  careerHistories: Personnel2aCareer[];
  policyRecords: Personnel2aPolicy[];
  familyRelations: Personnel2aFamily[];
  partyMember: Personnel2aParty | null;
}

// ─── Tải dữ liệu ──────────────────────────────────────────────────────────────

/** Map userId (legacy) → personnelId để giữ tương thích consumer cũ. */
export async function resolvePersonnelIdFromUserId(
  userId: string
): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { personnelId: true },
  });
  return user?.personnelId ?? null;
}

/**
 * Tải toàn bộ dữ liệu cần cho lý lịch 2A theo personnelId.
 * Trả null nếu không tồn tại nhân sự.
 */
export async function loadPersonnel2aData(
  personnelId: string
): Promise<Personnel2aData | null> {
  const personnel = await prisma.personnel.findUnique({
    where: { id: personnelId },
    include: {
      unit: { select: { name: true } },
      educationHistories: { orderBy: { startDate: 'desc' } },
      careerHistories: { orderBy: { eventDate: 'desc' } },
      familyRelations: { where: { deletedAt: null } },
      account: {
        select: {
          email: true,
          phone: true,
          partyMember: {
            select: {
              joinDate: true,
              officialDate: true,
              partyCardNumber: true,
              status: true,
            },
          },
          policyRecords: {
            where: { deletedAt: null, workflowStatus: 'APPROVED' },
            orderBy: { decisionDate: 'desc' },
            select: {
              recordType: true,
              title: true,
              level: true,
              decisionNumber: true,
              decisionDate: true,
              reason: true,
            },
          },
        },
      },
    },
  });

  if (!personnel) return null;

  return {
    fullName: personnel.fullName,
    dateOfBirth: personnel.dateOfBirth,
    militaryRank: personnel.militaryRank,
    militaryIdNumber: personnel.militaryIdNumber,
    position: personnel.position,
    unitName: personnel.unit?.name ?? null,
    gender: personnel.gender,
    ethnicity: personnel.ethnicity,
    religion: personnel.religion,
    placeOfOrigin: personnel.placeOfOrigin,
    birthPlace: personnel.birthPlace,
    educationLevel: personnel.educationLevel,
    enlistmentDate: personnel.enlistmentDate,
    email: personnel.account?.email ?? null,
    phone: personnel.account?.phone ?? null,
    educationHistories: personnel.educationHistories.map((e) => ({
      level: e.level,
      institution: e.institution,
      major: e.major,
      startDate: e.startDate,
      endDate: e.endDate,
    })),
    careerHistories: personnel.careerHistories.map((c) => ({
      eventDate: c.eventDate,
      endDate: c.endDate,
      title: c.title,
      newPosition: c.newPosition,
      newUnit: c.newUnit,
      notes: c.notes,
    })),
    policyRecords: personnel.account?.policyRecords ?? [],
    familyRelations: personnel.familyRelations.map((f) => ({
      relation: f.relation,
      fullName: f.fullName,
      dateOfBirth: f.dateOfBirth,
      address: f.address,
      occupation: f.occupation,
    })),
    partyMember: personnel.account?.partyMember ?? null,
  };
}

// ─── Dựng HTML ────────────────────────────────────────────────────────────────

/** Escape ký tự đặc biệt HTML để chống injection trong nội dung động. */
function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const EMPTY = '—';

function dateRange(start: Date | string | null, end: Date | string | null): string {
  const from = formatDateVi(start) || EMPTY;
  const to = end ? formatDateVi(end) : 'Nay';
  return `${from} – ${to}`;
}

/** Dựng nội dung HTML lý lịch 2A (thuần, không phụ thuộc DB hay puppeteer). */
export function buildPersonnel2aHtml(data: Personnel2aData): string {
  const awards = data.policyRecords.filter((r) =>
    ['REWARD', 'EMULATION'].includes(r.recordType)
  );
  const disciplines = data.policyRecords.filter((r) => r.recordType === 'DISCIPLINE');
  const party = data.partyMember;
  const now = new Date();

  const educationRows =
    data.educationHistories.length > 0
      ? `<table>
  <tr><th>Thời gian</th><th>Trường/Cơ sở đào tạo</th><th>Chuyên ngành</th><th>Trình độ</th></tr>
  ${data.educationHistories
    .map(
      (e) => `<tr>
    <td>${escapeHtml(dateRange(e.startDate, e.endDate))}</td>
    <td>${escapeHtml(e.institution || EMPTY)}</td>
    <td>${escapeHtml(e.major || EMPTY)}</td>
    <td>${escapeHtml(getLabel(EDUCATION_LEVEL_LABELS, e.level) || EMPTY)}</td>
  </tr>`
    )
    .join('')}
</table>`
      : '<p class="no-data">Chưa có thông tin đào tạo</p>';

  const careerRows =
    data.careerHistories.length > 0
      ? `<table>
  <tr><th>Thời gian</th><th>Nội dung/Chức vụ</th><th>Đơn vị</th><th>Ghi chú</th></tr>
  ${data.careerHistories
    .map(
      (c) => `<tr>
    <td>${escapeHtml(dateRange(c.eventDate, c.endDate))}</td>
    <td>${escapeHtml(c.newPosition || c.title || EMPTY)}</td>
    <td>${escapeHtml(c.newUnit || EMPTY)}</td>
    <td>${escapeHtml(c.notes || '')}</td>
  </tr>`
    )
    .join('')}
</table>`
      : '<p class="no-data">Chưa có thông tin công tác</p>';

  const awardRows =
    awards.length > 0
      ? `<table>
  <tr><th>Số quyết định</th><th>Hình thức khen thưởng</th><th>Cấp</th><th>Ngày quyết định</th></tr>
  ${awards
    .map(
      (a) => `<tr>
    <td>${escapeHtml(a.decisionNumber || EMPTY)}</td>
    <td>${escapeHtml(a.title || EMPTY)}</td>
    <td>${escapeHtml(getLabel(POLICY_LEVEL_LABELS, a.level) || EMPTY)}</td>
    <td>${escapeHtml(formatDateVi(a.decisionDate) || EMPTY)}</td>
  </tr>`
    )
    .join('')}
</table>`
      : '<p class="no-data">Không có khen thưởng</p>';

  const disciplineRows =
    disciplines.length > 0
      ? `<table>
  <tr><th>Số quyết định</th><th>Hình thức kỷ luật</th><th>Lý do</th><th>Ngày quyết định</th></tr>
  ${disciplines
    .map(
      (d) => `<tr>
    <td>${escapeHtml(d.decisionNumber || EMPTY)}</td>
    <td>${escapeHtml(d.title || getLabel(POLICY_LEVEL_LABELS, d.level) || EMPTY)}</td>
    <td>${escapeHtml(d.reason || EMPTY)}</td>
    <td>${escapeHtml(formatDateVi(d.decisionDate) || EMPTY)}</td>
  </tr>`
    )
    .join('')}
</table>`
      : '<p class="no-data">Không có kỷ luật</p>';

  const familyRows =
    data.familyRelations.length > 0
      ? `<table>
  <tr><th>Quan hệ</th><th>Họ và tên</th><th>Ngày sinh</th><th>Nơi ở</th><th>Nghề nghiệp</th></tr>
  ${data.familyRelations
    .map(
      (f) => `<tr>
    <td>${escapeHtml(getLabel(FAMILY_RELATION_LABELS, f.relation) || EMPTY)}</td>
    <td>${escapeHtml(f.fullName || EMPTY)}</td>
    <td>${escapeHtml(formatDateVi(f.dateOfBirth) || EMPTY)}</td>
    <td>${escapeHtml(f.address || EMPTY)}</td>
    <td>${escapeHtml(f.occupation || EMPTY)}</td>
  </tr>`
    )
    .join('')}
</table>`
      : '<p class="no-data">Chưa có thông tin gia đình</p>';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>Lý lịch quân nhân – ${escapeHtml(data.fullName)}</title>
<style>
  body { font-family: 'Times New Roman', serif; font-size: 13pt; margin: 20mm 25mm; color: #000; }
  .org-header { display: flex; justify-content: space-between; margin-bottom: 12px; }
  .org-header .block { text-align: center; width: 48%; }
  .org-header .block .strong { font-weight: bold; text-transform: uppercase; }
  .org-header .block .underline { display: inline-block; border-bottom: 1px solid #000; padding: 0 8px; }
  .title { text-align: center; margin: 16px 0; }
  .title h2 { font-size: 16pt; font-weight: bold; text-transform: uppercase; margin: 4px 0; }
  .title p { font-size: 11pt; margin: 2px 0; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  td, th { border: 1px solid #000; padding: 4px 6px; font-size: 12pt; vertical-align: top; }
  th { background: #f0f0f0; font-weight: bold; text-align: left; }
  .field-label { font-weight: bold; width: 22%; }
  .section-title { font-weight: bold; font-size: 13pt; margin-top: 12px; margin-bottom: 4px;
                   background: #e8e8e8; padding: 3px 6px; border: 1px solid #000; }
  .no-data { font-style: italic; color: #666; }
  .signature-block { margin-top: 30px; display: flex; justify-content: space-between; }
  .signature-col { text-align: center; width: 40%; }
  @media print { body { margin: 15mm 20mm; } }
</style>
</head>
<body>
<div class="org-header">
  <div class="block">
    <div class="strong">${ISSUING_AUTHORITY.ministry}</div>
    <div class="strong">${ISSUING_AUTHORITY.academy}</div>
  </div>
  <div class="block">
    <div class="strong">${NATIONAL_HEADER.nation}</div>
    <div class="underline"><strong>${NATIONAL_HEADER.motto}</strong></div>
  </div>
</div>

<div class="title">
  <h2>Lý lịch quân nhân</h2>
  <p>(Mẫu 2A-LLDV)</p>
</div>

<div class="section-title">I. THÔNG TIN CÁ NHÂN</div>
<table>
  <tr><td class="field-label">Họ và tên (chữ in hoa):</td><td><strong>${escapeHtml(
    (data.fullName || '').toUpperCase()
  )}</strong></td>
      <td class="field-label">Ngày sinh:</td><td>${escapeHtml(
        formatDateVi(data.dateOfBirth) || EMPTY
      )}</td></tr>
  <tr><td class="field-label">Cấp bậc/Hàm:</td><td>${escapeHtml(
    getRankLabel(data.militaryRank) || EMPTY
  )}</td>
      <td class="field-label">Số quân:</td><td>${escapeHtml(
        data.militaryIdNumber || EMPTY
      )}</td></tr>
  <tr><td class="field-label">Chức vụ hiện tại:</td><td>${escapeHtml(
    data.position || EMPTY
  )}</td>
      <td class="field-label">Đơn vị:</td><td>${escapeHtml(
        data.unitName || EMPTY
      )}</td></tr>
  <tr><td class="field-label">Giới tính:</td><td>${escapeHtml(
    getLabel(GENDER_LABELS, data.gender) || EMPTY
  )}</td>
      <td class="field-label">Dân tộc:</td><td>${escapeHtml(
        data.ethnicity || 'Kinh'
      )}</td></tr>
  <tr><td class="field-label">Tôn giáo:</td><td>${escapeHtml(
    data.religion || 'Không'
  )}</td>
      <td class="field-label">Quê quán:</td><td>${escapeHtml(
        data.placeOfOrigin || EMPTY
      )}</td></tr>
  <tr><td class="field-label">Nơi sinh:</td><td>${escapeHtml(
    data.birthPlace || EMPTY
  )}</td>
      <td class="field-label">Trình độ học vấn:</td><td>${escapeHtml(
        data.educationLevel || EMPTY
      )}</td></tr>
  <tr><td class="field-label">Email:</td><td>${escapeHtml(data.email || EMPTY)}</td>
      <td class="field-label">Số điện thoại:</td><td>${escapeHtml(
        data.phone || EMPTY
      )}</td></tr>
  <tr><td class="field-label">Ngày nhập ngũ:</td><td>${escapeHtml(
    formatDateVi(data.enlistmentDate) || EMPTY
  )}</td>
      <td class="field-label">Ngày vào biên chế:</td><td>${escapeHtml(
        formatDateVi(data.enlistmentDate) || EMPTY
      )}</td></tr>
</table>

<div class="section-title">II. THÔNG TIN ĐẢNG</div>
<table>
  <tr><td class="field-label">Ngày vào Đảng dự bị:</td><td>${escapeHtml(
    party ? formatDateVi(party.joinDate) || EMPTY : EMPTY
  )}</td>
      <td class="field-label">Ngày vào Đảng chính thức:</td><td>${escapeHtml(
        party ? formatDateVi(party.officialDate) || EMPTY : EMPTY
      )}</td></tr>
  <tr><td class="field-label">Số thẻ Đảng:</td><td>${escapeHtml(
    party?.partyCardNumber || EMPTY
  )}</td>
      <td class="field-label">Trạng thái:</td><td>${escapeHtml(
        party ? party.status || EMPTY : 'Chưa vào Đảng'
      )}</td></tr>
</table>

<div class="section-title">III. TRÌNH ĐỘ ĐÀO TẠO</div>
${educationRows}

<div class="section-title">IV. QUÁ TRÌNH CÔNG TÁC</div>
${careerRows}

<div class="section-title">V. KHEN THƯỞNG</div>
${awardRows}

<div class="section-title">VI. KỶ LUẬT</div>
${disciplineRows}

<div class="section-title">VII. QUAN HỆ GIA ĐÌNH</div>
${familyRows}

<div class="signature-block">
  <div class="signature-col">
    <p>Xác nhận của đơn vị</p>
    <br/><br/><br/>
    <p>(Ký, đóng dấu)</p>
  </div>
  <div class="signature-col">
    <p>${escapeHtml(formatPlaceAndDate(now))}</p>
    <p><strong>Người khai</strong></p>
    <br/><br/><br/>
    <p>(Ký và ghi rõ họ tên)</p>
  </div>
</div>
</body>
</html>`;
}

// ─── Dựng PDF ─────────────────────────────────────────────────────────────────

/**
 * Render HTML lý lịch 2A thành PDF (A4) bằng puppeteer.
 * Lazy-import để không kéo puppeteer vào các luồng chỉ cần HTML.
 */
export async function buildPersonnel2aPdf(html: string): Promise<Buffer> {
  const { default: puppeteer } = await import('puppeteer');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
