/**
 * Seed: Missing Data – FamilyRelations, ResearchFiles, ScientificResearch,
 *        MLModels/Experiments, ForeignLangCerts, TechCerts, PolicyRequests
 * Field names verified against actual DB schema.
 */
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

function pick<T>(arr: readonly T[], s: number): T { return arr[Math.abs(s) % arr.length]; }
function rnd(min: number, max: number, s: number): number {
  return parseFloat((min + (Math.abs(Math.sin(s * 3571)) % 1) * (max - min)).toFixed(2));
}
function randDate(start: Date, end: Date, s: number): Date {
  const diff = end.getTime() - start.getTime();
  return new Date(start.getTime() + (Math.abs(Math.sin(s * 1777)) % 1) * diff);
}
function uid() { return Math.random().toString(36).slice(2,11) + Date.now().toString(36); }

// ──────────────────────────────────────────────────────────────────
// 1. FAMILY RELATIONS
// ──────────────────────────────────────────────────────────────────
const RELATION_TYPES = ['SPOUSE','CHILD','FATHER','MOTHER','SIBLING','CHILD','SPOUSE','SIBLING'] as const;
const HO = ['Nguyễn','Trần','Lê','Phạm','Vũ','Đặng','Bùi','Hồ'];
const TEN = ['Văn An','Thị Bình','Văn Cường','Thị Dung','Văn Em','Thị Phương',
             'Văn Giang','Thị Hằng','Văn Long','Thị Kim','Văn Minh','Thị Mơ'];

async function seedFamilyRelations(users: { id: string }[]) {
  console.log('👨‍👩‍👧‍👦 Seeding FamilyRelations...');
  let created = 0;
  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    const num = 1 + (i % 3);
    for (let j = 0; j < num; j++) {
      const s = i * 11 + j + 1;
      const rel = pick(RELATION_TYPES, s);
      const birthYear = 1950 + (s % 50);
      await prisma.familyRelation.create({
        data: {
          userId: u.id,
          fullName: `${pick(HO, s)} ${pick(TEN, s * 7)}`,
          relation: rel as any,
          dateOfBirth: new Date(birthYear, (s * 3) % 12, 1 + (s % 27)),
          occupation: pick(['Giáo viên','Quân nhân','Công nhân','Nông dân','Cán bộ','Kế toán'], s),
          phoneNumber: `09${String(10000000 + s).padStart(8, '0')}`,
          address: `Số ${10 + s % 200}, ${pick(['Đường Lê Lợi','Phố Trần Hưng Đạo','Ngõ Nguyễn Trãi','Đường Điện Biên Phủ'], s)}, TP Hà Nội`,
          notes: rel === 'SPOUSE' ? 'Hôn nhân hợp pháp' : null,
        },
      });
      created++;
    }
  }
  console.log(`  ✔ FamilyRelation: ${created} created`);
}

