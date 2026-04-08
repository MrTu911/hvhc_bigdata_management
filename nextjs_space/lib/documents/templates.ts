/**
 * Templates cho Hồ sơ Nghiệm thu CNTT
 * Format: Times New Roman, Size 14
 * Học viện Hậu cần - Hệ thống BigData v8.0
 */

export const CSS_STYLESHEET = `
  @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&display=swap');
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 14pt;
    line-height: 1.5;
    color: #000;
  }
  
  .document {
    padding: 0;
  }
  
  .header {
    text-align: center;
    margin-bottom: 20pt;
  }
  
  .header-top {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10pt;
  }
  
  .header-left {
    text-align: center;
    width: 45%;
  }
  
  .header-right {
    text-align: center;
    width: 45%;
  }
  
  .header-org {
    font-size: 13pt;
    font-weight: bold;
    text-transform: uppercase;
  }
  
  .header-sub {
    font-size: 12pt;
  }
  
  .doc-number {
    font-size: 13pt;
    font-style: italic;
  }
  
  .doc-title {
    font-size: 16pt;
    font-weight: bold;
    text-transform: uppercase;
    text-align: center;
    margin: 20pt 0;
  }
  
  .doc-subtitle {
    font-size: 14pt;
    font-weight: bold;
    text-align: center;
    margin: 10pt 0;
  }
  
  .section-title {
    font-size: 14pt;
    font-weight: bold;
    margin: 15pt 0 10pt 0;
  }
  
  .subsection-title {
    font-size: 14pt;
    font-weight: bold;
    font-style: italic;
    margin: 10pt 0 5pt 0;
  }
  
  p {
    text-indent: 1cm;
    text-align: justify;
    margin-bottom: 10pt;
  }
  
  ul, ol {
    margin-left: 1cm;
    margin-bottom: 10pt;
  }
  
  li {
    margin-bottom: 5pt;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10pt 0;
  }
  
  th, td {
    border: 1px solid #000;
    padding: 8pt;
    text-align: left;
    font-size: 13pt;
  }
  
  th {
    background-color: #f0f0f0;
    font-weight: bold;
    text-align: center;
  }
  
  .signature-section {
    display: flex;
    justify-content: space-between;
    margin-top: 30pt;
  }
  
  .signature-block {
    text-align: center;
    width: 45%;
  }
  
  .signature-title {
    font-weight: bold;
    margin-bottom: 60pt;
  }
  
  .signature-name {
    font-weight: bold;
  }
  
  .page-break {
    page-break-before: always;
  }
  
  .text-center {
    text-align: center;
  }
  
  .text-bold {
    font-weight: bold;
  }
  
  .mt-20 {
    margin-top: 20pt;
  }
  
  .mb-20 {
    margin-bottom: 20pt;
  }
`;

// Header chung cho tất cả tài liệu
export const DOCUMENT_HEADER = `
  <div class="header">
    <div class="header-top" style="display: flex; justify-content: space-between;">
      <div class="header-left" style="width: 45%; text-align: center;">
        <div class="header-org">BỘ QUỐC PHÒNG</div>
        <div class="header-sub">HỌC VIỆN HẬU CẦN</div>
        <div style="border-bottom: 1px solid #000; width: 100px; margin: 5pt auto;"></div>
      </div>
      <div class="header-right" style="width: 45%; text-align: center;">
        <div class="header-org">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
        <div class="header-sub">Độc lập - Tự do - Hạnh phúc</div>
        <div style="border-bottom: 1px solid #000; width: 150px; margin: 5pt auto;"></div>
      </div>
    </div>
  </div>
`;

