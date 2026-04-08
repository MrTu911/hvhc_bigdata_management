/**
 * M01 – UC-04: Unit Tree Service
 *
 * Business logic cho quản lý cơ cấu tổ chức phân cấp.
 * Tách khỏi route layer để dễ test và tái sử dụng.
 */

import prisma from '@/lib/db';

export interface CreateUnitInput {
  code: string;
  name: string;
  type: string;
  level: number;
  parentId?: string | null;
  commanderId?: string | null;
  description?: string | null;
}

export interface UpdateUnitInput {
  name?: string;
  type?: string;
  level?: number;
  parentId?: string | null;
  commanderId?: string | null;
  description?: string | null;
}

export interface UnitTreeNode {
  id: string;
  code: string;
  name: string;
  type: string;
  level: number;
  parentId: string | null;
  path: string | null;
  active: boolean;
  children: UnitTreeNode[];
  _count?: { users: number; children: number };
}

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Tính path materialized từ parent.
 * path = "<parent.path>/<code>" hoặc "<code>" nếu là root.
 */
function buildPath(parentPath: string | null, code: string): string {
  return parentPath ? `${parentPath}/${code}` : code;
}

/**
 * Kiểm tra unitId có phải là tổ tiên của targetId không
 * (dùng để chặn cycle khi move).
 * Return true nếu unitId nằm trên đường đi từ root đến targetId.
 */
async function isAncestorOf(unitId: string, targetId: string): Promise<boolean> {
  let current = await prisma.unit.findUnique({
    where: { id: targetId },
    select: { parentId: true },
  });
  while (current?.parentId) {
    if (current.parentId === unitId) return true;
    current = await prisma.unit.findUnique({
      where: { id: current.parentId },
      select: { parentId: true },
    });
  }
  return false;
}

/**
 * Lấy tất cả id của unit và descendants (dùng khi cần update path hàng loạt).
 */
async function getDescendantIds(unitId: string): Promise<string[]> {
  const ids: string[] = [];
  const queue = [unitId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const children = await prisma.unit.findMany({
      where: { parentId: current, active: true },
      select: { id: true },
    });
    for (const child of children) {
      ids.push(child.id);
      queue.push(child.id);
    }
  }
  return ids;
}

/**
 * Cập nhật path cho unit và toàn bộ cây con (sau khi move).
 */
async function rebuildPathsForSubtree(unitId: string, newPath: string): Promise<void> {
  await prisma.unit.update({ where: { id: unitId }, data: { path: newPath } });

  const children = await prisma.unit.findMany({
    where: { parentId: unitId, active: true },
    select: { id: true, code: true },
  });

  await Promise.all(
    children.map((child) => rebuildPathsForSubtree(child.id, `${newPath}/${child.code}`))
  );
}

// ─── public API ─────────────────────────────────────────────────────────────

export async function createUnit(input: CreateUnitInput): Promise<{
  success: boolean;
  unit?: any;
  error?: string;
}> {
  const { code, name, type, level, parentId, commanderId, description } = input;

  // Code trùng
  const existing = await prisma.unit.findUnique({ where: { code } });
  if (existing) {
    return { success: false, error: `Mã đơn vị "${code}" đã tồn tại` };
  }

  // Parent tồn tại + cấp hợp lệ
  let parentPath: string | null = null;
  if (parentId) {
    const parent = await prisma.unit.findUnique({
      where: { id: parentId },
      select: { level: true, path: true, active: true },
    });
    if (!parent) return { success: false, error: 'Đơn vị cha không tồn tại' };
    if (!parent.active) return { success: false, error: 'Đơn vị cha đã bị vô hiệu hóa' };
    if (level <= parent.level) {
      return {
        success: false,
        error: `Cấp đơn vị con (${level}) phải lớn hơn cấp đơn vị cha (${parent.level})`,
      };
    }
    parentPath = parent.path;
  }

  const unit = await prisma.unit.create({
    data: {
      code,
      name,
      type,
      level,
      parentId: parentId ?? null,
      commanderId: commanderId ?? null,
      description: description ?? null,
      path: buildPath(parentPath, code),
    },
    include: {
      commander: { select: { id: true, name: true, rank: true } },
      parent: { select: { id: true, code: true, name: true } },
    },
  });

  return { success: true, unit };
}

