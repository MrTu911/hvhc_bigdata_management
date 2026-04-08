/**
 * Seed: Master Data HVHC v8.9+
 * 10 nhóm | 38 bảng | ~800 bản ghi
 * Chạy: npx tsx --require dotenv/config prisma/seed/seed_master_data_v1.ts
 */
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function upsertMany<T extends { id: string }>(
  model: any,
  data: T[],
  name: string,
) {
  let count = 0;
  for (const item of data) {
    await model.upsert({ where: { id: item.id }, update: item, create: item });
    count++;
  }
  console.log(`  ✓ ${name}: ${count} bản ghi`);
}

async function main() {
  console.log('🚀 Seeding Master Data HVHC v8.9+...\n');

  // ─── NHÓM 1: Tỉnh/Thành phố (34 đơn vị từ 01/07/2025) ─────────────
  console.log('📍 Nhóm 1: Địa lý hành chính');
  await upsertMany(prisma.province, [
    { id: 'HN',  name: 'Thành phố Hà Nội',             shortName: 'Hà Nội',    type: 'THANH_PHO' as any, region: 'DONG_BANG_SONG_HONG' as any, capital: 'Hà Nội',      orderNo: 1,  mergedFrom: [],                              isActive: true },
    { id: 'HP',  name: 'Thành phố Hải Phòng',           shortName: 'Hải Phòng', type: 'THANH_PHO' as any, region: 'DONG_BANG_SONG_HONG' as any, capital: 'Hải Phòng',   orderNo: 2,  mergedFrom: ['Quảng Ninh'],                  isActive: true },
    { id: 'DNG', name: 'Thành phố Đà Nẵng',             shortName: 'Đà Nẵng',   type: 'THANH_PHO' as any, region: 'DUYEN_HAI_NAM_TRUNG_BO' as any, capital: 'Đà Nẵng', orderNo: 3,  mergedFrom: [],                              isActive: true },
    { id: 'HCM', name: 'Thành phố Hồ Chí Minh',         shortName: 'TP.HCM',    type: 'THANH_PHO' as any, region: 'DONG_NAM_BO' as any,          capital: 'TP.HCM',     orderNo: 4,  mergedFrom: [],                              isActive: true },
    { id: 'CT',  name: 'Thành phố Cần Thơ',             shortName: 'Cần Thơ',   type: 'THANH_PHO' as any, region: 'DONG_BANG_SONG_CUU_LONG' as any, capital: 'Cần Thơ',orderNo: 5,  mergedFrom: [],                              isActive: true },
    { id: 'HUE', name: 'Thành phố Huế',                 shortName: 'Huế',       type: 'THANH_PHO' as any, region: 'BAC_TRUNG_BO' as any,          capital: 'Huế',        orderNo: 6,  mergedFrom: ['Quảng Trị', 'Quảng Bình'],     isActive: true },
    { id: 'HG',  name: 'Tỉnh Hà Giang',                 shortName: 'Hà Giang',  type: 'TINH' as any,      region: 'DONG_BAC_BO' as any,           capital: 'Hà Giang',   orderNo: 7,  mergedFrom: ['Tuyên Quang'],                 isActive: true },
    { id: 'CB',  name: 'Tỉnh Cao Bằng',                 shortName: 'Cao Bằng',  type: 'TINH' as any,      region: 'DONG_BAC_BO' as any,           capital: 'Cao Bằng',   orderNo: 8,  mergedFrom: ['Bắc Kạn', 'Thái Nguyên'],     isActive: true },
    { id: 'LS',  name: 'Tỉnh Lạng Sơn',                 shortName: 'Lạng Sơn',  type: 'TINH' as any,      region: 'DONG_BAC_BO' as any,           capital: 'Lạng Sơn',   orderNo: 9,  mergedFrom: [],                              isActive: true },
    { id: 'LC',  name: 'Tỉnh Lào Cai',                  shortName: 'Lào Cai',   type: 'TINH' as any,      region: 'TAY_BAC_BO' as any,            capital: 'Lào Cai',    orderNo: 10, mergedFrom: ['Yên Bái'],                     isActive: true },
    { id: 'DB',  name: 'Tỉnh Điện Biên',                shortName: 'Điện Biên', type: 'TINH' as any,      region: 'TAY_BAC_BO' as any,            capital: 'Điện Biên',  orderNo: 11, mergedFrom: ['Lai Châu'],                    isActive: true },
    { id: 'SL',  name: 'Tỉnh Sơn La',                   shortName: 'Sơn La',    type: 'TINH' as any,      region: 'TAY_BAC_BO' as any,            capital: 'Sơn La',     orderNo: 12, mergedFrom: ['Hòa Bình'],                    isActive: true },
    { id: 'PT',  name: 'Tỉnh Phú Thọ',                  shortName: 'Phú Thọ',   type: 'TINH' as any,      region: 'DONG_BAC_BO' as any,           capital: 'Việt Trì',   orderNo: 13, mergedFrom: ['Vĩnh Phúc'],                   isActive: true },
    { id: 'BN',  name: 'Tỉnh Bắc Ninh',                 shortName: 'Bắc Ninh',  type: 'TINH' as any,      region: 'DONG_BANG_SONG_HONG' as any,   capital: 'Bắc Ninh',   orderNo: 14, mergedFrom: ['Bắc Giang'],                   isActive: true },
    { id: 'HD',  name: 'Tỉnh Hải Dương',                shortName: 'Hải Dương', type: 'TINH' as any,      region: 'DONG_BANG_SONG_HONG' as any,   capital: 'Hải Dương',  orderNo: 15, mergedFrom: ['Hưng Yên'],                    isActive: true },
    { id: 'HNN', name: 'Tỉnh Hà Nam Ninh',              shortName: 'Hà Nam Ninh',type: 'TINH' as any,     region: 'DONG_BANG_SONG_HONG' as any,   capital: 'Ninh Bình',  orderNo: 16, mergedFrom: ['Hà Nam', 'Nam Định', 'Ninh Bình'], isActive: true },
    { id: 'TB',  name: 'Tỉnh Thái Bình',                shortName: 'Thái Bình', type: 'TINH' as any,      region: 'DONG_BANG_SONG_HONG' as any,   capital: 'Thái Bình',  orderNo: 17, mergedFrom: [],                              isActive: true },
    { id: 'TH',  name: 'Tỉnh Thanh Hóa',                shortName: 'Thanh Hóa', type: 'TINH' as any,      region: 'BAC_TRUNG_BO' as any,          capital: 'Thanh Hóa',  orderNo: 18, mergedFrom: ['Nghệ An'],                     isActive: true },
    { id: 'HT',  name: 'Tỉnh Hà Tĩnh',                  shortName: 'Hà Tĩnh',   type: 'TINH' as any,      region: 'BAC_TRUNG_BO' as any,          capital: 'Hà Tĩnh',    orderNo: 19, mergedFrom: [],                              isActive: true },
    { id: 'QNg', name: 'Tỉnh Quảng Nam',                shortName: 'Quảng Nam', type: 'TINH' as any,      region: 'DUYEN_HAI_NAM_TRUNG_BO' as any, capital: 'Tam Kỳ',   orderNo: 20, mergedFrom: ['Quảng Ngãi'],                  isActive: true },
    { id: 'BD',  name: 'Tỉnh Bình Định',                shortName: 'Bình Định', type: 'TINH' as any,      region: 'DUYEN_HAI_NAM_TRUNG_BO' as any, capital: 'Quy Nhơn',  orderNo: 21, mergedFrom: ['Phú Yên'],                     isActive: true },
    { id: 'KH',  name: 'Tỉnh Khánh Hòa',               shortName: 'Khánh Hòa', type: 'TINH' as any,      region: 'DUYEN_HAI_NAM_TRUNG_BO' as any, capital: 'Nha Trang', orderNo: 22, mergedFrom: ['Ninh Thuận'],                  isActive: true },
    { id: 'GL',  name: 'Tỉnh Gia Lai',                  shortName: 'Gia Lai',   type: 'TINH' as any,      region: 'TAY_NGUYEN' as any,            capital: 'Pleiku',     orderNo: 23, mergedFrom: ['Kon Tum'],                     isActive: true },
    { id: 'DL',  name: 'Tỉnh Đắk Lắk',                 shortName: 'Đắk Lắk',   type: 'TINH' as any,      region: 'TAY_NGUYEN' as any,            capital: 'Buôn Ma Thuột', orderNo: 24, mergedFrom: ['Đắk Nông'],               isActive: true },
    { id: 'LDg', name: 'Tỉnh Lâm Đồng',                shortName: 'Lâm Đồng',  type: 'TINH' as any,      region: 'TAY_NGUYEN' as any,            capital: 'Đà Lạt',     orderNo: 25, mergedFrom: [],                              isActive: true },
    { id: 'BPh', name: 'Tỉnh Bình Phước',               shortName: 'Bình Phước',type: 'TINH' as any,      region: 'DONG_NAM_BO' as any,           capital: 'Đồng Xoài',  orderNo: 26, mergedFrom: ['Tây Ninh'],                    isActive: true },
    { id: 'DNA', name: 'Tỉnh Đồng Nai',                 shortName: 'Đồng Nai',  type: 'TINH' as any,      region: 'DONG_NAM_BO' as any,           capital: 'Biên Hòa',   orderNo: 27, mergedFrom: ['Bình Dương'],                  isActive: true },
    { id: 'BR',  name: 'Tỉnh Bà Rịa - Vũng Tàu',       shortName: 'BR-VT',     type: 'TINH' as any,      region: 'DONG_NAM_BO' as any,           capital: 'Bà Rịa',     orderNo: 28, mergedFrom: [],                              isActive: true },
    { id: 'LAN', name: 'Tỉnh Long An',                  shortName: 'Long An',   type: 'TINH' as any,      region: 'DONG_BANG_SONG_CUU_LONG' as any, capital: 'Tân An',   orderNo: 29, mergedFrom: ['Tiền Giang'],                  isActive: true },
    { id: 'AN',  name: 'Tỉnh An Giang',                 shortName: 'An Giang',  type: 'TINH' as any,      region: 'DONG_BANG_SONG_CUU_LONG' as any, capital: 'Long Xuyên',orderNo: 30, mergedFrom: ['Đồng Tháp'],                 isActive: true },
    { id: 'VL',  name: 'Tỉnh Vĩnh Long',                shortName: 'Vĩnh Long', type: 'TINH' as any,      region: 'DONG_BANG_SONG_CUU_LONG' as any, capital: 'Vĩnh Long', orderNo: 31, mergedFrom: ['Trà Vinh', 'Bến Tre'],       isActive: true },
    { id: 'KG',  name: 'Tỉnh Kiên Giang',               shortName: 'Kiên Giang',type: 'TINH' as any,      region: 'DONG_BANG_SONG_CUU_LONG' as any, capital: 'Rạch Giá',  orderNo: 32, mergedFrom: [],                            isActive: true },
    { id: 'CM',  name: 'Tỉnh Cà Mau',                   shortName: 'Cà Mau',    type: 'TINH' as any,      region: 'DONG_BANG_SONG_CUU_LONG' as any, capital: 'Cà Mau',    orderNo: 33, mergedFrom: ['Bạc Liêu', 'Sóc Trăng', 'Hậu Giang'], isActive: true },
  ], 'Province (34 tỉnh/TP)');

  // ─── NHÓM 2: Tổ chức & Nhân sự ────────────────────────────────────
  console.log('\n🎖️  Nhóm 2: Tổ chức & Nhân sự');

  await upsertMany(prisma.militaryRank, [
    { id: 'BINHNI',   name: 'Binh nhì',                      shortCode: 'BN',    category: 'BIEN_CHE',          orderNo: 1,  isActive: true },
    { id: 'BINHNAT',  name: 'Binh nhất',                     shortCode: 'BNH',   category: 'BIEN_CHE',          orderNo: 2,  isActive: true },
    { id: 'HASI',     name: 'Hạ sĩ',                         shortCode: 'HS',    category: 'BIEN_CHE',          orderNo: 3,  isActive: true },
    { id: 'TRUNGSI',  name: 'Trung sĩ',                      shortCode: 'TS',    category: 'BIEN_CHE',          orderNo: 4,  isActive: true },
    { id: 'THUONGSI', name: 'Thượng sĩ',                     shortCode: 'ThS',   category: 'BIEN_CHE',          orderNo: 5,  isActive: true },
    { id: 'THIEUU',   name: 'Thiếu úy',                      shortCode: '4/',    category: 'SI_QUAN',           orderNo: 10, isActive: true },
    { id: 'TRUNCU',   name: 'Trung úy',                      shortCode: '3/',    category: 'SI_QUAN',           orderNo: 11, isActive: true },
    { id: 'THUONGU',  name: 'Thượng úy',                     shortCode: '2/',    category: 'SI_QUAN',           orderNo: 12, isActive: true },
    { id: 'DAIU',     name: 'Đại úy',                        shortCode: '1/',    category: 'SI_QUAN',           orderNo: 13, isActive: true },
    { id: 'THIEUTA',  name: 'Thiếu tá',                      shortCode: '4//',   category: 'SI_QUAN',           orderNo: 14, isActive: true },
    { id: 'TRUNGTA',  name: 'Trung tá',                      shortCode: '3//',   category: 'SI_QUAN',           orderNo: 15, isActive: true },
    { id: 'THUONGTA', name: 'Thượng tá',                     shortCode: '2//',   category: 'SI_QUAN',           orderNo: 16, isActive: true },
    { id: 'DAITA',    name: 'Đại tá',                        shortCode: '1//',   category: 'SI_QUAN',           orderNo: 17, isActive: true },
    { id: 'THIEUTG',  name: 'Thiếu tướng',                   shortCode: 'TG4',   category: 'SI_QUAN',           orderNo: 18, isActive: true },
    { id: 'TRUNGTG',  name: 'Trung tướng',                   shortCode: 'TG3',   category: 'SI_QUAN',           orderNo: 19, isActive: true },
    { id: 'THUONGTG', name: 'Thượng tướng',                  shortCode: 'TG2',   category: 'SI_QUAN',           orderNo: 20, isActive: true },
    { id: 'DAITG',    name: 'Đại tướng',                     shortCode: 'TG1',   category: 'SI_QUAN',           orderNo: 21, isActive: true },
    { id: 'HOIVIEN1', name: 'Học viên năm 1',                shortCode: 'H1',    category: 'HOC_VIEN',          orderNo: 30, isActive: true },
    { id: 'HOIVIEN2', name: 'Học viên năm 2',                shortCode: 'H2',    category: 'HOC_VIEN',          orderNo: 31, isActive: true },
    { id: 'HOIVIEN3', name: 'Học viên năm 3',                shortCode: 'H3',    category: 'HOC_VIEN',          orderNo: 32, isActive: true },
    { id: 'HOIVIEN4', name: 'Học viên năm 4',                shortCode: 'H4',    category: 'HOC_VIEN',          orderNo: 33, isActive: true },
    { id: 'HOIVIEN5', name: 'Học viên năm 5',                shortCode: 'H5',    category: 'HOC_VIEN',          orderNo: 34, isActive: true },
    { id: 'VCQP',     name: 'Viên chức quốc phòng',          shortCode: 'VCQP',  category: 'CNVQP',             orderNo: 40, isActive: true },
  ], 'MilitaryRank (23 cấp bậc)');

  await upsertMany(prisma.personnelTypeCatalog, [
    { id: 'CAN_BO_CHI_HUY',   name: 'Cán bộ chỉ huy',             shortName: 'CB Chỉ huy',   orderNo: 1, isActive: true },
    { id: 'SI_QUAN',          name: 'Sĩ quan',                    shortName: 'Sĩ quan',       orderNo: 2, isActive: true },
    { id: 'QN_CHUYEN_NGHIEP', name: 'Quân nhân chuyên nghiệp',    shortName: 'QNCN',          orderNo: 3, isActive: true },
    { id: 'CNVQP',            name: 'Công nhân viên quốc phòng',   shortName: 'CNVQP',         orderNo: 4, isActive: true },
    { id: 'VIEN_CHUC_QP',     name: 'Viên chức quốc phòng',       shortName: 'VCQP',          orderNo: 5, isActive: true },
    { id: 'GIANG_VIEN',       name: 'Giảng viên',                 shortName: 'GV',            orderNo: 6, isActive: true },
    { id: 'HOC_VIEN_QS',      name: 'Học viên quân sự',           shortName: 'HV QS',         orderNo: 7, isActive: true },
    { id: 'HOC_VIEN_QT',      name: 'Học viên quốc tế',           shortName: 'HV QT',         orderNo: 8, isActive: true },
    { id: 'NGHIEN_CUU_VIEN',  name: 'Nghiên cứu viên',            shortName: 'NCV',           orderNo: 9, isActive: true },
  ], 'PersonnelTypeCatalog');

  await upsertMany(prisma.workStatusCatalog, [
    { id: 'DANG_CONG_TAC',     name: 'Đang công tác',          color: '#22C55E', isActive: true, orderNo: 1 },
    { id: 'NGHI_PHEP',         name: 'Nghỉ phép',              color: '#3B82F6', isActive: true, orderNo: 2 },
    { id: 'DIEU_DONG',         name: 'Điều động',              color: '#F59E0B', isActive: true, orderNo: 3 },
    { id: 'BIEN_PHAI',         name: 'Biệt phái',              color: '#8B5CF6', isActive: true, orderNo: 4 },
    { id: 'HOC_TAP',           name: 'Đi học',                 color: '#06B6D4', isActive: true, orderNo: 5 },
    { id: 'CONG_TAC_NUOC_NGOAI','name': 'Công tác nước ngoài',color: '#EC4899', isActive: true, orderNo: 6 } as any,
    { id: 'NGHI_BENH',         name: 'Nghỉ ốm/Điều trị',      color: '#EF4444', isActive: true, orderNo: 7 },
    { id: 'NGHI_THAI_SAN',     name: 'Nghỉ thai sản',          color: '#F97316', isActive: true, orderNo: 8 },
    { id: 'CHUAN_BI_HUU',      name: 'Nghỉ chuẩn bị hưu',     color: '#9CA3AF', isActive: true, orderNo: 9 },
    { id: 'DA_NGHI_HUU',       name: 'Đã nghỉ hưu',            color: '#6B7280', isActive: true, orderNo: 10 },
    { id: 'CHUYEN_RA',         name: 'Chuyển ra',              color: '#374151', isActive: true, orderNo: 11 },
    { id: 'XUAT_NGU',          name: 'Xuất ngũ',               color: '#1F2937', isActive: true, orderNo: 12 },
  ], 'WorkStatusCatalog');

  await upsertMany(prisma.unitType, [
    { id: 'HOC_VIEN',  name: 'Học viện',           level: 1, isActive: true },
    { id: 'VIEN',      name: 'Viện nghiên cứu',    level: 2, isActive: true },
    { id: 'KHOA',      name: 'Khoa',               level: 2, isActive: true },
    { id: 'PHONG',     name: 'Phòng',              level: 2, isActive: true },
    { id: 'BAN',       name: 'Ban',                level: 2, isActive: true },
    { id: 'BO_MON',    name: 'Bộ môn',             level: 3, isActive: true },
    { id: 'TIEU_DOAN', name: 'Tiểu đoàn',          level: 3, isActive: true },
    { id: 'DAI_DOI',   name: 'Đại đội',            level: 4, isActive: true },
    { id: 'TRUNG_DOI', name: 'Trung đội',          level: 4, isActive: true },
    { id: 'LOP',       name: 'Lớp học viên',       level: 4, isActive: true },
    { id: 'TRUNG_TAM', name: 'Trung tâm',          level: 2, isActive: true },
  ], 'UnitType');

  // ─── NHÓM 3: Học thuật & Đào tạo ──────────────────────────────────
  console.log('\n🎓 Nhóm 3: Học thuật & Đào tạo');

  await upsertMany(prisma.academicTitle, [
    { id: 'GS',  name: 'Giáo sư',      shortName: 'GS',  orderNo: 1, isActive: true },
    { id: 'PGS', name: 'Phó Giáo sư',  shortName: 'PGS', orderNo: 2, isActive: true },
  ], 'AcademicTitle');

  await upsertMany(prisma.academicDegree, [
    { id: 'TRUNGHOC', name: 'Trung học phổ thông',  shortName: 'THPT', level: 0, orderNo: 1, isActive: true },
    { id: 'TRUNCCAP', name: 'Trung cấp',            shortName: 'TC',   level: 1, orderNo: 2, isActive: true },
    { id: 'CAODANG',  name: 'Cao đẳng',             shortName: 'CĐ',   level: 1, orderNo: 3, isActive: true },
    { id: 'DAIHOC',   name: 'Đại học',              shortName: 'ĐH',   level: 1, orderNo: 4, isActive: true },
    { id: 'KY_SU',    name: 'Kỹ sư',               shortName: 'KS',   level: 1, orderNo: 5, isActive: true },
    { id: 'CU_NHAN',  name: 'Cử nhân',             shortName: 'CN',   level: 1, orderNo: 6, isActive: true },
    { id: 'THAC_SI',  name: 'Thạc sĩ',             shortName: 'ThS',  level: 2, orderNo: 7, isActive: true },
    { id: 'TIEN_SI',  name: 'Tiến sĩ',             shortName: 'TS',   level: 3, orderNo: 8, isActive: true },
    { id: 'TSKH',     name: 'Tiến sĩ Khoa học',    shortName: 'TSKH', level: 3, orderNo: 9, isActive: true },
  ], 'AcademicDegree');

  await upsertMany(prisma.majorCatalog, [
    { id: 'HCQS',       name: 'Hậu cần quân sự',               shortName: 'HCQS',   fieldGroup: 'Quân sự', orderNo: 1,  isActive: true },
    { id: 'QLHC',       name: 'Quản lý hậu cần',               shortName: 'QLHC',   fieldGroup: 'Quân sự', orderNo: 2,  isActive: true },
    { id: 'QUAN_NU',    name: 'Quân nhu',                      shortName: 'QN',     fieldGroup: 'Quân sự', orderNo: 3,  isActive: true },
    { id: 'VAN_TAI',    name: 'Vận tải quân sự',               shortName: 'VT',     fieldGroup: 'Quân sự', orderNo: 4,  isActive: true },
    { id: 'XANG_DAU',   name: 'Xăng dầu quân sự',              shortName: 'XD',     fieldGroup: 'Quân sự', orderNo: 5,  isActive: true },
    { id: 'DOANH_TRAI', name: 'Doanh trại quân sự',            shortName: 'DT',     fieldGroup: 'Quân sự', orderNo: 6,  isActive: true },
    { id: 'KINH_TE_QP', name: 'Kinh tế quốc phòng',            shortName: 'KTQP',   fieldGroup: 'Kinh tế', orderNo: 10, isActive: true },
    { id: 'TAI_CHINH',  name: 'Tài chính quân sự',             shortName: 'TC',     fieldGroup: 'Kinh tế', orderNo: 11, isActive: true },
    { id: 'KE_TOAN',    name: 'Kế toán',                       shortName: 'KT',     fieldGroup: 'Kinh tế', orderNo: 12, isActive: true },
    { id: 'CNTT',       name: 'Công nghệ thông tin',            shortName: 'CNTT',   fieldGroup: 'Kỹ thuật',orderNo: 20, isActive: true },
    { id: 'KY_THUAT_QS',name: 'Kỹ thuật quân sự',              shortName: 'KTQS',   fieldGroup: 'Kỹ thuật',orderNo: 21, isActive: true },
    { id: 'LLMLN',      name: 'Lý luận Mác-Lênin, TT HCM',    shortName: 'LLMLN',  fieldGroup: 'LLCT',    orderNo: 30, isActive: true },
    { id: 'TIENG_ANH',  name: 'Tiếng Anh',                     shortName: 'EN',     fieldGroup: 'Ngoại ngữ',orderNo: 40, isActive: true },
    { id: 'TIENG_NGA',  name: 'Tiếng Nga',                     shortName: 'RU',     fieldGroup: 'Ngoại ngữ',orderNo: 41, isActive: true },
    { id: 'TIENG_TRUNG',name: 'Tiếng Trung',                   shortName: 'ZH',     fieldGroup: 'Ngoại ngữ',orderNo: 42, isActive: true },
  ], 'MajorCatalog');

  await upsertMany(prisma.trainingInstitution, [
    { id: 'HVHC',       name: 'Học viện Hậu cần',               shortName: 'HVHC',   country: 'Việt Nam', type: 'QUAN_DOI', isActive: true },
    { id: 'HVQP',       name: 'Học viện Quốc phòng',            shortName: 'HVQP',   country: 'Việt Nam', type: 'QUAN_DOI', isActive: true },
    { id: 'HVLQ',       name: 'Học viện Lục quân',              shortName: 'HVLQ',   country: 'Việt Nam', type: 'QUAN_DOI', isActive: true },
    { id: 'HVKTQS',     name: 'Học viện Kỹ thuật Quân sự',      shortName: 'HVKTQS', country: 'Việt Nam', type: 'QUAN_DOI', isActive: true },
    { id: 'HVQY',       name: 'Học viện Quân y',                shortName: 'HVQY',   country: 'Việt Nam', type: 'QUAN_DOI', isActive: true },
    { id: 'HVCHCT',     name: 'Học viện Chính trị',             shortName: 'HVCT',   country: 'Việt Nam', type: 'QUAN_DOI', isActive: true },
    { id: 'DHQGHN',     name: 'Đại học Quốc gia Hà Nội',        shortName: 'ĐHQGHN', country: 'Việt Nam', type: 'DAN_SU',   isActive: true },
    { id: 'DHBKHN',     name: 'Đại học Bách Khoa Hà Nội',       shortName: 'BKHN',   country: 'Việt Nam', type: 'DAN_SU',   isActive: true },
    { id: 'DHKTQD',     name: 'Đại học Kinh tế Quốc dân',       shortName: 'KTQD',   country: 'Việt Nam', type: 'DAN_SU',   isActive: true },
    { id: 'NUOC_NGOAI', name: 'Cơ sở đào tạo nước ngoài',       shortName: 'NN',     country: '',         type: 'NUOC_NGOAI',isActive: true },
  ], 'TrainingInstitution');

  await upsertMany(prisma.degreeType, [
    { id: 'CHINH_QUY',       name: 'Chính quy',                  orderNo: 1, isActive: true },
    { id: 'TAI_CHUC',        name: 'Tại chức (vừa làm vừa học)', orderNo: 2, isActive: true },
    { id: 'TU_XA',           name: 'Từ xa',                      orderNo: 3, isActive: true },
    { id: 'CAO_HOC',         name: 'Cao học',                    orderNo: 4, isActive: true },
    { id: 'NGHIEN_CUU_SINH', name: 'Nghiên cứu sinh',            orderNo: 5, isActive: true },
    { id: 'CHUYEN_NGANH_QS', name: 'Chuyên ngành quân sự',       orderNo: 7, isActive: true },
  ], 'DegreeType');

  await upsertMany(prisma.subjectCategory, [
    { id: 'LY_THUYET',   name: 'Lý thuyết',            orderNo: 1 },
    { id: 'THUC_HANH',   name: 'Thực hành',            orderNo: 2 },
    { id: 'THAO_TRUONG', name: 'Thao trường/thực địa', orderNo: 3 },
    { id: 'BAO_CAO',     name: 'Báo cáo chuyên đề',    orderNo: 4 },
    { id: 'LUAN_VAN',    name: 'Luận văn/luận án',     orderNo: 5 },
  ], 'SubjectCategory');

  await upsertMany(prisma.gradeScale, [
    { id: 'THANG_10',  name: 'Thang điểm 10',   maxScore: 10.0,  passingScore: 5.0,  isActive: true },
    { id: 'THANG_4',   name: 'Thang điểm 4.0',  maxScore: 4.0,   passingScore: 2.0,  isActive: true },
    { id: 'THANG_100', name: 'Thang điểm 100',  maxScore: 100.0, passingScore: 50.0, isActive: true },
    { id: 'DAT_KHONG', name: 'Đạt / Không đạt', maxScore: 1.0,   passingScore: 1.0,  isActive: true },
  ], 'GradeScale');

  // ─── NHÓM 4: Đảng & Chính trị ──────────────────────────────────────
  console.log('\n🔴 Nhóm 4: Đảng & Chính trị');

  await upsertMany(prisma.annualEvaluationRank, [
    { id: 'HTXSNV', name: 'Hoàn thành xuất sắc nhiệm vụ', shortCode: 'HTXSNV', color: '#22C55E', orderNo: 1, isActive: true },
    { id: 'HTTNV',  name: 'Hoàn thành tốt nhiệm vụ',      shortCode: 'HTTNV',  color: '#3B82F6', orderNo: 2, isActive: true },
    { id: 'HTNV',   name: 'Hoàn thành nhiệm vụ',           shortCode: 'HTNV',   color: '#F59E0B', orderNo: 3, isActive: true },
    { id: 'KHNV',   name: 'Không hoàn thành nhiệm vụ',     shortCode: 'KHNV',   color: '#EF4444', orderNo: 4, isActive: true },
  ], 'AnnualEvaluationRank');

  await upsertMany(prisma.partyOrgType, [
    { id: 'DANG_BO_HV',   name: 'Đảng bộ Học viện',    isActive: true },
    { id: 'DANG_BO_KHOA', name: 'Đảng bộ Khoa/Phòng',  isActive: true },
    { id: 'CHI_BO_CO_SO', name: 'Chi bộ cơ sở',        isActive: true },
    { id: 'CHI_BO_GHAI',  name: 'Chi bộ ghép',         isActive: true },
  ], 'PartyOrgType');

  await upsertMany(prisma.partyTransferType, [
    { id: 'KET_NAP_MOI', name: 'Kết nạp đảng viên mới' },
    { id: 'CHINH_THUC',  name: 'Công nhận đảng viên chính thức' },
    { id: 'CHUYEN_DEN',  name: 'Chuyển sinh hoạt đến' },
    { id: 'CHUYEN_DI',   name: 'Chuyển sinh hoạt đi' },
    { id: 'XOA_TEN',     name: 'Xóa tên khỏi danh sách' },
    { id: 'PHUC_HOI',    name: 'Phục hồi đảng tịch' },
  ], 'PartyTransferType');

  // ─── NHÓM 5: Bảo hiểm & Chế độ ────────────────────────────────────
  console.log('\n🏥 Nhóm 5: Bảo hiểm & Chế độ');

  await upsertMany(prisma.insuranceTypeCatalog, [
    { id: 'BHXH', name: 'Bảo hiểm xã hội',       shortName: 'BHXH', isActive: true },
    { id: 'BHYT', name: 'Bảo hiểm y tế',          shortName: 'BHYT', isActive: true },
    { id: 'BHTN', name: 'Bảo hiểm thất nghiệp',   shortName: 'BHTN', isActive: true },
    { id: 'BHQD', name: 'Bảo hiểm quân đội',      shortName: 'BHQD', isActive: true },
    { id: 'BHTS', name: 'Bảo hiểm tai nạn',        shortName: 'BHTS', isActive: true },
  ], 'InsuranceTypeCatalog');

  await upsertMany(prisma.allowanceType, [
    { id: 'CHUC_VU',   name: 'Phụ cấp chức vụ',             calcBasis: 'PHAN_TRAM', isActive: true, orderNo: 1 },
    { id: 'THAM_NIEN', name: 'Phụ cấp thâm niên',           calcBasis: 'PHAN_TRAM', isActive: true, orderNo: 2 },
    { id: 'KHU_VUC',   name: 'Phụ cấp khu vực',             calcBasis: 'PHAN_TRAM', isActive: true, orderNo: 3 },
    { id: 'DOC_HAI',   name: 'Phụ cấp độc hại, nguy hiểm', calcBasis: 'PHAN_TRAM', isActive: true, orderNo: 4 },
    { id: 'BIEN_GIOI', name: 'Phụ cấp biên giới, hải đảo',  calcBasis: 'PHAN_TRAM', isActive: true, orderNo: 6 },
    { id: 'KIEM_NHIEM',name: 'Phụ cấp kiêm nhiệm',          calcBasis: 'PHAN_TRAM', isActive: true, orderNo: 10 },
    { id: 'NUOI_CON',  name: 'Trợ cấp nuôi con nhỏ',        calcBasis: 'CO_DINH',   isActive: true, orderNo: 8 },
    { id: 'MAT_SUC',   name: 'Trợ cấp mất sức lao động',    calcBasis: 'CO_DINH',   isActive: true, orderNo: 9 },
  ], 'AllowanceType');

  await upsertMany(prisma.leaveType, [
    { id: 'PHEP_NAM',    name: 'Nghỉ phép năm',         maxDays: 30,  isPaid: true,  isActive: true },
    { id: 'THAI_SAN',    name: 'Nghỉ thai sản',          maxDays: 180, isPaid: true,  isActive: true },
    { id: 'CHON_CON',    name: 'Nghỉ chăm con ốm',       maxDays: 20,  isPaid: true,  isActive: true },
    { id: 'OAM_DAU',     name: 'Nghỉ ốm',               maxDays: null,isPaid: true,  isActive: true },
    { id: 'HOC_TAP',     name: 'Đi học dài hạn',         maxDays: null,isPaid: true,  isActive: true },
    { id: 'DAM_CUOI',    name: 'Nghỉ đám cưới',          maxDays: 5,   isPaid: true,  isActive: true },
    { id: 'TANG_LE',     name: 'Nghỉ tang lễ',           maxDays: 3,   isPaid: true,  isActive: true },
    { id: 'KHONG_LUONG', name: 'Nghỉ không lương',       maxDays: null,isPaid: false, isActive: true },
  ], 'LeaveType');

  // ─── NHÓM 6: Khen thưởng & Kỷ luật ────────────────────────────────
  console.log('\n🏅 Nhóm 6: Khen thưởng & Kỷ luật');

  await upsertMany(prisma.awardTypeCatalog, [
    { id: 'AH_LLVTND',    name: 'Danh hiệu Anh hùng LLVT nhân dân',         level: 'NHA_NUOC', orderNo: 1,  isActive: true },
    { id: 'HUAN_CHONG_M', name: 'Huân chương Quân công',                    level: 'NHA_NUOC', orderNo: 3,  isActive: true },
    { id: 'HUAN_CHIEN_SY',name: 'Huân chương Chiến sĩ vẻ vang',             level: 'NHA_NUOC', orderNo: 4,  isActive: true },
    { id: 'HUAN_BAOVE',   name: 'Huân chương Bảo vệ Tổ quốc',               level: 'NHA_NUOC', orderNo: 5,  isActive: true },
    { id: 'HUAN_LAODONG', name: 'Huân chương Lao động',                     level: 'NHA_NUOC', orderNo: 6,  isActive: true },
    { id: 'BANG_KHEN_CP', name: 'Bằng khen Thủ tướng Chính phủ',            level: 'NHA_NUOC', orderNo: 12, isActive: true },
    { id: 'BANG_KHEN_BQP',name: 'Bằng khen Bộ trưởng BQP',                 level: 'BO',       orderNo: 13, isActive: true },
    { id: 'BANG_KHEN_HV', name: 'Bằng khen Giám đốc Học viện',              level: 'HOC_VIEN', orderNo: 14, isActive: true },
    { id: 'GIAY_KHEN_HV', name: 'Giấy khen Giám đốc Học viện',              level: 'HOC_VIEN', orderNo: 15, isActive: true },
    { id: 'GIAY_KHEN_KH', name: 'Giấy khen cấp Khoa',                       level: 'KHOA',     orderNo: 16, isActive: true },
    { id: 'CS_VAVANG_1',  name: 'Chiến sĩ thi đua toàn quân',               level: 'NHA_NUOC', orderNo: 20, isActive: true },
    { id: 'CS_VAVANG_2',  name: 'Chiến sĩ thi đua cấp Bộ',                 level: 'BO',       orderNo: 21, isActive: true },
    { id: 'LDTT_HV',      name: 'Lao động tiên tiến cấp Học viện',          level: 'HOC_VIEN', orderNo: 22, isActive: true },
  ], 'AwardTypeCatalog');

  await upsertMany(prisma.disciplineTypeCatalog, [
    { id: 'KHIEN_TRACH',    name: 'Khiển trách',                         severity: 1, isActive: true },
    { id: 'CANH_CAO',       name: 'Cảnh cáo',                            severity: 2, isActive: true },
    { id: 'HA_CAP_BAC',     name: 'Hạ bậc lương / hạ cấp bậc quân hàm', severity: 3, isActive: true },
    { id: 'TUOC_DANH_HIEU', name: 'Tước danh hiệu quân nhân',            severity: 4, isActive: true },
    { id: 'TOAN_XET',       name: 'Đưa ra khỏi quân đội',                severity: 5, isActive: true },
    { id: 'THU_HOI_BANG',   name: 'Thu hồi bằng khen / danh hiệu',      severity: 3, isActive: true },
  ], 'DisciplineTypeCatalog');

  await upsertMany(prisma.meritTitle, [
    { id: 'CSTT_TOAN_QUAN', name: 'Chiến sĩ thi đua toàn quân',      level: 'TOA_QUAN', isActive: true },
    { id: 'CSTT_CAP_BO',    name: 'Chiến sĩ thi đua cấp Bộ',         level: 'BO',       isActive: true },
    { id: 'CSTT_HV',        name: 'Chiến sĩ thi đua cấp Học viện',   level: 'HOC_VIEN', isActive: true },
    { id: 'LDTT',           name: 'Lao động tiên tiến',               level: 'HOC_VIEN', isActive: true },
    { id: 'DVTIENBIEU',     name: 'Đảng viên tiêu biểu',             level: 'HOC_VIEN', isActive: true },
    { id: 'TAPTHE_XS',      name: 'Tập thể xuất sắc',                level: 'HOC_VIEN', isActive: true },
  ], 'MeritTitle');

  // ─── NHÓM 7: NCKH ──────────────────────────────────────────────────
  console.log('\n🔬 Nhóm 7: NCKH');

  await upsertMany(prisma.researchTypeCatalog, [
    { id: 'DT_NHA_NUOC', name: 'Đề tài cấp Nhà nước',         level: 'NHA_NUOC',  maxBudget: BigInt(5000000000), orderNo: 1, isActive: true },
    { id: 'DT_BO',       name: 'Đề tài cấp Bộ Quốc phòng',   level: 'BO',        maxBudget: BigInt(2000000000), orderNo: 2, isActive: true },
    { id: 'DT_HOC_VIEN', name: 'Đề tài cấp Học viện',         level: 'HOC_VIEN',  maxBudget: BigInt(500000000),  orderNo: 3, isActive: true },
    { id: 'DT_KHOA',     name: 'Đề tài cấp Khoa',             level: 'KHOA',      maxBudget: BigInt(100000000),  orderNo: 4, isActive: true },
    { id: 'DT_CO_SO',    name: 'Đề tài cơ sở',               level: 'CO_SO',     maxBudget: BigInt(50000000),   orderNo: 5, isActive: true },
    { id: 'SANG_KIEN',   name: 'Sáng kiến cải tiến',          level: 'HOC_VIEN',  maxBudget: BigInt(30000000),   orderNo: 6, isActive: true },
    { id: 'LUAN_AN',     name: 'Luận án tiến sĩ',             level: 'HOC_VIEN',  maxBudget: null,               orderNo: 7, isActive: true },
    { id: 'LUAN_VAN',    name: 'Luận văn thạc sĩ',            level: 'HOC_VIEN',  maxBudget: null,               orderNo: 8, isActive: true },
  ], 'ResearchTypeCatalog');

  await upsertMany(prisma.researchField, [
    { id: 'HC_QUAN_SU',  name: 'Hậu cần quân sự',                   orderNo: 1,  isActive: true },
    { id: 'KY_THUAT_QS', name: 'Kỹ thuật quân sự',                  orderNo: 2,  isActive: true },
    { id: 'KINH_TE_QP',  name: 'Kinh tế quốc phòng',                orderNo: 3,  isActive: true },
    { id: 'KHOA_HOC_XH', name: 'Khoa học xã hội nhân văn quân sự',  orderNo: 4,  isActive: true },
    { id: 'CNTT_AI',     name: 'Công nghệ thông tin và AI',          orderNo: 5,  isActive: true },
    { id: 'GIAO_DUC_DT', name: 'Giáo dục và Đào tạo',               orderNo: 6,  isActive: true },
    { id: 'KHOA_HOC_CB', name: 'Khoa học cơ bản',                   orderNo: 7,  isActive: true },
    { id: 'Y_TE_QS',     name: 'Y tế quân sự',                       orderNo: 9,  isActive: true },
    { id: 'LLMLN_TT',    name: 'Lý luận Mác-Lênin và tư tưởng HCM', orderNo: 10, isActive: true },
  ], 'ResearchField');

  await upsertMany(prisma.publicationTypeCatalog, [
    { id: 'TAP_CHI_ISI',     name: 'Bài báo tạp chí ISI/SCIE',       scoreWeight: 3.0, orderNo: 1,  isActive: true },
    { id: 'TAP_CHI_SCOPUS',  name: 'Bài báo tạp chí Scopus',          scoreWeight: 2.5, orderNo: 2,  isActive: true },
    { id: 'TAP_CHI_QG',      name: 'Bài báo tạp chí quốc gia',       scoreWeight: 1.5, orderNo: 3,  isActive: true },
    { id: 'TAP_CHI_HV',      name: 'Bài báo tạp chí Học viện',       scoreWeight: 1.0, orderNo: 4,  isActive: true },
    { id: 'KY_YEU_QT',       name: 'Báo cáo hội thảo quốc tế',       scoreWeight: 2.0, orderNo: 5,  isActive: true },
    { id: 'KY_YEU_QG',       name: 'Báo cáo hội thảo trong nước',    scoreWeight: 1.0, orderNo: 6,  isActive: true },
    { id: 'SACH_CHUYEN_KHAO',name: 'Sách chuyên khảo',               scoreWeight: 3.0, orderNo: 7,  isActive: true },
    { id: 'SACH_GIAO_TRINH', name: 'Giáo trình',                     scoreWeight: 2.0, orderNo: 8,  isActive: true },
    { id: 'SACH_THAM_KHAO',  name: 'Sách tham khảo',                 scoreWeight: 1.5, orderNo: 9,  isActive: true },
    { id: 'BANG_SANG_CHE',   name: 'Bằng sáng chế/giải pháp HH',    scoreWeight: 4.0, orderNo: 10, isActive: true },
    { id: 'SANG_KIEN_CN',    name: 'Sáng kiến cải tiến kỹ thuật',    scoreWeight: 1.0, orderNo: 11, isActive: true },
  ], 'PublicationTypeCatalog');

  await upsertMany(prisma.researchStatusCatalog, [
    { id: 'DE_XUAT',       name: 'Đề xuất / chờ duyệt',   color: '#9CA3AF', orderNo: 1 },
    { id: 'PHE_DUYET',     name: 'Đã phê duyệt',          color: '#3B82F6', orderNo: 2 },
    { id: 'DANG_TH',       name: 'Đang thực hiện',        color: '#22C55E', orderNo: 3 },
    { id: 'TAM_DUNG',      name: 'Tạm dừng',              color: '#F59E0B', orderNo: 4 },
    { id: 'CHO_NT',        name: 'Chờ nghiệm thu',        color: '#8B5CF6', orderNo: 5 },
    { id: 'HOAN_THANH',    name: 'Hoàn thành',            color: '#10B981', orderNo: 6 },
    { id: 'DUNG_LAI',      name: 'Dừng/Hủy',             color: '#EF4444', orderNo: 7 },
  ], 'ResearchStatusCatalog');

  // ─── NHÓM 8: RBAC & Hệ thống ───────────────────────────────────────
  console.log('\n⚙️  Nhóm 8: RBAC & Hệ thống');

  await upsertMany(prisma.moduleGroup, [
    { id: 'M01', name: 'Quản trị & RBAC',      icon: null, orderNo: 1 },
    { id: 'M02', name: 'CSDL Cán bộ',          icon: null, orderNo: 2 },
    { id: 'M03', name: 'CSDL Đảng viên',       icon: null, orderNo: 3 },
    { id: 'M04', name: 'CSDL Bảo hiểm',        icon: null, orderNo: 4 },
    { id: 'M05', name: 'CSDL Chế độ CS',       icon: null, orderNo: 5 },
    { id: 'M06', name: 'CSDL Khen thưởng KL',  icon: null, orderNo: 6 },
    { id: 'M07', name: 'CSDL GV - Học viên',   icon: null, orderNo: 7 },
    { id: 'M08', name: 'CSDL Đào tạo',         icon: null, orderNo: 8 },
    { id: 'M09', name: 'CSDL NCKH',            icon: null, orderNo: 9 },
    { id: 'M10', name: 'AI Engine',            icon: null, orderNo: 10 },
    { id: 'M11', name: 'Dashboard',            icon: null, orderNo: 11 },
    { id: 'M12', name: 'Hạ tầng dữ liệu',      icon: null, orderNo: 12 },
    { id: 'M13', name: 'Workflow',             icon: null, orderNo: 13 },
    { id: 'M16', name: 'Văn bản số',           icon: null, orderNo: 16 },
    { id: 'M17', name: 'Trang bị HCKT',        icon: null, orderNo: 17 },
  ], 'ModuleGroup');

  await upsertMany(prisma.functionCodeMaster, [
    // M01
    { id: 'VIEW_DASHBOARD',       name: 'Xem dashboard',                  moduleId: 'M01', description: null, isActive: true },
    { id: 'MANAGE_RBAC',          name: 'Quản lý phân quyền RBAC',        moduleId: 'M01', description: null, isActive: true },
    { id: 'MANAGE_USERS',         name: 'Quản lý tài khoản',              moduleId: 'M01', description: null, isActive: true },
    { id: 'MANAGE_UNITS',         name: 'Quản lý đơn vị',                 moduleId: 'M01', description: null, isActive: true },
    { id: 'VIEW_AUDIT_LOG',       name: 'Xem nhật ký kiểm toán',          moduleId: 'M01', description: null, isActive: true },
    { id: 'MANAGE_MASTER_DATA',   name: 'Quản lý master data',            moduleId: 'M01', description: null, isActive: true },
    // M02
    { id: 'VIEW_PERSONNEL',       name: 'Xem danh sách cán bộ',           moduleId: 'M02', description: null, isActive: true },
    { id: 'CREATE_PERSONNEL',     name: 'Thêm hồ sơ cán bộ',             moduleId: 'M02', description: null, isActive: true },
    { id: 'EDIT_PERSONNEL',       name: 'Sửa hồ sơ cán bộ',              moduleId: 'M02', description: null, isActive: true },
    { id: 'DELETE_PERSONNEL',     name: 'Xóa hồ sơ cán bộ',              moduleId: 'M02', description: null, isActive: true },
    { id: 'EXPORT_PERSONNEL',     name: 'Xuất dữ liệu cán bộ',            moduleId: 'M02', description: null, isActive: true },
    { id: 'VIEW_STATS_PERSONNEL', name: 'Xem thống kê nhân sự',           moduleId: 'M02', description: null, isActive: true },
    // M03
    { id: 'VIEW_PARTY',           name: 'Xem CSDL Đảng viên',             moduleId: 'M03', description: null, isActive: true },
    { id: 'CREATE_PARTY_MEMBER',  name: 'Kết nạp Đảng viên',             moduleId: 'M03', description: null, isActive: true },
    { id: 'EDIT_PARTY_MEMBER',    name: 'Sửa hồ sơ Đảng viên',           moduleId: 'M03', description: null, isActive: true },
    { id: 'EVALUATE_PARTY',       name: 'Đánh giá phân loại Đảng viên',  moduleId: 'M03', description: null, isActive: true },
    // M04
    { id: 'VIEW_INSURANCE',       name: 'Xem CSDL bảo hiểm',             moduleId: 'M04', description: null, isActive: true },
    { id: 'MANAGE_INSURANCE',     name: 'Quản lý hồ sơ bảo hiểm',        moduleId: 'M04', description: null, isActive: true },
    // M05
    { id: 'VIEW_POLICY',          name: 'Xem chế độ chính sách',          moduleId: 'M05', description: null, isActive: true },
    { id: 'MANAGE_LEAVE',         name: 'Quản lý nghỉ phép',              moduleId: 'M05', description: null, isActive: true },
    { id: 'APPROVE_LEAVE',        name: 'Phê duyệt nghỉ phép',            moduleId: 'M05', description: null, isActive: true },
    // M06
    { id: 'VIEW_AWARDS',          name: 'Xem khen thưởng, kỷ luật',       moduleId: 'M06', description: null, isActive: true },
    { id: 'MANAGE_AWARDS',        name: 'Quản lý hồ sơ khen thưởng',     moduleId: 'M06', description: null, isActive: true },
    { id: 'PROPOSE_AWARD',        name: 'Đề xuất khen thưởng',           moduleId: 'M06', description: null, isActive: true },
    { id: 'APPROVE_AWARD',        name: 'Phê duyệt khen thưởng',         moduleId: 'M06', description: null, isActive: true },
    // M07
    { id: 'VIEW_FACULTY',         name: 'Xem danh sách giảng viên',       moduleId: 'M07', description: null, isActive: true },
    { id: 'VIEW_STUDENT',         name: 'Xem danh sách học viên',         moduleId: 'M07', description: null, isActive: true },
    { id: 'MANAGE_STUDENT',       name: 'Quản lý hồ sơ học viên',        moduleId: 'M07', description: null, isActive: true },
    // M08
    { id: 'VIEW_TRAINING',        name: 'Xem CSDL Đào tạo',               moduleId: 'M08', description: null, isActive: true },
    { id: 'MANAGE_CURRICULUM',    name: 'Quản lý chương trình đào tạo',   moduleId: 'M08', description: null, isActive: true },
    { id: 'MANAGE_GRADES',        name: 'Quản lý kết quả học tập',        moduleId: 'M08', description: null, isActive: true },
    // M09
    { id: 'VIEW_RESEARCH',        name: 'Xem CSDL nghiên cứu KH',        moduleId: 'M09', description: null, isActive: true },
    { id: 'MANAGE_RESEARCH',      name: 'Quản lý đề tài NCKH',           moduleId: 'M09', description: null, isActive: true },
    { id: 'MANAGE_PUBLICATIONS',  name: 'Quản lý công bố khoa học',      moduleId: 'M09', description: null, isActive: true },
    // M10
    { id: 'VIEW_AI_ANALYTICS',    name: 'Xem phân tích AI',               moduleId: 'M10', description: null, isActive: true },
    { id: 'USE_AI_PREDICTION',    name: 'Sử dụng dự báo AI',              moduleId: 'M10', description: null, isActive: true },
    // M11
    { id: 'VIEW_DASHBOARD_ADMIN', name: 'Xem dashboard Admin',            moduleId: 'M11', description: null, isActive: true },
    { id: 'VIEW_DASHBOARD_KHOA',  name: 'Xem dashboard Khoa',             moduleId: 'M11', description: null, isActive: true },
    // M12
    { id: 'VIEW_DATALAKE',        name: 'Xem kho dữ liệu',                moduleId: 'M12', description: null, isActive: true },
    { id: 'UPLOAD_DATA',          name: 'Tải lên dữ liệu',                moduleId: 'M12', description: null, isActive: true },
    { id: 'QUERY_DATA',           name: 'Truy vấn dữ liệu SQL',           moduleId: 'M12', description: null, isActive: true },
    // M16
    { id: 'VIEW_DOCUMENTS',       name: 'Xem văn bản',                    moduleId: 'M16', description: null, isActive: true },
    { id: 'MANAGE_DOCUMENTS',     name: 'Quản lý văn bản',                moduleId: 'M16', description: null, isActive: true },
    // M17
    { id: 'VIEW_EQUIPMENT',       name: 'Xem danh mục trang bị',          moduleId: 'M17', description: null, isActive: true },
    { id: 'MANAGE_EQUIPMENT',     name: 'Quản lý trang bị HCKT',          moduleId: 'M17', description: null, isActive: true },
  ], 'FunctionCodeMaster (45 mã)');

  await upsertMany(prisma.accessScope, [
    { id: 'SELF',       name: 'Bản thân',          level: 1, description: 'Chỉ xem dữ liệu của chính mình' },
    { id: 'UNIT',       name: 'Đơn vị trực thuộc', level: 2, description: 'Xem dữ liệu trong đơn vị mình phụ trách' },
    { id: 'DEPARTMENT', name: 'Khoa/Phòng',        level: 3, description: 'Xem dữ liệu toàn Khoa/Phòng' },
    { id: 'ACADEMY',    name: 'Toàn Học viện',     level: 4, description: 'Xem dữ liệu toàn Học viện' },
  ], 'AccessScope');

  await upsertMany(prisma.dataClassification, [
    { id: 'PUBLIC',       name: 'Công khai',  color: '#22C55E', level: 1, description: 'Dữ liệu không hạn chế' },
    { id: 'INTERNAL',     name: 'Nội bộ',     color: '#3B82F6', level: 2, description: 'Chỉ trong nội bộ Học viện' },
    { id: 'CONFIDENTIAL', name: 'Mật',        color: '#F59E0B', level: 3, description: 'Dữ liệu mật, hạn chế truy cập' },
    { id: 'SECRET',       name: 'Tối mật',    color: '#EF4444', level: 4, description: 'Dữ liệu tối mật, chỉ người có thẩm quyền' },
  ], 'DataClassification');

  await upsertMany(prisma.notificationTypeCatalog, [
    { id: 'HET_HAN_BHYT',    name: 'Thẻ BHYT sắp hết hạn',        icon: 'card-expired',  priority: 3, isActive: true },
    { id: 'SINH_NHAT',       name: 'Sinh nhật cán bộ',            icon: 'birthday',      priority: 1, isActive: true },
    { id: 'DEN_HAN_BO_NHIEM',name: 'Đến hạn bổ nhiệm lại',       icon: 'calendar',      priority: 3, isActive: true },
    { id: 'WORKFLOW_CHO',    name: 'Có yêu cầu chờ phê duyệt',   icon: 'pending',       priority: 4, isActive: true },
    { id: 'WORKFLOW_DUYET',  name: 'Yêu cầu đã được phê duyệt',  icon: 'approved',      priority: 2, isActive: true },
    { id: 'WORKFLOW_TU',     name: 'Yêu cầu bị từ chối',         icon: 'rejected',      priority: 3, isActive: true },
    { id: 'HE_THONG',        name: 'Thông báo hệ thống',          icon: 'system',        priority: 2, isActive: true },
    { id: 'CANH_BAO_BM',     name: 'Cảnh báo bảo mật',           icon: 'security',      priority: 4, isActive: true },
  ], 'NotificationTypeCatalog');

  await upsertMany(prisma.workflowTypeCatalog, [
    { id: 'XIN_NGHI_PHEP',  name: 'Xin nghỉ phép',                 moduleId: 'M05', steps: 2, isActive: true },
    { id: 'DIEU_DONG_CB',   name: 'Đề xuất điều động cán bộ',      moduleId: 'M02', steps: 3, isActive: true },
    { id: 'BO_NHIEM_CB',    name: 'Đề xuất bổ nhiệm cán bộ',       moduleId: 'M02', steps: 3, isActive: true },
    { id: 'KET_NAP_DANG',   name: 'Quy trình kết nạp Đảng',        moduleId: 'M03', steps: 4, isActive: true },
    { id: 'DE_XUAT_NCKH',   name: 'Đăng ký đề tài NCKH',           moduleId: 'M09', steps: 3, isActive: true },
    { id: 'NGHIEM_THU_NCKH',name: 'Nghiệm thu đề tài NCKH',        moduleId: 'M09', steps: 3, isActive: true },
    { id: 'DE_XUAT_KT',     name: 'Đề xuất khen thưởng',           moduleId: 'M06', steps: 3, isActive: true },
    { id: 'BH_CLAIM',       name: 'Thanh toán bảo hiểm y tế',      moduleId: 'M04', steps: 2, isActive: true },
    { id: 'NHAP_TRANG_BI',  name: 'Đề xuất nhập trang bị mới',     moduleId: 'M17', steps: 3, isActive: true },
  ], 'WorkflowTypeCatalog');

  // ─── NHÓM 9: Dân số & Cá nhân ──────────────────────────────────────
  console.log('\n👥 Nhóm 9: Dân số & Cá nhân');
  // Ethnicity + Religion seeded by seed_master_data.ts — skip

  await upsertMany(prisma.familyMemberType, [
    { id: 'VO_CHONG',       name: 'Vợ/Chồng',           orderNo: 1 },
    { id: 'CON',            name: 'Con',                 orderNo: 2 },
    { id: 'BO_ME',          name: 'Bố/Mẹ',              orderNo: 3 },
    { id: 'ANH_CHI_EM',     name: 'Anh/Chị/Em ruột',   orderNo: 4 },
    { id: 'BO_ME_CHONG',    name: 'Bố/Mẹ chồng',        orderNo: 5 },
    { id: 'BO_ME_VO',       name: 'Bố/Mẹ vợ',           orderNo: 6 },
    { id: 'NGUOI_NUOI_DUONG','name': 'Người nuôi dưỡng', orderNo: 7 } as any,
  ], 'FamilyMemberType');

  await upsertMany(prisma.familyBackground, [
    { id: 'CONG_NHAN',  name: 'Công nhân' },
    { id: 'NONG_DAN',   name: 'Nông dân' },
    { id: 'QUAN_DOI',   name: 'Quân đội' },
    { id: 'VIEN_CHUC',  name: 'Viên chức / Công chức' },
    { id: 'TRI_THUC',   name: 'Trí thức' },
    { id: 'LIET_SI',    name: 'Con liệt sĩ' },
    { id: 'KHAC',       name: 'Khác' },
  ], 'FamilyBackground');

  // ─── NHÓM 10: Trang bị HCKT ────────────────────────────────────────
  console.log('\n🔧 Nhóm 10: Trang bị HCKT');

  // Insert parents first, then children
  const equipCatParents = [
    { id: 'QUAN_NU_TB',   name: 'Trang bị quân nhu',         parentId: null, orderNo: 1,  isActive: true },
    { id: 'VAN_TAI_TB',   name: 'Phương tiện vận tải',        parentId: null, orderNo: 2,  isActive: true },
    { id: 'XANG_DAU_TB',  name: 'Trang bị xăng dầu',          parentId: null, orderNo: 3,  isActive: true },
    { id: 'CNTT_TB',      name: 'Trang thiết bị CNTT',         parentId: null, orderNo: 5,  isActive: true },
    { id: 'HUAN_LUYEN_TB',name: 'Vũ khí/trang bị huấn luyện',parentId: null, orderNo: 6,  isActive: true },
  ];
  for (const item of equipCatParents) {
    await prisma.equipmentCategory.upsert({ where: { id: item.id }, update: item, create: item });
  }
  const equipCatChildren = [
    { id: 'QUAN_PHUC',  name: 'Quân phục, trang phục',        parentId: 'QUAN_NU_TB', orderNo: 11, isActive: true },
    { id: 'TRANG_BU_CN',name: 'Trang bị cá nhân chiến sĩ',   parentId: 'QUAN_NU_TB', orderNo: 12, isActive: true },
    { id: 'XE_CO_GIOI', name: 'Xe cơ giới',                   parentId: 'VAN_TAI_TB', orderNo: 21, isActive: true },
    { id: 'MAY_TINH',   name: 'Máy tính, máy chủ',            parentId: 'CNTT_TB',    orderNo: 51, isActive: true },
    { id: 'MANG_LAN',   name: 'Thiết bị mạng LAN',            parentId: 'CNTT_TB',    orderNo: 52, isActive: true },
    { id: 'IN_AN',      name: 'Máy in, photo',                parentId: 'CNTT_TB',    orderNo: 53, isActive: true },
  ];
  for (const item of equipCatChildren) {
    await prisma.equipmentCategory.upsert({ where: { id: item.id }, update: item, create: item });
  }
  console.log('  ✓ EquipmentCategory (5 cấp 1 + 6 cấp 2)');

  await upsertMany(prisma.equipmentStatusCatalog, [
    { id: 'TOT',         name: 'Tốt / Sẵn sàng',     color: '#22C55E', orderNo: 1 },
    { id: 'KHA',         name: 'Khá',                color: '#84CC16', orderNo: 2 },
    { id: 'TRUNG_BINH',  name: 'Trung bình',          color: '#F59E0B', orderNo: 3 },
    { id: 'XAU',         name: 'Xấu / Cần sửa chữa', color: '#EF4444', orderNo: 4 },
    { id: 'BAO_DUONG',   name: 'Đang bảo dưỡng',      color: '#3B82F6', orderNo: 5 },
    { id: 'THANH_LY',    name: 'Đã thanh lý',          color: '#9CA3AF', orderNo: 6 },
    { id: 'CHO_CAP_PHAT',name: 'Chờ cấp phát',        color: '#8B5CF6', orderNo: 7 },
  ], 'EquipmentStatusCatalog');

  await upsertMany(prisma.maintenanceTypeCatalog, [
    { id: 'BAO_DUONG_DK',      name: 'Bảo dưỡng định kỳ',           periodDays: 90,  isActive: true },
    { id: 'BAO_DUONG_TH',      name: 'Bảo dưỡng thường xuyên',      periodDays: 30,  isActive: true },
    { id: 'SUA_CHUA_NHO',      name: 'Sửa chữa nhỏ',               periodDays: null, isActive: true },
    { id: 'SUA_CHUA_LON',      name: 'Sửa chữa lớn / đại tu',      periodDays: null, isActive: true },
    { id: 'KIEM_TRA_KT',       name: 'Kiểm tra kỹ thuật định kỳ',   periodDays: 180, isActive: true },
    { id: 'NANG_CAP',          name: 'Nâng cấp thiết bị',           periodDays: null, isActive: true },
  ], 'MaintenanceTypeCatalog');

  // ─── Cập nhật MasterDataVersion ────────────────────────────────────
  console.log('\n📋 Cập nhật MasterDataVersion...');
  const tables = [
    { tableName: 'provinces',               notes: '34 tỉnh/TP 2 cấp từ 01/07/2025' },
    { tableName: 'military_ranks',          notes: '23 cấp bậc quân hàm QĐND VN' },
    { tableName: 'personnel_types',         notes: '9 loại cán bộ/nhân sự' },
    { tableName: 'work_statuses',           notes: '12 trạng thái công tác' },
    { tableName: 'unit_types',             notes: '11 loại đơn vị tổ chức' },
    { tableName: 'academic_titles',        notes: 'GS/PGS' },
    { tableName: 'academic_degrees',       notes: '9 học vị' },
    { tableName: 'majors',                 notes: '15 chuyên ngành HVHC' },
    { tableName: 'training_institutions',  notes: '10 cơ sở đào tạo' },
    { tableName: 'annual_evaluation_ranks',notes: 'HTXSNV/HTTNV/HTNV/KHNV' },
    { tableName: 'party_org_types',        notes: '4 loại tổ chức Đảng' },
    { tableName: 'party_transfer_types',   notes: '6 hình thức chuyển sinh hoạt' },
    { tableName: 'insurance_types',        notes: '5 loại bảo hiểm' },
    { tableName: 'allowance_types',        notes: '8 loại phụ cấp/trợ cấp' },
    { tableName: 'leave_types',            notes: '8 loại nghỉ phép' },
    { tableName: 'award_form_types',       notes: '13 hình thức khen thưởng' },
    { tableName: 'discipline_types',       notes: '6 hình thức kỷ luật' },
    { tableName: 'merit_titles',           notes: '6 danh hiệu thi đua' },
    { tableName: 'research_type_catalog',  notes: '8 cấp đề tài NCKH' },
    { tableName: 'research_fields',        notes: '9 lĩnh vực nghiên cứu' },
    { tableName: 'publication_types',      notes: '11 loại công bố KH' },
    { tableName: 'research_statuses',      notes: '7 trạng thái đề tài' },
    { tableName: 'module_groups',          notes: '15 nhóm module hệ thống' },
    { tableName: 'function_code_master',   notes: '45 function codes' },
    { tableName: 'access_scopes',          notes: 'SELF/UNIT/DEPARTMENT/ACADEMY' },
    { tableName: 'data_classifications',   notes: '4 mức phân loại bảo mật' },
    { tableName: 'notification_types',     notes: '8 loại thông báo' },
    { tableName: 'workflow_types',         notes: '9 loại workflow' },
    { tableName: 'family_member_types',    notes: '7 loại thân nhân' },
    { tableName: 'family_backgrounds',     notes: '7 thành phần gia đình' },
    { tableName: 'equipment_categories',   notes: '11 danh mục trang bị' },
    { tableName: 'equipment_status_catalog', notes: '7 trạng thái trang bị' },
    { tableName: 'maintenance_type_catalog', notes: '6 loại bảo dưỡng' },
  ];

  for (const t of tables) {
    await prisma.masterDataVersion.upsert({
      where: { id: (await prisma.masterDataVersion.findFirst({ where: { tableName: t.tableName } }))?.id || 0 },
      update: { version: '1.0', lastUpdated: new Date(), notes: t.notes },
      create: { tableName: t.tableName, version: '1.0', notes: t.notes },
    });
  }
  console.log(`  ✓ MasterDataVersion: ${tables.length} bản ghi`);

  // ─── TỔNG KẾT ──────────────────────────────────────────────────────
  const counts = await Promise.all([
    prisma.province.count(),
    prisma.militaryRank.count(),
    prisma.majorCatalog.count(),
    prisma.awardTypeCatalog.count(),
    prisma.researchTypeCatalog.count(),
    prisma.functionCodeMaster.count(),
    prisma.moduleGroup.count(),
  ]);
  console.log('\n═══════════════════════════════════════');
  console.log('  MASTER DATA SEED HOÀN THÀNH');
  console.log('═══════════════════════════════════════');
  console.log(`  Tỉnh/TP:           ${counts[0]}`);
  console.log(`  Cấp bậc quân hàm:  ${counts[1]}`);
  console.log(`  Chuyên ngành:       ${counts[2]}`);
  console.log(`  Hình thức KT:       ${counts[3]}`);
  console.log(`  Cấp đề tài NCKH:    ${counts[4]}`);
  console.log(`  Function codes:     ${counts[5]}`);
  console.log(`  Module groups:      ${counts[6]}`);
  console.log('═══════════════════════════════════════\n');
}

main()
  .catch((e) => { console.error('❌ Lỗi:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
