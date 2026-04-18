/**
 * M10 – UC-51: Student Profile Service
 *
 * Single source of business logic cho student CRUD.
 * Routes chỉ parse request, gọi service, gọi logAudit, trả response.
 *
 * Scope enforcement (HE / TIEU_DOAN / SELF) được xử lý tại đây — không ở route.
 */

import { prisma } from '@/lib/db';
import { getItemByCode, getItemsByCategory } from '@/lib/master-data-cache';

// ─── Error classes ─────────────────────────────────────────────────────────────

export class ServiceValidationError extends Error {
  readonly statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'ServiceValidationError';
  }
}

export class ServiceNotFoundError extends Error {
  readonly statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = 'ServiceNotFoundError';
  }
}

export class ServiceConflictError extends Error {
  readonly statusCode = 409;
  constructor(message: string) {
    super(message);
    this.name = 'ServiceConflictError';
  }
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ListStudentsParams {
  page: number;
  limit: number;
  search?: string;
  studentType?: 'civil' | 'military';
  currentStatus?: string;
  lop?: string;
  khoaHoc?: string;
  nganh?: string;
  studyMode?: string;
  trainingSystemUnitId?: string;
  battalionUnitId?: string;
  heDaoTao?: string;
}

/** Context người dùng để enforce scope — được resolve từ authResult ở route. */
export interface UserScopeContext {
  userId: string;
  unitId?: string | null;
  scope?: string; // 'SELF' | 'UNIT' | 'DEPARTMENT' | 'ACADEMY'
}

export interface ListStudentsResult {
  students: any[];
  total: number;
  statusGroups: Array<{ currentStatus: string; _count: { id: number } }>;
  lowGpaCount: number;
  warningCount: number;
}

export interface CreateStudentData {
  maHocVien: string;
  hoTen: string;
  ngaySinh?: string | null;
  gioiTinh?: string | null;
  lop?: string | null;
  khoaHoc?: string | null;
  nganh?: string | null;
  studyMode?: string | null;
  heDaoTao?: string | null;
  khoaQuanLy?: string | null;
  trungDoi?: string | null;
  daiDoi?: string | null;
  trainingSystemUnitId?: string | null;
  battalionUnitId?: string | null;
  currentProgramVersionId?: string | null;
  giangVienHuongDanId?: string | null;
  email?: string | null;
  dienThoai?: string | null;
  diaChi?: string | null;
  cohortId?: string | null;
  classId?: string | null;
  majorId?: string | null;
  userId?: string | null;
  ngayNhapHoc?: string | null;
}

export type UpdateStudentData = Partial<{
  hoTen: string;
  ngaySinh: string | null;
  gioiTinh: string;
  lop: string;
  khoaHoc: string;
  nganh: string;
  studyMode: string;
  heDaoTao: string;
  khoaQuanLy: string;
  trungDoi: string;
  daiDoi: string;
  trainingSystemUnitId: string;
  battalionUnitId: string;
  currentStatus: string;
  currentProgramVersionId: string;
  giangVienHuongDanId: string;
  email: string;
  dienThoai: string;
  diaChi: string;
  cohortId: string;
  classId: string;
  majorId: string;
  xepLoaiHocLuc: string;
  tongTinChi: number;
  tinChiTichLuy: number;
  ngayNhapHoc: string | null;
  ngayTotNghiep: string | null;
  lyDoNghiHoc: string;
}>;

// ─── Prisma select clause (shared) ────────────────────────────────────────────

const STUDENT_LIST_SELECT = {
  id: true,
  maHocVien: true,
  hoTen: true,
  ngaySinh: true,
  gioiTinh: true,
  lop: true,
  khoaHoc: true,
  nganh: true,
  currentStatus: true,
  studyMode: true,
  heDaoTao: true,
  diemTrungBinh: true,
  tinChiTichLuy: true,
  ngayNhapHoc: true,
  createdAt: true,
  currentProgramVersion: {
    select: { id: true, versionCode: true, effectiveFromCohort: true },
  },
  giangVienHuongDan: {
    select: { id: true, user: { select: { name: true } } },
  },
  khoaQuanLy: true,
  daiDoi: true,
  trungDoi: true,
  trainingSystemUnit: {
    select: { id: true, code: true, name: true },
  },
  battalionUnit: {
    select: { id: true, code: true, name: true },
  },
  academicWarnings: {
    orderBy: { createdAt: 'desc' as const },
    take: 1,
    select: { warningLevel: true },
  },
} as const;

// ─── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Build Prisma where clause cho listStudents.
 * Scope enforcement (HE / TIEU_DOAN / SELF) được thực thi tại đây.
 */
async function buildStudentWhereClause(
  params: ListStudentsParams,
  scopeCtx: UserScopeContext,
): Promise<Record<string, unknown>> {
  const where: Record<string, unknown> = { deletedAt: null };

  // Text search — sử dụng OR riêng biệt, không merge với studentType condition
  if (params.search) {
    where.OR = [
      { hoTen: { contains: params.search, mode: 'insensitive' } },
      { maHocVien: { contains: params.search, mode: 'insensitive' } },
      { email: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  // Direct field filters
  if (params.currentStatus) where.currentStatus = params.currentStatus;
  if (params.lop)           where.lop           = params.lop;
  if (params.khoaHoc)       where.khoaHoc       = params.khoaHoc;
  if (params.nganh)         where.nganh         = params.nganh;
  if (params.studyMode)     where.studyMode     = params.studyMode;
  if (params.heDaoTao)      where.heDaoTao      = params.heDaoTao;

  // trainingSystemUnitId / battalionUnitId chỉ filter khi không bị override bởi scope bên dưới
  const explicitTrainingSystem = params.trainingSystemUnitId;
  const explicitBattalion      = params.battalionUnitId;
  if (explicitTrainingSystem) where.trainingSystemUnitId = explicitTrainingSystem;
  if (explicitBattalion)      where.battalionUnitId      = explicitBattalion;

  // AND conditions: studentType + scope enforcement (phải tách khỏi search OR)
  const andConditions: unknown[] = [];

  if (params.studentType === 'military') {
    andConditions.push({
      OR: [{ khoaQuanLy: { not: null } }, { trainingSystemUnitId: { not: null } }],
    });
  } else if (params.studentType === 'civil') {
    andConditions.push({ khoaQuanLy: null }, { trainingSystemUnitId: null });
  }

  // Scope enforcement — lookup unit type từ DB
  if (scopeCtx.unitId) {
    const userUnit = await prisma.unit.findUnique({
      where: { id: scopeCtx.unitId },
      select: { type: true },
    });

    if (userUnit?.type === 'HE') {
      // Chỉ thấy học viên thuộc Hệ mình (trừ khi caller đã filter cụ thể hơn)
      if (!explicitTrainingSystem && !explicitBattalion) {
        where.trainingSystemUnitId = scopeCtx.unitId;
      }
    } else if (userUnit?.type === 'TIEUDOAN') {
      // Chỉ thấy học viên thuộc Tiểu đoàn mình
      if (!explicitBattalion) {
        where.battalionUnitId = scopeCtx.unitId;
      }
    } else if (scopeCtx.scope === 'SELF') {
      // Giảng viên SELF: chỉ xem học viên mình cố vấn
      const facultyProfile = await prisma.facultyProfile.findUnique({
        where: { userId: scopeCtx.userId },
        select: { id: true },
      });
      if (facultyProfile) {
        andConditions.push({ giangVienHuongDanId: facultyProfile.id });
      }
    }
  } else if (scopeCtx.scope === 'SELF') {
    const facultyProfile = await prisma.facultyProfile.findUnique({
      where: { userId: scopeCtx.userId },
      select: { id: true },
    });
    if (facultyProfile) {
      andConditions.push({ giangVienHuongDanId: facultyProfile.id });
    }
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  return where;
}

/** Validate studyMode và nganh theo M19. Throw ServiceValidationError nếu không hợp lệ. */
async function validateStudentLookupFields(data: {
  studyMode?: string | null;
  nganh?: string | null;
}): Promise<void> {
  if (data.studyMode) {
    const validItem = await getItemByCode('MD_STUDY_MODE', data.studyMode);
    if (!validItem) {
      const items = await getItemsByCategory('MD_STUDY_MODE', true);
      const validCodes = items.map((i: any) => i.code).join(', ');
      throw new ServiceValidationError(
        `studyMode '${data.studyMode}' không hợp lệ. Giá trị cho phép: ${validCodes}`
      );
    }
  }

  // Sprint C — validate nganh against M19 MD_MAJOR
  if (data.nganh) {
    const validItem = await getItemByCode('MD_MAJOR', data.nganh);
    if (!validItem) {
      throw new ServiceValidationError(
        `nganh '${data.nganh}' không hợp lệ. Vui lòng chọn từ danh mục ngành học (MD_MAJOR).`
      );
    }
  }
}

// ─── Public API ────────────────────────────────────────────────────────────────

export async function listStudents(
  params: ListStudentsParams,
  scopeCtx: UserScopeContext,
): Promise<ListStudentsResult> {
  const where = await buildStudentWhereClause(params, scopeCtx);
  const skip  = (params.page - 1) * params.limit;

  const [students, total, statusGroups, lowGpaCount, warningCount] = await Promise.all([
    prisma.hocVien.findMany({
      where,
      select: STUDENT_LIST_SELECT,
      orderBy: { maHocVien: 'asc' },
      skip,
      take: params.limit,
    }),
    prisma.hocVien.count({ where }),
    prisma.hocVien.groupBy({
      by: ['currentStatus'],
      where,
      _count: { id: true },
    }),
    prisma.hocVien.count({ where: { ...where, diemTrungBinh: { gt: 0, lt: 5 } } }),
    prisma.hocVien.count({ where: { ...where, academicWarnings: { some: {} } } }),
  ]);

  return { students, total, statusGroups, lowGpaCount, warningCount };
}

export async function getStudentById(id: string) {
  const hocVien = await prisma.hocVien.findFirst({
    where: { id, deletedAt: null },
    include: {
      currentProgramVersion: {
        include: { program: { select: { id: true, code: true, name: true } } },
      },
      giangVienHuongDan: {
        select: { id: true, user: { select: { name: true, email: true } } },
      },
      cohort:       { select: { id: true, name: true, code: true } },
      studentClass: { select: { id: true, name: true, code: true } },
      major:        { select: { id: true, name: true, code: true } },
      user:         { select: { id: true, name: true, email: true } },
      _count: {
        select: {
          classEnrollments: true, // M10 source of truth
          ketQuaHocTap:     true, // legacy LAN – chỉ đếm, không expand
          conductRecords:   true,
        },
      },
    },
  });

  if (!hocVien) throw new ServiceNotFoundError('Không tìm thấy học viên');
  return hocVien;
}

export async function createStudent(data: CreateStudentData) {
  if (!data.maHocVien || !data.hoTen) {
    throw new ServiceValidationError('maHocVien và hoTen là bắt buộc');
  }

  await validateStudentLookupFields(data);

  const existing = await prisma.hocVien.findUnique({ where: { maHocVien: data.maHocVien } });
  if (existing) {
    throw new ServiceConflictError(`Học viên ${data.maHocVien} đã tồn tại`);
  }

  return prisma.hocVien.create({
    data: {
      maHocVien:              data.maHocVien,
      hoTen:                  data.hoTen,
      ngaySinh:               data.ngaySinh ? new Date(data.ngaySinh) : null,
      gioiTinh:               data.gioiTinh || null,
      lop:                    data.lop || null,
      khoaHoc:                data.khoaHoc || null,
      nganh:                  data.nganh || null,
      studyMode:              data.studyMode || null,
      heDaoTao:               data.heDaoTao || null,
      khoaQuanLy:             data.khoaQuanLy || null,
      trungDoi:               data.trungDoi || null,
      daiDoi:                 data.daiDoi || null,
      trainingSystemUnitId:   data.trainingSystemUnitId || null,
      battalionUnitId:        data.battalionUnitId || null,
      currentStatus:          'ACTIVE',
      currentProgramVersionId: data.currentProgramVersionId || null,
      giangVienHuongDanId:    data.giangVienHuongDanId || null,
      email:                  data.email || null,
      dienThoai:              data.dienThoai || null,
      diaChi:                 data.diaChi || null,
      cohortId:               data.cohortId || null,
      classId:                data.classId || null,
      majorId:                data.majorId || null,
      userId:                 data.userId || null,
      ngayNhapHoc:            data.ngayNhapHoc ? new Date(data.ngayNhapHoc) : null,
    },
  });
}

export async function updateStudent(id: string, data: UpdateStudentData) {
  const existing = await prisma.hocVien.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new ServiceNotFoundError('Không tìm thấy học viên');

  if (Object.keys(data).length === 0) {
    throw new ServiceValidationError('Không có field nào được cập nhật');
  }

  await validateStudentLookupFields(data);

  // Chuyển date fields
  const dbData: Record<string, unknown> = { ...data };
  for (const field of ['ngaySinh', 'ngayNhapHoc', 'ngayTotNghiep'] as const) {
    if (field in data) {
      dbData[field] = (data as any)[field] ? new Date((data as any)[field]) : null;
    }
  }

  const updated = await prisma.hocVien.update({ where: { id }, data: dbData });
  return { existing, updated };
}

export async function softDeleteStudent(id: string) {
  const existing = await prisma.hocVien.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new ServiceNotFoundError('Không tìm thấy học viên');

  // Soft delete — giữ toàn bộ lịch sử học tập
  await prisma.hocVien.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return existing;
}
