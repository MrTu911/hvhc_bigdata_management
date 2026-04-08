
/**
 * Notification Dispatcher
 * Central service to route notifications to appropriate channels
 */

import { telegramNotifier } from './telegram';
import { emailNotifier } from './email';

interface NotificationOptions {
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  title: string;
  message: string;
  details?: Record<string, any>;
  channels?: ('telegram' | 'email')[];
}

interface SystemStatusNotification {
  serviceName: string;
  status: 'UP' | 'DOWN' | 'DEGRADED';
  uptime?: number;
  additionalInfo?: string;
}

interface LoginNotification {
  email: string;
  status: 'success' | 'failed';
  ipAddress: string;
  location?: string;
  userAgent?: string;
}

export class NotificationDispatcher {
  /**
   * Send notification to all configured channels based on severity
   */
  async sendAlert(options: NotificationOptions): Promise<void> {
    const { severity, title, message, details, channels } = options;

    // Determine which channels to use based on severity
    const defaultChannels = this.getDefaultChannels(severity);
    const targetChannels = channels || defaultChannels;

    const promises: Promise<boolean>[] = [];

    // Send to Telegram
    if (targetChannels.includes('telegram')) {
      promises.push(
        telegramNotifier.sendAlert(severity, title, message, details).catch((error) => {
          console.error('Failed to send Telegram notification:', error);
          return false;
        })
      );
    }

    // Send to Email
    if (targetChannels.includes('email')) {
      promises.push(
        emailNotifier.sendAlert(severity, title, message, details).catch((error) => {
          console.error('Failed to send email notification:', error);
          return false;
        })
      );
    }

    // Wait for all notifications to be sent
    const results = await Promise.all(promises);

    // Log results
    const successCount = results.filter((r) => r).length;
    console.log(`Sent ${successCount}/${results.length} notifications successfully`);
  }

  /**
   * Send system status notification
   */
  async sendSystemStatus(notification: SystemStatusNotification): Promise<void> {
    const { serviceName, status, uptime, additionalInfo } = notification;

    const promises: Promise<boolean>[] = [];

    // Always send to Telegram for real-time monitoring
    promises.push(
      telegramNotifier.sendSystemStatus(serviceName, status, uptime).catch((error) => {
        console.error('Failed to send Telegram status:', error);
        return false;
      })
    );

    // Send email only for DOWN or DEGRADED status
    if (status === 'DOWN' || status === 'DEGRADED') {
      promises.push(
        emailNotifier.sendSystemStatus(serviceName, status, uptime, additionalInfo).catch((error) => {
          console.error('Failed to send email status:', error);
          return false;
        })
      );
    }

    await Promise.all(promises);
  }

  /**
   * Send login alert
   */
  async sendLoginAlert(notification: LoginNotification): Promise<void> {
    const { email, status, ipAddress, location, userAgent } = notification;

    const promises: Promise<boolean>[] = [];

    // Send to Telegram (all logins)
    promises.push(
      telegramNotifier.sendLoginAlert(email, status, ipAddress, location).catch((error) => {
        console.error('Failed to send Telegram login alert:', error);
        return false;
      })
    );

    // Send email only for failed attempts
    if (status === 'failed') {
      promises.push(
        emailNotifier.sendLoginAlert(email, status, ipAddress, location, userAgent).catch((error) => {
          console.error('Failed to send email login alert:', error);
          return false;
        })
      );
    }

    await Promise.all(promises);
  }

  /**
   * Send file upload notification
   */
  async sendFileUploadNotification(
    fileName: string,
    fileSize: number,
    uploadedBy: string
  ): Promise<void> {
    // Only send to Telegram for file uploads (reduce email noise)
    await telegramNotifier.sendFileUploadNotification(fileName, fileSize, uploadedBy).catch((error) => {
      console.error('Failed to send file upload notification:', error);
    });
  }

  /**
   * Send training completion notification
   */
  async sendTrainingComplete(modelName: string, accuracy: number, duration: number): Promise<void> {
    // Send to Telegram for quick updates
    await telegramNotifier.sendTrainingComplete(modelName, accuracy, duration).catch((error) => {
      console.error('Failed to send training completion notification:', error);
    });
  }

  /**
   * Send weekly security report
   */
  async sendWeeklySecurityReport(
    totalLogins: number,
    failedAttempts: number,
    uniqueUsers: number,
    suspiciousActivities: number
  ): Promise<void> {
    // Email is better for detailed reports
    await emailNotifier
      .sendWeeklySecurityReport(totalLogins, failedAttempts, uniqueUsers, suspiciousActivities)
      .catch((error) => {
        console.error('Failed to send weekly security report:', error);
      });
  }

  /**
   * Get default channels based on severity
   */
  private getDefaultChannels(severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'): ('telegram' | 'email')[] {
    switch (severity) {
      case 'CRITICAL':
        return ['telegram', 'email']; // Both channels for critical alerts
      case 'ERROR':
        return ['telegram', 'email']; // Both channels for errors
      case 'WARNING':
        return ['telegram']; // Telegram only for warnings
      case 'INFO':
        return ['telegram']; // Telegram only for info
      default:
        return ['telegram'];
    }
  }

  /**
   * Batch send notifications (avoid spam)
   */
  async sendBatchAlerts(alerts: NotificationOptions[]): Promise<void> {
    // Group alerts by severity
    const grouped = alerts.reduce((acc, alert) => {
      if (!acc[alert.severity]) {
        acc[alert.severity] = [];
      }
      acc[alert.severity].push(alert);
      return acc;
    }, {} as Record<string, NotificationOptions[]>);

    // Send summary for each severity level
    for (const [severity, severityAlerts] of Object.entries(grouped)) {
      if (severityAlerts.length === 1) {
        // Send individual alert if only one
        await this.sendAlert(severityAlerts[0]);
      } else {
        // Send summary for multiple alerts
        await this.sendAlert({
          severity: severity as 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL',
          title: `${severityAlerts.length} ${severity} Alerts`,
          message: `Multiple alerts detected:\n${severityAlerts.map((a) => `• ${a.title}`).join('\n')}`,
          details: {
            'Total Alerts': severityAlerts.length,
            'Time Range': `${new Date().toLocaleTimeString('vi-VN')}`,
          },
        });
      }
    }
  }
}

// Singleton instance
export const notificationDispatcher = new NotificationDispatcher();
