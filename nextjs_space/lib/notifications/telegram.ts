
/**
 * Telegram Notification Service
 * Send alerts to Telegram bot for real-time monitoring
 */

interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: 'HTML' | 'Markdown';
  disable_notification?: boolean;
}

export class TelegramNotifier {
  private botToken: string;
  private chatId: string;
  private baseUrl: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.chatId = process.env.TELEGRAM_CHAT_ID || '';
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  /**
   * Check if Telegram is configured
   */
  isConfigured(): boolean {
    return !!(this.botToken && this.chatId);
  }

  /**
   * Send a message to Telegram
   */
  async sendMessage(
    text: string,
    options: {
      parseMode?: 'HTML' | 'Markdown';
      silent?: boolean;
    } = {}
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('Telegram not configured. Skipping notification.');
      return false;
    }

    try {
      const message: TelegramMessage = {
        chat_id: this.chatId,
        text,
        parse_mode: options.parseMode || 'HTML',
        disable_notification: options.silent || false,
      };

      const response = await fetch(`${this.baseUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Telegram API error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to send Telegram message:', error);
      return false;
    }
  }

  /**
   * Format and send an alert
   */
  async sendAlert(
    severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL',
    title: string,
    message: string,
    details?: Record<string, any>
  ): Promise<boolean> {
    const emoji = {
      INFO: 'ℹ️',
      WARNING: '⚠️',
      ERROR: '❌',
      CRITICAL: '🚨',
    }[severity];

    let text = `${emoji} <b>${severity}: ${title}</b>\n\n`;
    text += `${message}\n`;

    if (details) {
      text += '\n<b>Details:</b>\n';
      for (const [key, value] of Object.entries(details)) {
        text += `• ${key}: ${value}\n`;
      }
    }

    text += `\n⏰ ${new Date().toLocaleString('vi-VN')}`;

    // Silent for INFO, loud for CRITICAL
    const silent = severity === 'INFO';

    return await this.sendMessage(text, { silent });
  }

  /**
   * Send system status update
   */
  async sendSystemStatus(
    serviceName: string,
    status: 'UP' | 'DOWN' | 'DEGRADED',
    uptime?: number
  ): Promise<boolean> {
    const emoji = {
      UP: '✅',
      DOWN: '🔴',
      DEGRADED: '🟡',
    }[status];

    let text = `${emoji} <b>System Status Update</b>\n\n`;
    text += `Service: <code>${serviceName}</code>\n`;
    text += `Status: <b>${status}</b>\n`;

    if (uptime !== undefined) {
      text += `Uptime: ${uptime.toFixed(2)}%\n`;
    }

    text += `\n⏰ ${new Date().toLocaleString('vi-VN')}`;

    return await this.sendMessage(text);
  }

  /**
   * Send login alert
   */
  async sendLoginAlert(
    email: string,
    status: 'success' | 'failed',
    ipAddress: string,
    location?: string
  ): Promise<boolean> {
    const emoji = status === 'success' ? '🔐' : '⚠️';
    const statusText = status === 'success' ? 'Successful Login' : 'Failed Login Attempt';

    let text = `${emoji} <b>${statusText}</b>\n\n`;
    text += `Email: <code>${email}</code>\n`;
    text += `IP: <code>${ipAddress}</code>\n`;

    if (location) {
      text += `Location: ${location}\n`;
    }

    text += `\n⏰ ${new Date().toLocaleString('vi-VN')}`;

    // Silent for successful logins
    const silent = status === 'success';

    return await this.sendMessage(text, { silent });
  }

  /**
   * Send file upload notification
   */
  async sendFileUploadNotification(
    fileName: string,
    fileSize: number,
    uploadedBy: string
  ): Promise<boolean> {
    const sizeInMB = (fileSize / (1024 * 1024)).toFixed(2);

    let text = `📤 <b>New File Uploaded</b>\n\n`;
    text += `File: <code>${fileName}</code>\n`;
    text += `Size: ${sizeInMB} MB\n`;
    text += `Uploaded by: ${uploadedBy}\n`;
    text += `\n⏰ ${new Date().toLocaleString('vi-VN')}`;

    return await this.sendMessage(text, { silent: true });
  }

  /**
   * Send training completion notification
   */
  async sendTrainingComplete(
    modelName: string,
    accuracy: number,
    duration: number
  ): Promise<boolean> {
    const durationMin = Math.floor(duration / 60);

    let text = `🎯 <b>Model Training Complete</b>\n\n`;
    text += `Model: <code>${modelName}</code>\n`;
    text += `Accuracy: ${(accuracy * 100).toFixed(2)}%\n`;
    text += `Duration: ${durationMin} minutes\n`;
    text += `\n⏰ ${new Date().toLocaleString('vi-VN')}`;

    return await this.sendMessage(text);
  }
}

// Singleton instance
export const telegramNotifier = new TelegramNotifier();
