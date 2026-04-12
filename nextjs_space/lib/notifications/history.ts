
/**
 * Notification History Service
 * Stores and retrieves notification history
 */

import { prisma as db } from '@/lib/db';

export interface NotificationHistoryEntry {
  id?: number;
  notificationType: 'email' | 'telegram' | 'system';
  recipient: string;
  subject?: string;
  message: string;
  status: 'sent' | 'failed' | 'pending';
  errorMessage?: string;
  metadata?: Record<string, any>;
  sentAt?: Date;
}

export async function saveNotificationHistory(
  entry: NotificationHistoryEntry
): Promise<void> {
  try {
    await db.$executeRaw`
      INSERT INTO notification_history (
        notification_type, recipient, subject, message, 
        status, error_message, metadata, sent_at
      ) VALUES (
        ${entry.notificationType}, ${entry.recipient}, 
        ${entry.subject || null}, ${entry.message},
        ${entry.status}, ${entry.errorMessage || null},
        ${JSON.stringify(entry.metadata || {})}::jsonb,
        ${entry.sentAt || new Date()}
      )
    `;
  } catch (error) {
    console.error('Failed to save notification history:', error);
  }
}

export async function getNotificationHistory(filters?: {
  type?: string;
  recipient?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  try {
    const where: string[] = ['1=1'];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.type) {
      where.push(`notification_type = $${paramIndex++}`);
      params.push(filters.type);
    }
    if (filters?.recipient) {
      where.push(`recipient ILIKE $${paramIndex++}`);
      params.push(`%${filters.recipient}%`);
    }
    if (filters?.status) {
      where.push(`status = $${paramIndex++}`);
      params.push(filters.status);
    }
    if (filters?.startDate) {
      where.push(`sent_at >= $${paramIndex++}`);
      params.push(filters.startDate);
    }
    if (filters?.endDate) {
      where.push(`sent_at <= $${paramIndex++}`);
      params.push(filters.endDate);
    }

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const query = `
      SELECT 
        id, notification_type, recipient, subject, message,
        status, error_message, metadata, sent_at, created_at
      FROM notification_history
      WHERE ${where.join(' AND ')}
      ORDER BY sent_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;

    params.push(limit, offset);

    const result = await db.$queryRawUnsafe(query, ...params);
    
    return result;
  } catch (error) {
    console.error('Failed to get notification history:', error);
    return [];
  }
}

export async function getNotificationStats(timeRange: 'today' | 'week' | 'month' = 'week') {
  try {
    let interval = '7 days';
    if (timeRange === 'today') interval = '1 day';
    if (timeRange === 'month') interval = '30 days';

    const stats = await db.$queryRawUnsafe(`
      SELECT
        notification_type,
        status,
        COUNT(*) as count
      FROM notification_history
      WHERE sent_at >= NOW() - INTERVAL '${interval}'
      GROUP BY notification_type, status
      ORDER BY notification_type, status
    `);

    return stats;
  } catch (error) {
    console.error('Failed to get notification stats:', error);
    return [];
  }
}