// ──────────────────────────────────────────────────────────────────
// 2. RESEARCH FILES (Digital Documents)
// ──────────────────────────────────────────────────────────────────
const DOC_TITLES = [
  'Quy chế đào tạo đại học hệ chính quy 2025',
  'Kế hoạch huấn luyện năm học 2025-2026',
  'Báo cáo tổng kết công tác đảng năm 2025',
  'Hướng dẫn quản lý quân số và trang bị',
  'Quy định chế độ chính sách quân nhân',
  'Giáo trình Kỹ thuật hậu cần tập 1',
  'Giáo trình Quản lý tài chính quân sự',
  'Đề án phát triển khoa học công nghệ 2025-2030',
  'Báo cáo nghiên cứu ứng dụng AI trong hậu cần',
  'Tài liệu bồi dưỡng nghiệp vụ giảng viên',
  'Quy trình cấp phát quân trang chuẩn hóa',
  'Biểu mẫu lý lịch quân nhân 2A-LLDV',
  'Hướng dẫn sử dụng hệ thống HVHC BigData',
  'Kế hoạch kiểm tra học kỳ 1 năm 2025-2026',
  'Bản tin khoa học quân sự số 12/2025',
  'Nghiên cứu tối ưu chuỗi cung ứng hậu cần',
  'Tài liệu thực hành phòng thí nghiệm vật lý',
  'Báo cáo kết quả học tập toàn khóa HC2022',
  'Quyết định 144/BQP quản lý đảng viên quân đội',
  'Thông tư hướng dẫn bảo hiểm quân nhân 2025',
  'Sổ tay sinh viên học viên khóa 2024',
  'Quy trình quản lý tài sản vật tư kỹ thuật',
  'Báo cáo kiểm toán nội bộ quý 4/2025',
  'Kế hoạch đào tạo sau đại học năm 2026',
  'Hướng dẫn an toàn thông tin hệ thống HVHC',
];
const DEPARTMENTS = ['Phòng Đào tạo','Khoa CNTT','Khoa Hậu cần','Phòng Chính trị','Phòng Kế hoạch','Ban Giám đốc','Phòng Tài chính'];
const FILE_TYPES_DB = ['RESEARCH_PAPER','DATASET','REPORT','PRESENTATION','OTHER','RESEARCH_PAPER','REPORT'] as const;
const CLASSIFICATIONS = ['INTERNAL','PUBLIC','CONFIDENTIAL','INTERNAL','PUBLIC'] as const;
const DOC_STATUSES = ['COMPLETED','COMPLETED','COMPLETED','COMPLETED'] as const;
type FT = typeof FILE_TYPES_DB[number];
const MIME: Record<string, string> = { RESEARCH_PAPER:'application/pdf', DATASET:'text/csv', REPORT:'application/pdf', PRESENTATION:'application/vnd.ms-powerpoint', OTHER:'application/pdf', MODEL:'application/octet-stream' };
const EXT: Record<string, string> = { RESEARCH_PAPER:'pdf', DATASET:'csv', REPORT:'pdf', PRESENTATION:'pptx', OTHER:'pdf', MODEL:'pkl' };

async function seedResearchFiles(uploaderIds: string[]) {
  console.log('📁 Seeding ResearchFiles (Digital Documents)...');
  let created = 0;
  for (let i = 0; i < DOC_TITLES.length; i++) {
    const s = i + 1;
    const ft = pick(FILE_TYPES_DB, s);
    const title = DOC_TITLES[i];
    const safeTitle = title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_').slice(0, 40);
    await prisma.researchFile.create({
      data: {
        title,
        fileName: `${safeTitle}.${EXT[ft]}`,
        originalName: `${safeTitle}.${EXT[ft]}`,
        fileType: ft as any,
        fileSize: Math.floor(rnd(50, 5000, s) * 1024),
        mimeType: MIME[ft],
        bucketName: 'hvhc-documents',
        objectKey: `documents/2025/${safeTitle}.${EXT[ft]}`,
        department: pick(DEPARTMENTS, s),
        classification: pick(CLASSIFICATIONS, s) as any,
        status: pick(DOC_STATUSES, s) as any,
        tags: [pick(['giáo trình','quy định','báo cáo','hướng dẫn','nghiên cứu'], s), pick(['2025','quân sự','hậu cần','đào tạo'], s * 3)],
        keywords: title.toLowerCase().split(/\s+/).filter(w => w.length > 3).slice(0, 10),
        description: `Tài liệu: ${title}. Ban hành năm 2025.`,
        uploadedBy: pick(uploaderIds, s),
        downloadCount: Math.floor(rnd(0, 80, s)),
        viewCount: Math.floor(rnd(5, 300, s)),
        version: 1,
        isLatest: true,
        uploadedAt: randDate(new Date('2024-01-01'), new Date('2026-02-28'), s),
      },
    });
    created++;
  }
  console.log(`  ✔ ResearchFile: ${created} created`);
}

