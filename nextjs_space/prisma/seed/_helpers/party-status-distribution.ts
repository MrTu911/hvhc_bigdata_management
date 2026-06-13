/**
 * Helper dùng chung cho seed + backfill PartyMember status.
 *
 * Mục tiêu: gán trạng thái đảng viên nhất quán với vòng đời nghiệp vụ và
 * đồng bộ joinDate/officialDate, để mọi bộ lọc trên trang Hồ sơ Đảng viên
 * đều có dữ liệu.
 *
 * Vòng đời (giải thích quy tắc 4 giai đoạn chính):
 *  - CAM_TINH   : cảm tình — chưa vào Đảng, chưa học lớp cảm tình  → chưa có ngày kết nạp
 *  - DOI_TUONG  : đối tượng — đã học lớp cảm tình, chưa kết nạp     → chưa có ngày kết nạp
 *  - DU_BI      : dự bị — đã kết nạp, đang thử thách ~1 năm         → joinDate < now, officialDate > now
 *  - CHINH_THUC : chính thức — qua 1 năm thử thách, được công nhận  → officialDate <= now
 * Bổ sung cho đủ tab:
 *  - QUAN_CHUNG : quần chúng ưu tú (số ít)                          → chưa có ngày kết nạp
 *  - KHAI_TRU   : nguyên đảng viên bị khai trừ (số ít)             → ngày quá khứ
 *
 * Hàm thuần (pure), deterministic theo `bucket` để chạy lại cho cùng kết quả.
 */

import type { PartyMemberStatus, PartyPosition } from '@prisma/client';

// Chức vụ cấp ủy: bắt buộc là đảng viên CHÍNH THỨC (không thể giữ chức khi mới dự bị).
const LEADERSHIP_POSITIONS: PartyPosition[] = [
  'BI_THU',
  'PHO_BI_THU',
  'CAP_UY_VIEN',
  'BI_THU_CHI_BO',
  'PHO_BI_THU_CHI_BO',
  'TO_TRUONG_TO_DANG',
  'TO_PHO_TO_DANG',
];

export function isLeadershipPosition(position: PartyPosition | null | undefined): boolean {
  return !!position && LEADERSHIP_POSITIONS.includes(position);
}

/**
 * Hash ổn định id → bucket 0..99 (FNV-1a 32-bit).
 * Dùng để phân bổ trạng thái deterministic, idempotent giữa các lần chạy.
 */
export function bucketFromId(id: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return Math.abs(hash) % 100;
}

// ---------------------------------------------------------------------------
// Phân bố mục tiêu cho nhóm DANG_VIEN (đa số vẫn Chính thức, sát thực tế).
// Tổng = 100. Mọi tab đều có dữ liệu.
//   CHINH_THUC ~63% · DU_BI ~18% · DOI_TUONG ~8% · CAM_TINH ~6% · QUAN_CHUNG ~2% · KHAI_TRU ~3%
// ---------------------------------------------------------------------------
function statusFromBucket(bucket: number): PartyMemberStatus {
  if (bucket <= 62) return 'CHINH_THUC';
  if (bucket <= 80) return 'DU_BI';
  if (bucket <= 88) return 'DOI_TUONG';
  if (bucket <= 94) return 'CAM_TINH';
  if (bucket <= 96) return 'QUAN_CHUNG';
  return 'KHAI_TRU';
}

function addOneYear(d: Date): Date {
  return new Date(d.getFullYear() + 1, d.getMonth(), d.getDate());
}

function yearsAgo(now: Date, years: number, dayOffset: number): Date {
  return new Date(now.getFullYear() - years, dayOffset % 12, 1 + (dayOffset % 27));
}

function monthsAgo(now: Date, months: number): Date {
  const d = new Date(now);
  d.setMonth(d.getMonth() - months);
  return d;
}

function isPast(d: Date, now: Date): boolean {
  return d.getTime() <= now.getTime();
}

