/**
 * Cadre Profile Export Service — dựng dữ liệu xuất "Hồ sơ cán bộ điện tử" (mẫu 99 trường).
 *
 * Nguồn dữ liệu là USER (nơi chứa dữ liệu thật của cán bộ, vd import Viện B12) + các model
 * con khóa theo userId, KHÁC với resolver personnel của M18 (vốn yêu cầu bản ghi Personnel
 * và lấy WorkExperience). Vì vậy route xuất hồ sơ dùng exportWithData() với resolvedData do
 * service này dựng, theo đúng khuôn personal/career-export.service.ts.
 *
 * resolvedData khớp placeholder của template TPL_M02_HSCB_DIENTU:
 *   - ~80 scalar (hoTen, ngaySinh, capBac, ... + header Nghị định 30/2020).
 *   - 19 vòng lặp danh sách: ngoaiNgu_list, ethnicLang_list, combat_list, concurrentPos_list,
 *     khenThuong_list, kyLuat_list, asset_list, giaDinh_list, foreignTrip_list, honor_list,
 *     khoaHoc_list, baiBao_list, medical_list, evaluation_list, allowance_list, doanHistory_list,
 *     dangHistory_list, externalPos_list, professionalTitle_list.
 *
 * Lưu ý nhạy cảm: route gọi service rồi mask (tài sản giá trị/giấy tờ, CCCD) ở tầng route
 * khi caller thiếu quyền VIEW_SENSITIVE — service trả dữ liệu đầy đủ.
 */

import prisma from '@/lib/db';
import { buildHeaderContext } from '@/lib/services/data-resolver-service';
import {
  ASSET_TYPE_LABELS,
  COMMAND_MGMT_LEVEL_LABELS,
  EDUCATION_LEVEL_LABELS,
  EVALUATION_PERIOD_TYPE_LABELS,
  FAMILY_RELATION_LABELS,
  MANAGEMENT_CATEGORY_LABELS,
  MARITAL_STATUS_LABELS,
  PARTY_POSITION_LABELS,
  POLICY_LEVEL_LABELS,
  POLITICAL_THEORY_LEVEL_LABELS,
  PUBLICATION_TYPE_LABELS,
  RESEARCH_ROLE_LABELS,
} from '@/lib/constants/cadre-profile';

// ===== Helpers =====

