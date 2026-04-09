/**
 * Seed: M10 Learning Materials & Question Banks
 * Tạo dữ liệu mẫu tài liệu học tập và ngân hàng câu hỏi:
 *   - LearningMaterial (tài liệu theo môn học: slides, video, tài liệu tham khảo)
 *   - QuestionBank (ngân hàng câu hỏi theo môn)
 *   - Question (câu hỏi đa dạng loại và độ khó)
 *
 * Phụ thuộc:
 *   - Unit (từ seed_units.ts)
 *   - CurriculumCourse / subjectCode (từ seed_education.ts)
 *
 * Run: npx tsx --require dotenv/config prisma/seed/seed_m10_learning_materials.ts
 */

import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

// ─── Tài liệu học theo môn ──────────────────────────────────────────────────
type MaterialDef = {
  subjectCode: string;
  subjectName: string;
  materials: Array<{
    titleSuffix: string;
    materialType: 'DOCUMENT' | 'PRESENTATION' | 'VIDEO' | 'LINK' | 'OTHER';
    chapter?: string;
    topic?: string;
    format?: string;
    duration?: number;
  }>;
};

const MATERIAL_DEFS: MaterialDef[] = [
  {
    subjectCode: 'CNTT101',
    subjectName: 'Tin học đại cương',
    materials: [
      { titleSuffix: 'Bài giảng Chương 1: Giới thiệu máy tính', materialType: 'PRESENTATION', chapter: '1', topic: 'Cấu trúc máy tính', format: 'pptx' },
      { titleSuffix: 'Bài giảng Chương 2: Hệ điều hành', materialType: 'PRESENTATION', chapter: '2', topic: 'Hệ điều hành', format: 'pptx' },
      { titleSuffix: 'Giáo trình Tin học đại cương', materialType: 'DOCUMENT', chapter: 'all', format: 'pdf' },
      { titleSuffix: 'Video hướng dẫn sử dụng MS Office', materialType: 'VIDEO', topic: 'MS Office', duration: 45 },
      { titleSuffix: 'Bài tập thực hành Word/Excel', materialType: 'DOCUMENT', topic: 'Office', format: 'docx' },
    ],
  },
  {
    subjectCode: 'CNTT201',
    subjectName: 'Lập trình cơ bản',
    materials: [
      { titleSuffix: 'Slides Chương 1: Nhập môn lập trình Python', materialType: 'PRESENTATION', chapter: '1', format: 'pptx' },
      { titleSuffix: 'Slides Chương 2: Cấu trúc điều khiển', materialType: 'PRESENTATION', chapter: '2', format: 'pptx' },
      { titleSuffix: 'Slides Chương 3: Hàm và module', materialType: 'PRESENTATION', chapter: '3', format: 'pptx' },
      { titleSuffix: 'Giáo trình lập trình Python', materialType: 'DOCUMENT', format: 'pdf' },
      { titleSuffix: 'Video series: Python từ cơ bản đến nâng cao', materialType: 'VIDEO', duration: 120 },
      { titleSuffix: 'Bộ bài tập lập trình 50 bài', materialType: 'DOCUMENT', format: 'pdf' },
      { titleSuffix: 'Code mẫu thực hành Chương 1-3', materialType: 'OTHER', format: 'zip' },
    ],
  },
  {
    subjectCode: 'CNTT202',
    subjectName: 'Cấu trúc dữ liệu và giải thuật',
    materials: [
      { titleSuffix: 'Slides CTDL Chương 1: Mảng và danh sách', materialType: 'PRESENTATION', chapter: '1', format: 'pptx' },
      { titleSuffix: 'Slides CTDL Chương 2: Stack và Queue', materialType: 'PRESENTATION', chapter: '2', format: 'pptx' },
      { titleSuffix: 'Slides CTDL Chương 3: Cây và đồ thị', materialType: 'PRESENTATION', chapter: '3', format: 'pptx' },
      { titleSuffix: 'Giáo trình CTDL - Đại học Bách Khoa HN', materialType: 'DOCUMENT', format: 'pdf' },
      { titleSuffix: 'Video: Trực quan hóa giải thuật sắp xếp', materialType: 'VIDEO', duration: 30 },
    ],
  },
  {
    subjectCode: 'CNTT301',
    subjectName: 'Cơ sở dữ liệu',
    materials: [
      { titleSuffix: 'Slides CSDL Chương 1: Mô hình thực thể quan hệ', materialType: 'PRESENTATION', chapter: '1', format: 'pptx' },
      { titleSuffix: 'Slides CSDL Chương 2: Ngôn ngữ SQL', materialType: 'PRESENTATION', chapter: '2', format: 'pptx' },
      { titleSuffix: 'Tài liệu thực hành SQL Server', materialType: 'DOCUMENT', format: 'pdf' },
      { titleSuffix: 'Video hướng dẫn thiết kế CSDL', materialType: 'VIDEO', duration: 60 },
      { titleSuffix: 'Script SQL bài tập thực hành', materialType: 'OTHER', format: 'sql' },
    ],
  },
  {
    subjectCode: 'CNTT302',
    subjectName: 'Mạng máy tính',
    materials: [
      { titleSuffix: 'Slides Mạng Chương 1: Mô hình OSI và TCP/IP', materialType: 'PRESENTATION', chapter: '1', format: 'pptx' },
      { titleSuffix: 'Slides Mạng Chương 2: Địa chỉ IP và subnetting', materialType: 'PRESENTATION', chapter: '2', format: 'pptx' },
      { titleSuffix: 'Tài liệu Cisco CCNA - Routing & Switching', materialType: 'DOCUMENT', format: 'pdf' },
      { titleSuffix: 'Video Lab Cisco Packet Tracer cơ bản', materialType: 'VIDEO', duration: 90 },
      { titleSuffix: 'File Packet Tracer bài thực hành', materialType: 'OTHER', format: 'pkt' },
    ],
  },
  {
    subjectCode: 'CNTT403',
    subjectName: 'An toàn thông tin',
    materials: [
      { titleSuffix: 'Slides ATTT Chương 1: Tổng quan bảo mật thông tin', materialType: 'PRESENTATION', chapter: '1', format: 'pptx' },
      { titleSuffix: 'Slides ATTT Chương 2: Mã hóa và chứng thực', materialType: 'PRESENTATION', chapter: '2', format: 'pptx' },
      { titleSuffix: 'Tài liệu CEH - Ethical Hacking Fundamentals', materialType: 'DOCUMENT', format: 'pdf' },
      { titleSuffix: 'Video: Thực hành Kali Linux cơ bản', materialType: 'VIDEO', duration: 75 },
    ],
  },
  {
    subjectCode: 'KHCB101',
    subjectName: 'Toán cao cấp',
    materials: [
      { titleSuffix: 'Giáo trình Toán cao cấp A1 - ĐHBK HN', materialType: 'DOCUMENT', format: 'pdf' },
      { titleSuffix: 'Slides bài giảng Đại số tuyến tính', materialType: 'PRESENTATION', chapter: '1', format: 'pptx' },
      { titleSuffix: 'Slides Giải tích - Giới hạn và đạo hàm', materialType: 'PRESENTATION', chapter: '2', format: 'pptx' },
      { titleSuffix: '300 bài tập Toán cao cấp có lời giải', materialType: 'DOCUMENT', format: 'pdf' },
    ],
  },
  {
    subjectCode: 'NN101',
    subjectName: 'Tiếng Anh cơ bản 1',
    materials: [
      { titleSuffix: 'Giáo trình Life A1-A2 - Student Book', materialType: 'DOCUMENT', format: 'pdf' },
      { titleSuffix: 'Audio luyện nghe Tiếng Anh A1', materialType: 'OTHER', format: 'mp3', duration: 180 },
      { titleSuffix: 'Video bài học IELTS Foundation', materialType: 'VIDEO', duration: 60 },
      { titleSuffix: 'Bài tập grammar cơ bản - Unit 1-5', materialType: 'DOCUMENT', format: 'pdf' },
    ],
  },
  {
    subjectCode: 'LLCT101',
    subjectName: 'Triết học Mác-Lênin',
    materials: [
      { titleSuffix: 'Giáo trình Triết học Mác-Lênin (Bộ GD&ĐT 2019)', materialType: 'DOCUMENT', format: 'pdf' },
      { titleSuffix: 'Slides Chương 1: Triết học và vai trò trong đời sống', materialType: 'PRESENTATION', chapter: '1', format: 'pptx' },
      { titleSuffix: 'Slides Chương 2: Phép biện chứng duy vật', materialType: 'PRESENTATION', chapter: '2', format: 'pptx' },
      { titleSuffix: 'Đề cương ôn tập và câu hỏi thường gặp', materialType: 'DOCUMENT', format: 'pdf' },
    ],
  },
];

