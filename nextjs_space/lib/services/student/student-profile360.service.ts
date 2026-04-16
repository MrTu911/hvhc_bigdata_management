/**
 * M07 – Student Profile 360° Service
 *
 * Tổng hợp hồ sơ học viên từ nhiều nguồn:
 *   - HocVien (M10 backbone) – source of truth vòng đời học viên
 *   - User (M01) – thông tin tài khoản, rank, militaryId
 *   - Personnel (M02) – nhân thân nếu học viên có liên kết (via User.personnelId)
 *   - KetQuaHocTap (M10) – điểm học tập đã chốt (APPROVED)
 *   - ThesisProject (M10) – khóa luận/luận văn
 *   - StudentGpaHistory (M07 snapshot) – lịch sử GPA theo kỳ
 *   - AcademicWarning (M10) – cảnh báo học vụ còn mở
 *   - StudentConductRecord (M10) – điểm rèn luyện gần nhất
 *
 * Nguyên tắc: KHÔNG duplicate source of truth.
 * Service chỉ READ và aggregate; không write vào bảng nguồn.
 */

import 'server-only';
import db from '@/lib/db';
import { GradeWorkflowStatus, ThesisStatus } from '@prisma/client';

// ThesisStatus: DRAFT | IN_PROGRESS | DEFENDED | ARCHIVED
// "Active" = DRAFT + IN_PROGRESS; "Completed" = DEFENDED + ARCHIVED

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StudentProfile360 {
  /** Hồ sơ học viên từ HocVien */
  student: {
    id: string;
    maHocVien: string;
    hoTen: string;
    ngaySinh: Date | null;
    gioiTinh: string | null;
    lop: string | null;
    khoaHoc: string | null;
    nganh: string | null;
    heDaoTao: string | null;
    khoaQuanLy: string | null;
    trungDoi: string | null;
    daiDoi: string | null;
    trangThai: string;
    currentStatus: string;
    studyMode: string | null;
    ngayNhapHoc: Date | null;
    ngayTotNghiep: Date | null;
    diemTrungBinh: number;
    academicStatus: string;
    tinChiTichLuy: number | null;
    tongTinChi: number | null;
    xepLoaiHocLuc: string | null;
  };
  /** Thông tin tài khoản từ User */
  user: {
    id: string;
    name: string;
    email: string;
    militaryId: string | null;
    rank: string | null;
    role: string;
  } | null;
  /** Nhân thân từ M02 – null nếu không có liên kết Personnel */
  personnel: {
    personnelCode: string;
    fullName: string;
    dateOfBirth: Date | null;
    militaryRank: string | null;
    position: string | null;
    status: string;
    militaryIdNumber: string | null;
    academicDegree: string | null;
    specialization: string | null;
  } | null;
  /** Lớp học hiện tại */
  studentClass: {
    id: string;
    className: string;
    cohortStartYear: number | null;
  } | null;
  /** Giảng viên hướng dẫn (cố vấn học tập) */
  advisor: {
    id: string;
    name: string;
    academicRank: string | null;
    unit: { name: string; code: string } | null;
  } | null;
  /** Tóm tắt GPA từ M07 snapshot */
  gpaSnapshot: {
    cumulativeGpa: number;
    academicStatus: string;
    creditsAccumulated: number;
    totalProgramCredits: number;
    debtCredits: number;
    hasActiveWarning: boolean;
    latestSemester: {
      academicYear: string;
      semesterCode: string;
      semesterGpa: number;
      creditsEarned: number;
    } | null;
  };
  /** Lịch sử GPA gần nhất (tối đa 6 kỳ) từ StudentGpaHistory */
  gpaHistory: {
    academicYear: string;
    semesterCode: string;
    semesterGpa: number;
    cumulativeGpa: number;
    creditsEarned: number;
    academicStatus: string;
  }[];
  /** Tình hình học tập kỳ hiện tại (môn đang học từ ClassEnrollment) */
  currentLoad: {
    enrolledSubjects: number;   // số môn đang đăng ký học kỳ hiện tại
    pendingGrades: number;      // số môn chưa có điểm chốt
  };
  /** Khóa luận / luận văn */
  thesis: {
    activeCount: number;        // DRAFT + IN_PROGRESS
    completedCount: number;     // DEFENDED + ARCHIVED
    latest: {
      title: string;
      status: string;
      thesisType: string;
      defenseDate: Date | null;
      defenseScore: number | null;
      advisorName: string | null;
    } | null;
  };
  /** Cảnh báo học vụ còn mở */
  openWarnings: {
    academicYear: string;
    semesterCode: string;
    warningLevel: string;
    suggestedAction: string | null;
    generatedAt: Date;
  }[];
  /** Điểm rèn luyện gần nhất */
  latestConduct: {
    academicYear: string;
    semesterCode: string;
    conductScore: number;
    conductGrade: string | null;
    rewardSummary: string | null;
    disciplineSummary: string | null;
  } | null;
}

// ─── Core ─────────────────────────────────────────────────────────────────────