function formatFullDate(d: Date | null | undefined): string {
  if (!d) return '';
  const date = new Date(d);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

function formatMonthYear(d: Date | null | undefined): string {
  if (!d) return '';
  const date = new Date(d);
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

/** Khoảng thời gian "từ – đến" (đến trống = "nay" nếu có ngày bắt đầu). */
function formatRange(from: Date | null | undefined, to: Date | null | undefined): string {
  const f = formatMonthYear(from);
  if (!f) return formatMonthYear(to);
  const t = to ? formatMonthYear(to) : 'nay';
  return `${f} – ${t}`;
}

function gender(value: string | null | undefined): string {
  const v = (value ?? '').toUpperCase();
  if (v === 'M' || v === 'MALE' || v === 'NAM') return 'Nam';
  if (v === 'F' || v === 'FEMALE' || v === 'NU' || v === 'NỮ') return 'Nữ';
  return value ?? '';
}

function decimalToText(value: { toString(): string } | null | undefined): string {
  return value == null ? '' : value.toString();
}

function yesNo(flag: boolean | null | undefined): string {
  return flag ? 'X' : '';
}

/** Số quyết định + ngày (nếu có): "123/QĐ (01/01/2026)". */
function decisionText(num: string | null | undefined, date: Date | null | undefined): string {
  if (!num) return '';
  const d = formatFullDate(date);
  return d ? `${num} (${d})` : num;
}

/** Thứ tự ưu tiên bậc học để chọn bằng cấp cao nhất. */
const EDUCATION_LEVEL_RANK: Record<string, number> = {
  TIEN_SI: 4,
  THAC_SI: 3,
  DAI_HOC: 2,
  CU_NHAN_NGOAI_NGU: 1,
  KHAC: 0,
};

// ===== Main =====

export async function buildCadreProfileExportData(userId: string): Promise<Record<string, unknown>> {
  const [
    user,
    partyMember,
    youthUnion,
    youthPositions,
    educations,
    foreignLangs,
    ethnicLangs,
    combat,
    concurrentPositions,
    professionalTitles,
    externalPositions,
    assets,
    foreignTrips,
    honors,
    evaluations,
    allowances,
    research,
    publications,
    awards,
    policies,
    medicals,
    family,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        unitRelation: { select: { name: true } },
        positionRef: { select: { name: true } },
        academicTitleRef: { select: { name: true } },
        academicDegreeRef: { select: { name: true } },
        familyBackgroundRef: { select: { name: true } },
        personalBackgroundRef: { select: { name: true } },
        personnelProfile: {
          select: {
            militaryRank: true,
            position: true,
            rankDate: true,
            positionDate: true,
            politicalTheory: true,
            academicDegree: true,
            birthPlace: true,
            placeOfOrigin: true,
            permanentAddress: true,
            temporaryAddress: true,
            birthPlaceAdminRef: { select: { fullName: true, name: true } },
            placeOfOriginAdminRef: { select: { fullName: true, name: true } },
            permanentAddressAdminRef: { select: { fullName: true, name: true } },
            currentResidenceAdminRef: { select: { fullName: true, name: true } },
          },
        },
      },
    }),
    prisma.partyMember.findFirst({
      where: { userId, deletedAt: null },
      include: {
        organization: { select: { name: true } },
        histories: {
          orderBy: { effectiveDate: 'asc' },
          include: { organization: { select: { name: true } } },
        },
      },
    }),
    prisma.youthUnionMembership.findFirst({ where: { userId, deletedAt: null } }),
    prisma.youthUnionPositionHistory.findMany({
      where: { userId, deletedAt: null },
      orderBy: { fromDate: 'asc' },
    }),
    prisma.educationHistory.findMany({ where: { userId }, orderBy: { startDate: 'asc' } }),
    prisma.foreignLanguageCert.findMany({ where: { userId }, orderBy: { issueDate: 'asc' } }),
    prisma.ethnicLanguage.findMany({ where: { userId, deletedAt: null }, orderBy: { sortOrder: 'asc' } }),
    prisma.combatHistory.findMany({ where: { userId, deletedAt: null }, orderBy: { fromDate: 'asc' } }),
    prisma.concurrentPosition.findMany({ where: { userId, deletedAt: null }, orderBy: { fromDate: 'asc' } }),
    prisma.professionalTitleRecord.findMany({ where: { userId, deletedAt: null }, orderBy: { effectiveDate: 'asc' } }),
    prisma.externalPosition.findMany({ where: { userId, deletedAt: null }, orderBy: { fromDate: 'asc' } }),
    prisma.assetDeclaration.findMany({ where: { userId, deletedAt: null }, orderBy: { sortOrder: 'asc' } }),
    prisma.foreignTrip.findMany({ where: { userId, deletedAt: null }, orderBy: { fromDate: 'asc' } }),
    prisma.honorTitleRecord.findMany({
      where: { userId, deletedAt: null },
      orderBy: { awardYear: 'asc' },
      include: { meritTitle: { select: { name: true } } },
    }),
    prisma.personnelEvaluation.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ periodYear: 'asc' }, { periodQuarter: 'asc' }],
      include: { taskResultRank: { select: { name: true } } },
    }),
    prisma.allowanceRecord.findMany({
      where: { userId, deletedAt: null },
      orderBy: { fromDate: 'asc' },
      include: { allowanceType: { select: { name: true } } },
    }),
    prisma.scientificResearch.findMany({ where: { userId }, orderBy: { year: 'asc' } }),
    prisma.scientificPublication.findMany({ where: { userId }, orderBy: [{ year: 'asc' }, { month: 'asc' }] }),
    prisma.awardsRecord.findMany({ where: { userId }, orderBy: { year: 'asc' } }),
    prisma.policyRecord.findMany({ where: { userId, deletedAt: null }, orderBy: { decisionDate: 'asc' } }),
    prisma.medicalRecord.findMany({ where: { userId, deletedAt: null }, orderBy: { recordDate: 'asc' } }),
    prisma.familyRelation.findMany({ where: { userId, deletedAt: null }, orderBy: { createdAt: 'asc' } }),
  ]);

  if (!user) throw new Error(`Không tìm thấy người dùng: ${userId}`);

  const personnel = user.personnelProfile;

  // Bằng cấp cao nhất → ngành đào tạo (47), cấp độ đào tạo (48).
  const highestEducation = educations.reduce<(typeof educations)[number] | null>((best, e) => {
    if (!best) return e;
    return (EDUCATION_LEVEL_RANK[e.level] ?? 0) >= (EDUCATION_LEVEL_RANK[best.level] ?? 0) ? e : best;
  }, null);

  // ===== Reward/discipline: ưu tiên PolicyRecord (workflow + audit), fallback AwardsRecord =====
  const policyRewards = policies.filter((p) => p.recordType === 'REWARD' || p.recordType === 'EMULATION');
  const policyDiscipline = policies.filter((p) => p.recordType === 'DISCIPLINE');

  const khenThuongList = policyRewards.length
    ? policyRewards.map((p, i) => ({
        tt: i + 1,
        nam: p.year ? String(p.year) : formatFullDate(p.decisionDate),
        hinhThuc: p.title || '',
        capKhen: POLICY_LEVEL_LABELS[p.level] || '',
        soQD: decisionText(p.decisionNumber, p.decisionDate),
      }))
    : awards
        .filter((a) => a.type === 'KHEN_THUONG')
        .map((a, i) => ({ tt: i + 1, nam: String(a.year), hinhThuc: a.description, capKhen: a.category || '', soQD: a.awardedBy || '' }));

  const kyLuatList = policyDiscipline.length
    ? policyDiscipline.map((p, i) => ({
        tt: i + 1,
        nam: p.year ? String(p.year) : formatFullDate(p.decisionDate),
        hinhThuc: p.title || '',
        lyDo: p.reason || p.violationSummary || '',
        soQD: decisionText(p.decisionNumber, p.decisionDate),
      }))
    : awards
        .filter((a) => a.type === 'KY_LUAT')
        .map((a, i) => ({ tt: i + 1, nam: String(a.year), hinhThuc: a.description, lyDo: a.notes || '', soQD: a.awardedBy || '' }));

  // ===== Hoạt động KH (92): nghiên cứu + xuất bản phẩm không phải bài báo =====
  const khoaHocList = [
    ...research.map((r) => ({
      year: r.year,
      ten: r.title,
      cap: r.level || r.type || '',
      vaiTro: RESEARCH_ROLE_LABELS[r.role] || r.role,
    })),
    ...publications
      .filter((p) => p.type !== 'BAI_BAO')
      .map((p) => ({
        year: p.year,
        ten: p.title,
        cap: PUBLICATION_TYPE_LABELS[p.type] || '',
        vaiTro: p.role === 'CHU_BIEN' ? 'Chủ biên' : 'Tham gia',
      })),
  ]
    .sort((a, b) => a.year - b.year)
    .map((r, i) => ({ tt: i + 1, nam: String(r.year), ten: r.ten, cap: r.cap, vaiTro: r.vaiTro }));

  // ===== Bài báo (93) =====
  const baiBaoList = publications
    .filter((p) => p.type === 'BAI_BAO')
    .map((p, i) => ({
      tt: i + 1,
      thoiGian: p.month ? `${String(p.month).padStart(2, '0')}/${p.year}` : String(p.year),
      tenBai: p.title,
      tapChi: p.organization || p.publisher || '',
      soTrang: [p.issueNumber, p.pageNumbers].filter(Boolean).join(', '),
    }));

  const data: Record<string, unknown> = {
    ...buildHeaderContext(),

    // ----- Định danh (1-9) -----
    hoTen: (user.name ?? '').toUpperCase(),
    tenKhac: user.aliasName || 'Không',
    gioiTinh: gender(user.gender),
    doiTuongQL: user.managementCategory ? MANAGEMENT_CATEGORY_LABELS[user.managementCategory] || '' : '',
    ngaySinh: formatFullDate(user.dateOfBirth),
    maDinhDanh: user.militaryIdNumber || user.citizenId || '',
    soCCCD: user.citizenId || '',
    danToc: user.ethnicity || '',
    tonGiao: user.religion || 'Không',

    // ----- Cấp bậc - Lương - Chức vụ (10-21) -----
    capBac: user.rank || personnel?.militaryRank || '',
    tgNhanCap: formatFullDate(personnel?.rankDate),
    nangLuongLan: user.salaryRaiseCount != null ? String(user.salaryRaiseCount) : '',
    tgNangLuong: formatFullDate(user.salaryRaiseDate),
    heSoLuong: decimalToText(user.salaryCoefficient),
    mucLuong: decimalToText(user.salaryAmount),
    chucVu: user.position || user.positionRef?.name || personnel?.position || '',
    tgNhanChuc: formatFullDate(personnel?.positionDate),
    heSoPCCV: decimalToText(user.positionAllowanceCoeff),

    // ----- Địa chỉ (22-27) -----
    noiSinhMoi: personnel?.birthPlaceAdminRef?.fullName || personnel?.birthPlaceAdminRef?.name || user.birthPlace || '',
    noiSinhCu: personnel?.birthPlace || '',
    queQuanMoi: personnel?.placeOfOriginAdminRef?.fullName || personnel?.placeOfOriginAdminRef?.name || user.placeOfOrigin || '',
    queQuanCu: personnel?.placeOfOrigin || '',
    thuongTruMoi: user.permanentAddress || personnel?.permanentAddress || personnel?.permanentAddressAdminRef?.fullName || '',
    noiOHienNay: user.temporaryAddress || personnel?.temporaryAddress || personnel?.currentResidenceAdminRef?.fullName || '',

    // ----- Nền tảng & sức khỏe (28-38) -----
    thanhPhanGD: user.familyBackgroundRef?.name || '',
    thanhPhanBanThan: user.personalBackgroundRef?.name || '',
    nhanDang: user.identifyingMarks || '',
    sucKhoe: user.healthGrade || '',
    chieuCao: user.height != null ? String(user.height) : '',
    canNang: user.weight != null ? String(user.weight) : '',
    nhomMau: user.bloodGroupRaw || user.bloodType || '',
    benhChinh: user.chronicDisease || 'Không',
    thuongTat: user.disabilityStatus || 'Không',
    chiTietThuongTat: user.disabilityDetail || 'Không',
    giaDinhTBLS: user.warMartyrFamily || 'Không',

    // ----- Học vấn (39-49) -----
    hocHam: user.academicTitleRef?.name || user.academicTitle || 'Không',
    tgHocHam: formatFullDate(user.academicTitleDate),
    hocVi: user.academicDegreeRef?.name || personnel?.academicDegree || '',
    tgHocVi: formatFullDate(highestEducation?.certificateDate ?? highestEducation?.endDate),
    trinhDoCHQL: user.commandMgmtLevel ? COMMAND_MGMT_LEVEL_LABELS[user.commandMgmtLevel] || '' : '',
    tgCHQL: formatFullDate(user.commandMgmtLevelDate),
    trinhDoLLCT: user.politicalTheoryLevel
      ? POLITICAL_THEORY_LEVEL_LABELS[user.politicalTheoryLevel] || ''
      : personnel?.politicalTheory || 'Không',
    tgLLCT: formatFullDate(user.politicalTheoryDate),
    nganhDaoTao: highestEducation?.major || '',
    capDoDaoTao: highestEducation ? EDUCATION_LEVEL_LABELS[highestEducation.level] || '' : '',
    trinhDoVanHoa: user.generalEducationLevel || '',

    // ----- Phục vụ quân ngũ (50-58) -----
    thamGiaCM: formatFullDate(user.revolutionJoinDate),
    tgTuyenDung: formatFullDate(user.recruitmentDate),
    dvTuyenDung: user.recruitmentUnit || '',
    tgNhapNgu: formatFullDate(user.enlistmentDate),
    dvNhapNgu: user.enlistmentUnit || '',
    tgXuatNgu: formatFullDate(user.dischargeDate),
    dvXuatNgu: user.dischargeUnit || 'Không',
    tgTaiNgu: formatFullDate(user.reenlistmentDate),
    dvTaiNgu: user.reenlistmentUnit || 'Không',

    // ----- Đảng - Đoàn (59-67) -----
    tgKND: formatFullDate(partyMember?.joinDate),
    noiKND: user.partyJoinPlace || partyMember?.organization?.name || (partyMember ? '' : 'Chưa kết nạp Đảng'),
    tgChinhThuc: formatFullDate(partyMember?.officialDate),
    noiChinhThuc: user.partyOfficialPlace || '',
    nguoiGioiThieu: [partyMember?.recommender1, partyMember?.recommender2].filter(Boolean).join('; '),
    cvDangGioiThieu: user.recommenderPartyPosition || '',
    tgVaoDoan: formatFullDate(youthUnion?.joinDate),
    noiVaoDoan: youthUnion?.joinPlace || '',
    cvDoan: youthUnion?.currentPosition || 'Không',

    // ----- CMKTNV (68-69): bản ghi mới nhất, fallback legacy User.technicalPosition -----
    chucDanhCMKTNV:
      professionalTitles[professionalTitles.length - 1]?.titleName || user.technicalPosition || 'Không',
    tgCMKTNV:
      formatFullDate(professionalTitles[professionalTitles.length - 1]?.effectiveDate ?? user.technicalCertDate),

    // ----- Hồ sơ công tác (70-82) -----
    soTruongCT: user.workStrength || '',
    soTruongCN: user.personalStrength || '',
    soThichCN: user.personalHobby || '',
    congTacChinh: user.currentMainWork || '',
    congViecLauNhat: user.longestWork || '',
    nganhCongTac: user.currentSector || '',
    loaiCanBo: user.cadreType || '',
    nguonVao: user.entrySource || '',
    dungViTri: user.isCorrectPosition == null ? '' : user.isCorrectPosition ? 'Xếp đúng vị trí công tác' : 'Không',
    honNhan: user.maritalStatus ? MARITAL_STATUS_LABELS[user.maritalStatus] || '' : '',
    dienThoai: user.phone || '',
    lyDoTangQS: user.headcountIncreaseReason || 'Không',
    tgTangQS: formatFullDate(user.headcountIncreaseDate),

    // ----- Tiếng dân tộc (85) scalar tổng hợp + đơn vị công tác -----
    donViCongTac: user.unitRelation?.name || '',

    // ----- Chữ ký -----
    nguoiBoSung: `${user.rank ? user.rank + ' ' : ''}${user.name ?? ''}`.trim(),

    // ===== Vòng lặp danh sách =====
    ngoaiNgu_list: foreignLangs.map((f, i) => ({
      tt: i + 1,
      ngay: formatFullDate(f.issueDate),
      tiengNgu: f.language,
      trinhDo: [f.certLevel, f.framework].filter(Boolean).join(' - '),
      vanBang: [f.certType, f.certNumber].filter(Boolean).join(', '),
    })),

    ethnicLang_list: ethnicLangs.map((e, i) => ({ tt: i + 1, tiengDanToc: e.language, mucDo: e.proficiency || '' })),

    combat_list: combat.map((c, i) => ({
      tt: i + 1,
      thoiGian: formatRange(c.fromDate, c.toDate),
      matTran: c.battlefield || '',
      donVi: c.unit || '',
      vaiTro: c.role || '',
    })),

    concurrentPos_list: concurrentPositions.map((c, i) => ({
      tt: i + 1,
      chucVu: c.positionTitle,
      thoiGian: formatRange(c.fromDate, c.toDate),
      donVi: c.unit || '',
      chiTiet: c.detail || '',
    })),

    khenThuong_list: khenThuongList,
    kyLuat_list: kyLuatList,

    asset_list: assets.map((a, i) => ({
      tt: i + 1,
      ngay: formatFullDate(a.declaredDate),
      loai: ASSET_TYPE_LABELS[a.assetType] || '',
      tenTaiSan: a.assetName,
      dienTich: a.area || '',
      giaTri: decimalToText(a.value),
      giayTo: a.documentRef || '',
    })),

    giaDinh_list: family.map((m, i) => ({
      tt: i + 1,
      quanHe: FAMILY_RELATION_LABELS[m.relation] || m.relation,
      hoTen: m.fullName,
      namSinh: m.dateOfBirth ? String(new Date(m.dateOfBirth).getFullYear()) : '',
      queQuanCu: m.hometownOld || '',
      thuongTruMoi: m.residenceNew || m.address || '',
      ngheNghiep: m.occupation || '',
      dangVien: yesNo(m.isPartyMember),
      chucVuDang: m.partyPosition || '',
      canBoCaoCap: yesNo(m.isSeniorOfficial),
    })),

    foreignTrip_list: foreignTrips.map((t, i) => ({
      tt: i + 1,
      tuNgay: formatFullDate(t.fromDate),
      denNgay: formatFullDate(t.toDate),
      nuoc: t.country,
      mucDich: t.purpose || '',
      kinhPhi: t.sponsor || '',
    })),

    honor_list: honors.map((h, i) => ({
      tt: i + 1,
      nam: h.awardYear ? String(h.awardYear) : '',
      danhHieu: h.meritTitle?.name || h.titleName,
      cap: h.level || '',
      soQD: h.decisionNumber || '',
    })),

    khoaHoc_list: khoaHocList,
    baiBao_list: baiBaoList,

    medical_list: medicals.map((m, i) => ({
      tt: i + 1,
      thoiGian: formatMonthYear(m.recordDate),
      noi: m.hospital || '',
      noiDung: m.diagnosis || m.treatment || '',
      ketLuan: m.result || m.healthGrade || '',
    })),

    evaluation_list: evaluations.map((e, i) => ({
      tt: i + 1,
      ky:
        e.periodType === 'QUY' && e.periodQuarter
          ? `Quý ${e.periodQuarter}/${e.periodYear}`
          : `Năm ${e.periodYear}`,
      ketQua: e.taskResultRank?.name || e.taskResultLabel || '',
      xepLoaiDV: e.partyMemberRank || '',
    })),

    allowance_list: allowances.map((a, i) => ({
      tt: i + 1,
      tuDen: formatRange(a.fromDate, a.toDate),
      heSo: decimalToText(a.coefficient),
      lyDo: a.allowanceType?.name || a.allowanceLabel || a.reason || '',
      soQD: a.decisionNumber || '',
    })),

    doanHistory_list: youthPositions.map((p, i) => ({
      tt: i + 1,
      thoiGian: formatRange(p.fromDate, p.toDate),
      chucVu: p.position,
      donVi: p.organization || '',
    })),

    dangHistory_list: (partyMember?.histories ?? [])
      .filter((h) => h.position != null)
      .map((h, i) => ({
        tt: i + 1,
        thoiGian: formatFullDate(h.effectiveDate ?? h.decisionDate),
        chucVu: h.position ? PARTY_POSITION_LABELS[h.position] || h.position : '',
        toChuc: h.organization?.name || h.toOrganization || '',
      })),

    externalPos_list: externalPositions.map((p, i) => ({
      tt: i + 1,
      thoiGian: formatRange(p.fromDate, p.toDate),
      chucVu: p.positionTitle,
      toChuc: p.organization || '',
    })),

    professionalTitle_list: professionalTitles.map((p, i) => ({
      tt: i + 1,
      chucDanh: p.titleName,
      thoiGian: formatFullDate(p.effectiveDate),
      soQD: p.decisionNumber || '',
    })),
  };

  return data;
}