export async function updateUnit(
  id: string,
  input: UpdateUnitInput
): Promise<{ success: boolean; unit?: any; error?: string; oldData?: any }> {
  const existing = await prisma.unit.findUnique({
    where: { id },
    select: { code: true, name: true, type: true, level: true, parentId: true, path: true, active: true },
  });
  if (!existing) return { success: false, error: 'Đơn vị không tồn tại' };
  if (!existing.active) return { success: false, error: 'Đơn vị đã bị vô hiệu hóa' };

  const { name, type, level, parentId, commanderId, description } = input;
  const updateData: Record<string, any> = {};

  if (name !== undefined) updateData.name = name;
  if (type !== undefined) updateData.type = type;
  if (description !== undefined) updateData.description = description;
  if (commanderId !== undefined) updateData.commanderId = commanderId ?? null;

  // Level thay đổi — chỉ cho phép nếu không làm lệch parent constraint
  if (level !== undefined && level !== existing.level) {
    updateData.level = level;
  }

  // Move: parentId thay đổi
  const isMoving =
    parentId !== undefined &&
    parentId !== existing.parentId;

  if (isMoving) {
    // Không tự làm cha chính nó
    if (parentId === id) {
      return { success: false, error: 'Đơn vị không thể là cha của chính nó' };
    }

    if (parentId) {
      // Cycle check: parent mới không được là descendant của unit hiện tại
      const wouldCycle = await isAncestorOf(id, parentId);
      if (wouldCycle) {
        return { success: false, error: 'Không thể chuyển đơn vị vào một đơn vị con của chính nó (tạo vòng lặp)' };
      }

      const newParent = await prisma.unit.findUnique({
        where: { id: parentId },
        select: { level: true, path: true, active: true },
      });
      if (!newParent) return { success: false, error: 'Đơn vị cha mới không tồn tại' };
      if (!newParent.active) return { success: false, error: 'Đơn vị cha mới đã bị vô hiệu hóa' };

      const effectiveLevel = level ?? existing.level;
      if (effectiveLevel <= newParent.level) {
        return {
          success: false,
          error: `Cấp đơn vị con (${effectiveLevel}) phải lớn hơn cấp đơn vị cha (${newParent.level})`,
        };
      }

      updateData.parentId = parentId;
      updateData.path = buildPath(newParent.path, existing.code);
    } else {
      // Chuyển thành root
      updateData.parentId = null;
      updateData.path = existing.code;
    }
  }

  const unit = await prisma.unit.update({
    where: { id },
    data: updateData,
    include: {
      commander: { select: { id: true, name: true, rank: true } },
      parent: { select: { id: true, code: true, name: true } },
    },
  });

  // Rebuild paths cho toàn cây con nếu đã move
  if (isMoving && updateData.path) {
    await rebuildPathsForSubtree(id, updateData.path);
  }

  return { success: true, unit, oldData: existing };
}

export async function deactivateUnit(
  id: string
): Promise<{ success: boolean; error?: string; code?: string; name?: string }> {
  const unit = await prisma.unit.findUnique({
    where: { id },
    select: { code: true, name: true, active: true },
  });
  if (!unit) return { success: false, error: 'Đơn vị không tồn tại' };
  if (!unit.active) return { success: false, error: 'Đơn vị đã bị vô hiệu hóa' };

  // Chặn nếu còn đơn vị con active
  const childCount = await prisma.unit.count({ where: { parentId: id, active: true } });
  if (childCount > 0) {
    return {
      success: false,
      error: `Không thể vô hiệu hóa "${unit.name}" vì còn ${childCount} đơn vị con. Vô hiệu hóa các đơn vị con trước.`,
    };
  }

  // Chặn nếu còn user
  const userCount = await prisma.user.count({ where: { unitId: id } });
  if (userCount > 0) {
    return {
      success: false,
      error: `Không thể vô hiệu hóa "${unit.name}" vì còn ${userCount} người dùng thuộc đơn vị. Chuyển họ sang đơn vị khác trước.`,
    };
  }

  await prisma.unit.update({ where: { id }, data: { active: false } });
  return { success: true, code: unit.code, name: unit.name };
}

export async function getUnitTree(): Promise<UnitTreeNode[]> {
  const units = await prisma.unit.findMany({
    where: { active: true },
    include: {
      commander: { select: { id: true, name: true, rank: true } },
      _count: { select: { users: true, children: true } },
    },
    orderBy: [{ level: 'asc' }, { code: 'asc' }],
  });

  const map = new Map<string, UnitTreeNode>();
  const roots: UnitTreeNode[] = [];

  for (const u of units) {
    map.set(u.id, { ...(u as any), children: [] });
  }
  for (const u of units) {
    const node = map.get(u.id)!;
    if (u.parentId && map.has(u.parentId)) {
      map.get(u.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
