/**
 * M12 – Infrastructure Alert Service
 *
 * Wrap ServiceAlert model cho use case hạ tầng M12.
 * ServiceAlert đã có sẵn trong schema — không tạo model mới.
 *
 * Flow:
 *   health.service.ts phát hiện metric vượt ngưỡng
 *   → gọi raiseAlert() để tạo ServiceAlert
 *   → admin acknowledge qua acknowledgeAlert()
 *   → hệ thống hoặc health check resolve qua resolveAlert()
 */

import prisma from '@/lib/db';
import type { AlertSeverity, AlertStatus } from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RaiseAlertInput {
  serviceId:  string;
  title:      string;
  message:    string;
  severity:   AlertSeverity;
  metadata?:  Record<string, unknown>;
}

export interface ListAlertsFilter {
  serviceId?: string;
  status?:    AlertStatus;
  severity?:  AlertSeverity;
  page?:      number;
  pageSize?:  number;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function listInfraAlerts(filter: ListAlertsFilter = {}) {
  const page     = filter.page     ?? 1;
  const pageSize = filter.pageSize ?? 50;

  const where: Record<string, unknown> = {};
  if (filter.serviceId) where.serviceId = filter.serviceId;
  if (filter.status)    where.status    = filter.status;
  if (filter.severity)  where.severity  = filter.severity;

  const [alerts, total] = await prisma.$transaction([
    prisma.serviceAlert.findMany({
      where,
      orderBy: [{ triggeredAt: 'desc' }],
      skip:    (page - 1) * pageSize,
      take:    pageSize,
      include: {
        service: { select: { id: true, name: true, type: true } },
      },
    }),
    prisma.serviceAlert.count({ where }),
  ]);

  return { alerts, total, page, pageSize };
}

export async function getAlertSummary() {
  const [active, acknowledged, critical, warning] = await prisma.$transaction([
    prisma.serviceAlert.count({ where: { status: 'ACTIVE' } }),
    prisma.serviceAlert.count({ where: { status: 'ACKNOWLEDGED' } }),
    prisma.serviceAlert.count({ where: { status: 'ACTIVE', severity: 'CRITICAL' } }),
    prisma.serviceAlert.count({ where: { status: 'ACTIVE', severity: 'WARNING'  } }),
  ]);

  return { active, acknowledged, critical, warning };
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function raiseAlert(input: RaiseAlertInput) {
  // Không raise duplicate: nếu cùng serviceId + title đang ACTIVE thì skip
  const existing = await prisma.serviceAlert.findFirst({
    where: {
      serviceId: input.serviceId,
      title:     input.title,
      status:    'ACTIVE',
    },
  });
  if (existing) return existing;

  return prisma.serviceAlert.create({
    data: {
      serviceId:  input.serviceId,
      title:      input.title,
      message:    input.message,
      severity:   input.severity,
      status:     'ACTIVE',
      metadata:   input.metadata ?? {},
    },
  });
}

export async function acknowledgeAlert(alertId: string, userId: string) {
  const alert = await prisma.serviceAlert.findUnique({ where: { id: alertId } });
  if (!alert) throw new Error(`Alert ${alertId} not found`);
  if (alert.status === 'RESOLVED') throw new Error('Cannot acknowledge a resolved alert');

  return prisma.serviceAlert.update({
    where: { id: alertId },
    data: {
      status:         'ACKNOWLEDGED',
      acknowledgedAt: new Date(),
      acknowledgedBy: userId,
    },
  });
}

export async function resolveAlert(alertId: string, userId: string) {
  const alert = await prisma.serviceAlert.findUnique({ where: { id: alertId } });
  if (!alert) throw new Error(`Alert ${alertId} not found`);

  return prisma.serviceAlert.update({
    where: { id: alertId },
    data: {
      status:     'RESOLVED',
      resolvedAt: new Date(),
      resolvedBy: userId,
    },
  });
}