/**
 * Tổng hợp hồ sơ 360° của một học viên.
 *
 * @param hocVienId  HocVien.id
 * @returns null nếu không tìm thấy học viên
 */
export async function buildStudentProfile360(
  hocVienId: string,
): Promise<StudentProfile360 | null> {
  const hocVien = await db.hocVien.findUnique({
    where: { id: hocVienId, deletedAt: null },
    select: {
      id: true,
      maHocVien: true,
      hoTen: true,
      ngaySinh: true,
      gioiTinh: true,
      lop: true,
      khoaHoc: true,
      nganh: true,
      heDaoTao: true,
      khoaQuanLy: true,
      trungDoi: true,
      daiDoi: true,
      trangThai: true,
      currentStatus: true,
      studyMode: true,
      ngayNhapHoc: true,
      ngayTotNghiep: true,
      diemTrungBinh: true,
      academicStatus: true,
      tinChiTichLuy: true,
      tongTinChi: true,
      xepLoaiHocLuc: true,
      userId: true,
      classId: true,
      giangVienHuongDanId: true,
    },
  });

  if (!hocVien) return null;

  // ── Truy vấn song song các nguồn dữ liệu ──────────────────────────────────
  const [
    userRecord,
    studentClass,
    advisorProfile,
    gpaHistories,
    openWarnings,
    classEnrollmentCounts,
    thesisProjects,
    latestConduct,
  ] = await Promise.all([
    // User + Personnel chain
    hocVien.userId
      ? db.user.findUnique({
          where: { id: hocVien.userId },
          select: {
            id: true,
            name: true,
            email: true,
            militaryId: true,
            rank: true,
            role: true,
            personnelId: true,
          },
        })
      : null,

    // StudentClass (lớp)
    hocVien.classId
      ? db.studentClass.findUnique({
          where: { id: hocVien.classId },
          select: {
            id: true,
            name: true,
            cohort: { select: { startYear: true } },
          },
        })
      : null,

    // Giảng viên hướng dẫn
    hocVien.giangVienHuongDanId
      ? db.facultyProfile.findUnique({
          where: { id: hocVien.giangVienHuongDanId },
          select: {
            id: true,
            academicRank: true,
            user: { select: { name: true } },
            unit: { select: { name: true, code: true } },
          },
        })
      : null,

    // GPA history (6 kỳ gần nhất)
    db.studentGpaHistory.findMany({
      where: { hocVienId },
      orderBy: [{ academicYear: 'desc' }, { semesterCode: 'desc' }],
      take: 6,
      select: {
        academicYear: true,
        semesterCode: true,
        semesterGpa: true,
        cumulativeGpa: true,
        creditsEarned: true,
        academicStatus: true,
      },
    }),

    // Cảnh báo học vụ còn mở
    db.academicWarning.findMany({
      where: { hocVienId, isResolved: false },
      orderBy: { generatedAt: 'desc' },
      select: {
        academicYear: true,
        semesterCode: true,
        warningLevel: true,
        suggestedAction: true,
        generatedAt: true,
      },
    }),

    // Đếm ClassEnrollment (tổng và chưa chốt điểm)
    db.classEnrollment.aggregate({
      where: { hocVienId },
      _count: { id: true },
    }),

    // Khóa luận
    db.thesisProject.findMany({
      where: { hocVienId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        title: true,
        status: true,
        thesisType: true,
        defenseDate: true,
        defenseScore: true,
        advisor: {
          select: { user: { select: { name: true } } },
        },
      },
    }),

    // Điểm rèn luyện gần nhất
    db.studentConductRecord.findFirst({
      where: { hocVienId },
      orderBy: [{ academicYear: 'desc' }, { semesterCode: 'desc' }],
      select: {
        academicYear: true,
        semesterCode: true,
        conductScore: true,
        conductGrade: true,
        rewardSummary: true,
        disciplineSummary: true,
      },
    }),
  ]);

  // ── Resolve Personnel nếu có ───────────────────────────────────────────────
  let personnelRecord: StudentProfile360['personnel'] = null;
  if (userRecord?.personnelId) {
    const p = await db.personnel.findUnique({
      where: { id: userRecord.personnelId },
      select: {
        personnelCode: true,
        fullName: true,
        dateOfBirth: true,
        militaryRank: true,
        position: true,
        status: true,
        militaryIdNumber: true,
        academicDegree: true,
        specialization: true,
      },
    });
    if (p) {
      personnelRecord = {
        personnelCode: p.personnelCode,
        fullName: p.fullName,
        dateOfBirth: p.dateOfBirth,
        militaryRank: p.militaryRank,
        position: p.position,
        status: String(p.status),
        militaryIdNumber: p.militaryIdNumber,
        academicDegree: p.academicDegree,
        specialization: p.specialization,
      };
    }
  }

  // ── Tổng hợp GPA snapshot ──────────────────────────────────────────────────
  const latestGpa = gpaHistories[0] ?? null;
  const totalProgram = hocVien.tongTinChi ?? 0;
  const accumulated = hocVien.tinChiTichLuy ?? 0;

  const gpaSnapshot: StudentProfile360['gpaSnapshot'] = {
    cumulativeGpa: hocVien.diemTrungBinh,
    academicStatus: String(hocVien.academicStatus),
    creditsAccumulated: accumulated,
    totalProgramCredits: totalProgram,
    debtCredits: Math.max(0, totalProgram - accumulated),
    hasActiveWarning: openWarnings.length > 0,
    latestSemester: latestGpa
      ? {
          academicYear: latestGpa.academicYear,
          semesterCode: latestGpa.semesterCode,
          semesterGpa: latestGpa.semesterGpa,
          creditsEarned: latestGpa.creditsEarned,
        }
      : null,
  };

  // ── Tổng hợp khóa luận ─────────────────────────────────────────────────────
  const activeThesis = thesisProjects.filter(
    (t) => t.status === ThesisStatus.DRAFT || t.status === ThesisStatus.IN_PROGRESS,
  );
  const completedThesis = thesisProjects.filter(
    (t) => t.status === ThesisStatus.DEFENDED || t.status === ThesisStatus.ARCHIVED,
  );
  const latestThesis = thesisProjects[0] ?? null;

  // ── Tổng hợp load hiện tại ─────────────────────────────────────────────────
  // Dùng count ClassEnrollment làm proxy cho số môn đang học
  // Pending grades = approx từ KetQuaHocTap chưa APPROVED nếu cần chi tiết hơn
  const enrolledCount = classEnrollmentCounts._count.id;

  return {
    student: {
      id: hocVien.id,
      maHocVien: hocVien.maHocVien,
      hoTen: hocVien.hoTen,
      ngaySinh: hocVien.ngaySinh,
      gioiTinh: hocVien.gioiTinh,
      lop: hocVien.lop,
      khoaHoc: hocVien.khoaHoc,
      nganh: hocVien.nganh,
      heDaoTao: hocVien.heDaoTao,
      khoaQuanLy: hocVien.khoaQuanLy,
      trungDoi: hocVien.trungDoi,
      daiDoi: hocVien.daiDoi,
      trangThai: hocVien.trangThai,
      currentStatus: String(hocVien.currentStatus),
      studyMode: hocVien.studyMode,
      ngayNhapHoc: hocVien.ngayNhapHoc,
      ngayTotNghiep: hocVien.ngayTotNghiep,
      diemTrungBinh: hocVien.diemTrungBinh,
      academicStatus: String(hocVien.academicStatus),
      tinChiTichLuy: hocVien.tinChiTichLuy,
      tongTinChi: hocVien.tongTinChi,
      xepLoaiHocLuc: hocVien.xepLoaiHocLuc,
    },
    user: userRecord
      ? {
          id: userRecord.id,
          name: userRecord.name,
          email: userRecord.email,
          militaryId: userRecord.militaryId,
          rank: userRecord.rank,
          role: String(userRecord.role),
        }
      : null,
    personnel: personnelRecord,
    studentClass: studentClass
      ? {
          id: studentClass.id,
          className: studentClass.name,
          cohortStartYear: studentClass.cohort?.startYear ?? null,
        }
      : null,
    advisor: advisorProfile
      ? {
          id: advisorProfile.id,
          name: advisorProfile.user?.name ?? 'N/A',
          academicRank: advisorProfile.academicRank,
          unit: advisorProfile.unit
            ? { name: advisorProfile.unit.name, code: advisorProfile.unit.code }
            : null,
        }
      : null,
    gpaSnapshot,
    gpaHistory: gpaHistories.map((g) => ({
      academicYear: g.academicYear,
      semesterCode: g.semesterCode,
      semesterGpa: g.semesterGpa,
      cumulativeGpa: g.cumulativeGpa,
      creditsEarned: g.creditsEarned,
      academicStatus: String(g.academicStatus),
    })),
    currentLoad: {
      enrolledSubjects: enrolledCount,
      pendingGrades: 0, // Phase 1: placeholder – cần query KetQuaHocTap PENDING nếu cần chi tiết
    },
    thesis: {
      activeCount: activeThesis.length,
      completedCount: completedThesis.length,
      latest: latestThesis
        ? {
            title: latestThesis.title,
            status: String(latestThesis.status),
            thesisType: latestThesis.thesisType,
            defenseDate: latestThesis.defenseDate,
            defenseScore: latestThesis.defenseScore,
            advisorName: latestThesis.advisor?.user?.name ?? null,
          }
        : null,
    },
    openWarnings: openWarnings.map((w) => ({
      academicYear: w.academicYear,
      semesterCode: w.semesterCode,
      warningLevel: String(w.warningLevel),
      suggestedAction: w.suggestedAction,
      generatedAt: w.generatedAt,
    })),
    latestConduct: latestConduct
      ? {
          academicYear: latestConduct.academicYear,
          semesterCode: latestConduct.semesterCode,
          conductScore: latestConduct.conductScore,
          conductGrade: latestConduct.conductGrade,
          rewardSummary: latestConduct.rewardSummary,
          disciplineSummary: latestConduct.disciplineSummary,
        }
      : null,
  };
}