// ──────────────────────────────────────────────────────────────────
// 3. SCIENTIFIC RESEARCH – verified schema: userId, title, year, role, level, type, institution, result
// ──────────────────────────────────────────────────────────────────
const RESEARCH_TITLES = [
  'Ứng dụng AI trong quản lý hậu cần quân đội',
  'Hệ thống BigData cho học viện quân sự',
  'Tối ưu hóa chuỗi cung ứng vật tư quân sự bằng ML',
  'Mô hình dự báo nhu cầu quân trang theo lịch sử dữ liệu',
  'Ứng dụng blockchain quản lý tài sản quân đội',
  'Phương pháp giảng dạy hiện đại cho sĩ quan',
  'Hệ thống đánh giá học viên dựa trên AI',
  'Phân tích hiệu quả bảo hiểm quân nhân 2020-2025',
  'Nghiên cứu tự động hóa quy trình hành chính quân sự',
  'Mô hình số hóa kho vật tư kỹ thuật toàn quân',
];
const RESEARCH_TYPES = ['ĐỀ TÀI CẤP HỌC VIỆN','ĐỀ TÀI CẤP BỘ','SÁNG KIẾN','ĐỀ TÀI NGHIÊN CỨU ỨNG DỤNG'];
const RESEARCH_LEVELS = ['ACADEMY','MINISTRY','NATIONAL'];
const RESEARCH_ROLES = ['CHU_NHIEM','THAM_GIA','THANH_VIEN'] as const;
const INSTITUTIONS = ['Học viện Hậu cần','Học viện Kỹ thuật Quân sự','Đại học Bách khoa Hà Nội','Viện Khoa học Quân sự'];

async function seedScientificResearch(authorIds: string[]) {
  console.log('🔬 Seeding ScientificResearch...');
  let created = 0;
  for (let i = 0; i < RESEARCH_TITLES.length; i++) {
    const s = i + 1;
    const startYear = 2022 + (s % 3);
    await prisma.scientificResearch.create({
      data: {
        userId: pick(authorIds, s),
        title: RESEARCH_TITLES[i],
        year: startYear,
        role: pick(RESEARCH_ROLES, s) as any,
        level: pick(RESEARCH_LEVELS, s),
        type: pick(RESEARCH_TYPES, s),
        institution: pick(INSTITUTIONS, s),
        result: s % 3 === 0 ? 'Đạt loại Xuất sắc' : s % 3 === 1 ? 'Đạt loại Khá' : 'Đang triển khai',
        notes: `Đề tài được nghiệm thu ${s % 2 === 0 ? 'cấp Học viện' : 'cấp Bộ'} năm ${startYear + 1}`,
      },
    });
    created++;
  }
  console.log(`  ✔ ScientificResearch: ${created} created`);
}

// ──────────────────────────────────────────────────────────────────
// 4. ML MODELS + EXPERIMENTS – verified schema
// ──────────────────────────────────────────────────────────────────
const ML_MODELS_DATA = [
  { name: 'Dự báo kết quả học tập', type: 'CLASSIFICATION', acc: 0.87, fw: 'XGBOOST' },
  { name: 'Phát hiện bất thường nhân sự', type: 'OTHER', acc: 0.91, fw: 'SCIKIT_LEARN' },
  { name: 'Gợi ý khóa học cá nhân hóa', type: 'OTHER', acc: 0.82, fw: 'SCIKIT_LEARN' },
  { name: 'Dự báo nhu cầu quân trang', type: 'REGRESSION', acc: 0.79, fw: 'SCIKIT_LEARN' },
  { name: 'Phân tích cảm xúc phản hồi', type: 'NLP', acc: 0.85, fw: 'HUGGINGFACE' },
  { name: 'Phân loại văn bản tài liệu', type: 'CLASSIFICATION', acc: 0.89, fw: 'OTHER' },
];
const EXP_NAMES = ['Baseline thử nghiệm','Tinh chỉnh siêu tham số','Thêm đặc trưng mới','So sánh mô hình A/B','Đánh giá tập test thực'];
const MODEL_STATUSES = ['DEPLOYED','TRAINED','VALIDATING'] as const;

