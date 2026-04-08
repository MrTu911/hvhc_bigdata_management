/**
 * M07 – Faculty Profile 360° Service
 *
 * Tổng hợp hồ sơ giảng viên từ nhiều nguồn:
 *   - FacultyProfile (M07 local)
 *   - Personnel (M02) – nhân thân, học vị
 *   - ResearchProject / NckhProject / NckhPublication (M09) – nghiên cứu
 *   - ClassSection (M10) – lớp đang dạy
 *   - ThesisProject (M10) – hướng dẫn luận văn
 *   - FacultyEISScore (M07 snapshot) – điểm EIS gần nhất
 *
 * Nguyên tắc: KHÔNG duplicate source of truth.
 * Service chỉ READ và aggregate; không write vào bảng nguồn.
 */

import 'server-only';
import db from '@/lib/db';
import { ClassSectionStatus, NckhProjectStatus, ThesisStatus } from '@prisma/client';

// ThesisStatus: DRAFT | IN_PROGRESS | DEFENDED | ARCHIVED
// "Ongoing" = DRAFT + IN_PROGRESS; "Completed" = DEFENDED + ARCHIVED

export interface FacultyProfile360 {
  profile: {
    id: string;
    userId: string;
    personnelId: string | null;
    academicRank: string | null;
    academicDegree: string | null;
    specialization: string | null;
    teachingPosition: string | null;
    teachingStart: Date | null;
    weeklyHoursLimit: number;
    researchInterests: string | null;
    biography: string | null;
    isActive: boolean;
  };
  user: {
    id: string;
    name: string | null;
    email: string | null;
    militaryId: string | null;
    rank: string | null;
  };
  unit: { id: string; name: string; code: string } | null;
  /** Nhân thân từ M02 – null nếu không có personnelId */
  personnel: {
    personnelCode: string;
    fullName: string;
    dateOfBirth: Date | null;
    militaryRank: string | null;
    position: string | null;
    unitId: string | null;
    status: string;
  } | null;
  /** Tải giảng hiện tại từ M10 */
  teachingLoad: {
    activeSections: number;       // số lớp học phần đang dạy
    currentWeeklyHours: number;   // ước tính giờ/tuần (activeSections × 3 giờ chuẩn nếu chưa có snapshot)
    weeklyHoursLimit: number;
    isOverloaded: boolean;
    latestSnapshot: {             // snapshot kỳ gần nhất nếu có
      academicYear: string;
      semesterCode: string;
      totalHoursWeekly: number;
      totalHoursTerm: number;
      advisingCount: number;
      thesisCount: number;
    } | null;
  };
  /** Nghiên cứu khoa học từ M09 */
  research: {
    legacyProjects: number;       // ResearchProject (model cũ)
    nckhProjects: number;         // NckhProject (model M09 backbone)
    nckhCompleted: number;
    publications: number;
    citations: number;
  };
  /** Hướng dẫn khóa luận từ M10 */
  mentoring: {
    activeAdvisees: number;       // số HocVien đang cố vấn
    thesisOngoing: number;
    thesisCompleted: number;
  };
  /** Điểm EIS gần nhất từ FacultyEISScore */
  latestEIS: {
    academicYear: string;
    semesterCode: string;
    totalEIS: number;
    teachingScore: number;
    researchScore: number;
    mentoringScore: number;
    serviceScore: number;
    innovationScore: number;
    developmentScore: number;
    trend: string | null;
    calculatedAt: Date;
  } | null;
  teachingSubjects: { subjectCode: string; subjectName: string }[];
}

/**
 * Tổng hợp hồ sơ giảng viên 360°.
 * @param facultyProfileId - FacultyProfile.id
 */