// E1.1: Quyết định phê duyệt chủ trương đầu tư
export const E1_1_QUYET_DINH_PHE_DUYET = () => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
<div class="document">
  ${DOCUMENT_HEADER}
  
  <div class="doc-number" style="text-align: center;">Số: ___/QĐ-HVHC</div>
  <div style="text-align: right; margin: 10pt 0;"><i>Hà Nội, ngày ___ tháng ___ năm 2026</i></div>
  
  <div class="doc-title">QUYẾT ĐỊNH</div>
  <div class="doc-subtitle">Về việc phê duyệt chủ trương đầu tư<br/>Hệ thống Quản lý Dữ liệu lớn (BigData) Học viện Hậu cần</div>
  
  <div style="text-align: center; margin: 15pt 0;"><b>GIÁM ĐỐC HỌC VIỆN HẬU CẦN</b></div>
  
  <p><i>Căn cứ Quyết định số 144/2021/QĐ-BQP ngày 15/10/2021 của Bộ trưởng Bộ Quốc phòng về quản lý và khai thác cơ sở dữ liệu;</i></p>
  <p><i>Căn cứ Thông tư số 03/2020/TT-BTTTT ngày 24/02/2020 về quản lý dự án CNTT;</i></p>
  <p><i>Căn cứ Nghị định 85/2016/NĐ-CP về bảo đảm an toàn hệ thống thông tin;</i></p>
  <p><i>Căn cứ chức năng, nhiệm vụ, quyền hạn của Học viện Hậu cần;</i></p>
  <p><i>Xét đề nghị của Phòng Công nghệ thông tin,</i></p>
  
  <div style="text-align: center; margin: 15pt 0;"><b>QUYẾT ĐỊNH:</b></div>
  
  <p><b>Điều 1.</b> Phê duyệt chủ trương đầu tư xây dựng "Hệ thống Quản lý Dữ liệu lớn (BigData) Học viện Hậu cần" với các nội dung chính sau:</p>
  
  <p><b>1. Tên dự án:</b> Hệ thống Quản lý Dữ liệu lớn Học viện Hậu cần (HVHC BigData Management System)</p>
  
  <p><b>2. Mục tiêu:</b></p>
  <ul>
    <li>Xây dựng hệ thống quản lý dữ liệu tập trung cho 7 miền cơ sở dữ liệu</li>
    <li>Triển khai phân quyền theo chức năng (Function-based RBAC)</li>
    <li>Tích hợp AI/ML hỗ trợ ra quyết định</li>
    <li>Đảm bảo an toàn thông tin theo tiêu chuẩn BQP</li>
  </ul>
  
  <p><b>3. Phạm vi:</b> Toàn bộ Học viện Hậu cần và các đơn vị trực thuộc</p>
  
  <p><b>4. Các miền CSDL:</b></p>
  <ol>
    <li>CSDL Quân nhân (Personnel Database)</li>
    <li>CSDL Đảng viên (Party Members Database)</li>
    <li>CSDL Thi đua Khen thưởng (Awards Database)</li>
    <li>CSDL Chính sách (Policy Database)</li>
    <li>CSDL Bảo hiểm xã hội (Insurance Database)</li>
    <li>CSDL Giảng viên, QLGD (Faculty Database)</li>
    <li>CSDL Học viên Quân sự (Students Database)</li>
  </ol>
  
  <p><b>5. Công nghệ:</b> Next.js 14, PostgreSQL, Prisma ORM, Redis Cache, AWS S3, Abacus AI</p>
  
  <p><b>Điều 2.</b> Giao Phòng Công nghệ thông tin chủ trì, phối hợp với các cơ quan liên quan triển khai thực hiện.</p>
  
  <p><b>Điều 3.</b> Quyết định này có hiệu lực kể từ ngày ký.</p>
  
  <p><b>Điều 4.</b> Trưởng các phòng, ban, khoa và các đơn vị liên quan chịu trách nhiệm thi hành Quyết định này./.</p>
  
  <div class="signature-section" style="display: flex; justify-content: space-between; margin-top: 40pt;">
    <div style="width: 45%;">
      <p style="text-indent: 0;"><b><i>Nơi nhận:</i></b></p>
      <ul style="font-size: 12pt;">
        <li>Như Điều 4;</li>
        <li>Lưu: VT, CNTT.</li>
      </ul>
    </div>
    <div style="width: 45%; text-align: center;">
      <p style="text-indent: 0;"><b>GIÁM ĐỐC</b></p>
      <p style="text-indent: 0; margin-top: 70pt;"><b>Thiếu tướng _____________</b></p>
    </div>
  </div>