// ─── Ngân hàng câu hỏi ────────────────────────────────────────────────────────
type QuestionBankDef = {
  subjectCode: string;
  subjectName: string;
  questions: Array<{
    code: string;
    content: string;
    questionType: 'MULTIPLE_CHOICE' | 'SINGLE_CHOICE' | 'TRUE_FALSE' | 'ESSAY' | 'CALCULATION';
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    options?: Record<string, string>;
    correctAnswer: string;
    explanation?: string;
    chapter?: string;
    points?: number;
  }>;
};

const QUESTION_BANK_DEFS: QuestionBankDef[] = [
  {
    subjectCode: 'CNTT101',
    subjectName: 'Tin học đại cương',
    questions: [
      {
        code: 'Q01', content: 'CPU là viết tắt của?',
        questionType: 'SINGLE_CHOICE', difficulty: 'EASY',
        options: { A: 'Central Processing Unit', B: 'Computer Processing Unit', C: 'Central Program Unit', D: 'Core Processing Unit' },
        correctAnswer: 'A', chapter: '1',
      },
      {
        code: 'Q02', content: 'RAM là bộ nhớ có đặc điểm nào sau đây?',
        questionType: 'SINGLE_CHOICE', difficulty: 'EASY',
        options: { A: 'Lưu trữ dữ liệu vĩnh viễn', B: 'Lưu trữ tạm thời, mất khi tắt nguồn', C: 'Chỉ đọc không ghi được', D: 'Tốc độ chậm hơn ổ cứng' },
        correctAnswer: 'B', chapter: '1',
      },
      {
        code: 'Q03', content: 'Hệ điều hành Windows được phát triển bởi công ty nào?',
        questionType: 'SINGLE_CHOICE', difficulty: 'EASY',
        options: { A: 'Apple', B: 'Google', C: 'Microsoft', D: 'IBM' },
        correctAnswer: 'C', chapter: '2',
      },
      {
        code: 'Q04', content: '1 GB bằng bao nhiêu MB?',
        questionType: 'SINGLE_CHOICE', difficulty: 'EASY',
        options: { A: '100 MB', B: '512 MB', C: '1000 MB', D: '1024 MB' },
        correctAnswer: 'D', chapter: '1',
      },
      {
        code: 'Q05', content: 'Phần mềm Microsoft Word thuộc loại phần mềm gì?',
        questionType: 'SINGLE_CHOICE', difficulty: 'EASY',
        options: { A: 'Hệ điều hành', B: 'Phần mềm ứng dụng', C: 'Trình điều khiển thiết bị', D: 'Phần mềm hệ thống' },
        correctAnswer: 'B', chapter: '2',
      },
      {
        code: 'Q06', content: 'Trong Excel, hàm SUM dùng để làm gì?',
        questionType: 'SINGLE_CHOICE', difficulty: 'EASY',
        options: { A: 'Tính trung bình cộng', B: 'Tính tổng các giá trị', C: 'Đếm số ô có giá trị', D: 'Tìm giá trị lớn nhất' },
        correctAnswer: 'B', chapter: '3',
      },
      {
        code: 'Q07', content: 'Mô tả nào SAI về CPU?',
        questionType: 'SINGLE_CHOICE', difficulty: 'MEDIUM',
        options: { A: 'CPU thực hiện các phép tính số học', B: 'CPU điều phối hoạt động các thiết bị', C: 'CPU lưu trữ dữ liệu dài hạn', D: 'CPU giải mã và thực thi lệnh' },
        correctAnswer: 'C', chapter: '1',
        explanation: 'CPU không lưu trữ dữ liệu dài hạn. Dữ liệu dài hạn được lưu trên HDD/SSD.',
      },
      {
        code: 'Q08', content: 'Giải thích sự khác biệt giữa RAM và ROM.',
        questionType: 'ESSAY', difficulty: 'MEDIUM',
        correctAnswer: 'RAM là bộ nhớ đọc-ghi, dữ liệu mất khi tắt nguồn. ROM là bộ nhớ chỉ đọc, lưu trữ vĩnh viễn.',
        chapter: '1', points: 2,
      },
    ],
  },
  {
    subjectCode: 'CNTT201',
    subjectName: 'Lập trình cơ bản',
    questions: [
      {
        code: 'Q01', content: 'Trong Python, từ khóa nào dùng để định nghĩa hàm?',
        questionType: 'SINGLE_CHOICE', difficulty: 'EASY',
        options: { A: 'function', B: 'def', C: 'func', D: 'define' },
        correctAnswer: 'B', chapter: '3',
      },
      {
        code: 'Q02', content: 'Kết quả của biểu thức Python: len("Hello") là?',
        questionType: 'SINGLE_CHOICE', difficulty: 'EASY',
        options: { A: '4', B: '5', C: '6', D: 'Error' },
        correctAnswer: 'B', chapter: '1',
      },
      {
        code: 'Q03', content: 'Vòng lặp for trong Python duyệt qua từng phần tử của iterable.',
        questionType: 'TRUE_FALSE', difficulty: 'EASY',
        correctAnswer: 'True', chapter: '2',
      },
      {
        code: 'Q04', content: 'Kết quả của: print(type(3.14)) là?',
        questionType: 'SINGLE_CHOICE', difficulty: 'EASY',
        options: { A: "<class 'int'>", B: "<class 'str'>", C: "<class 'float'>", D: "<class 'double'>" },
        correctAnswer: 'C', chapter: '1',
      },
      {
        code: 'Q05', content: 'Cấu trúc nào SAI về cú pháp hàm Python?',
        questionType: 'SINGLE_CHOICE', difficulty: 'MEDIUM',
        options: { A: 'def func():', B: 'def func(x, y):', C: 'def func(x=5):', D: 'def func{x}:' },
        correctAnswer: 'D', chapter: '3',
        explanation: 'Python dùng dấu () cho tham số hàm, không dùng {}.',
      },
      {
        code: 'Q06', content: 'Danh sách (list) trong Python có thể chứa các phần tử khác kiểu dữ liệu với nhau.',
        questionType: 'TRUE_FALSE', difficulty: 'EASY',
        correctAnswer: 'True', chapter: '1',
      },
      {
        code: 'Q07', content: 'Viết hàm Python tính giai thừa n! sử dụng đệ quy.',
        questionType: 'ESSAY', difficulty: 'MEDIUM',
        correctAnswer: 'def factorial(n): return 1 if n <= 1 else n * factorial(n-1)',
        chapter: '3', points: 3,
      },
      {
        code: 'Q08', content: 'Kết quả của: [x**2 for x in range(5)] là?',
        questionType: 'SINGLE_CHOICE', difficulty: 'HARD',
        options: { A: '[1,4,9,16,25]', B: '[0,1,4,9,16]', C: '[0,1,2,3,4]', D: '[1,2,3,4,5]' },
        correctAnswer: 'B', chapter: '2',
        explanation: 'range(5) tạo dãy 0,1,2,3,4. x**2 cho kết quả 0,1,4,9,16.',
      },
      {
        code: 'Q09', content: 'Module nào trong Python dùng để làm việc với file?',
        questionType: 'SINGLE_CHOICE', difficulty: 'MEDIUM',
        options: { A: 'file', B: 'io', C: 'os', D: 'sys' },
        correctAnswer: 'C', chapter: '4',
      },
      {
        code: 'Q10', content: 'Exception handling trong Python sử dụng khối lệnh nào?',
        questionType: 'SINGLE_CHOICE', difficulty: 'MEDIUM',
        options: { A: 'try/catch', B: 'try/except', C: 'try/handle', D: 'catch/finally' },
        correctAnswer: 'B', chapter: '5',
      },
    ],
  },
  {
    subjectCode: 'CNTT301',
    subjectName: 'Cơ sở dữ liệu',
    questions: [
      {
        code: 'Q01', content: 'SQL là viết tắt của?',
        questionType: 'SINGLE_CHOICE', difficulty: 'EASY',
        options: { A: 'Structured Query Language', B: 'Simple Query Language', C: 'Standard Query Logic', D: 'Sequential Query Language' },
        correctAnswer: 'A', chapter: '2',
      },
      {
        code: 'Q02', content: 'Câu lệnh SQL nào dùng để lấy dữ liệu từ bảng?',
        questionType: 'SINGLE_CHOICE', difficulty: 'EASY',
        options: { A: 'GET', B: 'FETCH', C: 'SELECT', D: 'RETRIEVE' },
        correctAnswer: 'C', chapter: '2',
      },
      {
        code: 'Q03', content: 'PRIMARY KEY trong cơ sở dữ liệu quan hệ có đặc điểm gì?',
        questionType: 'MULTIPLE_CHOICE', difficulty: 'MEDIUM',
        options: { A: 'Giá trị phải duy nhất', B: 'Không được NULL', C: 'Có thể có nhiều PK trong một bảng', D: 'Chỉ dùng một cột' },
        correctAnswer: 'A,B',
        chapter: '1',
        explanation: 'PK phải unique và NOT NULL. Một bảng chỉ có 1 PK nhưng PK có thể là composite (nhiều cột).',
      },
      {
        code: 'Q04', content: 'INNER JOIN trả về các bản ghi tồn tại ở CẢ HAI bảng.',
        questionType: 'TRUE_FALSE', difficulty: 'EASY',
        correctAnswer: 'True', chapter: '2',
      },
      {
        code: 'Q05', content: 'Viết câu SQL lấy danh sách học viên có điểm trung bình >= 7.0, sắp xếp theo điểm giảm dần.',
        questionType: 'ESSAY', difficulty: 'MEDIUM',
        correctAnswer: "SELECT * FROM hoc_vien WHERE diem_tb >= 7.0 ORDER BY diem_tb DESC",
        chapter: '2', points: 3,
      },
      {
        code: 'Q06', content: 'Dạng chuẩn 1NF (First Normal Form) yêu cầu điều gì?',
        questionType: 'SINGLE_CHOICE', difficulty: 'HARD',
        options: { A: 'Không có thuộc tính đa trị', B: 'Mọi phụ thuộc hàm qua khóa chính', C: 'Không có phụ thuộc bắc cầu', D: 'Mọi quan hệ đều có BCNF' },
        correctAnswer: 'A', chapter: '3',
        explanation: '1NF yêu cầu tất cả các giá trị trong cột phải nguyên tố (atomic), không có nhóm lặp.',
      },
    ],
  },
  {
    subjectCode: 'CNTT302',
    subjectName: 'Mạng máy tính',
    questions: [
      {
        code: 'Q01', content: 'Mô hình OSI có bao nhiêu tầng?',
        questionType: 'SINGLE_CHOICE', difficulty: 'EASY',
        options: { A: '4', B: '5', C: '6', D: '7' },
        correctAnswer: 'D', chapter: '1',
      },
      {
        code: 'Q02', content: 'Giao thức TCP/IP thuộc tầng nào trong mô hình OSI?',
        questionType: 'SINGLE_CHOICE', difficulty: 'MEDIUM',
        options: { A: 'Tầng 3 - Network', B: 'Tầng 4 - Transport', C: 'Tầng 3 và 4', D: 'Tầng 2 - Data Link' },
        correctAnswer: 'C', chapter: '1',
        explanation: 'IP thuộc tầng Network (L3), TCP thuộc tầng Transport (L4).',
      },
      {
        code: 'Q03', content: 'Địa chỉ IP 192.168.1.0/24 có bao nhiêu host khả dụng?',
        questionType: 'CALCULATION', difficulty: 'MEDIUM',
        correctAnswer: '254',
        chapter: '2', points: 2,
        explanation: '2^8 - 2 = 254 (trừ network address và broadcast address)',
      },
      {
        code: 'Q04', content: 'DHCP server cấp phát địa chỉ IP động cho client.',
        questionType: 'TRUE_FALSE', difficulty: 'EASY',
        correctAnswer: 'True', chapter: '3',
      },
      {
        code: 'Q05', content: 'Giao thức nào đảm bảo truyền tin cậy (reliable) trong TCP/IP?',
        questionType: 'SINGLE_CHOICE', difficulty: 'EASY',
        options: { A: 'UDP', B: 'TCP', C: 'IP', D: 'ICMP' },
        correctAnswer: 'B', chapter: '2',
      },
    ],
  },
  {
    subjectCode: 'KHCB101',
    subjectName: 'Toán cao cấp',
    questions: [
      {
        code: 'Q01', content: 'Giá trị của lim(x→0) sin(x)/x là?',
        questionType: 'SINGLE_CHOICE', difficulty: 'MEDIUM',
        options: { A: '0', B: '1', C: 'vô định', D: 'vô cực' },
        correctAnswer: 'B', chapter: '2',
      },
      {
        code: 'Q02', content: 'Đạo hàm của hàm số f(x) = x^3 - 2x + 1 là?',
        questionType: 'SINGLE_CHOICE', difficulty: 'EASY',
        options: { A: '3x^2', B: '3x^2 - 2', C: 'x^3 - 2', D: '3x^2 - 2x' },
        correctAnswer: 'B', chapter: '2',
      },
      {
        code: 'Q03', content: 'Tính tích phân ∫(0 to 1) x^2 dx',
        questionType: 'CALCULATION', difficulty: 'MEDIUM',
        correctAnswer: '1/3',
        chapter: '3', points: 2,
      },
      {
        code: 'Q04', content: 'Ma trận vuông A là khả nghịch khi và chỉ khi det(A) ≠ 0.',
        questionType: 'TRUE_FALSE', difficulty: 'MEDIUM',
        correctAnswer: 'True', chapter: '1',
      },
      {
        code: 'Q05', content: 'Rank của ma trận A: [[1,2,3],[4,5,6],[7,8,9]] là?',
        questionType: 'SINGLE_CHOICE', difficulty: 'HARD',
        options: { A: '1', B: '2', C: '3', D: '0' },
        correctAnswer: 'B', chapter: '1',
        explanation: 'Hàng 3 = Hàng 1 + 2*(Hàng 2 - Hàng 1), nên rank = 2.',
      },
    ],
  },
];

