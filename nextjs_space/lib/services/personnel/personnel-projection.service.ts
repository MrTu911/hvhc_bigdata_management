/**
 * Chiếu (projection) trường mô tả nhân thân từ patch của `User` sang `Personnel` (master).
 *
 * Dùng CHUNG ở mọi nơi ghi hồ sơ cá nhân để CSDL chính (lãnh đạo đọc theo Personnel)
 * luôn liên thông với thay đổi của cá nhân:
 *   - ProfileChangeRequest.commitRequest (luồng duyệt 2 cấp)
 *   - PUT /api/profile/me (sửa trực tiếp trường mô tả an toàn)
 *
 * Chỉ chiếu các trường khai báo trong USER_TO_PERSONNEL_FIELD_MAP. Không đụng tới các
 * trường quyết định chỉ huy (cấp bậc/đơn vị/chức vụ) — xem lib/constants/personnel-field-map.ts.
 */
import 'server-only';
import type { Prisma } from '@prisma/client';
import { USER_TO_PERSONNEL_FIELD_MAP } from '@/lib/constants/personnel-field-map';

/**
 * Áp các trường (đã coerce) của `User` sang bản ghi `Personnel` tương ứng.
 *
 * @param tx          Prisma client hoặc transaction client (cùng interface delegate).
 * @param personnelId Id bản ghi Personnel của cán bộ; null nếu account chưa gắn Personnel.
 * @param userPatch   Patch keyed theo tên cột `User` (vd { birthPlace, dateOfBirth }).
 * @returns Số trường đã chiếu (0 nếu không có gì để đồng bộ hoặc thiếu personnelId).
 */
export async function projectUserPatchToPersonnel(
  tx: Prisma.TransactionClient,
  personnelId: string | null,
  userPatch: Record<string, unknown>,
): Promise<number> {
  if (!personnelId) return 0;

  const personnelPatch: Record<string, unknown> = {};
  for (const [userKey, personnelKey] of Object.entries(USER_TO_PERSONNEL_FIELD_MAP)) {
    if (Object.prototype.hasOwnProperty.call(userPatch, userKey)) {
      personnelPatch[personnelKey] = userPatch[userKey];
    }
  }

  const projectedCount = Object.keys(personnelPatch).length;
  if (projectedCount === 0) return 0;

  await tx.personnel.update({
    where: { id: personnelId },
    data: personnelPatch as Prisma.PersonnelUpdateInput,
  });
  return projectedCount;
}
