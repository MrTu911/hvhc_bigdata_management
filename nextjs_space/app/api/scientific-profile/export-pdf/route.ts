/**
 * API: Export Scientific Profile to PDF
 * GET /api/scientific-profile/export-pdf - Xuất lý lịch khoa học ra PDF
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { FACULTY } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, FACULTY.EXPORT);
    if (!authResult.allowed) {
      return authResult.response;
    }
    const user = authResult.user!;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || user.id;

    // Lấy thông tin user với các relations
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Lấy các relations riêng
    const [scientificProfile, facultyProfile, publications, research, workExperience] = await Promise.all([
      prisma.scientificProfile.findUnique({ where: { userId } }),
      prisma.facultyProfile.findUnique({
        where: { userId },
        include: {
          teachingSubjectsList: true,
          researchProjectsList: true,
        },
      }),
      prisma.scientificPublication.findMany({ where: { userId } }),
      prisma.scientificResearch.findMany({ where: { userId } }),
      prisma.workExperience.findMany({
        where: { userId },
        orderBy: { startDate: 'desc' },
      }),
    ]);

    // Tạo HTML content cho PDF
    const htmlContent = generateScientificProfileHTML({
      ...targetUser,
      facultyProfile,
      scientificPublications: publications,
      scientificResearch: research,
    });

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: FACULTY.EXPORT,
      action: 'EXPORT',
      resourceType: 'SCIENTIFIC_PROFILE',
      resourceId: userId,
      newValue: { format: 'PDF', targetUserId: userId },
      result: 'SUCCESS',
    });

    // Trả về JSON data để client render
    return NextResponse.json({
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        rank: targetUser.rank,
        position: targetUser.position,
        dateOfBirth: targetUser.dateOfBirth,
        gender: targetUser.gender,
        phone: targetUser.phone,
      },
      scientificProfile,
      facultyProfile,
      publications,
      research,
      workExperience,
      htmlContent,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Export scientific profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateScientificProfileHTML(user: any): string {
  const facultyProfile = user.facultyProfile;
  const publications = user.scientificPublications || [];
  const research = user.scientificResearch || [];

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Lý lịch Khoa học - ${user.name}</title>
      <style>
        body { font-family: 'Times New Roman', serif; margin: 40px; }
        h1 { text-align: center; color: #1a365d; }
        h2 { color: #2c5282; border-bottom: 2px solid #2c5282; padding-bottom: 5px; }
        .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .info-table td { padding: 8px; border: 1px solid #ddd; }
        .info-table td:first-child { font-weight: bold; width: 30%; background: #f7fafc; }
        .section { margin: 30px 0; }
        .publication { margin: 10px 0; padding: 10px; background: #f7fafc; border-radius: 5px; }
      </style>
    </head>
    <body>
      <h1>LÝ LỊCH KHOA HỌC</h1>
      
      <div class="section">
        <h2>I. THÔNG TIN CÁ NHÂN</h2>
        <table class="info-table">
          <tr><td>Họ và tên</td><td>${user.name || ''}</td></tr>
          <tr><td>Quân hàm</td><td>${user.rank || ''}</td></tr>
          <tr><td>Chức vụ</td><td>${user.position || ''}</td></tr>
          <tr><td>Học hàm</td><td>${facultyProfile?.academicRank || ''}</td></tr>
          <tr><td>Học vị</td><td>${facultyProfile?.academicDegree || ''}</td></tr>
          <tr><td>Chuyên ngành</td><td>${facultyProfile?.specialization || ''}</td></tr>
          <tr><td>Email</td><td>${user.email}</td></tr>
          <tr><td>Điện thoại</td><td>${user.phone || ''}</td></tr>
        </table>
      </div>

      <div class="section">
        <h2>II. CÔNG TRÌNH KHOA HỌC (ĐÃ CÔNG BỐ: ${publications.length})</h2>
        ${publications.map((pub: any, i: number) => `
          <div class="publication">
            <strong>${i + 1}. ${pub.title}</strong><br/>
            ${pub.journal ? `Tạp chí: ${pub.journal}` : ''}
            ${pub.year ? ` - Năm: ${pub.year}` : ''}
          </div>
        `).join('')}
      </div>

      <div class="section">
        <h2>III. ĐỀ TÀI NGHIÊN CỨU (${research.length})</h2>
        ${research.map((r: any, i: number) => `
          <div class="publication">
            <strong>${i + 1}. ${r.title}</strong><br/>
            ${r.role ? `Vai trò: ${r.role}` : ''}
            ${r.status ? ` - Trạng thái: ${r.status}` : ''}
          </div>
        `).join('')}
      </div>

      <p style="text-align: right; margin-top: 50px;">
        <em>Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}</em>
      </p>
    </body>
    </html>
  `;
}
