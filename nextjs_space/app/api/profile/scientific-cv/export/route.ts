import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import prisma from '@/lib/db';

// Helper function to format date
function formatDate(date: Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function formatMonthYear(date: Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// GET - Export lý lịch khoa học
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireFunction(req, FACULTY.EXPORT);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || user.id;
    const format = searchParams.get('format') || 'html';

    // Fetch user data with all related information
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        educationHistory: {
          orderBy: { startDate: 'asc' },
        },
        workExperience: {
          orderBy: { startDate: 'asc' },
        },
        scientificPublications: {
          orderBy: [{ year: 'asc' }, { month: 'asc' }],
        },
        scientificResearch: {
          orderBy: { year: 'asc' },
        },
        foreignLanguageCerts: {
          orderBy: { sortOrder: 'asc' },
        },
        technicalCertificates: {
          orderBy: { sortOrder: 'asc' },
        },
        careerHistories: {
          orderBy: { eventDate: 'asc' },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: FACULTY.EXPORT,
      action: 'EXPORT',
      resourceType: 'SCIENTIFIC_CV',
      resourceId: userId,
      newValue: { format, targetUserId: userId },
      result: 'SUCCESS',
    });

    // Build HTML content for scientific CV
    const htmlContent = generateScientificCVHTML(targetUser);

    if (format === 'json') {
      return NextResponse.json({
        user: targetUser,
        html: htmlContent,
      });
    }

    // Return HTML for PDF generation
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error exporting scientific CV:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateScientificCVHTML(user: any): string {
  const educationLevelMap: Record<string, string> = {
    'DAI_HOC': 'Đại học',
    'THAC_SI': 'Thạc sĩ',
    'TIEN_SI': 'Tiến sĩ',
    'CU_NHAN_NGOAI_NGU': 'Cử nhân ngoại ngữ',
    'KHAC': 'Khác',
  };

  const publicationTypeMap: Record<string, string> = {
    'GIAO_TRINH': 'Giáo trình',
    'TAI_LIEU': 'Tài liệu',
    'BAI_TAP': 'Bài tập',
    'BAI_BAO': 'Bài báo',
    'SANG_KIEN': 'Sáng kiến',
    'DE_TAI': 'Đề tài',
    'GIAO_TRINH_DT': 'Giáo trình',
  };

  // I. LÝ LỊCH SƠ LƯỢC
  const lyLichSection = `
    <h2>I. LÝ LỊCH SƠ LƯỢC</h2>
    <table class="info-table">
      <tr><td width="200">Họ và tên:</td><td><strong>${user.name || ''}</strong></td></tr>
      <tr><td>Giới tính:</td><td>${user.gender || ''}</td></tr>
      <tr><td>Ngày, tháng, năm sinh:</td><td>${formatDate(user.dateOfBirth)}</td></tr>
      <tr><td>Nơi sinh:</td><td>${user.birthPlace || ''}</td></tr>
      <tr><td>Quê quán:</td><td>${user.placeOfOrigin || ''}</td></tr>
      <tr><td>Dân tộc:</td><td>${user.ethnicity || 'Kinh'}</td></tr>
      <tr><td>Cấp bậc, chức vụ, đơn vị công tác:</td><td>${user.rank || ''} – ${user.position || ''} – ${user.unit || ''}</td></tr>
      <tr><td>Chỗ ở hoặc địa chỉ liên lạc:</td><td>${user.address || user.permanentAddress || ''}</td></tr>
      <tr><td>Điện thoại:</td><td>${user.phone || ''}</td></tr>
      <tr><td>Email:</td><td>${user.email || ''}</td></tr>
    </table>
  `;

  // II. QUÁ TRÌNH ĐÀO TẠO
  let daoTaoContent = '';
  let stt = 1;
  
  // Group education by level
  const daiHoc = user.educationHistory.filter((e: any) => e.level === 'DAI_HOC');
  const thacSi = user.educationHistory.filter((e: any) => e.level === 'THAC_SI');
  const tienSi = user.educationHistory.filter((e: any) => e.level === 'TIEN_SI');

  if (daiHoc.length > 0) {
    daiHoc.forEach((edu: any) => {
      daoTaoContent += `
        <p><strong>${stt}. Đại học ${edu.major || ''}</strong></p>
        <table class="info-table">
          <tr><td width="200">Hệ đào tạo:</td><td>${edu.trainingSystem || ''}</td></tr>
          <tr><td>Thời gian đào tạo:</td><td>từ ${formatMonthYear(edu.startDate)} đến ${formatMonthYear(edu.endDate)}</td></tr>
          <tr><td>Nơi học:</td><td>${edu.institution || ''}</td></tr>
          <tr><td>Ngành học:</td><td>${edu.major || ''}</td></tr>
          ${edu.examSubject ? `<tr><td>Môn thi:</td><td>${edu.examSubject}</td></tr>` : ''}
          ${edu.classification ? `<tr><td>Xếp loại:</td><td>${edu.classification}</td></tr>` : ''}
        </table>
      `;
      stt++;
    });
  }

  if (thacSi.length > 0) {
    thacSi.forEach((edu: any) => {
      daoTaoContent += `
        <p><strong>${stt}. Thạc sĩ</strong></p>
        <table class="info-table">
          <tr><td width="200">Thời gian đào tạo:</td><td>từ ${formatMonthYear(edu.startDate)} đến ${formatMonthYear(edu.endDate)}</td></tr>
          <tr><td>Nơi học:</td><td>${edu.institution || ''}</td></tr>
          <tr><td>Chuyên ngành:</td><td>${edu.major || ''}</td></tr>
          ${edu.thesisTitle ? `<tr><td>Tên luận văn:</td><td>${edu.thesisTitle}</td></tr>` : ''}
          ${edu.defenseDate ? `<tr><td>Ngày và nơi bảo vệ:</td><td>${formatDate(edu.defenseDate)} – ${edu.defenseLocation || ''}</td></tr>` : ''}
          ${edu.supervisor ? `<tr><td>Người hướng dẫn:</td><td>${edu.supervisor}</td></tr>` : ''}
        </table>
      `;
      stt++;
    });
  }

  if (tienSi.length > 0) {
    tienSi.forEach((edu: any) => {
      daoTaoContent += `
        <p><strong>${stt}. Tiến sĩ</strong></p>
        <table class="info-table">
          <tr><td width="200">Thời gian đào tạo:</td><td>từ ${formatMonthYear(edu.startDate)} đến ${formatMonthYear(edu.endDate)}</td></tr>
          <tr><td>Nơi học:</td><td>${edu.institution || ''}</td></tr>
          <tr><td>Chuyên ngành:</td><td>${edu.major || ''}</td></tr>
          ${edu.thesisTitle ? `<tr><td>Tên luận án:</td><td>${edu.thesisTitle}</td></tr>` : ''}
          ${edu.defenseDate ? `<tr><td>Ngày và nơi bảo vệ:</td><td>${formatDate(edu.defenseDate)} – ${edu.defenseLocation || ''}</td></tr>` : ''}
          ${edu.supervisor ? `<tr><td>Người hướng dẫn:</td><td>${edu.supervisor}</td></tr>` : ''}
        </table>
      `;
      stt++;
    });
  }

  // Trình độ ngoại ngữ
  if (user.foreignLanguageCerts && user.foreignLanguageCerts.length > 0) {
    daoTaoContent += `<p><strong>${stt}. Trình độ ngoại ngữ:</strong></p><ul>`;
    user.foreignLanguageCerts.forEach((cert: any) => {
      daoTaoContent += `<li>${cert.language} – ${cert.certType}${cert.certLevel ? `: ${cert.certLevel}` : ''}${cert.framework ? ` (${cert.framework})` : ''}</li>`;
    });
    daoTaoContent += '</ul>';
    stt++;
  }

  // Học vị, học hàm, chức vụ kỹ thuật
  if (user.technicalCertificates && user.technicalCertificates.length > 0) {
    daoTaoContent += `<p><strong>${stt}. Học vị, học hàm, chức vụ kỹ thuật được chính thức cấp:</strong></p><ul>`;
    user.technicalCertificates.forEach((cert: any) => {
      daoTaoContent += `<li>${cert.certName}${cert.classification ? ` hạng ${cert.classification}` : ''}${cert.certNumber ? ` số hiệu bằng ${cert.certNumber}` : ''} do ${cert.issuer || ''} cấp ngày ${formatDate(cert.issueDate)}.</li>`;
    });
    daoTaoContent += '</ul>';
  }

  const daoTaoSection = `
    <h2>II. QUÁ TRÌNH ĐÀO TẠO</h2>
    ${daoTaoContent}
  `;

  // III. QUÁ TRÌNH CÔNG TÁC CHUYÊN MÔN
  let congTacContent = '';
  if (user.workExperience && user.workExperience.length > 0) {
    user.workExperience.forEach((exp: any) => {
      const endStr = exp.endDate ? formatMonthYear(exp.endDate) : 'nay';
      congTacContent += `<p>Từ ${formatMonthYear(exp.startDate)} đến ${endStr}: ${exp.position} – ${exp.organization}</p>`;
    });
  }

  // Fallback to careerHistories if workExperience is empty
  if (!congTacContent && user.careerHistories && user.careerHistories.length > 0) {
    const appointments = user.careerHistories.filter((h: any) => 
      h.eventType === 'APPOINTMENT' || h.eventType === 'TRANSFER' || h.eventType === 'ENLISTMENT'
    );
    appointments.forEach((event: any, idx: number) => {
      const nextEvent = appointments[idx + 1];
      const endStr = nextEvent ? formatMonthYear(nextEvent.eventDate) : 'nay';
      congTacContent += `<p>Từ ${formatMonthYear(event.eventDate)} đến ${endStr}: ${event.newPosition || ''} – ${event.newUnit || ''}</p>`;
    });
  }

  const congTacSection = `
    <h2>III. QUÁ TRÌNH CÔNG TÁC CHUYÊN MÔN KỂ TỪ KHI TỐT NGHIỆP ĐẠI HỌC</h2>
    ${congTacContent || '<p><em>Chưa có dữ liệu</em></p>'}
  `;

  // IV. CÁC CÔNG TRÌNH KHOA HỌC ĐÃ CÔNG BỐ
  let congTrinhContent = '';
  const allPublications = [...(user.scientificPublications || []), ...(user.scientificResearch || [])];
  
  // Sort by year
  allPublications.sort((a: any, b: any) => (a.year || 0) - (b.year || 0));
  
  if (allPublications.length > 0) {
    allPublications.forEach((pub: any, idx: number) => {
      const typeStr = publicationTypeMap[pub.type] || pub.type || '';
      const monthYear = pub.month ? `tháng ${pub.month}/${pub.year}` : pub.year;
      congTrinhContent += `<p>${idx + 1}. ${typeStr}: ${pub.title} - ${pub.organization || pub.institution || ''} – ${monthYear}</p>`;
    });
  } else {
    congTrinhContent = '<p><em>Chưa có công trình khoa học</em></p>';
  }

  const congTrinhSection = `
    <h2>IV. CÁC CÔNG TRÌNH KHOA HỌC ĐÃ CÔNG BỐ</h2>
    ${congTrinhContent}
  `;

  // Footer
  const today = new Date();
  const footer = `
    <div class="footer">
      <table width="100%">
        <tr>
          <td width="50%" style="text-align: center;">
            <strong>XÁC NHẬN CỦA CƠ QUAN Cử ĐI HỌC</strong>
          </td>
          <td width="50%" style="text-align: center;">
            <p>Ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}</p>
            <strong>Người khai ký tên</strong>
            <br/><br/><br/><br/>
            <p>${user.name || ''}</p>
          </td>
        </tr>
      </table>
    </div>
  `;

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Lý lịch khoa học - ${user.name || ''}</title>
      <style>
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 13pt;
          line-height: 1.5;
          margin: 2cm;
          color: #000;
        }
        h1 {
          text-align: center;
          font-size: 16pt;
          margin-bottom: 20px;
        }
        h2 {
          font-size: 13pt;
          margin-top: 20px;
          margin-bottom: 10px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .header p {
          margin: 5px 0;
        }
        .info-table {
          width: 100%;
          border-collapse: collapse;
        }
        .info-table td {
          padding: 5px 0;
          vertical-align: top;
        }
        .footer {
          margin-top: 50px;
        }
        ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        li {
          margin-bottom: 5px;
        }
        @media print {
          body {
            margin: 1cm;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <p>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
        <p><strong>Độc lập – Tự do – Hạnh phúc</strong></p>
      </div>
      
      <h1>LÝ LỊCH KHOA HỌC</h1>
      
      ${lyLichSection}
      ${daoTaoSection}
      ${congTacSection}
      ${congTrinhSection}
      ${footer}
    </body>
    </html>
  `;
}
