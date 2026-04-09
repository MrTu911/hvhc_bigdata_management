/**
 * M18 – Field Catalog API
 * GET /api/templates/fields
 *
 * Trả về danh sách field khả dụng theo entity type.
 * Catalog tĩnh – phản ánh đúng những gì data-resolver-service thực sự output.
 * Không cần DB query.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { TEMPLATES } from '@/lib/rbac/function-codes';

export interface FieldEntry {
  key: string;
  label: string;
  group: string;
  example: string;
  type: 'text' | 'date' | 'list';
}

export type FieldCatalog = Record<string, FieldEntry[]>;

const FIELD_CATALOG: FieldCatalog = {
  personnel: [
    // Thông tin cơ bản
    { key: 'hoTen', label: 'Họ và tên', group: 'Thông tin cơ bản', example: 'NGUYỄN VĂN A', type: 'text' },
    { key: 'gioiTinh', label: 'Giới tính', group: 'Thông tin cơ bản', example: 'Nam', type: 'text' },
    { key: 'ngaySinh', label: 'Ngày sinh', group: 'Thông tin cơ bản', example: '01/01/1980', type: 'date' },
    { key: 'noiSinh', label: 'Nơi sinh', group: 'Thông tin cơ bản', example: 'Hà Nội', type: 'text' },
    { key: 'queQuan', label: 'Quê quán', group: 'Thông tin cơ bản', example: 'Nam Định', type: 'text' },
    { key: 'danToc', label: 'Dân tộc', group: 'Thông tin cơ bản', example: 'Kinh', type: 'text' },
    { key: 'militaryId', label: 'Số quân nhân / Mã định danh', group: 'Thông tin cơ bản', example: '123456', type: 'text' },
    { key: 'dienThoai', label: 'Điện thoại', group: 'Thông tin cơ bản', example: '0912345678', type: 'text' },
    { key: 'diaChiLienLac', label: 'Địa chỉ liên lạc', group: 'Thông tin cơ bản', example: 'Số 1, Hoàng Quốc Việt', type: 'text' },

    // Chức vụ / đơn vị
    { key: 'capBac', label: 'Cấp bậc', group: 'Chức vụ – Đơn vị', example: 'Thiếu tá', type: 'text' },
    { key: 'chucVu', label: 'Chức vụ', group: 'Chức vụ – Đơn vị', example: 'Phó Trưởng khoa', type: 'text' },
    { key: 'donViCongTac', label: 'Đơn vị công tác', group: 'Chức vụ – Đơn vị', example: 'Khoa Kinh tế', type: 'text' },

    // Đào tạo – Đại học
    { key: 'daoTao_DH_hinhThuc', label: 'ĐH – Hình thức đào tạo', group: 'Đào tạo', example: 'Tập trung', type: 'text' },
    { key: 'daoTao_DH_tuNam', label: 'ĐH – Từ năm', group: 'Đào tạo', example: '09/2000', type: 'date' },
    { key: 'daoTao_DH_denNam', label: 'ĐH – Đến năm', group: 'Đào tạo', example: '06/2004', type: 'date' },
    { key: 'daoTao_DH_noiHoc', label: 'ĐH – Nơi học', group: 'Đào tạo', example: 'HVHC', type: 'text' },
    { key: 'daoTao_DH_chuyenNganh', label: 'ĐH – Chuyên ngành', group: 'Đào tạo', example: 'Quản lý hậu cần', type: 'text' },

    // Đào tạo – Thạc sĩ
    { key: 'daoTao_ThS_tuNam', label: 'ThS – Từ năm', group: 'Đào tạo', example: '09/2010', type: 'date' },
    { key: 'daoTao_ThS_tenLV', label: 'ThS – Tên luận văn', group: 'Đào tạo', example: '...', type: 'text' },
    { key: 'daoTao_ThS_nguoiHD', label: 'ThS – Người hướng dẫn', group: 'Đào tạo', example: 'PGS.TS Nguyễn X', type: 'text' },

    // Đào tạo – Tiến sĩ
    { key: 'daoTao_TS_tenLA', label: 'TS – Tên luận án', group: 'Đào tạo', example: '...', type: 'text' },
    { key: 'daoTao_TS_nguoiHD_1', label: 'TS – Người HD 1', group: 'Đào tạo', example: 'GS.TS Trần Y', type: 'text' },
    { key: 'daoTao_TS_nguoiHD_2', label: 'TS – Người HD 2', group: 'Đào tạo', example: 'PGS.TS Lê Z', type: 'text' },
    { key: 'ngoaiNgu', label: 'Ngoại ngữ', group: 'Đào tạo', example: 'Tiếng Anh B2', type: 'text' },

    // Khen thưởng / kỷ luật
    { key: 'khenThuong', label: 'Khen thưởng', group: 'Khen thưởng – Kỷ luật', example: 'Chiến sĩ thi đua 2023', type: 'text' },
    { key: 'kyLuat', label: 'Kỷ luật', group: 'Khen thưởng – Kỷ luật', example: 'Không', type: 'text' },

    // Đảng
    { key: 'ngayVaoDang', label: 'Ngày vào Đảng', group: 'Thông tin Đảng', example: '03/02/2005', type: 'date' },
    { key: 'ngayChinhThuc', label: 'Ngày chính thức', group: 'Thông tin Đảng', example: '03/02/2006', type: 'date' },

    // Danh sách
    { key: 'congTac_list', label: 'Quá trình công tác (danh sách)', group: 'Danh sách', example: '[{tuNgay, denNgay, noiCongTac, congViec}]', type: 'list' },
    { key: 'giaoTrinh_list', label: 'Giáo trình (danh sách)', group: 'Danh sách', example: '[{stt, tenTaiLieu, namXuatBan, chuBien}]', type: 'list' },
    { key: 'deTai_list', label: 'Đề tài NCKH (danh sách)', group: 'Danh sách', example: '[{ten, nam, vaiTro}]', type: 'list' },
    { key: 'baiBao_list', label: 'Bài báo (danh sách)', group: 'Danh sách', example: '[{tacGia, nam, tenBaiBao, tapChi}]', type: 'list' },

    // Xác nhận
    { key: 'thoiGianKy', label: 'Thời gian ký', group: 'Xác nhận', example: '09/04/2026', type: 'date' },
  ],

  student: [
    { key: 'hoTen', label: 'Họ tên', group: 'Thông tin cơ bản', example: 'TRẦN VĂN B', type: 'text' },
    { key: 'mssv', label: 'Mã học viên', group: 'Thông tin cơ bản', example: 'HV2021001', type: 'text' },
    { key: 'ngaySinh', label: 'Ngày sinh', group: 'Thông tin cơ bản', example: '15/06/2001', type: 'date' },
    { key: 'gioiTinh', label: 'Giới tính', group: 'Thông tin cơ bản', example: 'Nam', type: 'text' },
    { key: 'lop', label: 'Lớp', group: 'Thông tin cơ bản', example: 'K45A', type: 'text' },
    { key: 'ketQua_list', label: 'Kết quả học tập (danh sách)', group: 'Kết quả', example: '[{monHoc, diem, xepLoai}]', type: 'list' },
  ],

  party_member: [
    { key: 'hoTen', label: 'Họ tên', group: 'Thông tin cơ bản', example: 'NGUYỄN VĂN A', type: 'text' },
    { key: 'capBac', label: 'Cấp bậc', group: 'Chức vụ', example: 'Thiếu tá', type: 'text' },
    { key: 'chucVu', label: 'Chức vụ', group: 'Chức vụ', example: 'Giảng viên', type: 'text' },
    { key: 'donVi', label: 'Đơn vị', group: 'Chức vụ', example: 'Khoa Kinh tế', type: 'text' },
    { key: 'ngayVaoDang', label: 'Ngày vào Đảng', group: 'Thông tin Đảng', example: '03/02/2005', type: 'date' },
    { key: 'ngayChinhThuc', label: 'Ngày chính thức', group: 'Thông tin Đảng', example: '03/02/2006', type: 'date' },
    { key: 'chiBoHienTai', label: 'Chi bộ hiện tại', group: 'Thông tin Đảng', example: 'Chi bộ Khoa KT', type: 'text' },
    { key: 'xepLoai', label: 'Xếp loại đảng viên', group: 'Thông tin Đảng', example: 'Xuất sắc', type: 'text' },
  ],

  faculty: [
    // Giảng viên reuse personnel resolver — same fields
    { key: 'hoTen', label: 'Họ và tên', group: 'Thông tin cơ bản', example: 'NGUYỄN VĂN A', type: 'text' },
    { key: 'gioiTinh', label: 'Giới tính', group: 'Thông tin cơ bản', example: 'Nam', type: 'text' },
    { key: 'ngaySinh', label: 'Ngày sinh', group: 'Thông tin cơ bản', example: '01/01/1975', type: 'date' },
    { key: 'capBac', label: 'Cấp bậc', group: 'Chức vụ – Đơn vị', example: 'Thượng tá', type: 'text' },
    { key: 'chucVu', label: 'Chức vụ', group: 'Chức vụ – Đơn vị', example: 'Trưởng bộ môn', type: 'text' },
    { key: 'donViCongTac', label: 'Đơn vị công tác', group: 'Chức vụ – Đơn vị', example: 'Bộ môn Kinh tế', type: 'text' },
    { key: 'daoTao_DH_chuyenNganh', label: 'ĐH – Chuyên ngành', group: 'Đào tạo', example: 'Kinh tế', type: 'text' },
    { key: 'daoTao_ThS_tenLV', label: 'ThS – Tên luận văn', group: 'Đào tạo', example: '...', type: 'text' },
    { key: 'daoTao_TS_tenLA', label: 'TS – Tên luận án', group: 'Đào tạo', example: '...', type: 'text' },
    { key: 'khenThuong', label: 'Khen thưởng', group: 'Khen thưởng – Kỷ luật', example: 'CSTĐ 2023', type: 'text' },
    { key: 'ngayVaoDang', label: 'Ngày vào Đảng', group: 'Thông tin Đảng', example: '03/02/2005', type: 'date' },
    { key: 'giaoTrinh_list', label: 'Giáo trình (danh sách)', group: 'Danh sách', example: '[{stt, tenTaiLieu, namXuatBan}]', type: 'list' },
    { key: 'deTai_list', label: 'Đề tài NCKH (danh sách)', group: 'Danh sách', example: '[{ten, nam, vaiTro}]', type: 'list' },
    { key: 'baiBao_list', label: 'Bài báo (danh sách)', group: 'Danh sách', example: '[{tacGia, nam, tenBaiBao}]', type: 'list' },
  ],
};

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await requireScopedFunction(request, TEMPLATES.VIEW);
    if (!user) return response!;

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');

    const data = entityType && FIELD_CATALOG[entityType]
      ? { [entityType]: FIELD_CATALOG[entityType] }
      : FIELD_CATALOG;

    return NextResponse.json({ success: true, data, error: null });
  } catch {
    return NextResponse.json({ success: false, data: null, error: 'Lỗi tải field catalog' }, { status: 500 });
  }
}
