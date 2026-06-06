/** Hằng số & helper dùng chung cho các file spec mẫu văn bản hành chính. */

/** Dòng chấm điền tay. */
export const DOTS = '............................................................';

/** Header placeholder do buildHeaderContext cung cấp (văn bản nhà nước của Học viện). */
export const HEADER_PH = [
  '{tenCoQuanCapTren}',
  '{tenCoQuanBanHanh}',
  '{quocHieu}',
  '{tieuNgu}',
  '{soVanBan}',
  '{diaDanhNgayThang}',
  '{hoTenNguoiKy}',
];

/** Header placeholder cho văn bản Đảng (cơ quan ghi đè literal, không dùng tag). */
export const PARTY_PH = ['{quocHieu}', '{tieuNgu}', '{soVanBan}', '{diaDanhNgayThang}', '{hoTenNguoiKy}'];

/** Header ghi đè cho văn bản Đảng. */
export const DU_HEADER = {
  headerCapTren: 'ĐẢNG BỘ QUÂN ĐỘI',
  headerBanHanh: 'ĐẢNG ỦY HỌC VIỆN HẬU CẦN',
};
export const CB_HEADER = {
  headerCapTren: 'ĐẢNG ỦY HỌC VIỆN HẬU CẦN',
  headerBanHanh: 'CHI BỘ ............',
};

/** Căn cứ pháp lý mặc định cho Quyết định hành chính của Học viện. */
export const QD_CAN_CU_HVHC = [
  'Quyết định quy định chức năng, nhiệm vụ, quyền hạn và cơ cấu tổ chức của Học viện Hậu cần',
  'Quy chế làm việc của Học viện Hậu cần',
];
