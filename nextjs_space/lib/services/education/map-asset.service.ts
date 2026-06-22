/**
 * M10 – Phase 3: Service Vật chất bản đồ (Ban Bản đồ).
 * Quản lý kho bản đồ giấy + số (có cấp độ mật) + cấp phát/mượn-trả.
 * Lưu ý bảo mật: bản đồ mật/tối mật/tuyệt mật chỉ trả khi có quyền VIEW_MAP_SECRET.
 */

import type { MapType, MapFormat, MapSecurityLevel, AssetIssueType, Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';

/** Mức mật cần quyền VIEW_MAP_SECRET để xem. */
export const RESTRICTED_SECURITY_LEVELS: MapSecurityLevel[] = ['CONFIDENTIAL', 'SECRET', 'TOP_SECRET'];

export interface MapListFilters {
  search?: string;
  mapType?: MapType;
  format?: MapFormat;
  managingUnitId?: string;
  /** false (mặc định) = ẩn bản đồ mật khỏi danh sách */
  includeSecret?: boolean;
  page?: number;
  limit?: number;
}

export async function listMapAssets(filters: MapListFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));

  const where: Prisma.MapAssetWhereInput = { isActive: true };
  if (filters.search) {
    where.OR = [
      { code: { contains: filters.search, mode: 'insensitive' } },
      { name: { contains: filters.search, mode: 'insensitive' } },
      { sheetNumber: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  if (filters.mapType) where.mapType = filters.mapType;
  if (filters.format) where.format = filters.format;
  if (filters.managingUnitId) where.managingUnitId = filters.managingUnitId;
  // Guard backend: không có quyền mật → chỉ thấy bản đồ NORMAL
  if (!filters.includeSecret) where.securityLevel = 'NORMAL';

  const [items, total] = await Promise.all([
    prisma.mapAsset.findMany({
      where,
      orderBy: { code: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { loans: true } } },
    }),
    prisma.mapAsset.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export interface CreateMapInput {
  code: string;
  name: string;
  mapType?: MapType;
  format?: MapFormat;
  scale?: string;
  sheetNumber?: string;
  securityLevel?: MapSecurityLevel;
  quantityTotal?: number;
  quantityAvailable?: number;
  fileUrl?: string;
  storageLocation?: string;
  managingUnitId?: string;
  description?: string;
}

export async function createMapAsset(input: CreateMapInput) {
  const quantityTotal = input.quantityTotal ?? 0;
  return prisma.mapAsset.create({
    data: {
      code: input.code,
      name: input.name,
      mapType: input.mapType ?? 'TOPOGRAPHIC',
      format: input.format ?? 'PAPER',
      scale: input.scale ?? null,
      sheetNumber: input.sheetNumber ?? null,
      securityLevel: input.securityLevel ?? 'NORMAL',
      quantityTotal,
      quantityAvailable: input.quantityAvailable ?? quantityTotal,
      fileUrl: input.fileUrl ?? null,
      storageLocation: input.storageLocation ?? null,
      managingUnitId: input.managingUnitId ?? null,
      description: input.description ?? null,
    },
  });
}

export async function updateMapAsset(id: string, input: Partial<CreateMapInput>) {
  return prisma.mapAsset.update({ where: { id }, data: input });
}

/** Xóa mềm — giữ lịch sử mượn-trả. */
export async function deleteMapAsset(id: string) {
  return prisma.mapAsset.update({ where: { id }, data: { isActive: false } });
}

export interface IssueMapInput {
  quantity: number;
  loanType?: AssetIssueType;
  borrowerUnitId?: string;
  borrowerName?: string;
  issuedById: string;
  purpose?: string;
  dueDate?: string;
}

/** Cấp phát/cho mượn bản đồ — giảm tồn khả dụng; ALLOCATION giảm cả tổng. */
export async function issueMapAsset(mapAssetId: string, input: IssueMapInput) {
  return prisma.$transaction(async (tx) => {
    const asset = await tx.mapAsset.findUnique({ where: { id: mapAssetId } });
    if (!asset) throw new Error('Không tìm thấy bản đồ');

    const quantity = input.quantity ?? 1;
    if (quantity <= 0) throw new Error('Số lượng phải lớn hơn 0');
    if (quantity > asset.quantityAvailable) {
      throw new Error(`Không đủ tồn khả dụng (còn ${asset.quantityAvailable})`);
    }

    const loan = await tx.mapLoan.create({
      data: {
        mapAssetId,
        quantity,
        loanType: input.loanType ?? 'LOAN',
        borrowerUnitId: input.borrowerUnitId ?? null,
        borrowerName: input.borrowerName ?? null,
        issuedById: input.issuedById,
        purpose: input.purpose ?? null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        status: 'ISSUED',
      },
    });

    const data: Prisma.MapAssetUpdateInput = { quantityAvailable: { decrement: quantity } };
    if (input.loanType === 'ALLOCATION') data.quantityTotal = { decrement: quantity };
    await tx.mapAsset.update({ where: { id: mapAssetId }, data });

    return loan;
  });
}

/** Thu hồi/nhận trả bản đồ — chỉ với phiếu LOAN; cộng lại tồn khả dụng. */
export async function returnMapAsset(loanId: string) {
  return prisma.$transaction(async (tx) => {
    const loan = await tx.mapLoan.findUnique({ where: { id: loanId } });
    if (!loan) throw new Error('Không tìm thấy phiếu mượn');
    if (loan.status === 'RETURNED') return loan;
    if (loan.loanType === 'ALLOCATION') throw new Error('Phiếu cấp hẳn không thu hồi');

    const updated = await tx.mapLoan.update({
      where: { id: loanId },
      data: { status: 'RETURNED', returnedAt: new Date() },
    });
    await tx.mapAsset.update({
      where: { id: loan.mapAssetId },
      data: { quantityAvailable: { increment: loan.quantity } },
    });
    return updated;
  });
}
