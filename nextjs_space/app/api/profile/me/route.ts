/**
 * API: /api/profile/me
 * Lấy và cập nhật hồ sơ cá nhân của người dùng hiện tại
 */

import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/rbac/middleware';
import { authorize } from '@/lib/rbac/authorize';
import { PERSONAL } from '@/lib/rbac/function-codes';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.allowed) return authResult.response!;
    const user = authResult.user!;

    const perm = await authorize(user, PERSONAL.MANAGE_PROFILE, {});
    if (!perm.allowed) {
      return NextResponse.json({ error: perm.deniedReason ?? 'Không có quyền xem hồ sơ cá nhân' }, { status: 403 });
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        dateOfBirth: true,
        gender: true,
        citizenId: true,
        militaryId: true,
        rank: true,
        position: true,
        unitId: true,
        birthPlace: true,
        placeOfOrigin: true,
        permanentAddress: true,
        temporaryAddress: true,
        ethnicity: true,
        religion: true,
        bloodType: true,
        educationLevel: true,
        specialization: true,
        enlistmentDate: true,
        managementLevel: true,
        managementCategory: true,
        partyJoinDate: true,
        partyPosition: true,
        role: true,
        workStatus: true,
        unitRelation: {
          select: { id: true, name: true, code: true }
        },
        workExperience: {
          orderBy: { startDate: 'desc' },
          select: {
            id: true,
            organization: true,
            position: true,
            startDate: true,
            endDate: true,
            description: true,
          }
        },
        educationHistory: {
          orderBy: { endDate: 'desc' },
          select: {
            id: true,
            level: true,
            trainingSystem: true,
            institution: true,
            major: true,
            startDate: true,
            endDate: true,
            thesisTitle: true,
            classification: true,
            certificateCode: true,
          }
        },
        foreignLanguageCerts: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            language: true,
            certType: true,
            certLevel: true,
            framework: true,
            certNumber: true,
            issueDate: true,
            issuer: true,
            expiryDate: true,
            notes: true,
          }
        },
        technicalCertificates: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            certType: true,
            certName: true,
            certNumber: true,
            classification: true,
            issueDate: true,
            issuer: true,
            decisionNumber: true,
            notes: true,
          }
        },
        awardsRecords: {
          orderBy: { year: 'desc' },
          select: {
            id: true,
            type: true,
            description: true,
            year: true,
            awardedBy: true,
          }
        },
        insuranceInfo: true,
      }
    });

    if (!userData) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...userData,
        unitName: userData.unitRelation?.name || null,
        awards: userData.awardsRecords || [],
        disciplines: [],
        insurance: userData.insuranceInfo,
        foreignLanguageCerts: userData.foreignLanguageCerts || [],
        technicalCertificates: userData.technicalCertificates || [],
      }
    });
  } catch (error: any) {
    console.error('[Profile/me GET]', error);
    return NextResponse.json({ error: 'Lỗi server: ' + error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.allowed) return authResult.response!;
    const user = authResult.user!;

    const perm = await authorize(user, PERSONAL.MANAGE_PROFILE, {});
    if (!perm.allowed) {
      return NextResponse.json({ error: perm.deniedReason ?? 'Không có quyền cập nhật hồ sơ cá nhân' }, { status: 403 });
    }

    const body = await request.json();
    
    // Chỉ cho phép cập nhật các trường an toàn
    const allowedFields = [
      'name', 'phone', 'dateOfBirth', 'gender', 'citizenId',
      'birthPlace', 'placeOfOrigin', 'permanentAddress', 'temporaryAddress',
      'ethnicity', 'religion', 'bloodType', 'educationLevel', 'specialization',
      'rank', 'position'
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'dateOfBirth' && body[field]) {
          updateData[field] = new Date(body[field]);
        } else {
          updateData[field] = body[field] || null;
        }
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        citizenId: true,
        militaryId: true,
        rank: true,
        position: true,
        unitId: true,
        birthPlace: true,
        placeOfOrigin: true,
        permanentAddress: true,
        temporaryAddress: true,
        ethnicity: true,
        religion: true,
        bloodType: true,
        educationLevel: true,
        specialization: true,
        enlistmentDate: true,
        managementLevel: true,
        managementCategory: true,
        partyJoinDate: true,
        partyPosition: true,
        unitRelation: {
          select: { id: true, name: true, code: true }
        },
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedUser,
        unitName: updatedUser.unitRelation?.name || null,
      }
    });
  } catch (error: any) {
    console.error('[Profile/me PUT]', error);
    return NextResponse.json({ error: 'Lỗi cập nhật: ' + error.message }, { status: 500 });
  }
}
