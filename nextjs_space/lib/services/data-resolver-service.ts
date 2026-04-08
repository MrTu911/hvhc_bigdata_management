/**
 * Data Resolver Service – M18
 * Gọi parallel tới các API module, merge data để render template
 */

import prisma from '@/lib/db';

export type EntityType = 'personnel' | 'student' | 'party_member' | 'faculty';

interface ResolveOptions {
  entityId: string;
  entityType: EntityType;
  dataMap: Record<string, unknown>;
  requestedBy: string;
}

/**
 * Resolve dữ liệu từ DB cho 1 entity dựa theo dataMap
 * Returns flat object với key là placeholder name, value là data đã resolve
 */
export async function resolveEntityData(options: ResolveOptions): Promise<Record<string, unknown>> {
  const { entityId, entityType, dataMap } = options;
  const resolved: Record<string, unknown> = {};

  try {
    switch (entityType) {
      case 'personnel':
        return await resolvePersonnelData(entityId, dataMap);
      case 'student':
        return await resolveStudentData(entityId, dataMap);
      case 'faculty':
        return await resolveFacultyData(entityId, dataMap);
      case 'party_member':
        return await resolvePartyMemberData(entityId, dataMap);
      default:
        return resolved;
    }
  } catch (error) {
    throw new Error(`Data resolve failed for ${entityType}/${entityId}: ${error}`);
  }
}

/**
 * Resolve dữ liệu nhân sự (M02 + M09)
 */
async function resolvePersonnelData(
  id: string,
  dataMap: Record<string, unknown>
): Promise<Record<string, unknown>> {
  // Lấy personnel với unit relation và linked user account
  const personnel = await prisma.personnel.findUnique({
    where: { id },
    include: {
      unit: { select: { id: true, name: true, code: true } },
      account: true,
    },
  });

  if (!personnel) throw new Error(`Không tìm thấy nhân sự ID: ${id}`);

  const userId = personnel.account?.id;

  // Lấy tất cả data cần thiết song song qua userId
  const [educations, workHistories, publications, research, awards, partyMemberData] =
    await Promise.all([
      userId
        ? prisma.educationHistory.findMany({ where: { userId }, orderBy: { startDate: 'asc' } })
        : [],
      userId
        ? prisma.workExperience.findMany({ where: { userId }, orderBy: { startDate: 'asc' } })
        : [],
      userId
        ? prisma.scientificPublication.findMany({ where: { userId }, orderBy: { year: 'desc' } })
        : [],
      userId
        ? prisma.scientificResearch.findMany({ where: { userId }, orderBy: { year: 'desc' } })
        : [],
      userId
        ? prisma.awardsRecord.findMany({ where: { userId }, orderBy: { year: 'desc' } })
        : [],
      userId ? prisma.partyMember.findFirst({ where: { userId } }) : null,
    ]);

  // Format date helper
  const fmt = (d: Date | null | undefined, f = 'DD/MM/YYYY') => {
    if (!d) return '';
    const date = new Date(d);
    if (f === 'MM/YYYY') return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    if (f === 'DD/MM/YYYY') return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    return date.toISOString();
  };

  // Map gender
  const genderMap: Record<string, string> = { M: 'Nam', F: 'Nữ', MALE: 'Nam', FEMALE: 'Nữ' };

  // Education by level enum (DAI_HOC, THAC_SI, TIEN_SI)
  const eduByLevel = (level: string) => educations.find((e) => e.level === level) || null;

  // Resolve core fields
  const data: Record<string, unknown> = {
    hoTen: personnel.fullName?.toUpperCase() || '',
    gioiTinh: genderMap[personnel.gender || ''] || personnel.gender || '',
    ngaySinh: fmt(personnel.dateOfBirth),
    noiSinh: personnel.birthPlace || '',
    queQuan: personnel.placeOfOrigin || '',
    danToc: personnel.ethnicity || '',
    capBac: personnel.militaryRank || '',
    chucVu: personnel.position || '',
    donViCongTac: personnel.unit?.name || '',
    diaChiLienLac: personnel.account?.address || '',
    dienThoai: personnel.account?.phone || '',
    militaryId: personnel.militaryIdNumber || '',

    // Education - Đại học
    daoTao_DH_hinhThuc: eduByLevel('DAI_HOC')?.trainingSystem || '',
    daoTao_DH_tuNam: fmt(eduByLevel('DAI_HOC')?.startDate, 'MM/YYYY'),
    daoTao_DH_denNam: fmt(eduByLevel('DAI_HOC')?.endDate, 'MM/YYYY'),
    daoTao_DH_noiHoc: eduByLevel('DAI_HOC')?.institution || '',
    daoTao_DH_chuyenNganh: eduByLevel('DAI_HOC')?.major || '',

    // Education - Thạc sĩ
    daoTao_ThS_tuNam: fmt(eduByLevel('THAC_SI')?.startDate, 'MM/YYYY'),
    daoTao_ThS_tenLV: eduByLevel('THAC_SI')?.thesisTitle || '',
    daoTao_ThS_nguoiHD: eduByLevel('THAC_SI')?.supervisor || '',

    // Education - Tiến sĩ
    daoTao_TS_tenLA: eduByLevel('TIEN_SI')?.thesisTitle || '',
    daoTao_TS_nguoiHD_1: '',
    daoTao_TS_nguoiHD_2: '',
    ngoaiNgu: '',

    // Công tác list
    congTac_list: workHistories.map((w) => ({
      tuNgay: fmt(w.startDate, 'MM/YYYY'),
      denNgay: w.endDate ? fmt(w.endDate, 'MM/YYYY') : 'Nay',
      noiCongTac: w.organization || '',
      congViec: w.position || '',
    })),

    // Publications
    giaoTrinh_list: publications
      .filter((p) => p.type === 'GIAO_TRINH')
      .map((p, i) => ({
        stt: i + 1,
        tenTaiLieu: p.title || '',
        namXuatBan: p.year || '',
        chuBien: p.role === 'CHU_BIEN' ? 'X' : '',
      })),

    // Research
    deTai_list: research.map((r) => ({
      ten: r.title || '',
      nam: r.year || '',
      vaiTro: r.role === 'CHU_NHIEM' ? 'Chủ nhiệm' : 'Tham gia nghiên cứu',
    })),

    // Bài báo
    baiBao_list: publications
      .filter((p) => p.type === 'BAI_BAO')
      .map((p) => ({
        tacGia: p.coAuthors || '',
        nam: p.year || '',
        tenBaiBao: p.title || '',
        tapChi: p.organization || '',
        soTapChi: p.issueNumber || '',
      })),

    // Khen thưởng
    khenThuong: awards
      .filter((a) => a.type === 'KHEN_THUONG')
      .map((a) => a.description)
      .filter(Boolean)
      .join(', ') || '',

    kyLuat: awards
      .filter((a) => a.type === 'KY_LUAT')
      .map((a) => a.description)
      .filter(Boolean)
      .join(', ') || 'Không',

    // Đảng
    ngayVaoDang: fmt(partyMemberData?.joinDate),
    ngayChinhThuc: fmt(partyMemberData?.officialDate),

    // Xác nhận
    thoiGianKy: fmt(new Date()),
  };

  return data;
}

