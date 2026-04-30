/**
 * M18 – Field Catalog Registry
 *
 * Là nguồn sự thật duy nhất về danh sách field khả dụng theo entity type.
 * Phản ánh đúng những gì data-resolver-service thực sự output.
 *
 * Thêm entity type mới:
 *   1. Thêm resolver trong data-resolver-service.ts
 *   2. Thêm entry trong FIELD_CATALOG bên dưới
 *   3. Thêm EntityType tương ứng trong data-resolver-service.ts
 */

export interface FieldEntry {
  key: string;
  label: string;
  group: string;
  example: string;
  type: 'text' | 'date' | 'list';
}

export type FieldCatalog = Record<string, FieldEntry[]>;

// ─── Core catalog ─────────────────────────────────────────────────────────────

const PERSONNEL_FIELDS: FieldEntry[] = [
  { key: 'hoTen',             label: 'Họ và tên',                          group: 'Thông tin cơ bản',       example: 'NGUYỄN VĂN A',                              type: 'text' },
  { key: 'gioiTinh',          label: 'Giới tính',                          group: 'Thông tin cơ bản',       example: 'Nam',                                        type: 'text' },
  { key: 'ngaySinh',          label: 'Ngày sinh',                          group: 'Thông tin cơ bản',       example: '01/01/1980',                                 type: 'date' },
  { key: 'noiSinh',           label: 'Nơi sinh',                           group: 'Thông tin cơ bản',       example: 'Hà Nội',                                     type: 'text' },
  { key: 'queQuan',           label: 'Quê quán',                           group: 'Thông tin cơ bản',       example: 'Nam Định',                                   type: 'text' },
  { key: 'danToc',            label: 'Dân tộc',                            group: 'Thông tin cơ bản',       example: 'Kinh',                                       type: 'text' },
  { key: 'militaryId',        label: 'Số quân nhân / Mã định danh',        group: 'Thông tin cơ bản',       example: '123456',                                     type: 'text' },
  { key: 'dienThoai',         label: 'Điện thoại',                         group: 'Thông tin cơ bản',       example: '0912345678',                                 type: 'text' },
  { key: 'diaChiLienLac',     label: 'Địa chỉ liên lạc',                   group: 'Thông tin cơ bản',       example: 'Số 1, Hoàng Quốc Việt',                      type: 'text' },
  { key: 'capBac',            label: 'Cấp bậc',                            group: 'Chức vụ – Đơn vị',       example: 'Thiếu tá',                                   type: 'text' },
  { key: 'chucVu',            label: 'Chức vụ',                            group: 'Chức vụ – Đơn vị',       example: 'Phó Trưởng khoa',                            type: 'text' },
  { key: 'donViCongTac',      label: 'Đơn vị công tác',                    group: 'Chức vụ – Đơn vị',       example: 'Khoa Kinh tế',                               type: 'text' },
  { key: 'daoTao_DH_hinhThuc',label: 'ĐH – Hình thức đào tạo',            group: 'Đào tạo',                example: 'Tập trung',                                  type: 'text' },
  { key: 'daoTao_DH_tuNam',   label: 'ĐH – Từ năm',                        group: 'Đào tạo',                example: '09/2000',                                    type: 'date' },
  { key: 'daoTao_DH_denNam',  label: 'ĐH – Đến năm',                       group: 'Đào tạo',                example: '06/2004',                                    type: 'date' },
  { key: 'daoTao_DH_noiHoc',  label: 'ĐH – Nơi học',                       group: 'Đào tạo',                example: 'HVHC',                                       type: 'text' },
  { key: 'daoTao_DH_chuyenNganh', label: 'ĐH – Chuyên ngành',             group: 'Đào tạo',                example: 'Quản lý hậu cần',                            type: 'text' },
  { key: 'daoTao_ThS_tuNam',  label: 'ThS – Từ năm',                       group: 'Đào tạo',                example: '09/2010',                                    type: 'date' },
  { key: 'daoTao_ThS_tenLV',  label: 'ThS – Tên luận văn',                 group: 'Đào tạo',                example: '...',                                        type: 'text' },
  { key: 'daoTao_ThS_nguoiHD',label: 'ThS – Người hướng dẫn',              group: 'Đào tạo',                example: 'PGS.TS Nguyễn X',                            type: 'text' },
  { key: 'daoTao_TS_tenLA',   label: 'TS – Tên luận án',                   group: 'Đào tạo',                example: '...',                                        type: 'text' },
  { key: 'daoTao_TS_nguoiHD_1',label: 'TS – Người HD 1',                   group: 'Đào tạo',                example: 'GS.TS Trần Y',                               type: 'text' },
  { key: 'daoTao_TS_nguoiHD_2',label: 'TS – Người HD 2',                   group: 'Đào tạo',                example: 'PGS.TS Lê Z',                               type: 'text' },
  { key: 'ngoaiNgu',          label: 'Ngoại ngữ',                          group: 'Đào tạo',                example: 'Tiếng Anh B2',                               type: 'text' },
  { key: 'khenThuong',        label: 'Khen thưởng',                        group: 'Khen thưởng – Kỷ luật',  example: 'Chiến sĩ thi đua 2023',                      type: 'text' },
  { key: 'kyLuat',            label: 'Kỷ luật',                            group: 'Khen thưởng – Kỷ luật',  example: 'Không',                                      type: 'text' },
  { key: 'ngayVaoDang',       label: 'Ngày vào Đảng',                      group: 'Thông tin Đảng',         example: '03/02/2005',                                 type: 'date' },
  { key: 'ngayChinhThuc',     label: 'Ngày chính thức',                    group: 'Thông tin Đảng',         example: '03/02/2006',                                 type: 'date' },
  { key: 'congTac_list',      label: 'Quá trình công tác (danh sách)',      group: 'Danh sách',              example: '[{tuNgay, denNgay, noiCongTac, congViec}]',   type: 'list' },
  { key: 'giaoTrinh_list',    label: 'Giáo trình (danh sách)',              group: 'Danh sách',              example: '[{stt, tenTaiLieu, namXuatBan, chuBien}]',   type: 'list' },
  { key: 'deTai_list',        label: 'Đề tài NCKH (danh sách)',            group: 'Danh sách',              example: '[{ten, nam, vaiTro}]',                        type: 'list' },
  { key: 'baiBao_list',       label: 'Bài báo (danh sách)',                group: 'Danh sách',              example: '[{tacGia, nam, tenBaiBao, tapChi}]',          type: 'list' },
  { key: 'thoiGianKy',        label: 'Thời gian ký',                       group: 'Xác nhận',               example: '09/04/2026',                                 type: 'date' },
];

