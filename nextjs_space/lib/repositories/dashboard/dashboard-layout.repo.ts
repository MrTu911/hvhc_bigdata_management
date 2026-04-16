/**
 * DashboardLayoutRepo – M11 Phase 1
 *
 * Data access layer cho DashboardRoleTemplate và DashboardUserLayout.
 * Chỉ query/write – không chứa business logic.
 */
import 'server-only'
import db from '@/lib/db'
import type { DashboardRoleKey } from '@prisma/client'

// ─── Role Templates ───────────────────────────────────────────────────────────

export async function getRoleTemplate(roleKey: DashboardRoleKey) {
  return db.dashboardRoleTemplate.findUnique({ where: { roleKey } })
}

export async function upsertRoleTemplate(
  roleKey: DashboardRoleKey,
  layoutJson: unknown,
  widgetKeys: string[],
) {
  return db.dashboardRoleTemplate.upsert({
    where: { roleKey },
    create: { roleKey, layoutJson, widgetKeys, isActive: true },
    update: { layoutJson, widgetKeys, updatedAt: new Date() },
  })
}

// ─── User Layouts ─────────────────────────────────────────────────────────────

export async function getUserLayout(userId: string, dashboardKey: DashboardRoleKey) {
  return db.dashboardUserLayout.findUnique({
    where: { userId_dashboardKey: { userId, dashboardKey } },
    include: { template: { select: { layoutJson: true, widgetKeys: true } } },
  })
}

export async function saveUserLayout(
  userId: string,
  dashboardKey: DashboardRoleKey,
  layoutJson: unknown,
  templateId?: string | null,
) {
  return db.dashboardUserLayout.upsert({
    where: { userId_dashboardKey: { userId, dashboardKey } },
    create: { userId, dashboardKey, layoutJson, templateId },
    update: { layoutJson, updatedAt: new Date() },
  })
}

export async function deleteUserLayout(userId: string, dashboardKey: DashboardRoleKey) {
  return db.dashboardUserLayout.deleteMany({
    where: { userId, dashboardKey },
  })
}

// ─── Access Log ───────────────────────────────────────────────────────────────

export async function logDashboardAccess(
  userId: string,
  dashboardKey: string,
  action: 'VIEW' | 'EXPORT' | 'REFRESH' | 'LAYOUT_SAVE' | 'LAYOUT_RESET' | 'ALERT_ACK',
  meta?: Record<string, unknown>,
) {
  return db.dashboardAccessLog.create({
    data: { userId, dashboardKey, action, meta: meta ?? undefined },
  })
}
