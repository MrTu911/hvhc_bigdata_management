/**
 * Unit Membership Service (M01/M02) — nguồn sự thật đơn vị là Personnel.
 *
 * Một người có thể tồn tại ở 3 nơi với cùng khái niệm "đơn vị":
 *   - `Personnel.unitId`        : M02 master — NGUỒN CHUẨN (badge "số cán bộ" đếm theo đây)
 *   - `User.unitId`             : tài khoản đăng nhập (RBAC scope) — projection
 *   - `FacultyProfile.unitId`   : hồ sơ giảng viên — projection
 *
 * Service này là điểm DUY NHẤT để gán/gỡ đơn vị, đảm bảo cả 3 cột luôn đồng bộ trong cùng
 * transaction. Dùng cho cả gán theo User (trang quản lý đơn vị) lẫn gán theo Personnel
 * (trang gán cán bộ, kể cả cán bộ chưa có tài khoản).
 *
 * Liên kết: `User.personnelId` (@unique), `FacultyProfile.userId`/`FacultyProfile.personnelId`
 * (đều @unique).
 */
import type { Prisma } from '@prisma/client';

export interface UnitMembershipResult {
  usersUpdated: number;
  personnelUpdated: number;
  facultyUpdated: number;
}

interface ProjectUnitMembershipArgs {
  /** ID tài khoản User cần gán (nếu xuất phát từ trang gán theo tài khoản). */
  userIds?: string[];
  /** ID hồ sơ Personnel cần gán (nếu xuất phát từ trang gán theo cán bộ). */
  personnelIds?: string[];
  /** Đơn vị đích; `null` = gỡ khỏi đơn vị. */
  unitId: string | null;
}

/**
 * Gán/gỡ đơn vị cho một tập User và/hoặc Personnel, đồng bộ cả 3 cột unitId.
 * Mở rộng tập: User → Personnel liên kết, Personnel → User liên kết, rồi ghi cả nhóm.
 * Bỏ qua entity không tồn tại/không có liên kết (không ném lỗi).
 *
 * @param tx Prisma transaction client (caller bọc `$transaction`).
 */
export async function projectUnitMembership(
  tx: Prisma.TransactionClient,
  { userIds = [], personnelIds = [], unitId }: ProjectUnitMembershipArgs
): Promise<UnitMembershipResult> {
  const userIdSet = new Set(userIds);
  const personnelIdSet = new Set(personnelIds);

  // User → personnelId liên kết
  if (userIdSet.size > 0) {
    const linked = await tx.user.findMany({
      where: { id: { in: [...userIdSet] }, personnelId: { not: null } },
      select: { personnelId: true },
    });
    for (const u of linked) if (u.personnelId) personnelIdSet.add(u.personnelId);
  }

  // Personnel → userId liên kết (cán bộ có tài khoản)
  if (personnelIdSet.size > 0) {
    const accounts = await tx.user.findMany({
      where: { personnelId: { in: [...personnelIdSet] } },
      select: { id: true },
    });
    for (const a of accounts) userIdSet.add(a.id);
  }

  const finalUserIds = [...userIdSet];
  const finalPersonnelIds = [...personnelIdSet];

  // Ghi Personnel (nguồn chuẩn) trước, rồi chiếu sang User + FacultyProfile.
  const personnelRes =
    finalPersonnelIds.length > 0
      ? await tx.personnel.updateMany({
          where: { id: { in: finalPersonnelIds } },
          data: { unitId },
        })
      : { count: 0 };

  const userRes =
    finalUserIds.length > 0
      ? await tx.user.updateMany({
          where: { id: { in: finalUserIds } },
          data: { unitId },
        })
      : { count: 0 };

  const facultyRes =
    finalUserIds.length > 0 || finalPersonnelIds.length > 0
      ? await tx.facultyProfile.updateMany({
          where: {
            OR: [
              ...(finalUserIds.length ? [{ userId: { in: finalUserIds } }] : []),
              ...(finalPersonnelIds.length ? [{ personnelId: { in: finalPersonnelIds } }] : []),
            ],
          },
          data: { unitId },
        })
      : { count: 0 };

  return {
    usersUpdated: userRes.count,
    personnelUpdated: personnelRes.count,
    facultyUpdated: facultyRes.count,
  };
}
