/**
 * API Sync Dữ liệu Hồ sơ Cán bộ vào các CSDL tương ứng
 * 
 * QUY TẮC ĐỒNG BỘ MỚI (v2):
 * - Sĩ quan: Dựa trên managementCategory = 'CAN_BO' (không dùng quân hàm vì QNCN cũng có quân hàm)
 * - Quân nhân (QNCN, HSQ, Chiến sĩ): Dựa trên managementCategory = 'QUAN_LUC'
 * - Đảng viên: Dựa trên partyJoinDate (có ngày vào Đảng) HOẶC partyPosition (Đảng viên, Bí thư, Đảng ủy viên, Chi ủy viên)
 * - Tất cả → CSDL Chính sách, Bảo hiểm, Khen thưởng
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { SYSTEM, PERSONNEL } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

// Map quân hàm tiếng Việt → enum (vẫn dùng để lưu thông tin quân hàm)
const OFFICER_RANK_MAP: Record<string, string> = {
  'Đại tướng': 'DAI_TUONG',
  'Thượng tướng': 'THUONG_TUONG',
  'Trung tướng': 'TRUNG_TUONG',
  'Thiếu tướng': 'THIEU_TUONG',
  'Đại tá': 'DAI_TA',
  'Thượng tá': 'THUONG_TA',
  'Trung tá': 'TRUNG_TA',
  'Thiếu tá': 'THIEU_TA',
  'Đại úy': 'DAI_UY',
  'Thượng úy': 'THUONG_UY',
  'Trung úy': 'TRUNG_UY',
  'Thiếu úy': 'THIEU_UY',
};

const SOLDIER_RANK_MAP: Record<string, string> = {
  'Thượng sĩ': 'THUONG_SI',
  'Trung sĩ': 'TRUNG_SI',
  'Hạ sĩ': 'HA_SI',
  'Binh nhất': 'BINH_NHAT',
  'Binh nhì': 'BINH_NHI',
};

// Các chức danh Đảng được công nhận
const PARTY_POSITION_KEYWORDS = ['Đảng viên', 'Bí thư', 'Đảng ủy viên', 'Chi ủy viên', 'Đảng ủy', 'Chi bộ'];

/**
 * Kiểm tra xem user có thuộc diện Cán bộ quản lý không (Sĩ quan)
 * Dựa trên field managementCategory = 'CAN_BO'
 */
function isOfficerByManagement(user: { managementCategory: string | null }): boolean {
  return user.managementCategory === 'CAN_BO';
}

/**
 * Kiểm tra xem user có thuộc diện Quân lực quản lý không (QNCN, HSQ, Chiến sĩ)
 * Dựa trên field managementCategory = 'QUAN_LUC'
 */
function isSoldierByManagement(user: { managementCategory: string | null }): boolean {
  return user.managementCategory === 'QUAN_LUC';
}

/**
 * Kiểm tra xem user có phải Đảng viên không
 * Dựa trên: partyJoinDate (có ngày vào Đảng) HOẶC partyPosition (có chức danh Đảng)
 */
function isPartyMemberByData(user: { partyJoinDate: Date | null, partyPosition: string | null, position: string | null }): boolean {
  // Có ngày vào Đảng → là Đảng viên
  if (user.partyJoinDate) return true;
  
  // Có chức danh Đảng trong partyPosition
  if (user.partyPosition) {
    if (PARTY_POSITION_KEYWORDS.some(k => user.partyPosition!.includes(k))) return true;
  }
  
  // Kiểm tra trong position (chức vụ) có chứa chức danh Đảng không
  if (user.position) {
    if (PARTY_POSITION_KEYWORDS.some(k => user.position!.includes(k))) return true;
  }
  
  return false;
}

function getOfficerRankEnum(rank: string): string | null {
  for (const [key, value] of Object.entries(OFFICER_RANK_MAP)) {
    if (rank.includes(key)) return value;
  }
  return null;
}

function getSoldierRankEnum(rank: string): string | null {
  for (const [key, value] of Object.entries(SOLDIER_RANK_MAP)) {
    if (rank.includes(key)) return value;
  }
  return null;
}

