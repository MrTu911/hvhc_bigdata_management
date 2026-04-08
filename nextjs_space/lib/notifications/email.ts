
/**
 * Email Notification Service
 * Send alerts via SMTP for critical system events
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  priority?: 'high' | 'normal' | 'low';
}

export class EmailNotifier {
  private transporter: Transporter | null = null;
  private from: string;
  private defaultTo: string;

  constructor() {
    this.from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@hvhc.edu.vn';
    this.defaultTo = process.env.ALERT_EMAIL_TO || 'admin@hvhc.edu.vn';
    this.initializeTransporter();
  }

  /**
   * Initialize SMTP transporter
   */
  private initializeTransporter(): void {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;

    if (!host || !user || !pass) {
      console.warn('SMTP not configured. Email notifications will be disabled.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
          user,
          pass,
        },
      });
    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
      this.transporter = null;
    }
  }

  /**
   * Check if email is configured
   */
  isConfigured(): boolean {
    return this.transporter !== null;
  }

  /**
   * Send an email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.warn('Email transporter not configured. Skipping notification.');
      return false;
    }

    try {
      const recipients = Array.isArray(options.to) ? options.to : [options.to];

      await this.transporter.sendMail({
        from: this.from,
        to: recipients.join(', '),
        subject: options.subject,
        html: options.html,
        priority: options.priority || 'normal',
      });

      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  /**
   * Send alert email
   */
  async sendAlert(
    severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL',
    title: string,
    message: string,
    details?: Record<string, any>
  ): Promise<boolean> {
    const severityColors = {
      INFO: '#3b82f6',
      WARNING: '#f59e0b',
      ERROR: '#ef4444',
      CRITICAL: '#dc2626',
    };

    const color = severityColors[severity];

    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${color}; color: white; padding: 20px; border-radius: 5px 5px 0 0;">
          <h2 style="margin: 0;">${severity}: ${title}</h2>
        </div>
        <div style="border: 1px solid #e5e7eb; padding: 20px; border-radius: 0 0 5px 5px;">
          <p style="font-size: 16px; line-height: 1.6;">${message}</p>
    `;

    if (details && Object.keys(details).length > 0) {
      html += `
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin-top: 20px;">
          <h3 style="margin-top: 0;">Details:</h3>
          <table style="width: 100%; border-collapse: collapse;">
      `;

      for (const [key, value] of Object.entries(details)) {
        html += `
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 30%;">${key}:</td>
            <td style="padding: 8px 0;">${value}</td>
          </tr>
        `;
      }

      html += `
          </table>
        </div>
      `;
    }

    html += `
          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            Time: ${new Date().toLocaleString('vi-VN')}<br>
            System: BigData Management - HVHC
          </p>
        </div>
      </div>
    `;

    const priority = severity === 'CRITICAL' || severity === 'ERROR' ? 'high' : 'normal';

    return await this.sendEmail({
      to: this.defaultTo,
      subject: `[${severity}] ${title}`,
      html,
      priority,
    });
  }

  /**
   * Send system status email
   */
  async sendSystemStatus(
    serviceName: string,
    status: 'UP' | 'DOWN' | 'DEGRADED',
    uptime?: number,
    additionalInfo?: string
  ): Promise<boolean> {
    const statusColors = {
      UP: '#10b981',
      DOWN: '#ef4444',
      DEGRADED: '#f59e0b',
    };

    const color = statusColors[status];

    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${color}; color: white; padding: 20px; border-radius: 5px 5px 0 0;">
          <h2 style="margin: 0;">System Status Update</h2>
        </div>
        <div style="border: 1px solid #e5e7eb; padding: 20px; border-radius: 0 0 5px 5px;">
          <h3 style="margin-top: 0;">${serviceName}</h3>
          <p style="font-size: 18px; font-weight: bold; color: ${color};">Status: ${status}</p>
    `;

    if (uptime !== undefined) {
      html += `<p>Uptime: ${uptime.toFixed(2)}%</p>`;
    }

    if (additionalInfo) {
      html += `<p>${additionalInfo}</p>`;
    }

    html += `
          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            Time: ${new Date().toLocaleString('vi-VN')}<br>
            System: BigData Management - HVHC
          </p>
        </div>
      </div>
    `;

    const priority = status === 'DOWN' ? 'high' : 'normal';

    return await this.sendEmail({
      to: this.defaultTo,
      subject: `[${status}] ${serviceName} - System Status Update`,
      html,
      priority,
    });
  }

  /**
   * Send login alert email
   */
  async sendLoginAlert(
    email: string,
    status: 'success' | 'failed',
    ipAddress: string,
    location?: string,
    userAgent?: string
  ): Promise<boolean> {
    // Only send email for failed logins (reduce noise)
    if (status === 'success') {
      return true;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #ef4444; color: white; padding: 20px; border-radius: 5px 5px 0 0;">
          <h2 style="margin: 0;">⚠️ Failed Login Attempt</h2>
        </div>
        <div style="border: 1px solid #e5e7eb; padding: 20px; border-radius: 0 0 5px 5px;">
          <p style="font-size: 16px;">A failed login attempt was detected for your account.</p>
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <table style="width: 100%;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Email:</td>
                <td style="padding: 8px 0;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">IP Address:</td>
                <td style="padding: 8px 0;">${ipAddress}</td>
              </tr>
              ${location ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Location:</td>
                <td style="padding: 8px 0;">${location}</td>
              </tr>
              ` : ''}
              ${userAgent ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Device:</td>
                <td style="padding: 8px 0;">${userAgent}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Time:</td>
                <td style="padding: 8px 0;">${new Date().toLocaleString('vi-VN')}</td>
              </tr>
            </table>
          </div>
          <p style="margin-top: 20px; color: #6b7280;">
            If this was you, you can safely ignore this email. If you did not attempt to log in, please contact your administrator immediately.
          </p>
        </div>
      </div>
    `;

    return await this.sendEmail({
      to: email,
      subject: '⚠️ Failed Login Attempt - HVHC BigData System',
      html,
      priority: 'high',
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
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #3b82f6; color: white; padding: 20px; border-radius: 5px 5px 0 0;">
          <h2 style="margin: 0;">📊 Weekly Security Report</h2>
        </div>
        <div style="border: 1px solid #e5e7eb; padding: 20px; border-radius: 0 0 5px 5px;">
          <p style="font-size: 16px;">Here's your weekly security summary for the BigData Management System.</p>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <h3 style="margin-top: 0;">Summary:</h3>
            <table style="width: 100%;">
              <tr>
                <td style="padding: 12px 0; font-size: 16px;">Total Logins:</td>
                <td style="padding: 12px 0; font-size: 16px; font-weight: bold; color: #10b981;">${totalLogins}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; font-size: 16px;">Failed Attempts:</td>
                <td style="padding: 12px 0; font-size: 16px; font-weight: bold; color: ${failedAttempts > 10 ? '#ef4444' : '#f59e0b'};">${failedAttempts}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; font-size: 16px;">Unique Users:</td>
                <td style="padding: 12px 0; font-size: 16px; font-weight: bold; color: #3b82f6;">${uniqueUsers}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; font-size: 16px;">Suspicious Activities:</td>
                <td style="padding: 12px 0; font-size: 16px; font-weight: bold; color: ${suspiciousActivities > 0 ? '#ef4444' : '#10b981'};">${suspiciousActivities}</td>
              </tr>
            </table>
          </div>

          ${suspiciousActivities > 0 ? `
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin-top: 20px;">
            <p style="margin: 0; color: #dc2626; font-weight: bold;">
              ⚠️ Warning: ${suspiciousActivities} suspicious activities detected. Please review the security dashboard.
            </p>
          </div>
          ` : ''}

          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            Report Period: ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN')} - ${new Date().toLocaleDateString('vi-VN')}<br>
            System: BigData Management - HVHC
          </p>
        </div>
      </div>
    `;

    return await this.sendEmail({
      to: this.defaultTo,
      subject: '📊 Weekly Security Report - HVHC BigData System',
      html,
      priority: 'normal',
    });
  }
}

// Singleton instance
export const emailNotifier = new EmailNotifier();
