/**
 * Offline Mode - Rule-based EIS Calculation
 * Fallback khi không có kết nối AI service
 */

import { prisma } from '@/lib/db';

export interface EISComponents {
  teachingQuality: number;     // 0-30
  researchOutput: number;      // 0-25
  studentMentorship: number;   // 0-20
  innovation: number;          // 0-10
  leadership: number;          // 0-10
  collaboration: number;       // 0-5
}

export interface OfflineEISResult {
  totalScore: number;          // 0-100
  components: EISComponents;
  confidence: number;          // Always 0.8 for rule-based
  method: 'rule-based';
}

/**
 * Tính EIS score dựa trên quy tắc (không dùng AI)
 */
export async function calculateOfflineEIS(
  facultyId: string
): Promise<OfflineEISResult> {
  try {
    // Lấy thông tin giảng viên
    const faculty = await prisma.facultyProfile.findUnique({
      where: { id: facultyId },
      include: {
        teachingSubjectsList: true,
        researchProjectsList: true,
        hocVienHuongDan: {
          include: {
            ketQuaHocTap: true,
          },
        },
      },
    });

    if (!faculty) {
      throw new Error('Faculty not found');
    }

    // Danh sách học viên hướng dẫn
    const students = faculty.hocVienHuongDan || [];

    // Tính từng thành phần
    const components: EISComponents = {
      teachingQuality: await calculateTeachingQuality(students),
      researchOutput: calculateResearchOutput(
        faculty.researchProjectsList || []
      ),
      studentMentorship: calculateStudentMentorship(students),
      innovation: calculateInnovation(faculty.teachingSubjectsList || []),
      leadership: calculateLeadership(faculty.academicRank || ''),
      collaboration: 3, // Default placeholder
    };

    const totalScore =
      components.teachingQuality +
      components.researchOutput +
      components.studentMentorship +
      components.innovation +
      components.leadership +
      components.collaboration;

    return {
      totalScore: Math.min(100, Math.max(0, totalScore)),
      components,
      confidence: 0.8, // Rule-based có confidence cố định 0.8
      method: 'rule-based',
    };
  } catch (error) {
    console.error('Error calculating offline EIS:', error);
    throw error;
  }
}

/**
 * Tính điểm Teaching Quality (0-30)
 * Dựa trên tỷ lệ đạt và GPA trung bình của học viên
 */
async function calculateTeachingQuality(students: any[]): Promise<number> {
  if (students.length === 0) return 0;

  let totalScore = 0;
  let totalStudents = 0;

  for (const student of students) {
    const grades = student.ketQuaHocTap || [];
    if (grades.length === 0) continue;

    // Tính GPA trung bình
    const avgGrade =
      grades.reduce(
        (sum: number, grade: any) => sum + (grade.diemTongKet || 0),
        0
      ) / grades.length;

    totalScore += avgGrade;
    totalStudents++;
  }

  if (totalStudents === 0) return 0;

  const avgGPA = totalScore / totalStudents;
  const passRate =
    students.filter((s) => {
      const avg =
        s.ketQuaHocTap?.reduce(
          (sum: number, g: any) => sum + (g.diemTongKet || 0),
          0
        ) / (s.ketQuaHocTap?.length || 1);
      return avg >= 5.0;
    }).length / students.length;

  // Scoring:
  // - GPA >= 8.0 && pass rate >= 0.9: 25-30 points
  // - GPA >= 7.0 && pass rate >= 0.8: 20-24 points
  // - GPA >= 6.0 && pass rate >= 0.7: 15-19 points
  // - GPA >= 5.0 && pass rate >= 0.6: 10-14 points
  // - Else: 0-9 points

  if (avgGPA >= 8.0 && passRate >= 0.9) {
    return 25 + Math.min(5, Math.floor((avgGPA - 8.0) * 5));
  } else if (avgGPA >= 7.0 && passRate >= 0.8) {
    return 20 + Math.min(4, Math.floor((avgGPA - 7.0) * 4));
  } else if (avgGPA >= 6.0 && passRate >= 0.7) {
    return 15 + Math.min(4, Math.floor((avgGPA - 6.0) * 4));
  } else if (avgGPA >= 5.0 && passRate >= 0.6) {
    return 10 + Math.min(4, Math.floor((avgGPA - 5.0) * 4));
  } else {
    return Math.min(9, Math.floor(avgGPA * 1.5));
  }
}

