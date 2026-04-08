/**
 * M03 – UC-63: Xuất mẫu 2A-LLĐV (Lý lịch đảng viên)
 * GET /api/party/members/[id]/export-2a
 *
 * Trạng thái hiện tại (Phase 1 – scaffold):
 *   Trả về dữ liệu JSON đầy đủ cho biểu mẫu 2A-LLĐV.
 *   Render PDF/DOCX sẽ được xử lý bởi M18 (Export Engine) khi sẵn sàng.
 *
 * Kế hoạch migration (Phase 2 – khi M18 sẵn sàng):
 *   1. Gọi M18 với templateId = '2A-LLĐV' và payload này
 *   2. M18 render ra PDF/DOCX theo mẫu chuẩn
 *   3. Trả về signed URL hoặc file stream
 *
 * @m18-integration-point templateId: '2A-LLĐV'
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAnyFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';
import { buildPartyMemberProfile360 } from '@/lib/services/party/party-profile360.service';
import { logAudit, logSensitiveAccess } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await requireAnyFunction(request, [PARTY.EXPORT_REPORT, PARTY.VIEW_MEMBER]);
    if (!authResult.allowed) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const profile360 = await buildPartyMemberProfile360(params.id);
    if (!profile360) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy đảng viên' }, { status: 404 });
    }

    // Mẫu 2A-LLĐV — payload chuẩn để render template
    const payload = {
      templateId: '2A-LLĐV',
      // TODO (Phase 2): Gọi M18 export engine với payload này thay vì trả JSON
      // m18Adapter.renderTemplate({ templateId: '2A-LLĐV', data: payload })
      data: {
        // I. Thông tin cơ bản
        hoTen: profile360.user.name,
        soQuan: profile360.user.militaryId,
        capBac: profile360.user.rank,
        chucVu: profile360.user.position,
        donVi: profile360.user.unitRelation?.name,
        soTheDang: profile360.partyMember.partyCardNumber,
        ngayVaoDang: profile360.partyMember.joinDate,
        ngayChinhThuc: profile360.partyMember.officialDate,
        chiBoHienTai: profile360.organization?.name,
        trangThaiHienTai: profile360.partyMember.status,
        vaiTroDang: profile360.partyMember.partyRole,

        // II. Quá trình hoạt động CM (từ M02 — OfficerCareer)
        quaTrinhHoatDong: profile360.sections.careerHistory,

        // III. Đánh giá hàng năm (từ PartyAnnualReview)
        danhGiaHangNam: profile360.sections.annualReviews,

        // IV. Khen thưởng (từ PartyAward)
        khenThuong: profile360.sections.awards,

        // V. Kỷ luật (từ PartyDiscipline)
        kyLuat: profile360.sections.disciplines,

        // VI. Chuyển sinh hoạt (từ PartyTransfer)
        chuyenSinhHoat: profile360.sections.transfers,

        // VII. Kiểm tra (từ PartyInspectionTarget)
        kiemTra: profile360.sections.inspections,
      },
      exportedAt: new Date().toISOString(),
      exportedBy: authResult.user!.id,
    };

    await logSensitiveAccess(authResult.user!.id, 'PARTY_MEMBER_EXPORT_2A', params.id);
    await logAudit({
      userId: authResult.user!.id,
      functionCode: PARTY.EXPORT_REPORT,
      action: 'EXPORT',
      resourceType: 'PARTY_MEMBER',
      resourceId: params.id,
      newValue: { templateId: '2A-LLĐV' },
      result: 'SUCCESS',
    });

    return NextResponse.json({ success: true, data: payload });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
