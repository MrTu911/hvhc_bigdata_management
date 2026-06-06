/**
 * Kiểu dữ liệu mô tả mẫu văn bản hành chính (Nghị định 30/2020/NĐ-CP).
 *
 * Một TemplateSpec mô tả đầy đủ thể thức của một văn bản; từ spec này:
 *   - docx-builder.ts  sinh file .docx (có tag docxtemplater) để xuất DOCX.
 *   - html-builder.ts  sinh file .html (cùng quy ước placeholder) để xuất PDF/HTML.
 *   - seed_admin_doc_templates.ts upload 2 file lên MinIO và upsert ReportTemplate.
 *
 * Quy ước placeholder dùng CHUNG cho cả DOCX và HTML:
 *   - Scalar:   {fieldName}
 *   - Vòng lặp: {#listKey}...{fieldOfItem}...{/listKey}
 */

export type DocType = 'BC' | 'CV' | 'KH' | 'TTr' | 'QD' | 'TB';

export type EntityBinding =
  | 'personnel'
  | 'student'
  | 'party_member'
  | 'faculty'
  | 'scientific_council'
  | 'scientist_profile'
  | null;

export type TemplateCategory =
  | 'NHAN_SU'
  | 'DANG_VIEN'
  | 'BAO_HIEM'
  | 'CHE_DO'
  | 'KHEN_THUONG'
  | 'DAO_TAO'
  | 'NCKH'
  | 'TONG_HOP';

/** Một cột trong bảng dữ liệu lặp (entity-bound). */
export interface LoopColumn {
  header: string;
  /** Tên field của từng item trong mảng, vd 'tuNgay'. */
  field: string;
  /** Trọng số độ rộng cột (tỉ lệ). Mặc định 1. */
  weight?: number;
  /** Căn lề nội dung cột. Mặc định 'left' ('center' cho STT). */
  align?: 'left' | 'center' | 'right';
}

/** Bảng dữ liệu lặp theo một mảng trong resolved data. */
export interface LoopTable {
  /** Tên mảng trong resolved data, vd 'congTac_list'. */
  key: string;
  columns: LoopColumn[];
}

/** Một mục nội dung trong phần thân văn bản. */
export interface BodySection {
  /** Tiêu đề mục (in đậm), vd 'Phần I. KẾT QUẢ THỰC HIỆN' hoặc 'Điều 1.'. */
  heading?: string;
  /** Các đoạn văn (có thể chứa {tag} hoặc dòng chấm điền tay). */
  paragraphs?: string[];
  /** Bảng dữ liệu lặp (chỉ dùng cho mẫu entity-bound). */
  loop?: LoopTable;
}

export interface TemplateSpec {
  code: string;
  name: string;
  description: string;
  docType: DocType;
  category: TemplateCategory;
  module: string;
  moduleSource: string[];
  /** Thực thể gắn dữ liệu; null = mẫu skeleton (form trắng điền tay). */
  entity: EntityBinding;
  classification: 'INTERNAL' | 'CONFIDENTIAL';
  /** Mã quyền export (EXPORT_DATA cho đơn lẻ, EXPORT_BATCH cho danh sách). */
  rbacCode: string;

  /**
   * Ghi đè tên cơ quan ở header (literal). Mặc định dùng tag {tenCoQuanCapTren}
   * / {tenCoQuanBanHanh} (lấy từ buildHeaderContext = học viện). Dùng cho văn bản
   * Đảng (M03) cần hiển thị "ĐẢNG BỘ ... / ĐẢNG ỦY ...".
   */
  headerCapTren?: string;
  headerBanHanh?: string;

  /** Phần ký hiệu sau số, vd 'BC-HVHC-BKHHCQS'. */
  kyHieu: string;
  /** Trích yếu / nội dung "V/v" (với Công văn). */
  trichYeu: string;
  /** Ghi đè tên loại văn bản ở giữa trang (vd 'BIÊN BẢN'); mặc định theo docType. */
  titleOverride?: string;
  /** Có dòng "Kính gửi:" (Công văn, Tờ trình). */
  kinhGui?: string;

  /** Quyết định: chức danh người ban hành, vd 'GIÁM ĐỐC HỌC VIỆN HẬU CẦN'. */
  banHanhChucDanh?: string;
  /** Quyết định: danh sách "Căn cứ ...". */
  canCu?: string[];
  /** Quyết định: dòng "Theo đề nghị của ...". Mặc định cơ quan chức năng. */
  theoDeNghi?: string;

  body: BodySection[];

  /** Khối ký: các dòng chức vụ (in đậm). Mặc định ['GIÁM ĐỐC']. */
  chuKyChucVu?: string[];
  /** Nơi nhận (mỗi phần tử một dòng). Tự thêm dòng "- Lưu: VT, ...". */
  noiNhan?: string[];
  /** Bộ phận lưu. Mặc định 'BKHHCQS'. */
  luuBoPhan?: string;

  /** Danh sách placeholder để lưu vào ReportTemplate.placeholders. */
  placeholders: string[];
  /** Ánh xạ bổ sung (đa số rỗng — template dùng trực tiếp tên field resolved). */
  dataMap?: Record<string, unknown>;
}

/** Tiêu đề loại văn bản hiển thị ở giữa trang (null = Công văn, không in tên loại). */
export const DOC_TYPE_META: Record<DocType, { title: string | null; label: string }> = {
  BC: { title: 'BÁO CÁO', label: 'Báo cáo' },
  CV: { title: null, label: 'Công văn' },
  KH: { title: 'KẾ HOẠCH', label: 'Kế hoạch' },
  TTr: { title: 'TỜ TRÌNH', label: 'Tờ trình' },
  QD: { title: 'QUYẾT ĐỊNH', label: 'Quyết định' },
  TB: { title: 'THÔNG BÁO', label: 'Thông báo' },
};