/**
 * Tính điểm Research Output (0-25)
 * Dựa trên số lượng đề tài nghiên cứu và trạng thái hoàn thành
 */
function calculateResearchOutput(projects: any[]): number {
  if (projects.length === 0) return 0;

  const completedProjects = projects.filter(
    (p) => p.status?.toLowerCase() === 'completed' || p.status?.toLowerCase() === 'hoàn thành'
  ).length;

  const publishedProjects = projects.filter(
    (p) => p.isPublished === true
  ).length;

  // Scoring:
  // - Mỗi đề tài hoàn thành: 3 điểm (max 15 điểm)
  // - Mỗi đề tài đã xuất bản: 5 điểm bổ sung (max 10 điểm)

  const completedScore = Math.min(15, completedProjects * 3);
  const publishedScore = Math.min(10, publishedProjects * 5);

  return completedScore + publishedScore;
}

/**
 * Tính điểm Student Mentorship (0-20)
 * Dựa trên GPA trung bình và số lượng học viên hướng dẫn
 */
function calculateStudentMentorship(students: any[]): number {
  if (students.length === 0) return 0;

  let totalGPA = 0;
  let count = 0;

  for (const student of students) {
    const grades = student.ketQuaHocTap || [];
    if (grades.length === 0) continue;

    const avgGrade =
      grades.reduce(
        (sum: number, grade: any) => sum + (grade.diemTongKet || 0),
        0
      ) / grades.length;

    totalGPA += avgGrade;
    count++;
  }

  if (count === 0) return 0;

  const avgGPA = totalGPA / count;

  // Scoring:
  // - Số lượng học viên: max 8 điểm (1 điểm/học viên, max 8)
  // - GPA trung bình: max 12 điểm
  const studentCountScore = Math.min(8, students.length);
  const gpaScore = Math.min(12, Math.floor((avgGPA / 10) * 12));

  return studentCountScore + gpaScore;
}

/**
 * Tính điểm Innovation (0-10)
 * Dựa trên số lượng môn giảng dạy
 */
function calculateInnovation(subjects: any[]): number {
  if (subjects.length === 0) return 0;

  // Mỗi môn học: 2 điểm (max 10 điểm)
  return Math.min(10, subjects.length * 2);
}

/**
 * Tính điểm Leadership (0-10)
 * Dựa trên học hàm
 */
function calculateLeadership(academicRank: string): number {
  const rank = academicRank.toLowerCase();

  if (rank.includes('giáo sư') || rank.includes('professor')) {
    return 10;
  } else if (rank.includes('phó giáo sư') || rank.includes('associate')) {
    return 8;
  } else if (rank.includes('tiến sĩ') || rank.includes('phd') || rank.includes('doctor')) {
    return 6;
  } else if (rank.includes('thạc sĩ') || rank.includes('master')) {
    return 4;
  } else {
    return 2;
  }
}

/**
 * Tính EIS cho toàn bộ khoa/phòng (aggregate)
 */
export async function calculateDepartmentEIS(
  departmentId: string
): Promise<{ avgScore: number; totalFaculty: number }> {
  try {
    const faculties = await prisma.facultyProfile.findMany({
      where: { departmentId },
    });

    if (faculties.length === 0) {
      return { avgScore: 0, totalFaculty: 0 };
    }

    let totalScore = 0;
    for (const faculty of faculties) {
      const eis = await calculateOfflineEIS(faculty.id);
      totalScore += eis.totalScore;
    }

    return {
      avgScore: totalScore / faculties.length,
      totalFaculty: faculties.length,
    };
  } catch (error) {
    console.error('Error calculating department EIS:', error);
    throw error;
  }
}