/** Ngày cho đảng viên chính thức: ưu tiên giữ joinDate quá khứ sẵn có (officialDate phải đã qua). */
function chinhThucDates(now: Date, bucket: number, existingJoinDate?: Date | null) {
  if (existingJoinDate && isPast(addOneYear(existingJoinDate), now)) {
    return { joinDate: existingJoinDate, officialDate: addOneYear(existingJoinDate) };
  }
  const joinDate = yearsAgo(now, 2 + (bucket % 13), bucket);
  return { joinDate, officialDate: addOneYear(joinDate) };
}

export interface PartyStageAssignment {
  status: PartyMemberStatus;
  joinDate: Date | null;
  officialDate: Date | null;
}

export interface AssignPartyStageOptions {
  /** Ngày kết nạp sẵn có (seed: user.partyJoinDate; backfill: PartyMember.joinDate). */
  existingJoinDate?: Date | null;
  /**
   * true (seed): nếu có ngày kết nạp thật → suy CHINH_THUC/DU_BI theo thử thách 1 năm.
   * false (backfill): bỏ qua phân loại theo ngày (ngày hiện tại là synthetic, all-ACTIVE)
   *                   để tạo đủ độ đa dạng theo bucket.
   */
  classifyFromExistingDate?: boolean;
}

/**
 * Quyết định trạng thái + ngày tháng nhất quán cho 1 đảng viên.
 */
export function assignPartyStage(
  position: PartyPosition | null | undefined,
  bucket: number,
  now: Date,
  opts: AssignPartyStageOptions = {},
): PartyStageAssignment {
  const { existingJoinDate, classifyFromExistingDate = false } = opts;

  // 1) Cấp ủy → luôn CHÍNH THỨC, ngày quá khứ.
  if (isLeadershipPosition(position)) {
    return { status: 'CHINH_THUC', ...chinhThucDates(now, bucket, existingJoinDate) };
  }

  // 2) (Seed) Có ngày kết nạp thật → suy chính thức/dự bị theo mốc 1 năm thử thách.
  if (classifyFromExistingDate && existingJoinDate) {
    const officialDate = addOneYear(existingJoinDate);
    const status: PartyMemberStatus = isPast(officialDate, now) ? 'CHINH_THUC' : 'DU_BI';
    return { status, joinDate: existingJoinDate, officialDate };
  }

  // 3) Đảng viên thường (dữ liệu seed/synthetic) → rải theo bucket cho đủ tab.
  const status = statusFromBucket(bucket);
  switch (status) {
    case 'CHINH_THUC':
      return { status, ...chinhThucDates(now, bucket, existingJoinDate) };
    case 'DU_BI': {
      // Mới kết nạp trong vòng ~1 năm → officialDate ở tương lai (đang thử thách).
      const joinDate = monthsAgo(now, 1 + (bucket % 11));
      return { status, joinDate, officialDate: addOneYear(joinDate) };
    }
    case 'KHAI_TRU': {
      const joinDate = yearsAgo(now, 3 + (bucket % 10), bucket);
      return { status, joinDate, officialDate: addOneYear(joinDate) };
    }
    default:
      // CAM_TINH, DOI_TUONG, QUAN_CHUNG: chưa kết nạp → không có ngày vào Đảng.
      return { status, joinDate: null, officialDate: null };
  }
}

export const PARTY_BACKFILL_REASON = 'Backfill demo: chuẩn hoá trạng thái từ giá trị legacy ACTIVE';
export const PARTY_EXPELLED_REASON = 'Khai trừ khỏi Đảng theo quyết định kỷ luật (dữ liệu mô phỏng)';

/** Lý do thay đổi trạng thái tương ứng (ghi vào statusChangeReason để truy vết/rollback). */
export function reasonForStatus(status: PartyMemberStatus): string {
  return status === 'KHAI_TRU' ? PARTY_EXPELLED_REASON : PARTY_BACKFILL_REASON;
}
