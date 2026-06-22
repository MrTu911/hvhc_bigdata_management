/**
 * M10 – Phase 3: Service Vật chất huấn luyện (Ban Vật chất).
 * Quản lý kho vật chất + cấp phát/mượn-trả (cập nhật tồn khả dụng trong transaction).
 */

import type { MaterielCategory, MaterielCondition, AssetIssueType, Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';

export interface MaterielListFilters {
  search?: string;
  category?: MaterielCategory;
  condition?: MaterielCondition;
  managingUnitId?: string;
  page?: number;
  limit?: number;
}

export async function listMateriels(filters: MaterielListFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));

  const where: Prisma.TrainingMaterielWhereInput = { isActive: true };
  if (filters.search) {
    where.OR = [
      { code: { contains: filters.search, mode: 'insensitive' } },
      { name: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  if (filters.category) where.category = filters.category;
  if (filters.condition) where.condition = filters.condition;
  if (filters.managingUnitId) where.managingUnitId = filters.managingUnitId;

  const [items, total] = await Promise.all([
    prisma.trainingMateriel.findMany({
      where,
      orderBy: { code: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { issuances: true } } },
    }),
    prisma.trainingMateriel.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export interface CreateMaterielInput {
  code: string;
  name: string;
  category?: MaterielCategory;
  measureUnit?: string;
  quantityTotal?: number;
  quantityAvailable?: number;
  condition?: MaterielCondition;
  storageLocation?: string;
  managingUnitId?: string;
  description?: string;
}

export async function createMateriel(input: CreateMaterielInput) {
  const quantityTotal = input.quantityTotal ?? 0;
  return prisma.trainingMateriel.create({
    data: {
      code: input.code,
      name: input.name,
      category: input.category ?? 'EQUIPMENT',
      measureUnit: input.measureUnit ?? null,
      quantityTotal,
      quantityAvailable: input.quantityAvailable ?? quantityTotal,
      condition: input.condition ?? 'GOOD',
      storageLocation: input.storageLocation ?? null,
      managingUnitId: input.managingUnitId ?? null,
      description: input.description ?? null,
    },
  });
}

export async function updateMateriel(id: string, input: Partial<CreateMaterielInput>) {
  return prisma.trainingMateriel.update({ where: { id }, data: input });
}

/** Xóa mềm — giữ lịch sử cấp phát (soft delete). */
export async function deleteMateriel(id: string) {
  return prisma.trainingMateriel.update({ where: { id }, data: { isActive: false } });
}

export interface IssueMaterielInput {
  quantity: number;
  issueType?: AssetIssueType;
  borrowerUnitId?: string;
  borrowerName?: string;
  issuedById: string;
  purpose?: string;
  dueDate?: string;
}

/** Cấp phát/cho mượn — giảm tồn khả dụng; ALLOCATION (cấp hẳn) giảm cả tổng. */
export async function issueMateriel(materielId: string, input: IssueMaterielInput) {
  return prisma.$transaction(async (tx) => {
    const materiel = await tx.trainingMateriel.findUnique({ where: { id: materielId } });
    if (!materiel) throw new Error('Không tìm thấy vật chất');

    const quantity = input.quantity ?? 1;
    if (quantity <= 0) throw new Error('Số lượng phải lớn hơn 0');
    if (quantity > materiel.quantityAvailable) {
      throw new Error(`Không đủ tồn khả dụng (còn ${materiel.quantityAvailable})`);
    }

    const issuance = await tx.materielIssuance.create({
      data: {
        materielId,
        quantity,
        issueType: input.issueType ?? 'LOAN',
        borrowerUnitId: input.borrowerUnitId ?? null,
        borrowerName: input.borrowerName ?? null,
        issuedById: input.issuedById,
        purpose: input.purpose ?? null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        status: 'ISSUED',
      },
    });

    const data: Prisma.TrainingMaterielUpdateInput = { quantityAvailable: { decrement: quantity } };
    if (input.issueType === 'ALLOCATION') data.quantityTotal = { decrement: quantity };
    await tx.trainingMateriel.update({ where: { id: materielId }, data });

    return issuance;
  });
}

/** Thu hồi/nhận trả — chỉ với phiếu LOAN; cộng lại tồn khả dụng. */
export async function returnMateriel(issuanceId: string) {
  return prisma.$transaction(async (tx) => {
    const issuance = await tx.materielIssuance.findUnique({ where: { id: issuanceId } });
    if (!issuance) throw new Error('Không tìm thấy phiếu cấp phát');
    if (issuance.status === 'RETURNED') return issuance;
    if (issuance.issueType === 'ALLOCATION') throw new Error('Phiếu cấp hẳn không thu hồi');

    const updated = await tx.materielIssuance.update({
      where: { id: issuanceId },
      data: { status: 'RETURNED', returnedAt: new Date() },
    });
    await tx.trainingMateriel.update({
      where: { id: issuance.materielId },
      data: { quantityAvailable: { increment: issuance.quantity } },
    });
    return updated;
  });
}
