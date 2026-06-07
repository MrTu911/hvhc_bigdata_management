/**
 * Career Export Service — dựng dữ liệu xuất "Bản quá trình công tác" của cá nhân.
 *
 * Nguồn dữ liệu là CareerHistory (theo userId) + thông tin tóm tắt của User, KHÁC với
 * resolver personnel của M18 (vốn lấy WorkExperience và yêu cầu bản ghi Personnel).
 * Vì vậy route SELF dùng exportWithData() với resolvedData do service này dựng, đảm bảo
 * khớp đúng dữ liệu hiển thị ở trang /dashboard/personal/my-career.
 *
 * resolvedData trả ra khớp placeholder của template TPL_M02_QTCT_CANHAN:
 *   - Scalar: hoTen, capBac, chucVu, donVi, ngayNhapNgu, thamNien + header context.
 *   - Vòng lặp congTac_list: { tuNgay, denNgay, suKien, noiDung, quyetDinh }.
 */

import prisma from '@/lib/db';
import { buildHeaderContext } from '@/lib/services/data-resolver-service';

/** Nhãn tiếng Việt cho từng loại sự kiện công tác (CareerEventType). */
const EVENT_LABELS: Record<string, string> = {
  ENLISTMENT: 'Nhập ngũ / Tuyển dụng',
  PROMOTION: 'Thăng quân hàm',
  APPOINTMENT: 'Bổ nhiệm chức vụ',
  POSITION_CHANGE: 'Thay đổi chức vụ',
  TRANSFER: 'Điều động',
  UNIT_CHANGE: 'Chuyển đơn vị',
  SECONDMENT: 'Biệt phái',
  TRAINING: 'Đào tạo / Bồi dưỡng',
  STUDY_LEAVE: 'Đi học tập trung',
  RETURN: 'Trở lại công tác',
  AWARD: 'Khen thưởng',
  DISCIPLINE: 'Kỷ luật',
  RANK_DEMOTION: 'Giáng cấp',
  RETIREMENT_PREP: 'Chuẩn bị nghỉ hưu',
  RETIREMENT: 'Nghỉ hưu',
  DISCHARGE: 'Phục viên / Xuất ngũ',
  OTHER: 'Khác',
};

function formatMonthYear(d: Date | null | undefined): string {
  if (!d) return '';
  const date = new Date(d);
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

function formatFullDate(d: Date | null | undefined): string {
  if (!d) return '';
  const date = new Date(d);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

/** Thâm niên công tác (số năm tròn) tính từ ngày nhập ngũ, fallback sự kiện sớm nhất. */
function calculateServiceYears(enlistmentDate: Date | null, earliestEvent: Date | null): string {
  const start = enlistmentDate ?? earliestEvent;
  if (!start) return '';
  const years = Math.floor((Date.now() - new Date(start).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  return years >= 0 ? `${years} năm` : '';
}

/** Gộp các thay đổi của một sự kiện thành 1 dòng nội dung dễ đọc. */
function buildEventContent(event: {
  title: string | null;
  oldPosition: string | null;
  newPosition: string | null;
  oldRank: string | null;
  newRank: string | null;
  oldUnit: string | null;
  newUnit: string | null;
  trainingName: string | null;
  trainingInstitution: string | null;
  notes: string | null;
}): string {
  const parts: string[] = [];
  if (event.title) parts.push(event.title);
  if (event.newPosition) {
    parts.push(event.oldPosition ? `Chức vụ: ${event.oldPosition} → ${event.newPosition}` : `Chức vụ: ${event.newPosition}`);
  }
  if (event.newRank) {
    parts.push(event.oldRank ? `Cấp bậc: ${event.oldRank} → ${event.newRank}` : `Cấp bậc: ${event.newRank}`);
  }
  if (event.newUnit) {
    parts.push(event.oldUnit ? `Đơn vị: ${event.oldUnit} → ${event.newUnit}` : `Đơn vị: ${event.newUnit}`);
  }
  if (event.trainingName) {
    parts.push(event.trainingInstitution ? `${event.trainingName} (${event.trainingInstitution})` : event.trainingName);
  }
  if (parts.length === 0 && event.notes) parts.push(event.notes);
  return parts.join('; ');
}

/**
 * Dựng resolvedData để render template quá trình công tác của user.
 * Career list xếp theo thời gian tăng dần (cũ → mới) đúng quy ước sơ yếu lý lịch.
 */
export async function buildCareerExportData(userId: string): Promise<Record<string, unknown>> {
  const [user, careerHistories, activePosition] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        rank: true,
        enlistmentDate: true,
        unitRelation: { select: { name: true } },
      },
    }),
    prisma.careerHistory.findMany({
      where: { userId, deletedAt: null },
      orderBy: { eventDate: 'asc' },
      select: {
        eventType: true,
        eventDate: true,
        endDate: true,
        title: true,
        decisionNumber: true,
        decisionDate: true,
        oldPosition: true,
        newPosition: true,
        oldRank: true,
        newRank: true,
        oldUnit: true,
        newUnit: true,
        trainingName: true,
        trainingInstitution: true,
        notes: true,
      },
    }),
    prisma.userPosition.findFirst({
      where: { userId, isActive: true },
      orderBy: { startDate: 'desc' },
      select: {
        position: { select: { name: true } },
        unit: { select: { name: true } },
      },
    }),
  ]);

  if (!user) throw new Error(`Không tìm thấy người dùng: ${userId}`);

  const earliestEvent = careerHistories.length > 0 ? careerHistories[0].eventDate : null;
  const currentUnitName = activePosition?.unit?.name ?? user.unitRelation?.name ?? '';

  const congTac_list = careerHistories.map((event) => ({
    tuNgay: formatMonthYear(event.eventDate),
    // Chỉ sự kiện có khoảng thời gian (vd đào tạo) mới có "đến"; sự kiện thời điểm để trống.
    denNgay: event.endDate ? formatMonthYear(event.endDate) : '',
    suKien: EVENT_LABELS[event.eventType] ?? EVENT_LABELS.OTHER,
    noiDung: buildEventContent(event),
    quyetDinh: event.decisionNumber
      ? `${event.decisionNumber}${event.decisionDate ? ` (${formatFullDate(event.decisionDate)})` : ''}`
      : '',
  }));

  return {
    ...buildHeaderContext(),
    hoTen: (user.name ?? '').toUpperCase(),
    capBac: user.rank ?? '',
    chucVu: activePosition?.position?.name ?? '',
    donVi: currentUnitName,
    ngayNhapNgu: formatFullDate(user.enlistmentDate),
    thamNien: calculateServiceYears(user.enlistmentDate, earliestEvent),
    congTac_list,
  };
}