</div>
</body>
</html>
`;

// E1.2: Quyết định thành lập Tổ triển khai
export const E1_2_QUYET_DINH_TO_TRIEN_KHAI = () => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
<div class="document">
  ${DOCUMENT_HEADER}
  
  <div class="doc-number" style="text-align: center;">Số: ___/QĐ-HVHC</div>
  <div style="text-align: right; margin: 10pt 0;"><i>Hà Nội, ngày ___ tháng ___ năm 2026</i></div>
  
  <div class="doc-title">QUYẾT ĐỊNH</div>
  <div class="doc-subtitle">Về việc thành lập Tổ triển khai Hệ thống BigData</div>
  
  <div style="text-align: center; margin: 15pt 0;"><b>GIÁM ĐỐC HỌC VIỆN HẬU CẦN</b></div>
  
  <p><i>Căn cứ Quyết định số ___/QĐ-HVHC ngày ___/___/2026 về phê duyệt chủ trương đầu tư;</i></p>
  <p><i>Căn cứ yêu cầu triển khai dự án CNTT;</i></p>
  <p><i>Xét đề nghị của Phòng Công nghệ thông tin,</i></p>
  
  <div style="text-align: center; margin: 15pt 0;"><b>QUYẾT ĐỊNH:</b></div>
  
  <p><b>Điều 1.</b> Thành lập Tổ triển khai Hệ thống BigData Học viện Hậu cần gồm các thành viên:</p>
  
  <table>
    <tr>
      <th style="width: 5%;">TT</th>
      <th style="width: 25%;">Họ và tên</th>
      <th style="width: 25%;">Chức vụ</th>
      <th style="width: 25%;">Nhiệm vụ trong Tổ</th>
      <th style="width: 20%;">Ghi chú</th>
    </tr>
    <tr>
      <td style="text-align: center;">1</td>
      <td></td>
      <td>Phó Giám đốc phụ trách</td>
      <td>Tổ trưởng</td>
      <td></td>
    </tr>
    <tr>
      <td style="text-align: center;">2</td>
      <td></td>
      <td>Trưởng phòng CNTT</td>
      <td>Tổ phó thường trực</td>
      <td></td>
    </tr>
    <tr>
      <td style="text-align: center;">3</td>
      <td></td>
      <td>Chuyên viên CNTT</td>
      <td>Thư ký</td>
      <td></td>
    </tr>
    <tr>
      <td style="text-align: center;">4</td>
      <td></td>
      <td>Trưởng phòng Đào tạo</td>
      <td>Thành viên</td>
      <td></td>
    </tr>
    <tr>
      <td style="text-align: center;">5</td>
      <td></td>
      <td>Trưởng Ban Cán bộ</td>
      <td>Thành viên</td>
      <td></td>
    </tr>
    <tr>
      <td style="text-align: center;">6</td>
      <td></td>
      <td>Trưởng phòng KH-CN</td>
      <td>Thành viên</td>
      <td></td>
    </tr>
  </table>
  
  <p><b>Điều 2.</b> Tổ triển khai có nhiệm vụ:</p>
  <ul>
    <li>Xây dựng kế hoạch chi tiết triển khai hệ thống</li>
    <li>Phối hợp với đơn vị phát triển phần mềm</li>
    <li>Kiểm tra, giám sát tiến độ thực hiện</li>
    <li>Tổ chức đào tạo, hướng dẫn sử dụng</li>
    <li>Nghiệm thu, bàn giao hệ thống</li>
  </ul>
  
  <p><b>Điều 3.</b> Tổ triển khai được sử dụng con dấu của Học viện trong phạm vi nhiệm vụ được giao.</p>
  
  <p><b>Điều 4.</b> Quyết định có hiệu lực từ ngày ký. Tổ tự giải thể sau khi hoàn thành nhiệm vụ./.</p>
  
  <div class="signature-section" style="display: flex; justify-content: space-between; margin-top: 40pt;">
    <div style="width: 45%;">
      <p style="text-indent: 0;"><b><i>Nơi nhận:</i></b></p>
      <ul style="font-size: 12pt;">
        <li>Như Điều 1;</li>
        <li>Lưu: VT, CNTT.</li>
      </ul>
    </div>
    <div style="width: 45%; text-align: center;">
      <p style="text-indent: 0;"><b>GIÁM ĐỐC</b></p>
      <p style="text-indent: 0; margin-top: 70pt;"><b>Thiếu tướng _____________</b></p>
    </div>
  </div>
</div>
</body>
</html>
`;

