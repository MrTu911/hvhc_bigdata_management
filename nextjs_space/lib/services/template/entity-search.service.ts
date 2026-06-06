/**
 * Entity Search Service – M18
 * Tìm kiếm đối tượng đích để preview/export template (cán bộ, học viên, đảng viên...).
 *
 * Trả về danh sách option đã chuẩn hóa { id, label, sublabel } để combobox dùng chung.
 * `id` luôn là id nội bộ (cuid) — data-resolver chấp nhận cả id lẫn mã nghiệp vụ,
 * nhưng picker gửi id để tránh nhập nhằng.
 */

import prisma from '@/lib/db';
import { EntityType } from '@/lib/services/data-resolver-service';

export interface ExportEntityOption {
  id: string;
  label: string;
  sublabel?: string;
}

const MAX_RESULTS = 25;

/**
 * Tìm các đối tượng có thể export theo entityType + từ khóa (tên hoặc mã).
 */
export async function searchExportEntities(
  entityType: EntityType,
  keyword: string,
  limit = 10,
): Promise<ExportEntityOption[]> {
  const q = keyword.trim();
  const take = Math.min(Math.max(limit, 1), MAX_RESULTS);
  const join = (parts: (string | null | undefined)[]) => parts.filter(Boolean).join(' · ');

  switch (entityType) {
    // faculty dùng chung nguồn Personnel với personnel (xem resolveFacultyData)
    case 'personnel':
    case 'faculty': {
      const rows = await prisma.personnel.findMany({
        where: q
          ? {
              OR: [
                { fullName: { contains: q, mode: 'insensitive' } },
                { militaryIdNumber: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {},
        select: {
          id: true,
          fullName: true,
          militaryRank: true,
          militaryIdNumber: true,
          unit: { select: { name: true } },
        },
        orderBy: { fullName: 'asc' },
        take,
      });
      return rows.map((r) => ({
        id: r.id,
        label: r.fullName || '(không tên)',
        sublabel: join([r.militaryRank, r.militaryIdNumber, r.unit?.name]),
      }));
    }

    case 'student': {
      const rows = await prisma.hocVien.findMany({
        where: q
          ? {
              OR: [
                { hoTen: { contains: q, mode: 'insensitive' } },
                { maHocVien: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {},
        select: { id: true, hoTen: true, maHocVien: true, lop: true },
        orderBy: { hoTen: 'asc' },
        take,
      });
      return rows.map((r) => ({
        id: r.id,
        label: r.hoTen || '(không tên)',
        sublabel: join([r.maHocVien, r.lop]),
      }));
    }

    case 'party_member': {
      const rows = await prisma.partyMember.findMany({
        where: q ? { user: { name: { contains: q, mode: 'insensitive' } } } : {},
        select: {
          id: true,
          partyCell: true,
          user: { select: { name: true, rank: true } },
        },
        orderBy: { createdAt: 'desc' },
        take,
      });
      return rows.map((r) => ({
        id: r.id,
        label: r.user?.name || '(không tên)',
        sublabel: join([r.user?.rank, r.partyCell]),
      }));
    }

    // scientific_council / scientist_profile: chưa hỗ trợ picker, dùng nhập tay id
    default:
      return [];
  }
}