const STUDENT_FIELDS: FieldEntry[] = [
  { key: 'hoTen',         label: 'Họ tên',                           group: 'Thông tin cơ bản', example: 'TRẦN VĂN B',                            type: 'text' },
  { key: 'mssv',          label: 'Mã học viên',                      group: 'Thông tin cơ bản', example: 'HV2021001',                              type: 'text' },
  { key: 'ngaySinh',      label: 'Ngày sinh',                        group: 'Thông tin cơ bản', example: '15/06/2001',                             type: 'date' },
  { key: 'gioiTinh',      label: 'Giới tính',                        group: 'Thông tin cơ bản', example: 'Nam',                                    type: 'text' },
  { key: 'lop',           label: 'Lớp',                              group: 'Thông tin cơ bản', example: 'K45A',                                   type: 'text' },
  { key: 'ketQua_list',   label: 'Kết quả học tập (danh sách)',      group: 'Kết quả',          example: '[{monHoc, diem, xepLoai}]',              type: 'list' },
];

const PARTY_MEMBER_FIELDS: FieldEntry[] = [
  { key: 'hoTen',         label: 'Họ tên',              group: 'Thông tin cơ bản', example: 'NGUYỄN VĂN A',          type: 'text' },
  { key: 'capBac',        label: 'Cấp bậc',             group: 'Chức vụ',          example: 'Thiếu tá',               type: 'text' },
  { key: 'chucVu',        label: 'Chức vụ',             group: 'Chức vụ',          example: 'Giảng viên',             type: 'text' },
  { key: 'donVi',         label: 'Đơn vị',              group: 'Chức vụ',          example: 'Khoa Kinh tế',           type: 'text' },
  { key: 'ngayVaoDang',   label: 'Ngày vào Đảng',       group: 'Thông tin Đảng',   example: '03/02/2005',             type: 'date' },
  { key: 'ngayChinhThuc', label: 'Ngày chính thức',     group: 'Thông tin Đảng',   example: '03/02/2006',             type: 'date' },
  { key: 'chiBoHienTai',  label: 'Chi bộ hiện tại',     group: 'Thông tin Đảng',   example: 'Chi bộ Khoa KT',         type: 'text' },
  { key: 'xepLoai',       label: 'Xếp loại đảng viên',  group: 'Thông tin Đảng',   example: 'Xuất sắc',               type: 'text' },
];