// E2.1: Thuyết minh kiến trúc tổng thể
export const E2_1_THUYET_MINH_KIEN_TRUC = () => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
<div class="document">
  ${DOCUMENT_HEADER}
  
  <div class="doc-title">THUYẾT MINH KIẾN TRÚC TỔNG THỂ</div>
  <div class="doc-subtitle">Hệ thống Quản lý Dữ liệu lớn Học viện Hậu cần v8.0</div>
  
  <div class="section-title">I. TỔNG QUAN HỆ THỐNG</div>
  
  <div class="subsection-title">1.1. Giới thiệu</div>
  <p>Hệ thống Quản lý Dữ liệu lớn Học viện Hậu cần (HVHC BigData Management System) là nền tảng công nghệ thông tin tập trung, được xây dựng nhằm quản lý toàn diện 7 miền cơ sở dữ liệu của Học viện theo quy định tại Quyết định 144/2021/QĐ-BQP.</p>
  
  <div class="subsection-title">1.2. Mục tiêu hệ thống</div>
  <ul>
    <li>Tập trung hóa quản lý dữ liệu từ 7 miền nghiệp vụ</li>
    <li>Triển khai phân quyền theo chức năng (Function-based RBAC) với 71 function codes</li>
    <li>Tích hợp trí tuệ nhân tạo (AI/ML) hỗ trợ phân tích, dự báo</li>
    <li>Đảm bảo an toàn thông tin theo tiêu chuẩn CQNN/BQP</li>
    <li>Hỗ trợ thanh tra, kiểm tra và giải trình</li>
  </ul>
  
  <div class="section-title">II. KIẾN TRÚC PHÂN LỚP</div>
  
  <div class="subsection-title">2.1. Lớp Trình bày (Presentation Layer)</div>
  <table>
    <tr><th>Thành phần</th><th>Công nghệ</th><th>Mô tả</th></tr>
    <tr><td>Frontend Framework</td><td>Next.js 14</td><td>React Server Components, App Router</td></tr>
    <tr><td>UI Components</td><td>Radix UI, Tailwind CSS</td><td>Component library responsive</td></tr>
    <tr><td>Charts</td><td>Recharts</td><td>Biểu đồ tương tác</td></tr>
    <tr><td>Authentication</td><td>NextAuth.js</td><td>Xác thực phiên làm việc</td></tr>
  </table>
  
  <div class="subsection-title">2.2. Lớp Nghiệp vụ (Business Logic Layer)</div>
  <table>
    <tr><th>Thành phần</th><th>Công nghệ</th><th>Mô tả</th></tr>
    <tr><td>API Routes</td><td>Next.js API Routes</td><td>262 endpoints RESTful</td></tr>
    <tr><td>RBAC Engine</td><td>Custom authorize()</td><td>Function-based access control</td></tr>
    <tr><td>Workflow Engine</td><td>State Machine</td><td>DRAFT → SUBMITTED → APPROVED</td></tr>
    <tr><td>Audit System</td><td>Custom logAudit()</td><td>Ghi nhật ký hoạt động</td></tr>
  </table>
  
  <div class="subsection-title">2.3. Lớp Dữ liệu (Data Layer)</div>
  <table>
    <tr><th>Thành phần</th><th>Công nghệ</th><th>Mô tả</th></tr>
    <tr><td>Database</td><td>PostgreSQL 14+</td><td>CSDL quan hệ</td></tr>
    <tr><td>ORM</td><td>Prisma 6.7</td><td>Type-safe database access</td></tr>
    <tr><td>Cache</td><td>Redis</td><td>Session & query cache</td></tr>
    <tr><td>File Storage</td><td>AWS S3</td><td>Lưu trữ tệp đính kèm</td></tr>
  </table>
  
  <div class="subsection-title">2.4. Lớp Tích hợp AI (AI Integration Layer)</div>
  <table>
    <tr><th>Thành phần</th><th>Công nghệ</th><th>Mô tả</th></tr>
    <tr><td>AI Provider</td><td>Abacus AI</td><td>LLM API integration</td></tr>
    <tr><td>Insights Engine</td><td>Custom ML Pipeline</td><td>Phân tích xu hướng, dự báo</td></tr>
    <tr><td>NLP Module</td><td>Sentiment Analysis</td><td>Phân tích văn bản, phản hồi</td></tr>
  </table>
  
  <div class="section-title">III. 7 MIỀN CƠ SỞ DỮ LIỆU</div>
  
  <table>
    <tr><th>STT</th><th>Miền CSDL</th><th>Bảng chính</th><th>Số bản ghi ước tính</th></tr>
    <tr><td>1</td><td>CSDL Quân nhân</td><td>User, CareerHistory</td><td>1,299+</td></tr>
    <tr><td>2</td><td>CSDL Đảng viên</td><td>PartyMember, PartyActivity</td><td>800+</td></tr>
    <tr><td>3</td><td>CSDL Thi đua KT</td><td>AwardsRecord, DisciplineRecord</td><td>500+</td></tr>
    <tr><td>4</td><td>CSDL Chính sách</td><td>PolicyCategory, PolicyRequest</td><td>300+</td></tr>
    <tr><td>5</td><td>CSDL Bảo hiểm XH</td><td>SocialInsurance, InsuranceHistory</td><td>1,299+</td></tr>
    <tr><td>6</td><td>CSDL Giảng viên</td><td>FacultyProfile, TeachingSubject, ResearchProject</td><td>264+</td></tr>
    <tr><td>7</td><td>CSDL Học viên QS</td><td>HocVien, KetQuaHocTap, CourseRegistration</td><td>3,500+</td></tr>
  </table>
  
  <div class="section-title">IV. MÔ HÌNH PHÂN QUYỀN RBAC</div>
  
  <p>Hệ thống áp dụng mô hình Function-based RBAC (Role-Based Access Control dựa trên chức năng) với các thành phần:</p>
  
  <ul>
    <li><b>Position (Chức danh):</b> 23 chức danh chuẩn hóa</li>
    <li><b>Function (Chức năng):</b> 71 function codes theo nhóm nghiệp vụ</li>
    <li><b>PositionFunction:</b> Ma trận gán quyền Position-Function</li>
    <li><b>Scope:</b> Phạm vi truy cập (self / unit / academy)</li>
  </ul>
  
  <div class="section-title">V. TÍNH NĂNG AN TOÀN THÔNG TIN</div>
  
  <ul>
    <li>Mã hóa mật khẩu bcrypt với salt</li>
    <li>Rate limiting cho API đăng nhập</li>
    <li>Input validation với Zod schema</li>
    <li>SQL injection prevention qua Prisma ORM</li>
    <li>Audit Log toàn diện (SUCCESS/FAIL/DENIED)</li>
    <li>Security Event logging (SIEM-ready)</li>
  </ul>
  
  <div style="margin-top: 40pt; text-align: right;">
    <p><i>Hà Nội, ngày ___ tháng ___ năm 2026</i></p>
    <p style="text-indent: 0;"><b>TỔ TRIỂN KHAI</b></p>
  </div>
</div>
</body>
</html>
`;

// Export all document templates
export const DOCUMENT_TEMPLATES = {
  // E1: Hồ sơ Pháp lý - Quản lý
  'E1.1': { id: 'E1.1', name: 'Quyết định phê duyệt chủ trương đầu tư', template: E1_1_QUYET_DINH_PHE_DUYET, category: 'E1' },
  'E1.2': { id: 'E1.2', name: 'Quyết định thành lập Tổ triển khai', template: E1_2_QUYET_DINH_TO_TRIEN_KHAI, category: 'E1' },
  'E2.1': { id: 'E2.1', name: 'Thuyết minh kiến trúc tổng thể', template: E2_1_THUYET_MINH_KIEN_TRUC, category: 'E2' },
};

export const DOCUMENT_CATEGORIES = {
  'E1': 'Hồ sơ Pháp lý - Quản lý',
  'E2': 'Hồ sơ Kiến trúc & Thiết kế',
  'E3': 'Hồ sơ Dữ liệu & CSDL',
  'E4': 'Hồ sơ Phân quyền & RBAC',
  'E5': 'Hồ sơ ATTT',
  'E6': 'Hồ sơ Audit Log & Security',
  'E7': 'Hồ sơ Kiểm thử & Vận hành',
};