/**
 * Resolve dữ liệu học viên (M08)
 */
async function resolveStudentData(
  id: string,
  _dataMap: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const student = await prisma.hocVien.findUnique({
    where: { id },
    include: {
      ketQuaHocTap: {
        orderBy: { hocKy: 'asc' },
      },
    },
  });

  if (!student) throw new Error(`Không tìm thấy học viên ID: ${id}`);

  const fmt = (d: Date | null | undefined) => {
    if (!d) return '';
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  return {
    hoTen: student.hoTen?.toUpperCase() || '',
    mssv: student.maHocVien || '',
    ngaySinh: fmt(student.ngaySinh),
    gioiTinh: student.gioiTinh === 'M' ? 'Nam' : 'Nữ',
    lop: student.lop || '',
    ketQua_list: student.ketQuaHocTap.map((k) => ({
      monHoc: k.monHoc || '',
      diem: k.diem || '',
      xepLoai: k.ketQua || '',
    })),
  };
}

/**
 * Resolve dữ liệu giảng viên (M02 + M09)
 */
async function resolveFacultyData(
  id: string,
  dataMap: Record<string, unknown>
): Promise<Record<string, unknown>> {
  // Reuse personnel resolver for faculty
  return resolvePersonnelData(id, dataMap);
}

/**
 * Resolve dữ liệu đảng viên (M03)
 */
async function resolvePartyMemberData(
  id: string,
  _dataMap: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const member = await prisma.partyMember.findUnique({
    where: { id },
    include: {
      user: true,
    },
  });

  if (!member) throw new Error(`Không tìm thấy đảng viên ID: ${id}`);

  const fmt = (d: Date | null | undefined) => {
    if (!d) return '';
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  return {
    hoTen: member.user?.name?.toUpperCase() || '',
    capBac: member.user?.rank || '',
    chucVu: member.user?.position || '',
    donVi: member.user?.unit || '',
    ngayVaoDang: fmt(member.joinDate),
    ngayChinhThuc: fmt(member.officialDate),
    chiBoHienTai: member.partyCell || '',
    xepLoai: '',
  };
}

/**
 * Render template (simple placeholder replacement)
 * Thay thế {placeholder} trong HTML string bằng giá trị thực
 */
export function renderTemplate(
  templateContent: string,
  data: Record<string, unknown>
): string {
  let result = templateContent;

  // Replace simple placeholders
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) continue; // Xử lý array riêng
    const placeholder = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(placeholder, String(value ?? ''));
  }

  return result;
}

/**
 * Lấy missing fields từ dataMap so với resolved data
 */
export function getMissingFields(
  dataMap: Record<string, unknown>,
  resolvedData: Record<string, unknown>
): string[] {
  const missing: string[] = [];
  for (const key of Object.keys(dataMap)) {
    if (resolvedData[key] === undefined || resolvedData[key] === null || resolvedData[key] === '') {
      missing.push(key);
    }
  }
  return missing;
}
