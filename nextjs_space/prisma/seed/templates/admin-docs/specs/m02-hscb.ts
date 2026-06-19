/**
 * M02 ext — "Cập nhật thông tin hồ sơ cán bộ điện tử" (mẫu 99 trường).
 *
 * Mẫu 3 cột (TT | Dữ liệu | Cập nhật thông tin) gồm ~80 trường scalar (kvTable) +
 * 18 nhóm dạng danh sách (loop). Dữ liệu do resolver lib/services/personnel/
 * cadre-profile-export.service.ts dựng (User-centric), xuất qua route
 * /api/personnel/[id]/profile-document/export bằng exportWithData().
 *
 * Tên field placeholder ở đây PHẢI khớp khóa resolvedData của resolver.
 */

import type { KvRow, TemplateSpec } from '../types';
import { HEADER_PH } from './shared';

const KV_COLS: [string, string, string] = ['TT', 'Dữ liệu', 'Cập nhật thông tin'];

/** Helper dựng 1 dòng key/value. */
function kv(tt: number, label: string, field: string): KvRow {
  return { tt: String(tt), label, field };
}

/** Cột STT chuẩn cho bảng lặp. */
const TT_COL = { header: 'TT', field: 'tt', weight: 0.6, align: 'center' as const };

export const M02_HSCB_SPECS: TemplateSpec[] = [
  {
    code: 'TPL_M02_HSCB_DIENTU',
    name: 'Phiếu cập nhật thông tin hồ sơ cán bộ điện tử',
    description:
      'Mẫu cập nhật thông tin hồ sơ cán bộ điện tử (99 trường) — gắn dữ liệu cá nhân từ M02; xuất DOCX/PDF.',
    docType: 'BC',
    category: 'NHAN_SU',
    module: 'M02',
    moduleSource: ['M02'],
    entity: 'personnel',
    classification: 'CONFIDENTIAL',
    rbacCode: 'EXPORT_DATA',
    kyHieu: 'HVHC',
    trichYeu: '',
    titleOverride: 'PHIẾU CẬP NHẬT THÔNG TIN HỒ SƠ CÁN BỘ ĐIỆN TỬ',
    body: [
      {
        heading: 'I. THÔNG TIN ĐỊNH DANH',
        kvTable: {
          columns: KV_COLS,
          rows: [
            kv(1, 'Họ tên khai sinh', 'hoTen'),
            kv(2, 'Họ tên khác / bí danh', 'tenKhac'),
            kv(3, 'Giới tính', 'gioiTinh'),
            kv(4, 'Đối tượng quản lý', 'doiTuongQL'),
            kv(5, 'Ngày sinh', 'ngaySinh'),
            kv(6, 'Mã định danh', 'maDinhDanh'),
            kv(7, 'Số căn cước (CCCD)', 'soCCCD'),
            kv(8, 'Dân tộc', 'danToc'),
            kv(9, 'Tôn giáo', 'tonGiao'),
          ],
        },
      },
      {
        heading: 'II. CẤP BẬC - TIỀN LƯƠNG - CHỨC VỤ',
        kvTable: {
          columns: KV_COLS,
          rows: [
            kv(10, 'Cấp bậc', 'capBac'),
            kv(11, 'Thời gian nhận cấp', 'tgNhanCap'),
            kv(12, 'Nâng lương (lần)', 'nangLuongLan'),
            kv(13, 'Thời gian nâng lương', 'tgNangLuong'),
            kv(14, 'Hệ số lương', 'heSoLuong'),
            kv(15, 'Mức lương', 'mucLuong'),
            kv(16, 'Chức vụ', 'chucVu'),
            kv(17, 'Tháng năm nhận chức', 'tgNhanChuc'),
            kv(18, 'Hệ số phụ cấp chức vụ', 'heSoPCCV'),
          ],
        },
      },
      {
        heading: 'Chức vụ kiêm nhiệm (19-21)',
        loop: {
          key: 'concurrentPos_list',
          columns: [
            TT_COL,
            { header: 'Chức vụ kiêm', field: 'chucVu', weight: 3 },
            { header: 'Thời gian', field: 'thoiGian', weight: 2, align: 'center' },
            { header: 'Đơn vị', field: 'donVi', weight: 2 },
            { header: 'Chi tiết', field: 'chiTiet', weight: 3 },
          ],
        },
      },
      {
        heading: 'III. ĐỊA CHỈ',
        kvTable: {
          columns: KV_COLS,
          rows: [
            kv(22, 'Nơi sinh (địa danh mới)', 'noiSinhMoi'),
            kv(23, 'Nơi sinh (địa danh cũ)', 'noiSinhCu'),
            kv(24, 'Quê quán (địa danh mới)', 'queQuanMoi'),
            kv(25, 'Quê quán (địa danh cũ)', 'queQuanCu'),
            kv(26, 'Thường trú (địa danh mới)', 'thuongTruMoi'),
            kv(27, 'Nơi ở hiện nay (địa danh mới)', 'noiOHienNay'),
          ],
        },
      },
      {
        heading: 'IV. THÀNH PHẦN - NHẬN DẠNG - SỨC KHỎE',
        kvTable: {
          columns: KV_COLS,
          rows: [
            kv(28, 'Thành phần gia đình', 'thanhPhanGD'),
            kv(29, 'Thành phần bản thân', 'thanhPhanBanThan'),
            kv(30, 'Nhận dạng', 'nhanDang'),
            kv(31, 'Sức khỏe (loại)', 'sucKhoe'),
            kv(32, 'Chiều cao (m)', 'chieuCao'),
            kv(33, 'Cân nặng (kg)', 'canNang'),
            kv(34, 'Nhóm máu', 'nhomMau'),
            kv(35, 'Bệnh chính', 'benhChinh'),
            kv(36, 'Thương tật', 'thuongTat'),
            kv(37, 'Chi tiết thương tật', 'chiTietThuongTat'),
            kv(38, 'Gia đình thương binh, liệt sĩ', 'giaDinhTBLS'),
          ],
        },
      },
      {
        heading: 'V. TRÌNH ĐỘ',
        kvTable: {
          columns: KV_COLS,
          rows: [
            kv(39, 'Học hàm', 'hocHam'),
            kv(40, 'Thời gian học hàm', 'tgHocHam'),
            kv(41, 'Học vị', 'hocVi'),
            kv(42, 'Thời gian học vị', 'tgHocVi'),
            kv(43, 'Trình độ chỉ huy quản lý (CHQL)', 'trinhDoCHQL'),
            kv(44, 'Thời gian nhận CHQL', 'tgCHQL'),
            kv(45, 'Trình độ lý luận chính trị (LLCT)', 'trinhDoLLCT'),
            kv(46, 'Thời gian nhận LLCT', 'tgLLCT'),
            kv(47, 'Ngành đào tạo', 'nganhDaoTao'),
            kv(48, 'Cấp độ đào tạo', 'capDoDaoTao'),
            kv(49, 'Trình độ văn hóa', 'trinhDoVanHoa'),
          ],
        },
      },
      {
        heading: 'VI. QUÁ TRÌNH PHỤC VỤ',
        kvTable: {
          columns: KV_COLS,
          rows: [
            kv(50, 'Tham gia cách mạng', 'thamGiaCM'),
            kv(51, 'Thời gian tuyển dụng', 'tgTuyenDung'),
            kv(52, 'Đơn vị tuyển dụng', 'dvTuyenDung'),
            kv(53, 'Thời gian nhập ngũ', 'tgNhapNgu'),
            kv(54, 'Đơn vị nhập ngũ', 'dvNhapNgu'),
            kv(55, 'Thời gian xuất ngũ', 'tgXuatNgu'),
            kv(56, 'Đơn vị xuất ngũ', 'dvXuatNgu'),
            kv(57, 'Thời gian tái ngũ', 'tgTaiNgu'),
            kv(58, 'Đơn vị tái ngũ', 'dvTaiNgu'),
          ],
        },
      },
      {
        heading: 'VII. ĐẢNG - ĐOÀN',
        kvTable: {
          columns: KV_COLS,
          rows: [
            kv(59, 'Thời gian kết nạp Đảng', 'tgKND'),
            kv(60, 'Nơi kết nạp Đảng', 'noiKND'),
            kv(61, 'Thời gian vào Đảng chính thức', 'tgChinhThuc'),
            kv(62, 'Nơi vào Đảng chính thức', 'noiChinhThuc'),
            kv(63, 'Người giới thiệu', 'nguoiGioiThieu'),
            kv(64, 'Chức vụ đảng người giới thiệu', 'cvDangGioiThieu'),
            kv(65, 'Thời gian vào Đoàn', 'tgVaoDoan'),
            kv(66, 'Nơi vào Đoàn', 'noiVaoDoan'),
            kv(67, 'Chức vụ Đoàn', 'cvDoan'),
          ],
        },
      },
      {
        heading: 'VIII. CHỨC DANH CHUYÊN MÔN KỸ THUẬT NGHIỆP VỤ (CMKTNV)',
        kvTable: {
          columns: KV_COLS,
          rows: [
            kv(68, 'Chức danh CMKTNV', 'chucDanhCMKTNV'),
            kv(69, 'Thời gian nhận CMKTNV', 'tgCMKTNV'),
          ],
        },
      },
      {
        heading: 'IX. SỞ TRƯỜNG - CÔNG TÁC',
        kvTable: {
          columns: KV_COLS,
          rows: [
            kv(70, 'Sở trường công tác', 'soTruongCT'),
            kv(71, 'Sở trường cá nhân', 'soTruongCN'),
            kv(72, 'Sở thích cá nhân', 'soThichCN'),
            kv(73, 'Công tác chính đang làm', 'congTacChinh'),
            kv(74, 'Công việc đã làm lâu nhất', 'congViecLauNhat'),
            kv(75, 'Ngành đang công tác', 'nganhCongTac'),
            kv(76, 'Loại cán bộ', 'loaiCanBo'),
            kv(77, 'Nguồn vào đội ngũ', 'nguonVao'),
            kv(78, 'Đúng vị trí công tác', 'dungViTri'),
            kv(79, 'Tình trạng hôn nhân', 'honNhan'),
            kv(80, 'Số điện thoại', 'dienThoai'),
            kv(81, 'Lý do tăng quân số', 'lyDoTangQS'),
            kv(82, 'Thời gian tăng quân số', 'tgTangQS'),
          ],
        },
      },
      {
        heading: 'X. QUÁ TRÌNH CHIẾN ĐẤU (83)',
        loop: {
          key: 'combat_list',
          columns: [
            TT_COL,
            { header: 'Thời gian', field: 'thoiGian', weight: 2, align: 'center' },
            { header: 'Chiến trường / mặt trận', field: 'matTran', weight: 3 },
            { header: 'Đơn vị', field: 'donVi', weight: 2 },
            { header: 'Cương vị', field: 'vaiTro', weight: 2 },
          ],
        },
      },
      {
        heading: 'XI. NGOẠI NGỮ (84)',
        loop: {
          key: 'ngoaiNgu_list',
          columns: [
            TT_COL,
            { header: 'Ngày', field: 'ngay', weight: 1.5, align: 'center' },
            { header: 'Tiếng', field: 'tiengNgu', weight: 2 },
            { header: 'Trình độ', field: 'trinhDo', weight: 2 },
            { header: 'Văn bằng/chứng nhận', field: 'vanBang', weight: 3 },
          ],
        },
      },
      {
        heading: 'Tiếng dân tộc (85)',
        loop: {
          key: 'ethnicLang_list',
          columns: [
            TT_COL,
            { header: 'Tiếng dân tộc', field: 'tiengDanToc', weight: 3 },
            { header: 'Mức độ', field: 'mucDo', weight: 3 },
          ],
        },
      },
      {
        heading: 'XII. KHEN THƯỞNG (86)',
        loop: {
          key: 'khenThuong_list',
          columns: [
            TT_COL,
            { header: 'Năm', field: 'nam', weight: 1, align: 'center' },
            { header: 'Hình thức / nội dung', field: 'hinhThuc', weight: 4 },
            { header: 'Cấp khen', field: 'capKhen', weight: 2 },
            { header: 'Số quyết định', field: 'soQD', weight: 2 },
          ],
        },
      },
      {
        heading: 'Kỷ luật (87)',
        loop: {
          key: 'kyLuat_list',
          columns: [
            TT_COL,
            { header: 'Năm', field: 'nam', weight: 1, align: 'center' },
            { header: 'Hình thức', field: 'hinhThuc', weight: 3 },
            { header: 'Lý do', field: 'lyDo', weight: 3 },
            { header: 'Số quyết định', field: 'soQD', weight: 2 },
          ],
        },
      },
      {
        heading: 'XIII. TÀI SẢN (88)',
        loop: {
          key: 'asset_list',
          columns: [
            TT_COL,
            { header: 'Ngày', field: 'ngay', weight: 1.5, align: 'center' },
            { header: 'Loại', field: 'loai', weight: 1.5 },
            { header: 'Tên tài sản', field: 'tenTaiSan', weight: 3 },
            { header: 'Diện tích', field: 'dienTich', weight: 1.5 },
            { header: 'Giá trị', field: 'giaTri', weight: 1.5, align: 'right' },
            { header: 'Giấy tờ', field: 'giayTo', weight: 2 },
          ],
        },
      },
      {
        heading: 'XIV. QUAN HỆ GIA ĐÌNH (89)',
        loop: {
          key: 'giaDinh_list',
          columns: [
            TT_COL,
            { header: 'Quan hệ', field: 'quanHe', weight: 1.6 },
            { header: 'Họ tên', field: 'hoTen', weight: 2.4 },
            { header: 'Năm sinh', field: 'namSinh', weight: 1, align: 'center' },
            { header: 'Quê quán (cũ)', field: 'queQuanCu', weight: 2.4 },
            { header: 'Thường trú (mới)', field: 'thuongTruMoi', weight: 2.4 },
            { header: 'Nghề nghiệp', field: 'ngheNghiep', weight: 2 },
            { header: 'ĐV', field: 'dangVien', weight: 0.7, align: 'center' },
            { header: 'CV Đảng', field: 'chucVuDang', weight: 1.4 },
            { header: 'CBCC', field: 'canBoCaoCap', weight: 0.8, align: 'center' },
          ],
        },
      },
      {
        heading: 'XV. ĐI NƯỚC NGOÀI (90)',
        loop: {
          key: 'foreignTrip_list',
          columns: [
            TT_COL,
            { header: 'Từ ngày', field: 'tuNgay', weight: 1.5, align: 'center' },
            { header: 'Đến ngày', field: 'denNgay', weight: 1.5, align: 'center' },
            { header: 'Nước', field: 'nuoc', weight: 2 },
            { header: 'Mục đích', field: 'mucDich', weight: 3 },
            { header: 'Kinh phí', field: 'kinhPhi', weight: 2 },
          ],
        },
      },
      {
        heading: 'XVI. DANH HIỆU (91)',
        loop: {
          key: 'honor_list',
          columns: [
            TT_COL,
            { header: 'Năm', field: 'nam', weight: 1, align: 'center' },
            { header: 'Danh hiệu', field: 'danhHieu', weight: 4 },
            { header: 'Cấp', field: 'cap', weight: 2 },
            { header: 'Số quyết định', field: 'soQD', weight: 2 },
          ],
        },
      },
      {
        heading: 'XVII. HOẠT ĐỘNG KHOA HỌC (92)',
        loop: {
          key: 'khoaHoc_list',
          columns: [
            TT_COL,
            { header: 'Năm', field: 'nam', weight: 1, align: 'center' },
            { header: 'Tên đề tài / sáng kiến / giáo trình', field: 'ten', weight: 5 },
            { header: 'Cấp', field: 'cap', weight: 2 },
            { header: 'Vai trò', field: 'vaiTro', weight: 2 },
          ],
        },
      },
      {
        heading: 'Hoạt động viết báo (93)',
        loop: {
          key: 'baiBao_list',
          columns: [
            TT_COL,
            { header: 'Thời gian', field: 'thoiGian', weight: 1.5, align: 'center' },
            { header: 'Tên bài báo', field: 'tenBai', weight: 4 },
            { header: 'Tạp chí', field: 'tapChi', weight: 2.5 },
            { header: 'Số / trang', field: 'soTrang', weight: 2 },
          ],
        },
      },
      {
        heading: 'XVIII. KHÁM CHỮA BỆNH (94)',
        loop: {
          key: 'medical_list',
          columns: [
            TT_COL,
            { header: 'Thời gian', field: 'thoiGian', weight: 1.5, align: 'center' },
            { header: 'Nơi khám', field: 'noi', weight: 2.5 },
            { header: 'Nội dung', field: 'noiDung', weight: 3 },
            { header: 'Kết luận', field: 'ketLuan', weight: 3 },
          ],
        },
      },
      {
        heading: 'XIX. XẾP LOẠI ĐÁNH GIÁ CÁN BỘ THEO QUÝ/NĂM (95)',
        loop: {
          key: 'evaluation_list',
          columns: [
            TT_COL,
            { header: 'Kỳ đánh giá', field: 'ky', weight: 2, align: 'center' },
            { header: 'Kết quả phân loại', field: 'ketQua', weight: 4 },
            { header: 'Xếp loại đảng viên', field: 'xepLoaiDV', weight: 3 },
          ],
        },
      },
      {
        heading: 'XX. PHỤ CẤP (96)',
        loop: {
          key: 'allowance_list',
          columns: [
            TT_COL,
            { header: 'Từ - đến', field: 'tuDen', weight: 2.5, align: 'center' },
            { header: 'Hệ số', field: 'heSo', weight: 1, align: 'center' },
            { header: 'Lý do', field: 'lyDo', weight: 3.5 },
            { header: 'Số quyết định', field: 'soQD', weight: 2 },
          ],
        },
      },
      {
        heading: 'XXI. CHỨC VỤ ĐOÀN (97)',
        loop: {
          key: 'doanHistory_list',
          columns: [
            TT_COL,
            { header: 'Thời gian', field: 'thoiGian', weight: 2, align: 'center' },
            { header: 'Chức vụ', field: 'chucVu', weight: 4 },
            { header: 'Đơn vị', field: 'donVi', weight: 3 },
          ],
        },
      },
      {
        heading: 'Chức vụ Đảng (98)',
        loop: {
          key: 'dangHistory_list',
          columns: [
            TT_COL,
            { header: 'Thời gian', field: 'thoiGian', weight: 2, align: 'center' },
            { header: 'Chức vụ', field: 'chucVu', weight: 4 },
            { header: 'Tổ chức', field: 'toChuc', weight: 3 },
          ],
        },
      },
      {
        heading: 'Chức vụ ngoài Quân đội (99)',
        loop: {
          key: 'externalPos_list',
          columns: [
            TT_COL,
            { header: 'Thời gian', field: 'thoiGian', weight: 2, align: 'center' },
            { header: 'Chức vụ', field: 'chucVu', weight: 4 },
            { header: 'Tổ chức', field: 'toChuc', weight: 3 },
          ],
        },
      },
    ],
    signatures: [
      { chucVu: ['KT. VIỆN TRƯỞNG', 'PHÓ VIỆN TRƯỞNG'], kyGhiChu: '(Ký, đóng dấu)', hoTen: '{hoTenNguoiKy}' },
      { chucVu: ['NGƯỜI BỔ SUNG'], kyGhiChu: '(Ký, ghi rõ họ tên)', hoTen: '{nguoiBoSung}' },
    ],
    luuBoPhan: 'PCB',
    placeholders: [
      ...HEADER_PH,
      '{nguoiBoSung}',
      // Nhóm scalar
      '{hoTen}', '{tenKhac}', '{gioiTinh}', '{doiTuongQL}', '{ngaySinh}', '{maDinhDanh}', '{soCCCD}', '{danToc}', '{tonGiao}',
      '{capBac}', '{tgNhanCap}', '{nangLuongLan}', '{tgNangLuong}', '{heSoLuong}', '{mucLuong}', '{chucVu}', '{tgNhanChuc}', '{heSoPCCV}',
      '{noiSinhMoi}', '{noiSinhCu}', '{queQuanMoi}', '{queQuanCu}', '{thuongTruMoi}', '{noiOHienNay}',
      '{thanhPhanGD}', '{thanhPhanBanThan}', '{nhanDang}', '{sucKhoe}', '{chieuCao}', '{canNang}', '{nhomMau}', '{benhChinh}', '{thuongTat}', '{chiTietThuongTat}', '{giaDinhTBLS}',
      '{hocHam}', '{tgHocHam}', '{hocVi}', '{tgHocVi}', '{trinhDoCHQL}', '{tgCHQL}', '{trinhDoLLCT}', '{tgLLCT}', '{nganhDaoTao}', '{capDoDaoTao}', '{trinhDoVanHoa}',
      '{thamGiaCM}', '{tgTuyenDung}', '{dvTuyenDung}', '{tgNhapNgu}', '{dvNhapNgu}', '{tgXuatNgu}', '{dvXuatNgu}', '{tgTaiNgu}', '{dvTaiNgu}',
      '{tgKND}', '{noiKND}', '{tgChinhThuc}', '{noiChinhThuc}', '{nguoiGioiThieu}', '{cvDangGioiThieu}', '{tgVaoDoan}', '{noiVaoDoan}', '{cvDoan}',
      '{chucDanhCMKTNV}', '{tgCMKTNV}',
      '{soTruongCT}', '{soTruongCN}', '{soThichCN}', '{congTacChinh}', '{congViecLauNhat}', '{nganhCongTac}', '{loaiCanBo}', '{nguonVao}', '{dungViTri}', '{honNhan}', '{dienThoai}', '{lyDoTangQS}', '{tgTangQS}',
      // Vòng lặp danh sách
      '{#concurrentPos_list}', '{#combat_list}', '{#ngoaiNgu_list}', '{#ethnicLang_list}',
      '{#khenThuong_list}', '{#kyLuat_list}', '{#asset_list}', '{#giaDinh_list}',
      '{#foreignTrip_list}', '{#honor_list}', '{#khoaHoc_list}', '{#baiBao_list}',
      '{#medical_list}', '{#evaluation_list}', '{#allowance_list}',
      '{#doanHistory_list}', '{#dangHistory_list}', '{#externalPos_list}',
    ],
  },
];
