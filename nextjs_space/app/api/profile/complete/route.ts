import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { requireAuth } from '@/lib/rbac/middleware';

// GET: Lấy thông tin profile hiện tại
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const authUser = authResult.user!;

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        personnelProfile: true,
        unitRelation: { select: { id: true, name: true, code: true } }
      }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Merge user data with personnel data
    const profileData = {
      fullName: user.name || user.personnelProfile?.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      dateOfBirth: user.personnelProfile?.dateOfBirth?.toISOString().split('T')[0] || '',
      gender: user.personnelProfile?.gender || '',
      citizenId: '', // Sensitive - not returned directly
      militaryId: user.personnelProfile?.militaryIdNumber || '',
      rank: user.personnelProfile?.militaryRank || '',
      position: user.personnelProfile?.position || '',
      unitId: user.unitId || user.personnelProfile?.unitId || '',
      enlistmentDate: user.personnelProfile?.enlistmentDate?.toISOString().split('T')[0] || '',
      birthPlace: user.personnelProfile?.birthPlace || '',
      placeOfOrigin: user.personnelProfile?.placeOfOrigin || '',
      permanentAddress: '',
      educationLevel: user.personnelProfile?.educationLevel || '',
      specialization: user.personnelProfile?.specialization || '',
      academicDegree: '',
      ethnicity: user.personnelProfile?.ethnicity || '',
      religion: user.personnelProfile?.religion || '',
      bloodType: '',
      maritalStatus: ''
    };

    return NextResponse.json({ success: true, data: profileData });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Cập nhật profile
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if (!authResult.allowed) {
      return authResult.response!;
    }
    const authUser = authResult.user!;

    const data = await request.json();
    const userId = authUser.id;

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { personnelProfile: true }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Update User table
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.fullName || user.name,
        phone: data.phone || user.phone,
        unitId: data.unitId || user.unitId
      }
    });

    // If user has linked personnel, update Personnel table
    if (user.personnelId) {
      await prisma.personnel.update({
        where: { id: user.personnelId },
        data: {
          fullName: data.fullName,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
          gender: data.gender,
          militaryIdNumber: data.militaryId,
          militaryRank: data.rank,
          position: data.position,
          unitId: data.unitId,
          enlistmentDate: data.enlistmentDate ? new Date(data.enlistmentDate) : undefined,
          birthPlace: data.birthPlace,
          placeOfOrigin: data.placeOfOrigin,
          educationLevel: data.educationLevel,
          specialization: data.specialization,
          ethnicity: data.ethnicity,
          religion: data.religion
        }
      });
    } else {
      // Create new Personnel record and link to user
      // Generate unique personnel code
      const personnelCode = `P${Date.now().toString(36).toUpperCase()}`;
      
      const newPersonnel = await prisma.personnel.create({
        data: {
          personnelCode,
          fullName: data.fullName || user.name || 'Unknown',
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
          gender: data.gender,
          militaryIdNumber: data.militaryId,
          militaryRank: data.rank,
          position: data.position,
          unitId: data.unitId,
          enlistmentDate: data.enlistmentDate ? new Date(data.enlistmentDate) : undefined,
          birthPlace: data.birthPlace,
          placeOfOrigin: data.placeOfOrigin,
          educationLevel: data.educationLevel,
          specialization: data.specialization,
          ethnicity: data.ethnicity,
          religion: data.religion,
          category: 'GIANG_VIEN' // Default, can be updated by admin
        }
      });

      // Link to user
      await prisma.user.update({
        where: { id: userId },
        data: { personnelId: newPersonnel.id }
      });
    }

    // Audit log
    await logAudit({
      userId,
      functionCode: 'PROFILE.UPDATE',
      action: 'UPDATE_PROFILE',
      resourceType: 'USER',
      resourceId: userId,
      newValue: data,
      result: 'SUCCESS'
    });

    return NextResponse.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