const FACULTY_FIELDS: FieldEntry[] = [
  { key: 'hoTen',              label: 'Họ và tên',           group: 'Thông tin cơ bản',      example: 'NGUYỄN VĂN A',           type: 'text' },
  { key: 'gioiTinh',           label: 'Giới tính',           group: 'Thông tin cơ bản',      example: 'Nam',                    type: 'text' },
  { key: 'ngaySinh',           label: 'Ngày sinh',           group: 'Thông tin cơ bản',      example: '01/01/1975',             type: 'date' },
  { key: 'capBac',             label: 'Cấp bậc',             group: 'Chức vụ – Đơn vị',      example: 'Thượng tá',              type: 'text' },
  { key: 'chucVu',             label: 'Chức vụ',             group: 'Chức vụ – Đơn vị',      example: 'Trưởng bộ môn',          type: 'text' },
  { key: 'donViCongTac',       label: 'Đơn vị công tác',     group: 'Chức vụ – Đơn vị',      example: 'Bộ môn Kinh tế',         type: 'text' },
  { key: 'daoTao_DH_chuyenNganh', label: 'ĐH – Chuyên ngành', group: 'Đào tạo',             example: 'Kinh tế',                type: 'text' },
  { key: 'daoTao_ThS_tenLV',   label: 'ThS – Tên luận văn',  group: 'Đào tạo',              example: '...',                    type: 'text' },
  { key: 'daoTao_TS_tenLA',    label: 'TS – Tên luận án',    group: 'Đào tạo',              example: '...',                    type: 'text' },
  { key: 'khenThuong',         label: 'Khen thưởng',         group: 'Khen thưởng – Kỷ luật', example: 'CSTĐ 2023',             type: 'text' },
  { key: 'ngayVaoDang',        label: 'Ngày vào Đảng',       group: 'Thông tin Đảng',        example: '03/02/2005',             type: 'date' },
  { key: 'giaoTrinh_list',     label: 'Giáo trình (danh sách)', group: 'Danh sách',          example: '[{stt, tenTaiLieu, namXuatBan}]', type: 'list' },
  { key: 'deTai_list',         label: 'Đề tài NCKH (danh sách)', group: 'Danh sách',         example: '[{ten, nam, vaiTro}]',   type: 'list' },
  { key: 'baiBao_list',        label: 'Bài báo (danh sách)', group: 'Danh sách',             example: '[{tacGia, nam, tenBaiBao}]', type: 'list' },
];

// ─── Registry ─────────────────────────────────────────────────────────────────
//
// Thêm entity type mới bằng cách bổ sung entry vào object này.
// Route /api/templates/fields đọc trực tiếp từ đây.

export const FIELD_CATALOG: FieldCatalog = {
  personnel:    PERSONNEL_FIELDS,
  student:      STUDENT_FIELDS,
  party_member: PARTY_MEMBER_FIELDS,
  faculty:      FACULTY_FIELDS,
};

/**
 * Lấy fields cho entity type cụ thể.
 * Trả undefined nếu entity type chưa có catalog.
 */
export function getFieldsForEntityType(entityType: string): FieldEntry[] | undefined {
  return FIELD_CATALOG[entityType];
}

/**
 * Đăng ký fields cho entity type mới (dùng cho extension modules M20–M26).
 * Chỉ được gọi một lần tại module init — không được gọi trong request handler.
 */
export function registerEntityFields(entityType: string, fields: FieldEntry[]): void {
  if (FIELD_CATALOG[entityType]) {
    console.warn(`[field-catalog] entity type "${entityType}" đã có catalog — bỏ qua đăng ký trùng`);
    return;
  }
  FIELD_CATALOG[entityType] = fields;
}