function getSoldierCategory(rank: string): string {
  if (rank.includes('QNCN')) return 'QNCN';
  if (rank.includes('CNVQP')) return 'CNVQP';
  if (rank.includes('Thượng sĩ') || rank.includes('Trung sĩ') || rank.includes('Hạ sĩ')) return 'HSQ';
  return 'CHIEN_SI';
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.UPDATE);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }
    const { user } = authResult;

    const body = await request.json();
    const { action, unitId } = body;

    // Lấy danh sách User đã liên kết hồ sơ Personnel
    const linkedUsers = await prisma.user.findMany({
      where: {
        personnelId: { not: null },
        status: 'ACTIVE',
        ...(unitId ? { unitId } : {}),
      },
      include: {
        personnelProfile: true,
        unitRelation: true,
        partyMember: true,
        insuranceInfo: true,
      },
    });

    const stats = {
      total: linkedUsers.length,
      officers: { synced: 0, skipped: 0, noCategory: 0 },
      soldiers: { synced: 0, skipped: 0, noCategory: 0 },
      partyMembers: { synced: 0, skipped: 0, noData: 0 },
      insurance: { synced: 0, skipped: 0 },
      policy: { synced: 0, skipped: 0 },
    };

    for (const userData of linkedUsers) {
      if (!userData.personnelProfile) continue;
      const personnel = userData.personnelProfile;

      // 1. SYNC SĨ QUAN - Dựa trên managementCategory = 'CAN_BO'
      if (isOfficerByManagement(userData)) {
        const existingOfficer = await prisma.officerCareer.findUnique({
          where: { personnelId: personnel.id },
        });
        if (!existingOfficer) {
          const rankEnum = getOfficerRankEnum(userData.rank || '');
          await prisma.officerCareer.create({
            data: {
              personnelId: personnel.id,
              officerIdNumber: userData.militaryIdNumber || userData.employeeId,
              currentRank: rankEnum as any,
              currentPosition: userData.position,
              commissionedDate: userData.enlistmentDate,
              createdBy: user!.id,
            },
          });
          stats.officers.synced++;
        } else {
          stats.officers.skipped++;
        }
      }
      // 2. SYNC QUÂN NHÂN (QNCN, HSQ, Chiến sĩ) - Dựa trên managementCategory = 'QUAN_LUC'
      else if (isSoldierByManagement(userData)) {
        const existingSoldier = await prisma.soldierProfile.findUnique({
          where: { personnelId: personnel.id },
        });
        if (!existingSoldier) {
          const rankEnum = getSoldierRankEnum(userData.rank || '');
          const category = getSoldierCategory(userData.rank || '');
          await prisma.soldierProfile.create({
            data: {
              personnelId: personnel.id,
              soldierIdNumber: userData.militaryIdNumber || userData.employeeId,
              soldierCategory: category as any,
              currentRank: rankEnum as any,
              serviceType: 'NGHIA_VU',
              enlistmentDate: userData.enlistmentDate,
              createdBy: user!.id,
            },
          });
          stats.soldiers.synced++;
        } else {
          stats.soldiers.skipped++;
        }
      } else if (!userData.managementCategory) {
        // Chưa có thông tin diện quản lý
        stats.officers.noCategory++;
      }

      // 3. SYNC ĐẢNG VIÊN - Dựa trên partyJoinDate HOẶC partyPosition
      const partyMemberCheck = isPartyMemberByData(userData);
      if (partyMemberCheck && !userData.partyMember) {
        await prisma.partyMember.create({
          data: {
            userId: userData.id,
            status: 'ACTIVE',
            joinDate: userData.partyJoinDate || undefined,
            partyCell: userData.unitRelation?.name || 'Chưa xác định',
          },
        });
        stats.partyMembers.synced++;
      } else if (userData.partyMember) {
        stats.partyMembers.skipped++;
      } else if (!userData.partyJoinDate && !userData.partyPosition) {
        stats.partyMembers.noData++;
      }

      // 4. SYNC BẢO HIỂM
      if (!userData.insuranceInfo) {
        await prisma.insuranceInfo.create({
          data: {
            userId: userData.id,
            insuranceNumber: `BHXH${userData.employeeId || userData.id.slice(-8)}`,
            healthInsuranceNumber: `BHYT${userData.employeeId || userData.id.slice(-8)}`,
            insuranceStartDate: userData.joinDate || new Date(),
          },
        });
        stats.insurance.synced++;
      } else {
        stats.insurance.skipped++;
      }

      // 5. SYNC CHÍNH SÁCH (tạo record mặc định nếu chưa có)
      const existingPolicy = await prisma.policyRecord.findFirst({
        where: { userId: userData.id, recordType: 'REWARD' },
      });
      if (!existingPolicy) {
        await prisma.policyRecord.create({
          data: {
            userId: userData.id,
            recordType: 'REWARD',
            level: 'UNIT',
            title: 'Hồ sơ chính sách cán bộ',
            reason: 'Tự động tạo khi đồng bộ dữ liệu',
            effectiveDate: userData.joinDate || new Date(),
            status: 'ACTIVE',
          },
        });
        stats.policy.synced++;
      } else {
        stats.policy.skipped++;
      }
    }

    // Ghi log
    await prisma.systemLog.create({
      data: {
        userId: user!.id,
        level: 'INFO',
        category: 'SYSTEM',
        action: 'SYNC_PERSONNEL_DATA',
        description: `Đồng bộ dữ liệu: ${JSON.stringify(stats)}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Đồng bộ dữ liệu thành công',
      stats,
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Lỗi đồng bộ dữ liệu', details: String(error) },
      { status: 500 }
    );
  }
}

// GET: Lấy thống kê hiện tại
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.UPDATE);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.authResult?.deniedReason || 'Không có quyền' || 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const unitId = searchParams.get('unitId');

    // Đếm số lượng từng loại
    const [linkedUsers, officers, soldiers, partyMembers, insuranceRecords, policyRecords, units] = await Promise.all([
      prisma.user.count({ where: { personnelId: { not: null }, status: 'ACTIVE', ...(unitId ? { unitId } : {}) } }),
      prisma.officerCareer.count(),
      prisma.soldierProfile.count(),
      prisma.partyMember.count({ where: { status: 'ACTIVE' } }),
      prisma.insuranceInfo.count({ where: { deletedAt: null } }),
      prisma.policyRecord.count({ where: { status: 'ACTIVE' } }),
      prisma.unit.findMany({
        where: { active: true },
        select: { id: true, name: true, code: true, _count: { select: { users: true } } },
        orderBy: { name: 'asc' },
      }),
    ]);

    // Lấy danh sách user chưa đồng bộ - bao gồm các field mới
    const usersNeedSync = await prisma.user.findMany({
      where: {
        personnelId: { not: null },
        status: 'ACTIVE',
        ...(unitId ? { unitId } : {}),
      },
      select: {
        id: true,
        name: true,
        rank: true,
        position: true,
        managementCategory: true,  // Diện quản lý: CAN_BO hoặc QUAN_LUC
        partyJoinDate: true,        // Ngày vào Đảng
        partyPosition: true,        // Chức danh Đảng
        unitRelation: { select: { name: true } },
        personnelProfile: {
          select: {
            id: true,
            officerCareer: { select: { id: true } },
            soldierProfile: { select: { id: true } },
          },
        },
        partyMember: { select: { id: true } },
        insuranceInfo: { select: { id: true } },
      },
    });

    // Phân loại user theo quy tắc mới
    const needsSync = usersNeedSync.filter(u => {
      const personnel = u.personnelProfile;
      const isOfficer = isOfficerByManagement(u);
      const isSoldier = isSoldierByManagement(u);
      const isParty = isPartyMemberByData(u);
      
      return (
        (isOfficer && !personnel?.officerCareer) ||
        (isSoldier && !personnel?.soldierProfile) ||
        (isParty && !u.partyMember) ||
        !u.insuranceInfo
      );
    });

    // Thống kê người chưa có diện quản lý
    const noManagementCategory = usersNeedSync.filter(u => !u.managementCategory).length;
    const noPartyInfo = usersNeedSync.filter(u => !u.partyJoinDate && !u.partyPosition && !u.partyMember).length;

    return NextResponse.json({
      success: true,
      stats: {
        linkedUsers,
        officers,
        soldiers,
        partyMembers,
        insuranceRecords,
        policyRecords,
        needsSync: needsSync.length,
        noManagementCategory,  // Số người chưa có diện quản lý
        noPartyInfo,           // Số người chưa có thông tin Đảng
      },
      units: units.map(u => ({
        id: u.id,
        name: u.name,
        code: u.code,
        personnelCount: u._count.users,
      })),
      usersNeedSync: needsSync.slice(0, 20).map(u => ({
        id: u.id,
        name: u.name,
        rank: u.rank,
        position: u.position,
        managementCategory: u.managementCategory,
        partyJoinDate: u.partyJoinDate,
        partyPosition: u.partyPosition,
        unit: u.unitRelation?.name,
        missing: {
          officer: isOfficerByManagement(u) && !u.personnelProfile?.officerCareer,
          soldier: isSoldierByManagement(u) && !u.personnelProfile?.soldierProfile,
          party: isPartyMemberByData(u) && !u.partyMember,
          insurance: !u.insuranceInfo,
          noCategory: !u.managementCategory,  // Chưa có diện quản lý
        },
      })),
      // Quy tắc đồng bộ mới
      syncRules: {
        officer: 'Diện quản lý = "Cán bộ" (managementCategory = CAN_BO)',
        soldier: 'Diện quản lý = "Quân lực" (managementCategory = QUAN_LUC)',
        partyMember: 'Có ngày vào Đảng HOẶC chức danh: Đảng viên, Bí thư, Đảng ủy viên, Chi ủy viên',
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Lỗi lấy thống kê', details: String(error) },
      { status: 500 }
    );
  }
}