async function seedMLModels(ownerIds: string[]) {
  console.log('🤖 Seeding MLModels + MLExperiments...');
  let modelCount = 0, expCount = 0;
  for (let i = 0; i < ML_MODELS_DATA.length; i++) {
    const m = ML_MODELS_DATA[i];
    const s = i + 1;
    const model = await prisma.mLModel.create({
      data: {
        name: m.name,
        description: `Mô hình ${m.type} – ${m.name}. Huấn luyện trên dữ liệu thực tế HVHC.`,
        modelType: m.type as any,
        framework: m.fw as any,
        ownerId: pick(ownerIds, s),
        version: `${s}.0.0`,
        isLatest: true,
        accuracy: m.acc,
        precision: rnd(0.75, 0.95, s * 3),
        recall: rnd(0.70, 0.93, s * 7),
        f1Score: rnd(0.72, 0.94, s * 11),
        hyperparameters: { n_estimators: 100 + s * 10, max_depth: 6 + s % 5, learning_rate: 0.01 * (1 + s % 5) },
        tags: [m.type.toLowerCase(), m.fw.toLowerCase().split(/[- ]/)[0]],
        status: pick(MODEL_STATUSES, s) as any,
        trainingCompletedAt: randDate(new Date('2024-06-01'), new Date('2026-01-01'), s),
      },
    });
    modelCount++;

    const numExp = 2 + (i % 2);
    for (let j = 0; j < numExp; j++) {
      const es = s * 7 + j + 1;
      const start = randDate(new Date('2024-06-01'), new Date('2025-10-01'), es);
      const end = new Date(start.getTime() + 1000 * 3600 * (12 + j * 24));
      await prisma.ml_experiments.create({
        data: {
          id: `exp_${model.id.slice(0,8)}_${j}_${es}`,
          name: `${EXP_NAMES[j % EXP_NAMES.length]} – ${m.name}`,
          description: `Thử nghiệm ${j + 1} cho mô hình ${m.name}`,
          model_id: model.id,
          status: pick(['completed','failed','running'] as const, es),
          parameters: { lr: 0.001 * (1 + j), epochs: 50 + j * 10, batch_size: 32 },
          results: { accuracy: rnd(0.70, m.acc, es), loss: rnd(0.05, 0.3, es * 3) },
          tags: JSON.stringify([m.type.toLowerCase()]),
          created_by: pick(ownerIds, es),
          start_time: start,
          end_time: end,
        },
      });
      expCount++;
    }
  }
  console.log(`  ✔ MLModel: ${modelCount}, MLExperiment: ${expCount}`);
}

// ──────────────────────────────────────────────────────────────────
// 5. FOREIGN LANGUAGE CERTS – schema: userId,language,certType,certLevel,framework,certNumber,issueDate,issuer,expiryDate
// ──────────────────────────────────────────────────────────────────
const LANG_CERTS = [
  { lang: 'English', type: 'IELTS', levels: ['5.5','6.0','6.5','7.0'], issuer: 'British Council' },
  { lang: 'English', type: 'TOEIC', levels: ['600','650','700','750','800'], issuer: 'ETS Vietnam' },
  { lang: 'Russian', type: 'ТРКИ', levels: ['B1','B2','C1'], issuer: 'Viện Văn hóa Nga' },
  { lang: 'Chinese', type: 'HSK', levels: ['4','5','6'], issuer: 'Hanban' },
];

async function seedForeignLanguageCerts(userIds: string[]) {
  console.log('🌐 Seeding ForeignLanguageCerts...');
  let created = 0;
  const eligible = userIds.filter((_, i) => i % 3 !== 0).slice(0, 80);
  for (let i = 0; i < eligible.length; i++) {
    const s = i + 1;
    const cert = pick(LANG_CERTS, s);
    const issueDate = randDate(new Date('2018-01-01'), new Date('2025-01-01'), s);
    await prisma.foreignLanguageCert.create({
      data: {
        userId: eligible[i],
        language: cert.lang,
        certType: cert.type,
        certLevel: pick(cert.levels, s * 3),
        certNumber: `FL${String(100000 + s).padStart(6,'0')}`,
        issuer: cert.issuer,
        issueDate,
        expiryDate: new Date(issueDate.getFullYear() + 2, issueDate.getMonth(), issueDate.getDate()),
      },
    });
    created++;
  }
  console.log(`  ✔ ForeignLanguageCert: ${created}`);
}

