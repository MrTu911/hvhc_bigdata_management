/**
 * CSDL Quân nhân - Personnel API
 * Quản lý hồ sơ cán bộ
 * 
 * RBAC: Function-based với Scope filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { WorkStatus, BloodType, PersonnelCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { PERSONNEL } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

// Helper: Lấy danh sách đơn vị con (recursive)
async function getSubordinateUnitIds(unitId: string): Promise<string[]> {
  const result: string[] = [unitId];
  const children = await prisma.unit.findMany({
    where: { parentId: unitId },
    select: { id: true },
  });
  for (const child of children) {
    const childUnits = await getSubordinateUnitIds(child.id);
    result.push(...childUnits);
  }
  return result;
}

export async function GET(request: NextRequest) {
  try {
    // RBAC Check với Scope: VIEW_PERSONNEL
    const { user, scopedOptions, response } = await requireScopedFunction(request, PERSONNEL.VIEW);
    if (!user) {
      return response!;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const unitId = searchParams.get('unitId');
    const workStatus = searchParams.get('workStatus') as WorkStatus | null;
    const personnelType = searchParams.get('personnelType');
    const rank = searchParams.get('rank');

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    // Unit-based filtering based on RBAC scope
    const scope = scopedOptions?.scope || 'SELF';
    
    if (scope === 'ACADEMY') {
      // Full access, filter only if user selected specific unit
      if (unitId && unitId !== 'ALL') {
        const subordinateUnitIds = await getSubordinateUnitIds(unitId);
        where.unitId = { in: subordinateUnitIds };
      }
    } else if (scope === 'DEPARTMENT' || scope === 'UNIT') {
      // Limit to user's unit and subordinate units
      if (user.unitId) {
        const subordinateUnitIds = await getSubordinateUnitIds(user.unitId);
        where.unitId = { in: subordinateUnitIds };
      } else {
        where.id = user.id; // Fallback to self
      }
    } else {
      // SELF scope - only own record
      where.id = user.id;
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } },
        { militaryId: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Work status filter
    if (workStatus && workStatus !== 'ALL' as any) {
      where.workStatus = workStatus;
    }

    // Personnel type filter
    if (personnelType && personnelType !== 'ALL') {
      where.personnelType = personnelType;
    }

    // Rank filter
    if (rank && rank !== 'ALL') {
      where.rank = rank;
    }

    // Query with pagination
    const [personnel, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          employeeId: true,
          militaryId: true,
          rank: true,
          position: true,
          phone: true,
          avatar: true,
          workStatus: true,
          personnelType: true,
          educationLevel: true,
          specialization: true,
          placeOfOrigin: true,
          dateOfBirth: true,
          gender: true,
          joinDate: true,
          startDate: true,
          unitId: true,
          unitRelation: {
            select: {
              id: true,
              name: true,
              code: true,
              type: true,
            },
          },
          scientificProfile: {
            select: { id: true },
          },
        },
        orderBy: [{ rank: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Get statistics
    const stats = await prisma.user.groupBy({
      by: ['workStatus'],
      where,
      _count: { id: true },
    });

    // Log audit
    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.VIEW,
      action: 'VIEW',
      resourceType: 'PERSONNEL_LIST',
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      success: true,
      data: personnel,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: stats.reduce((acc, s) => {
        acc[s.workStatus || 'UNKNOWN'] = s._count.id;
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error) {
    console.error('Error fetching personnel:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy danh sách cán bộ' },
      { status: 500 }
    );
  }
}

// Map gender string to standard format
function mapGender(gender: string): string | undefined {
  const genderMap: Record<string, string> = {
    'Nam': 'Nam',
    'MALE': 'Nam',
    'NAM': 'Nam',
    'Nữ': 'Nữ',
    'FEMALE': 'Nữ',
    'NU': 'Nữ',
  };
  return genderMap[gender];
}

// Map blood type string to enum
function mapBloodType(bloodType: string): BloodType | undefined {
  const bloodTypeMap: Record<string, BloodType> = {
    'O': BloodType.O_POSITIVE,
    'A': BloodType.A_POSITIVE,
    'B': BloodType.B_POSITIVE,
    'AB': BloodType.AB_POSITIVE,
    'O+': BloodType.O_POSITIVE,
    'O-': BloodType.O_NEGATIVE,
    'A+': BloodType.A_POSITIVE,
    'A-': BloodType.A_NEGATIVE,
    'B+': BloodType.B_POSITIVE,
    'B-': BloodType.B_NEGATIVE,
    'AB+': BloodType.AB_POSITIVE,
    'AB-': BloodType.AB_NEGATIVE,
  };
  return bloodTypeMap[bloodType];
}

// Generate employee ID
async function generateEmployeeId(): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2);
  const count = await prisma.user.count();
  return `CB${year}${(count + 1).toString().padStart(4, '0')}`;
}

// Generate military ID
async function generateMilitaryId(): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2);
  const count = await prisma.user.count({ where: { militaryId: { not: null } } });
  return `QN${year}${(count + 1).toString().padStart(5, '0')}`;
}

export async function POST(request: NextRequest) {
  try {
    // RBAC Check với Scope: CREATE_PERSONNEL
    const { user, response } = await requireScopedFunction(request, PERSONNEL.CREATE);
    if (!user) {
      return response!;
    }

    const body = await request.json();
    const { name, email, phone, dateOfBirth, gender, rank, position, unitId: bodyUnitId, unit, 
            placeOfOrigin, bloodType, educationLevel, specialization,
            enlistmentDate, joinDate, ethnicity, religion, citizenId,
            permanentAddress, temporaryAddress, birthPlace,
            // New FK fields for master data integration
            positionId, ethnicityId, religionId, specializationId, 
            birthPlaceId, placeOfOriginId, managementCategory, managementLevel } = body;
    
    // If positionId is provided, get position name from DB for compatibility
    let positionName = position;
    if (positionId) {
      const positionRecord = await prisma.position.findUnique({
        where: { id: positionId },
        select: { name: true, code: true },
      });
      if (positionRecord) {
        positionName = positionRecord.name;
      }
    }

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json({ success: false, error: 'Họ tên và email là bắt buộc' }, { status: 400 });
    }

    // Check email uniqueness
    const existingByEmail = await prisma.user.findUnique({ where: { email } });
    if (existingByEmail) {
      return NextResponse.json({ 
        success: false, 
        error: `Email "${email}" đã tồn tại trong hệ thống (thuộc cán bộ: ${existingByEmail.name})` 
      }, { status: 400 });
    }

    // Check for duplicate citizenId (CCCD)
    if (citizenId && citizenId.trim()) {
      const existingByCitizenId = await prisma.user.findFirst({ 
        where: { citizenId: citizenId.trim() } 
      });
      if (existingByCitizenId) {
        return NextResponse.json({ 
          success: false, 
          error: `Số CCCD/CMND "${citizenId}" đã tồn tại trong hệ thống (thuộc cán bộ: ${existingByCitizenId.name})` 
        }, { status: 400 });
      }
    }

    // Check for duplicate officerIdCard (Số chứng minh sĩ quan)
    const officerIdCard = body.officerIdCard || body.militaryIdNumber;
    if (officerIdCard && officerIdCard.trim()) {
      const existingByOfficerId = await prisma.user.findFirst({ 
        where: { militaryId: officerIdCard.trim() } 
      });
      if (existingByOfficerId) {
        return NextResponse.json({ 
          success: false, 
          error: `Số chứng minh sĩ quan "${officerIdCard}" đã tồn tại trong hệ thống (thuộc cán bộ: ${existingByOfficerId.name})` 
        }, { status: 400 });
      }
    }

    // Determine unit ID
    let unitId: string | undefined = bodyUnitId;
    if (!unitId && unit) {
      const foundUnit = await prisma.unit.findFirst({
        where: {
          OR: [
            { name: { contains: unit, mode: 'insensitive' } },
            { code: { equals: unit, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      });
      unitId = foundUnit?.id;
    }

    // Generate IDs
    const employeeId = await generateEmployeeId();
    const militaryId = await generateMilitaryId();
    
    // Hash default password
    const hashedPassword = await bcrypt.hash('Hv@2025', 10);

    // Map role from position (use positionName which may come from FK lookup)
    let userRole: any = 'HOC_VIEN';
    let personnelCategory: PersonnelCategory = PersonnelCategory.CONG_NHAN_VIEN;
    if (positionName) {
      const posLower = positionName.toLowerCase();
      if (posLower.includes('giám đốc') || posLower.includes('phó giám đốc')) {
        userRole = 'CHI_HUY_HOC_VIEN';
        personnelCategory = PersonnelCategory.CAN_BO_CHI_HUY;
      } else if (posLower.includes('trưởng') || posLower.includes('phó trưởng')) {
        userRole = 'CHI_HUY_KHOA_PHONG';
        personnelCategory = PersonnelCategory.CAN_BO_CHI_HUY;
      } else if (posLower.includes('chủ nhiệm') || posLower.includes('q.cn')) {
        userRole = 'CHU_NHIEM_BO_MON';
        personnelCategory = PersonnelCategory.CAN_BO_CHI_HUY;
      } else if (posLower.includes('giảng viên') || posLower.includes('gv')) {
        userRole = 'GIANG_VIEN';
        personnelCategory = PersonnelCategory.GIANG_VIEN;
      } else if (posLower.includes('nghiên cứu')) {
        userRole = 'NGHIEN_CUU_VIEN';
        personnelCategory = PersonnelCategory.NGHIEN_CUU_VIEN;
      }
    }

    // Determine if this is an officer or soldier based on rank
    const officerRanks = [
      'Đại tướng', 'Thượng tướng', 'Trung tướng', 'Thiếu tướng',
      'Đại tá', 'Thượng tá', 'Trung tá', 'Thiếu tá',
      'Đại úy', 'Thượng úy', 'Trung úy', 'Thiếu úy'
    ];
    const isOfficer = rank && officerRanks.some(r => rank.includes(r));

    // Create user with FK references to master data
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: mapGender(gender),
        rank: rank || null,
        position: positionName || null,
        positionId: positionId || null,           // FK to Position
        employeeId,
        militaryId,
        placeOfOrigin: placeOfOrigin || birthPlace || null,
        placeOfOriginId: placeOfOriginId || null, // FK to AdministrativeUnit
        birthPlace: birthPlace || placeOfOrigin || null,
        birthPlaceId: birthPlaceId || null,       // FK to AdministrativeUnit
        bloodType: mapBloodType(bloodType),
        educationLevel: educationLevel || null,
        specialization: specialization || null,
        specializationId: specializationId || null, // FK to SpecializationCatalog
        ethnicity: ethnicity || null,
        ethnicityId: ethnicityId || null,         // FK to Ethnicity
        religion: religion || null,
        religionId: religionId || null,           // FK to Religion
        citizenId: citizenId || null,
        permanentAddress: permanentAddress || null,
        temporaryAddress: temporaryAddress || null,
        joinDate: joinDate ? new Date(joinDate) : null,
        startDate: enlistmentDate ? new Date(enlistmentDate) : null,
        workStatus: WorkStatus.ACTIVE,
        personnelType: personnelCategory,
        managementCategory: managementCategory || null,
        managementLevel: managementLevel || null,
        role: userRole,
        unitId: unitId || user.unitId || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        militaryId: true,
        rank: true,
        position: true,
        positionId: true,
        role: true,
      },
    });

    // Also create Personnel record for linking with OfficerCareer/SoldierProfile
    const personnelCode = `CB${new Date().getFullYear().toString().slice(-2)}${(await prisma.personnel.count() + 1).toString().padStart(5, '0')}`;
    
    // Map rank string to OfficerRank enum
    const rankEnumMap: Record<string, string> = {
      'Đại tướng': 'DAI_TUONG', 'Thượng tướng': 'THUONG_TUONG', 'Trung tướng': 'TRUNG_TUONG', 'Thiếu tướng': 'THIEU_TUONG',
      'Đại tá': 'DAI_TA', 'Thượng tá': 'THUONG_TA', 'Trung tá': 'TRUNG_TA', 'Thiếu tá': 'THIEU_TA',
      'Đại úy': 'DAI_UY', 'Thượng úy': 'THUONG_UY', 'Trung úy': 'TRUNG_UY', 'Thiếu úy': 'THIEU_UY',
    };
    const officerRankEnum = rank ? rankEnumMap[rank] : undefined;

    const newPersonnel = await prisma.personnel.create({
      data: {
        personnelCode,
        fullName: name,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: mapGender(gender),
        placeOfOrigin: placeOfOrigin || birthPlace || null,
        placeOfOriginAdminId: placeOfOriginId || null, // FK
        birthPlace: birthPlace || placeOfOrigin || null,
        birthPlaceAdminId: birthPlaceId || null, // FK
        ethnicity: ethnicity || null,
        ethnicityId: ethnicityId || null, // FK
        religion: religion || null,
        religionId: religionId || null, // FK
        category: personnelCategory,
        unitId: unitId || user.unitId || null,
        status: 'DANG_CONG_TAC',
        militaryRank: rank || null,
        position: positionName || null,
        positionId: positionId || null, // FK
        enlistmentDate: enlistmentDate ? new Date(enlistmentDate) : null,
        educationLevel: educationLevel || null,
        specialization: specialization || null,
        specializationId: specializationId || null, // FK
      },
    });

    // Auto-categorize into OfficerCareer or SoldierProfile based on rank
    if (isOfficer && officerRankEnum) {
      // Create OfficerCareer record for officers
      await prisma.officerCareer.create({
        data: {
          personnelId: newPersonnel.id,
          officerIdNumber: officerIdCard || militaryId,
          currentRank: officerRankEnum as any,
          currentPosition: position || null,
          commissionedDate: enlistmentDate ? new Date(enlistmentDate) : null,
          createdBy: user.id,
        },
      });
    } else if (rank) {
      // Create SoldierProfile record for soldiers (non-officers)
      // Map soldier rank string to SoldierRank enum
      const soldierRankMap: Record<string, string> = {
        'Thượng sĩ': 'THUONG_SI', 'Thượng sĩ nhất': 'THUONG_SI',
        'Trung sĩ': 'TRUNG_SI', 'Trung sĩ nhất': 'TRUNG_SI',
        'Hạ sĩ': 'HA_SI',
        'Binh nhất': 'BINH_NHAT',
        'Binh nhì': 'BINH_NHI',
      };
      const soldierRankEnum = Object.keys(soldierRankMap).find(k => rank.includes(k));
      const mappedSoldierRank = soldierRankEnum ? soldierRankMap[soldierRankEnum] : undefined;
      
      await prisma.soldierProfile.create({
        data: {
          personnelId: newPersonnel.id,
          soldierIdNumber: militaryId,
          currentRank: mappedSoldierRank as any || undefined,
          soldierCategory: 'HSQ', // Default category
          enlistmentDate: enlistmentDate ? new Date(enlistmentDate) : null,
          createdBy: user.id,
        },
      });
    }

    // Audit log
    await logAudit({
      userId: user.id,
      functionCode: PERSONNEL.CREATE,
      action: 'CREATE',
      resourceType: 'PERSONNEL',
      resourceId: newUser.id,
      newValue: { name, email, position, rank },
      result: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      success: true,
      data: newUser,
      message: 'Tạo hồ sơ cán bộ thành công',
    });
  } catch (error) {
    console.error('Error creating personnel:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tạo hồ sơ cán bộ' },
      { status: 500 }
    );
  }
}
