/**
 * API: Generate Acceptance Documents
 * POST /api/documents/generate
 * Tạo PDF tài liệu nghiệm thu với format Times New Roman, Size 14
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CSS_STYLESHEET, DOCUMENT_HEADER } from '@/lib/documents/templates';
import * as AllTemplates from '@/lib/documents/all-templates';

// Template mapping
const getTemplate = (docId: string): string => {
  const templates: Record<string, () => string> = {
    // E1: Pháp lý
    'E1.1': () => require('@/lib/documents/templates').E1_1_QUYET_DINH_PHE_DUYET(),
    'E1.2': () => require('@/lib/documents/templates').E1_2_QUYET_DINH_TO_TRIEN_KHAI(),
    'E1.3': AllTemplates.E1_3_KE_HOACH_TRIEN_KHAI,
    'E1.4': AllTemplates.E1_4_BIEN_BAN_HOP,
    // E2: Kiến trúc
    'E2.1': () => require('@/lib/documents/templates').E2_1_THUYET_MINH_KIEN_TRUC(),
    'E2.2': AllTemplates.E2_2_SO_DO_KIEN_TRUC,
    'E2.3': () => generateE2_3_SoDoPhanlop(),
    'E2.4': () => generateE2_4_DFD(),
    // E3: CSDL
    'E3.1': AllTemplates.E3_1_DANH_MUC_CSDL,
    'E3.2': () => generateE3_2_DataDictionary(),
    'E3.3': () => generateE3_3_ERD(),
    'E3.4': () => generateE3_4_LienThong(),
    // E4: RBAC
    'E4.1': AllTemplates.E4_1_MO_HINH_RBAC,
    'E4.2': AllTemplates.E4_2_DANH_MUC_FUNCTION,
    'E4.3': () => generateE4_3_Policy(),
    'E4.4': () => generateE4_4_Scope(),
    // E5: ATTT
    'E5.1': AllTemplates.E5_1_QUY_CHE_ATTT,
    'E5.2': () => generateE5_2_MaTranRuiRo(),
    'E5.3': () => generateE5_3_UngCuuSuCo(),
    'E5.4': () => generateE5_4_PhanCongATTT(),
    // E6: Audit
    'E6.1': AllTemplates.E6_1_MO_TA_AUDIT_LOG,
    'E6.2': () => generateE6_2_SecurityEvent(),
    'E6.3': () => generateE6_3_MauLog(),
    'E6.4': () => generateE6_4_ThoiGianLuuTru(),
    // E7: Kiểm thử
    'E7.1': AllTemplates.E7_1_KE_HOACH_KIEM_THU,
    'E7.2': () => generateE7_2_BienBanKiemThu(),
    'E7.3': () => generateE7_3_KiemThuPhanQuyen(),
    'E7.4': () => generateE7_4_SOP(),
    'E7.5': AllTemplates.E7_5_HUONG_DAN_SU_DUNG,
  };

  const templateFn = templates[docId];
  if (templateFn) {
    return templateFn();
  }
  return generateDefaultTemplate(docId);
};

// Helper function to generate missing templates
function generateDefaultTemplate(docId: string): string {
  return `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body>
<div class="document">
  ${DOCUMENT_HEADER}
  <div class="doc-title">TÀI LIỆU ${docId}</div>
  <div class="doc-subtitle">Hệ thống BigData Học viện Hậu cần</div>
  <p>Nội dung tài liệu đang được hoàn thiện...</p>
  <div style="margin-top: 40pt; text-align: right;"><b>TỔ TRIỂN KHAI</b></div>
</div>
</body></html>
`;
}

// E2.3: Sơ đồ phân lớp
function generateE2_3_SoDoPhanlop(): string {
  return `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body>
<div class="document">
  ${DOCUMENT_HEADER}
  <div class="doc-title">SƠ ĐỒ PHÂN LỚP HỆ THỐNG</div>
  <div class="doc-subtitle">Frontend - Backend - Database</div>
  
  <div class="section-title">I. LỚP FRONTEND (Presentation)</div>
  <table>
    <tr><th>Thành phần</th><th>Công nghệ</th><th>Chức năng</th></tr>
    <tr><td>Framework</td><td>Next.js 14 (App Router)</td><td>Server-side rendering, routing</td></tr>
    <tr><td>UI Library</td><td>Radix UI + shadcn/ui</td><td>Component library accessible</td></tr>
    <tr><td>Styling</td><td>Tailwind CSS</td><td>Utility-first CSS</td></tr>
    <tr><td>Charts</td><td>Recharts</td><td>Biểu đồ tương tác</td></tr>
    <tr><td>State</td><td>React Query + Zustand</td><td>Client state management</td></tr>
    <tr><td>Auth UI</td><td>NextAuth.js</td><td>Authentication flow</td></tr>
  </table>
  
  <div class="section-title">II. LỚP BACKEND (Business Logic)</div>
  <table>
    <tr><th>Thành phần</th><th>Công nghệ</th><th>Chức năng</th></tr>
    <tr><td>API Routes</td><td>Next.js API Routes</td><td>262 RESTful endpoints</td></tr>
    <tr><td>RBAC Engine</td><td>lib/rbac/*</td><td>authorize(), scope.ts, policy.ts</td></tr>
    <tr><td>Workflow</td><td>State Machine</td><td>DRAFT → SUBMITTED → APPROVED</td></tr>
    <tr><td>Validation</td><td>Zod</td><td>Schema validation</td></tr>
    <tr><td>AI Integration</td><td>Abacus AI</td><td>LLM, Insights, Predictions</td></tr>
  </table>
  
  <div class="section-title">III. LỚP DATABASE (Data)</div>
  <table>
    <tr><th>Thành phần</th><th>Công nghệ</th><th>Chức năng</th></tr>
    <tr><td>RDBMS</td><td>PostgreSQL 14+</td><td>Primary data store</td></tr>
    <tr><td>ORM</td><td>Prisma 6.7</td><td>Type-safe database access</td></tr>
    <tr><td>Cache</td><td>Redis</td><td>Session, query cache</td></tr>
    <tr><td>File Storage</td><td>AWS S3</td><td>File uploads, attachments</td></tr>
  </table>
  
  <div style="margin-top: 40pt; text-align: right;"><b>TỔ TRIỂN KHAI</b></div>
</div>
</body></html>
`;
}

// E2.4: DFD
function generateE2_4_DFD(): string {
  return `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body>
<div class="document">
  ${DOCUMENT_HEADER}
  <div class="doc-title">SƠ ĐỒ LUỒNG DỮ LIỆU (DFD)</div>
  <div class="doc-subtitle">Data Flow Diagram - Level 0</div>
  
  <div class="section-title">I. DFD LEVEL 0 - TỔNG QUAN</div>
  <pre style="font-family: monospace; font-size: 10pt; background: #f5f5f5; padding: 15pt;">
     ┌────────────┐          ┌────────────────────┐
     │  Cán bộ   │─────▶│                    │
     │ Giảng viên│          │   Hệ THỐNG       │─────▶ Báo cáo
     └────────────┘          │   BIGDATA HVHC   │
                            │                    │
     ┌────────────┐          │                    │
     │  Học viên │─────▶│                    │─────▶ Dashboard
     └────────────┘          │                    │
                            └────────────────────┘
     ┌────────────┐                    │
     │  Chỉ huy  │───────────────────┘
     └────────────┘                    ▼
                            ┌────────────────────┐
                            │   7 MIỀN CSDL     │
                            │  (PostgreSQL)    │
                            └────────────────────┘
  </pre>
  
  <div class="section-title">II. LUỒNG DỮ LIỆU CHÍNH</div>
  <table>
    <tr><th>Luồng</th><th>Nguồn</th><th>Đích</th><th>Dữ liệu</th></tr>
    <tr><td>1</td><td>Cán bộ</td><td>CSDL Quân nhân</td><td>Hồ sơ cá nhân</td></tr>
    <tr><td>2</td><td>Giảng viên</td><td>CSDL Điểm</td><td>Điểm học viên (DRAFT)</td></tr>
    <tr><td>3</td><td>Trưởng khoa</td><td>CSDL Điểm</td><td>Duyệt điểm (APPROVED)</td></tr>
    <tr><td>4</td><td>Học viên</td><td>Dashboard</td><td>Xem điểm, tiến độ</td></tr>
    <tr><td>5</td><td>Chỉ huy</td><td>Dashboard</td><td>Thống kê tổng hợp</td></tr>
  </table>
  
  <div style="margin-top: 40pt; text-align: right;"><b>TỔ TRIỂN KHAI</b></div>
</div>
</body></html>
`;
}

// E3.2: Data Dictionary
function generateE3_2_DataDictionary(): string {
  return `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body>
<div class="document">
  ${DOCUMENT_HEADER}
  <div class="doc-title">DATA DICTIONARY</div>
  <div class="doc-subtitle">Từ điển dữ liệu các trường chính</div>
  
  <div class="section-title">I. BẢNG USER (Quân nhân)</div>
  <table>
    <tr><th>Trường</th><th>Kiểu</th><th>Mô tả</th><th>Bắt buộc</th></tr>
    <tr><td>id</td><td>UUID</td><td>Mã định danh duy nhất</td><td>Có</td></tr>
    <tr><td>email</td><td>String</td><td>Email đăng nhập</td><td>Có</td></tr>
    <tr><td>name</td><td>String</td><td>Họ tên đầy đủ</td><td>Có</td></tr>
    <tr><td>rank</td><td>String</td><td>Quân hàm</td><td>Không</td></tr>
    <tr><td>position</td><td>String</td><td>Chức vụ</td><td>Không</td></tr>
    <tr><td>unitId</td><td>UUID</td><td>Mã đơn vị</td><td>Không</td></tr>
    <tr><td>role</td><td>Enum</td><td>Vai trò hệ thống</td><td>Có</td></tr>
    <tr><td>status</td><td>Enum</td><td>Trạng thái (ACTIVE/INACTIVE)</td><td>Có</td></tr>
  </table>
  
  <div class="section-title">II. BẢNG HOC_VIEN (Học viên)</div>
  <table>
    <tr><th>Trường</th><th>Kiểu</th><th>Mô tả</th><th>Bắt buộc</th></tr>
    <tr><td>id</td><td>UUID</td><td>Mã định danh</td><td>Có</td></tr>
    <tr><td>maHocVien</td><td>String</td><td>Mã học viên</td><td>Có</td></tr>
    <tr><td>hoTen</td><td>String</td><td>Họ tên</td><td>Có</td></tr>
    <tr><td>ngaySinh</td><td>DateTime</td><td>Ngày sinh</td><td>Không</td></tr>
    <tr><td>lopId</td><td>UUID</td><td>Mã lớp</td><td>Có</td></tr>
    <tr><td>trangThai</td><td>Enum</td><td>Trạng thái học tập</td><td>Có</td></tr>
  </table>
  
  <div class="section-title">III. BẢNG KET_QUA_HOC_TAP (Điểm)</div>
  <table>
    <tr><th>Trường</th><th>Kiểu</th><th>Mô tả</th><th>Bắt buộc</th></tr>
    <tr><td>id</td><td>UUID</td><td>Mã định danh</td><td>Có</td></tr>
    <tr><td>hocVienId</td><td>UUID</td><td>Mã học viên</td><td>Có</td></tr>
    <tr><td>monHoc</td><td>String</td><td>Tên môn học</td><td>Có</td></tr>
    <tr><td>diemChuyenCan</td><td>Float</td><td>Điểm chuyên cần</td><td>Không</td></tr>
    <tr><td>diemGiuaKy</td><td>Float</td><td>Điểm giữa kỳ</td><td>Không</td></tr>
    <tr><td>diemThi</td><td>Float</td><td>Điểm thi</td><td>Không</td></tr>
    <tr><td>diemTongKet</td><td>Float</td><td>Điểm tổng kết</td><td>Không</td></tr>
    <tr><td>workflowStatus</td><td>Enum</td><td>DRAFT/SUBMITTED/APPROVED</td><td>Có</td></tr>
  </table>
  
  <div style="margin-top: 40pt; text-align: right;"><b>TỔ TRIỂN KHAI</b></div>
</div>
</body></html>
`;
}

// Additional template generators...
function generateE3_3_ERD(): string {
  return generateDefaultTemplate('E3.3 - Mô hình ERD');
}

function generateE3_4_LienThong(): string {
  return generateDefaultTemplate('E3.4 - Cơ chế liên thông');
}

function generateE4_3_Policy(): string {
  return generateDefaultTemplate('E4.3 - Chính sách phân quyền');
}

function generateE4_4_Scope(): string {
  return generateDefaultTemplate('E4.4 - Sơ đồ Scope');
}

function generateE5_2_MaTranRuiRo(): string {
  return generateDefaultTemplate('E5.2 - Ma trận rủi ro');
}

function generateE5_3_UngCuuSuCo(): string {
  return generateDefaultTemplate('E5.3 - Kế hoạch ứng cứu');
}

function generateE5_4_PhanCongATTT(): string {
  return generateDefaultTemplate('E5.4 - Phân công ATTT');
}

function generateE6_2_SecurityEvent(): string {
  return generateDefaultTemplate('E6.2 - Security Event');
}

function generateE6_3_MauLog(): string {
  return generateDefaultTemplate('E6.3 - Mẫu log');
}

function generateE6_4_ThoiGianLuuTru(): string {
  return generateDefaultTemplate('E6.4 - Thời gian lưu trữ');
}

function generateE7_2_BienBanKiemThu(): string {
  return generateDefaultTemplate('E7.2 - Biên bản kiểm thử');
}

function generateE7_3_KiemThuPhanQuyen(): string {
  return generateDefaultTemplate('E7.3 - Kiểm thử phân quyền');
}

function generateE7_4_SOP(): string {
  return generateDefaultTemplate('E7.4 - SOP');
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json({ success: false, error: 'Missing documentId' }, { status: 400 });
    }

    // Get HTML template
    const htmlContent = getTemplate(documentId);

    // Generate PDF via Abacus API
    const createResponse = await fetch('https://apps.abacus.ai/api/createConvertHtmlToPdfRequest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
        html_content: htmlContent,
        pdf_options: {
          format: 'A4',
          margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '25mm' },
          print_background: true,
        },
        css_stylesheet: CSS_STYLESHEET,
      }),
    });

    if (!createResponse.ok) {
      throw new Error('Failed to create PDF request');
    }

    const { request_id } = await createResponse.json();
    if (!request_id) {
      throw new Error('No request ID returned');
    }

    // Poll for completion
    const maxAttempts = 60;
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const statusResponse = await fetch('https://apps.abacus.ai/api/getConvertHtmlToPdfStatus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id, deployment_token: process.env.ABACUSAI_API_KEY }),
      });

      const statusResult = await statusResponse.json();
      const status = statusResult?.status || 'FAILED';
      const result = statusResult?.result || null;

      if (status === 'SUCCESS' && result?.result) {
        const pdfBuffer = Buffer.from(result.result, 'base64');
        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${documentId}.pdf"`,
          },
        });
      } else if (status === 'FAILED') {
        throw new Error(result?.error || 'PDF generation failed');
      }
      attempts++;
    }

    throw new Error('PDF generation timed out');
  } catch (error) {
    console.error('Document generation error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