async function main() {
  console.log('📚 Bắt đầu seed M10 Learning Materials...\n');

  const units = await prisma.unit.findMany({
    where: { type: { in: ['FACULTY', 'DEPARTMENT', 'KHOA', 'PHONG'] } },
    select: { id: true },
    take: 5,
  });

  // ─── 1. LearningMaterial ──────────────────────────────────────────────────────
  console.log('1️⃣  Tạo LearningMaterial...');
  let materialCreated = 0;
  let matIdx = 0;

  for (const subjectDef of MATERIAL_DEFS) {
    for (let i = 0; i < subjectDef.materials.length; i++) {
      const mat = subjectDef.materials[i];
      const code = `LM-${subjectDef.subjectCode}-${String(i + 1).padStart(2, '0')}`;

      const existing = await prisma.learningMaterial.findUnique({ where: { code } });
      if (existing) { matIdx++; continue; }

      await prisma.learningMaterial.create({
        data: {
          code,
          title: `[${subjectDef.subjectCode}] ${mat.titleSuffix}`,
          description: `Tài liệu học tập môn ${subjectDef.subjectName}`,
          subjectCode: subjectDef.subjectCode,
          subjectName: subjectDef.subjectName,
          materialType: mat.materialType,
          format: mat.format ?? null,
          fileUrl: mat.materialType !== 'LINK'
            ? `/materials/${subjectDef.subjectCode.toLowerCase()}/${code}.${mat.format ?? 'pdf'}`
            : null,
          fileName: mat.format ? `${code}.${mat.format}` : null,
          fileSize: mat.materialType === 'VIDEO' ? 500_000_000 : mat.materialType === 'DOCUMENT' ? 5_000_000 : 2_000_000,
          duration: mat.duration ?? null,
          unitId: units.length > 0 ? pick(units, matIdx).id : null,
          chapter: mat.chapter ?? null,
          topic: mat.topic ?? null,
          tags: [subjectDef.subjectCode, mat.materialType.toLowerCase(), mat.chapter ?? 'general'],
          accessLevel: 'INTERNAL',
          isActive: true,
          publishedAt: new Date('2025-09-01'),
          viewCount: Math.floor(Math.random() * 200) + 20,
          downloadCount: Math.floor(Math.random() * 100) + 5,
          version: '1.0',
        },
      });
      materialCreated++;
      matIdx++;
    }
  }
  console.log(`  ✔ LearningMaterial tạo: ${materialCreated}\n`);

  // ─── 2. QuestionBank ──────────────────────────────────────────────────────────
  console.log('2️⃣  Tạo QuestionBank...');
  const bankMap = new Map<string, string>(); // subjectCode → bankId
  let bankCreated = 0;

  for (let i = 0; i < QUESTION_BANK_DEFS.length; i++) {
    const def = QUESTION_BANK_DEFS[i];
    const bankCode = `QB-${def.subjectCode}`;

    const existing = await prisma.questionBank.findUnique({ where: { code: bankCode } });
    if (existing) {
      bankMap.set(def.subjectCode, existing.id);
      continue;
    }

    const created = await prisma.questionBank.create({
      data: {
        code: bankCode,
        name: `Ngân hàng câu hỏi - ${def.subjectName}`,
        subjectCode: def.subjectCode,
        subjectName: def.subjectName,
        unitId: units.length > 0 ? pick(units, i).id : null,
        description: `Ngân hàng câu hỏi chính thức môn ${def.subjectName}, dùng cho thi giữa kỳ và cuối kỳ`,
        totalQuestions: def.questions.length,
        isActive: true,
        isPublic: false,
      },
    });
    bankMap.set(def.subjectCode, created.id);
    bankCreated++;
  }
  console.log(`  ✔ QuestionBank tạo: ${bankCreated}\n`);

  // ─── 3. Question ──────────────────────────────────────────────────────────────
  console.log('3️⃣  Tạo Question...');
  let questionCreated = 0;

  for (const def of QUESTION_BANK_DEFS) {
    const bankId = bankMap.get(def.subjectCode);
    if (!bankId) continue;

    for (const q of def.questions) {
      const existing = await prisma.question.findUnique({
        where: { questionBankId_code: { questionBankId: bankId, code: q.code } },
      });
      if (existing) continue;

      await prisma.question.create({
        data: {
          questionBankId: bankId,
          code: q.code,
          content: q.content,
          contentType: 'TEXT',
          questionType: q.questionType,
          options: q.options ?? null,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation ?? null,
          difficulty: q.difficulty,
          points: q.points ?? 1,
          chapter: q.chapter ?? null,
          tags: [def.subjectCode, q.difficulty.toLowerCase(), q.questionType.toLowerCase()],
          status: 'ACTIVE',
          isActive: true,
          usageCount: Math.floor(Math.random() * 50),
        },
      });
      questionCreated++;
    }
  }

  // Cập nhật totalQuestions theo số câu hỏi thực tế
  for (const [subjectCode, bankId] of Array.from(bankMap)) {
    const total = await prisma.question.count({ where: { questionBankId: bankId } });
    await prisma.questionBank.update({
      where: { id: bankId },
      data: { totalQuestions: total },
    });
  }

  console.log(`  ✔ Question tạo: ${questionCreated}\n`);

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log('📊 TỔNG KẾT:');
  const [matCount, bankCount, qCount] = await Promise.all([
    prisma.learningMaterial.count(),
    prisma.questionBank.count(),
    prisma.question.count(),
  ]);
  console.log(`  LearningMaterial: ${matCount}`);
  console.log(`  QuestionBank:     ${bankCount}`);
  console.log(`  Question:         ${qCount}`);
  console.log('\n✅ Seed M10 Learning Materials hoàn tất!');
}

main()
  .catch(e => { console.error('❌ Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