export async function buildFacultyProfile360(
  facultyProfileId: string,
): Promise<FacultyProfile360 | null> {
  // ── 1. Load FacultyProfile lõi ─────────────────────────────────────────────
  const profile = await db.facultyProfile.findUnique({
    where: { id: facultyProfileId },
    include: {
      user: {
        select: { id: true, name: true, email: true, militaryId: true, rank: true },
      },
      unit: { select: { id: true, name: true, code: true } },
      teachingSubjectsList: { select: { subjectCode: true, subjectName: true } },
    },
  });

  if (!profile) return null;

  // ── 2. Personnel từ M02 (chỉ nếu personnelId tồn tại) ────────────────────
  const personnel = profile.personnelId
    ? await db.personnel.findUnique({
        where: { id: profile.personnelId, deletedAt: null },
        select: {
          personnelCode: true,
          fullName: true,
          dateOfBirth: true,
          militaryRank: true,
          position: true,
          unitId: true,
          status: true,
        },
      })
    : null;

  // ── 3. Tải giảng từ M10 ───────────────────────────────────────────────────
  const [activeSections, latestWorkloadSnapshot] = await Promise.all([
    db.classSection.count({
      where: {
        facultyId: facultyProfileId,
        status: ClassSectionStatus.ACTIVE,
      },
    }),
    db.facultyWorkloadSnapshot.findFirst({
      where: { facultyProfileId },
      orderBy: [{ academicYear: 'desc' }, { semesterCode: 'desc' }],
      select: {
        academicYear: true,
        semesterCode: true,
        totalHoursWeekly: true,
        totalHoursTerm: true,
        advisingCount: true,
        thesisCount: true,
      },
    }),
  ]);

  // Nếu chưa có snapshot, ước tính thô từ activeSections (3 giờ chuẩn/lớp/tuần)
  const currentWeeklyHours = latestWorkloadSnapshot?.totalHoursWeekly ?? activeSections * 3;

  // ── 4. Nghiên cứu từ M09 ─────────────────────────────────────────────────
  const [legacyProjects, nckhTotal, nckhCompleted] = await Promise.all([
    db.researchProject.count({ where: { facultyId: facultyProfileId } }),
    db.nckhProject.count({ where: { principalInvestigatorId: profile.userId } }),
    db.nckhProject.count({
      where: {
        principalInvestigatorId: profile.userId,
        status: NckhProjectStatus.COMPLETED,
      },
    }),
  ]);

  // ── 5. Mentoring từ M10 ───────────────────────────────────────────────────
  const [activeAdvisees, thesisOngoing, thesisCompleted] = await Promise.all([
    db.hocVien.count({ where: { giangVienHuongDanId: facultyProfileId } }),
    db.thesisProject.count({
      where: {
        advisorId: facultyProfileId,
        status: { in: [ThesisStatus.DRAFT, ThesisStatus.IN_PROGRESS] },
      },
    }),
    db.thesisProject.count({
      where: {
        advisorId: facultyProfileId,
        status: { in: [ThesisStatus.DEFENDED, ThesisStatus.ARCHIVED] },
      },
    }),
  ]);

  // ── 6. EIS gần nhất ───────────────────────────────────────────────────────
  const latestEIS = await db.facultyEISScore.findFirst({
    where: { facultyProfileId },
    orderBy: [{ academicYear: 'desc' }, { semesterCode: 'desc' }],
    select: {
      academicYear: true,
      semesterCode: true,
      totalEIS: true,
      teachingScore: true,
      researchScore: true,
      mentoringScore: true,
      serviceScore: true,
      innovationScore: true,
      developmentScore: true,
      trend: true,
      calculatedAt: true,
    },
  });

  return {
    profile: {
      id: profile.id,
      userId: profile.userId,
      personnelId: profile.personnelId,
      academicRank: profile.academicRank,
      academicDegree: profile.academicDegree,
      specialization: profile.specialization,
      teachingPosition: profile.teachingPosition,
      teachingStart: profile.teachingStart,
      weeklyHoursLimit: profile.weeklyHoursLimit,
      researchInterests: profile.researchInterests,
      biography: profile.biography,
      isActive: profile.isActive,
    },
    user: profile.user,
    unit: profile.unit,
    personnel: personnel
      ? {
          personnelCode: personnel.personnelCode,
          fullName: personnel.fullName,
          dateOfBirth: personnel.dateOfBirth,
          militaryRank: personnel.militaryRank,
          position: personnel.position,
          unitId: personnel.unitId,
          status: personnel.status,
        }
      : null,
    teachingLoad: {
      activeSections,
      currentWeeklyHours,
      weeklyHoursLimit: profile.weeklyHoursLimit,
      isOverloaded: currentWeeklyHours > profile.weeklyHoursLimit,
      latestSnapshot: latestWorkloadSnapshot ?? null,
    },
    research: {
      legacyProjects,
      nckhProjects: nckhTotal,
      nckhCompleted,
      publications: profile.publications,
      citations: profile.citations,
    },
    mentoring: {
      activeAdvisees,
      thesisOngoing,
      thesisCompleted,
    },
    latestEIS: latestEIS
      ? {
          ...latestEIS,
          trend: latestEIS.trend ?? null,
        }
      : null,
    teachingSubjects: profile.teachingSubjectsList,
  };
}
