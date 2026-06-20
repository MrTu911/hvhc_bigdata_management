/**
 * Personnel Classification Service — M02
 *
 * Phân loại cán bộ thành SĨ QUAN (OFFICER) / QUÂN NHÂN (SOLDIER) / DÂN SỰ (CIVILIAN).
 *
 * Nguồn sự thật: quan hệ thật trên Personnel liên kết (qua User.personnelId):
 *   - có `officerCareer`  → OFFICER
 *   - có `soldierProfile` → SOLDIER
 *
 * Keyword trên `User.rank` chỉ là FALLBACK cho các User chưa liên kết Personnel
 * (dual-read trong giai đoạn chuyển tiếp). Sĩ quan được ưu tiên: ai đã tính là sĩ
 * quan thì không tính lại là quân nhân, để filter/đếm luôn rời nhau (disjoint).
 */
import type { Prisma } from '@prisma/client';

export type PersonnelTypeClass = 'OFFICER' | 'SOLDIER' | 'CIVILIAN';

// Legacy fallback: phân loại theo từ khóa quân hàm khi User chưa liên kết
// Personnel/officerCareer/soldierProfile. Gỡ dần sau khi backfill liên thông xong.
const OFFICER_RANK_KEYWORDS = ['tướng', 'tá', 'úy'];
const SOLDIER_RANK_KEYWORDS = ['sĩ', 'binh'];

function officerRankKeywordCond(): Prisma.UserWhereInput {
  return { OR: OFFICER_RANK_KEYWORDS.map((k) => ({ rank: { contains: k, mode: 'insensitive' as const } })) };
}

function soldierRankKeywordCond(): Prisma.UserWhereInput {
  return { OR: SOLDIER_RANK_KEYWORDS.map((k) => ({ rank: { contains: k, mode: 'insensitive' as const } })) };
}

/** Khớp sĩ quan: có officerCareer (ưu tiên) HOẶC quân hàm khớp từ khóa sĩ quan. */
function officerMatchCondition(): Prisma.UserWhereInput {
  return {
    OR: [
      { personnelProfile: { officerCareer: { isNot: null } } },
      officerRankKeywordCond(),
    ],
  };
}

/** Khớp quân nhân: có soldierProfile HOẶC quân hàm khớp từ khóa quân nhân. */
function soldierMatchCondition(): Prisma.UserWhereInput {
  return {
    OR: [
      { personnelProfile: { soldierProfile: { isNot: null } } },
      soldierRankKeywordCond(),
    ],
  };
}

/** Điều kiện lọc danh sách SĨ QUAN (dùng cho filter `type=OFFICER` và đếm typeStats). */
export function buildOfficerWhereCondition(): Prisma.UserWhereInput {
  return officerMatchCondition();
}

/**
 * Điều kiện lọc danh sách QUÂN NHÂN. Loại trừ sĩ quan để filter/đếm rời nhau,
 * khớp đúng thứ tự ưu tiên của classifyPersonnelType (officer thắng soldier).
 */
export function buildSoldierWhereCondition(): Prisma.UserWhereInput {
  return { AND: [soldierMatchCondition(), { NOT: officerMatchCondition() }] };
}

/** Hình dạng tối thiểu cần để phân loại từng dòng (relation thắng keyword). */
export interface ClassifiableUser {
  rank?: string | null;
  personnelProfile?: {
    officerCareer?: { id: string } | null;
    soldierProfile?: { id: string } | null;
  } | null;
}

/** Phân loại một bản ghi: officerCareer > soldierProfile > keyword sĩ quan > keyword quân nhân. */
export function classifyPersonnelType(user: ClassifiableUser): PersonnelTypeClass {
  if (user.personnelProfile?.officerCareer) return 'OFFICER';
  if (user.personnelProfile?.soldierProfile) return 'SOLDIER';

  const rank = (user.rank ?? '').toLowerCase();
  if (OFFICER_RANK_KEYWORDS.some((k) => rank.includes(k))) return 'OFFICER';
  if (SOLDIER_RANK_KEYWORDS.some((k) => rank.includes(k))) return 'SOLDIER';
  return 'CIVILIAN';
}