// ──────────────────────────────────────────────────────────────────
// 6. TECHNICAL CERTS – schema: userId,certType,certName,certNumber,classification,issueDate,issuer,decisionNumber
// ──────────────────────────────────────────────────────────────────
const TECH_CERTS = [
  { type: 'NETWORKING', name: 'Chứng chỉ CCNA', issuer: 'Cisco Systems' },
  { type: 'SECURITY', name: 'Chứng chỉ An ninh mạng', issuer: 'Bộ Thông tin & Truyền thông' },
  { type: 'MANAGEMENT', name: 'Chứng chỉ Quản lý dự án PMP', issuer: 'Project Management Institute' },
  { type: 'QUALITY', name: 'Chứng chỉ ISO 9001 Lead Auditor', issuer: 'Bureau Veritas Vietnam' },
  { type: 'DRIVING', name: 'Bằng lái xe hạng B2', issuer: 'Cục CSGT Bộ Công an' },
  { type: 'LEADERSHIP', name: 'Chứng nhận kỹ năng lãnh đạo quân sự', issuer: 'Học viện Hậu cần' },
];

async function seedTechnicalCerts(userIds: string[]) {
  console.log('📜 Seeding TechnicalCerts...');
  let created = 0;
  const eligible = userIds.filter((_, i) => i % 4 !== 0).slice(0, 60);
  for (let i = 0; i < eligible.length; i++) {
    const s = i + 1;
    const cert = pick(TECH_CERTS, s);
    const issueDate = randDate(new Date('2015-01-01'), new Date('2025-12-31'), s);
    await prisma.technicalCertificate.create({
      data: {
        userId: eligible[i],
        certType: cert.type,
        certName: cert.name,
        certNumber: `TC${String(200000 + s).padStart(6,'0')}`,
        classification: 'PROFESSIONAL',
        issuer: cert.issuer,
        issueDate,
        decisionNumber: `QĐ ${3000 + s}/BQP`,
        decisionDate: issueDate,
      },
    });
    created++;
  }
  console.log(`  ✔ TechnicalCertificate: ${created}`);
}

// ──────────────────────────────────────────────────────────────────
// 7. POLICY CATEGORIES + REQUESTS
// ──────────────────────────────────────────────────────────────────
const POLICY_CATS = [
  { code: 'PCAT_THAMNIENWN', name: 'Phụ cấp thâm niên', desc: 'Chính sách phụ cấp theo thâm niên công tác' },
  { code: 'PCAT_NGHIPHEP', name: 'Chế độ nghỉ phép', desc: 'Quy định nghỉ phép hàng năm quân nhân' },
  { code: 'PCAT_BODONG', name: 'Bổ sung chế độ', desc: 'Chính sách bổ sung chế độ đặc biệt' },
  { code: 'PCAT_KHENTHUONG', name: 'Khen thưởng xuất sắc', desc: 'Chính sách khen thưởng cá nhân xuất sắc' },
  { code: 'PCAT_DAOTAO', name: 'Hỗ trợ đào tạo', desc: 'Hỗ trợ kinh phí đào tạo nâng cao trình độ' },
];
const REQ_TITLES = [
  'Đề nghị xét phụ cấp thâm niên theo TT14/2023/TT-BQP',
  'Xin điều chỉnh chế độ nghỉ phép do hoàn cảnh đặc biệt',
  'Đề nghị xét khen thưởng hoàn thành xuất sắc nhiệm vụ 2025',
  'Xin hỗ trợ kinh phí đào tạo sau đại học nước ngoài',
  'Đề nghị bổ sung chế độ cho quân nhân vùng khó khăn',
];

async function seedPolicyCategoriesAndRequests(userIds: string[]) {
  console.log('📋 Seeding PolicyCategories + PolicyRequests...');
  let catCreated = 0;
  const catIds: string[] = [];
  for (const cat of POLICY_CATS) {
    const existing = await prisma.policyCategory.findFirst({ where: { code: cat.code } });
    if (existing) { catIds.push(existing.id); continue; }
    const c = await prisma.policyCategory.create({
      data: { code: cat.code, name: cat.name, description: cat.desc, isActive: true, requiresApproval: true, approvalLevels: 2 },
    });
    catIds.push(c.id);
    catCreated++;
  }

  let reqCreated = 0;
  const STATUSES_REQ = ['PENDING','APPROVED','APPROVED','REJECTED','PENDING'] as const;
  const requestors = userIds.slice(0, 60);
  for (let i = 0; i < requestors.length; i++) {
    const s = i + 1;
    const status = pick(STATUSES_REQ, s);
    const submittedAt = randDate(new Date('2025-01-01'), new Date('2026-03-01'), s);
    await prisma.policyRequest.create({
      data: {
        requestNumber: `PR2025${String(s).padStart(5,'0')}`,
        requesterId: requestors[i],
        categoryId: pick(catIds, s),
        title: pick(REQ_TITLES, s),
        description: `${pick(REQ_TITLES, s)}. Căn cứ quyết định số ${1000 + s}/QĐ-HVHC.`,
        reason: 'Theo đúng quy định tại thông tư hiện hành của Bộ Quốc phòng.',
        status: status === 'PENDING' ? 'SUBMITTED' : status as any,
        submittedAt,
        submittedBy: requestors[i],
        reviewedAt: status !== 'PENDING' ? new Date(submittedAt.getTime() + 1000 * 3600 * 24 * 7) : null,
        reviewedBy: status !== 'PENDING' ? requestors[(i + 1) % requestors.length] : null,
        reviewerNote: status === 'APPROVED' ? 'Đủ điều kiện, đề nghị phê duyệt' : status === 'REJECTED' ? 'Chưa đủ điều kiện' : null,
      },
    });
    reqCreated++;
  }
  console.log(`  ✔ PolicyCategory: ${catCreated} new, PolicyRequest: ${reqCreated}`);
}

// ──────────────────────────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Seeding missing data modules...\n');

  const allStaff = await prisma.user.findMany({
    where: { status: 'ACTIVE', role: { not: 'HOC_VIEN_SINH_VIEN' } },
    select: { id: true, role: true },
    orderBy: { createdAt: 'asc' },
  });
  const staffIds = allStaff.map(u => u.id);
  const facultyIds = allStaff.filter(u => ['GIANG_VIEN','NGHIEN_CUU_VIEN','CHU_NHIEM_BO_MON','CHI_HUY_BO_MON'].includes(u.role)).map(u => u.id);
  const adminIds = allStaff.filter(u => ['ADMIN','QUAN_TRI_HE_THONG','CHI_HUY_HOC_VIEN'].includes(u.role)).map(u => u.id);

  if (staffIds.length === 0) { console.error('❌ No staff found'); process.exit(1); }

  await seedFamilyRelations(allStaff.slice(0, 100));
  await seedResearchFiles([...staffIds.slice(0, 5), ...adminIds.slice(0, 3)]);
  await seedScientificResearch(facultyIds.length > 0 ? facultyIds : staffIds);
  await seedMLModels(adminIds.length > 0 ? adminIds : staffIds.slice(0, 5));
  await seedForeignLanguageCerts(staffIds);
  await seedTechnicalCerts(staffIds);
  await seedPolicyCategoriesAndRequests(staffIds);

  console.log('\n============ FINAL COUNTS ============');
  const rows = await Promise.all([
    prisma.familyRelation.count().then(n => `  FamilyRelation     : ${n}`),
    prisma.researchFile.count().then(n => `  ResearchFile       : ${n}`),
    prisma.scientificResearch.count().then(n => `  ScientificResearch : ${n}`),
    prisma.mLModel.count().then(n => `  MLModel            : ${n}`),
    prisma.ml_experiments.count().then(n => `  MLExperiment       : ${n}`),
    prisma.foreignLanguageCert.count().then(n => `  ForeignLangCert    : ${n}`),
    prisma.technicalCertificate.count().then(n => `  TechnicalCert      : ${n}`),
    prisma.policyCategory.count().then(n => `  PolicyCategory     : ${n}`),
    prisma.policyRequest.count().then(n => `  PolicyRequest      : ${n}`),
  ]);
  rows.forEach(r => console.log(r));
  console.log('=====================================\n');
}

main()
  .catch(e => { console.error('❌', e.message || e); process.exit(1); })
  .finally(() => prisma.$disconnect());
