/**
 * GĐ4.15: Logger Utility với Log Levels
 * - Giảm spam Redis ECONNREFUSED (log 1 lần/chu kỳ)
 * - Phân cấp INFO/WARN/ERROR
 * - Structured logging cho production
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// Log level priority
const LOG_LEVELS: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// Get current log level from env
const getCurrentLogLevel = (): LogLevel => {
  const envLevel = process.env.LOG_LEVEL?.toUpperCase() as LogLevel;
  return LOG_LEVELS[envLevel] !== undefined ? envLevel : 'INFO';
};

// Throttle tracking for repeated errors
const errorThrottle = new Map<string, {
  count: number;
  lastLogged: number;
  firstSeen: number;
}>();

// Throttle interval (5 minutes)
const THROTTLE_INTERVAL_MS = 5 * 60 * 1000;

// Known spam patterns to throttle
const THROTTLE_PATTERNS = [
  'ECONNREFUSED 127.0.0.1:6379', // Redis
  'Connection is closed',        // Redis
  'Redis connection failed',     // Redis
  'ETIMEDOUT',                   // Network timeout
  'ENOTFOUND',                   // DNS resolution
];

/**
 * Check if error should be throttled
 */
function shouldThrottle(message: string): { throttle: boolean; count?: number } {
  const pattern = THROTTLE_PATTERNS.find(p => message.includes(p));
  if (!pattern) return { throttle: false };

  const now = Date.now();
  const key = pattern;
  const entry = errorThrottle.get(key);

  if (!entry) {
    // First occurrence - log it
    errorThrottle.set(key, { count: 1, lastLogged: now, firstSeen: now });
    return { throttle: false };
  }

  entry.count++;

  // Check if throttle interval has passed
  if (now - entry.lastLogged >= THROTTLE_INTERVAL_MS) {
    // Log summary and reset
    const count = entry.count;
    entry.count = 0;
    entry.lastLogged = now;
    return { throttle: false, count };
  }

  // Still within throttle interval - suppress
  return { throttle: true, count: entry.count };
}

/**
 * Format log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
  const isProd = process.env.NODE_ENV === 'production';
  
  if (isProd) {
    // JSON format for production (easier to parse)
    return JSON.stringify(entry);
  }

  // Human-readable format for development
  const levelColors: Record<LogLevel, string> = {
    DEBUG: '\x1b[90m', // Gray
    INFO: '\x1b[36m',  // Cyan
    WARN: '\x1b[33m',  // Yellow
    ERROR: '\x1b[31m', // Red
  };
  const reset = '\x1b[0m';
  const color = levelColors[entry.level];

  let output = `${color}[${entry.level}]${reset} ${entry.timestamp}`;
  if (entry.context) output += ` [${entry.context}]`;
  output += ` ${entry.message}`;
  
  if (entry.data && Object.keys(entry.data).length > 0) {
    output += ` ${JSON.stringify(entry.data)}`;
  }

  if (entry.error) {
    output += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
    if (entry.error.stack && entry.level === 'ERROR') {
      output += `\n  ${entry.error.stack.split('\n').slice(1, 4).join('\n  ')}`;
    }
  }

  return output;
}

/**
 * Core log function
 */
function log(
  level: LogLevel,
  message: string,
  context?: string,
  data?: Record<string, unknown>,
  error?: Error
): void {
  // Check log level
  const currentLevel = getCurrentLogLevel();
  if (LOG_LEVELS[level] < LOG_LEVELS[currentLevel]) {
    return;
  }

  // Check throttling for repeated errors
  if (level === 'ERROR' || level === 'WARN') {
    const throttleResult = shouldThrottle(message);
    if (throttleResult.throttle) {
      return; // Suppress repeated error
    }
    if (throttleResult.count && throttleResult.count > 1) {
      message = `${message} (repeated ${throttleResult.count} times in last ${THROTTLE_INTERVAL_MS / 60000} min)`;
    }
  }

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    data,
  };

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  const formatted = formatLogEntry(entry);

  switch (level) {
    case 'ERROR':
      console.error(formatted);
      break;
    case 'WARN':
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
  }
}

/**
 * Logger instance with context
 */
export function createLogger(context: string) {
  return {
    debug: (message: string, data?: Record<string, unknown>) => 
      log('DEBUG', message, context, data),
    info: (message: string, data?: Record<string, unknown>) => 
      log('INFO', message, context, data),
    warn: (message: string, data?: Record<string, unknown>, error?: Error) => 
      log('WARN', message, context, data, error),
    error: (message: string, error?: Error, data?: Record<string, unknown>) => 
      log('ERROR', message, context, data, error),
  };
}

/**
 * Default logger
 */
export const logger = createLogger('App');

/**
 * Pre-configured loggers for common contexts
 */
export const dbLogger = createLogger('Database');
export const redisLogger = createLogger('Redis');
export const authLogger = createLogger('Auth');
export const apiLogger = createLogger('API');
export const rbacLogger = createLogger('RBAC');

/**
 * Request logger middleware helper
 */
export function logRequest(
  method: string,
  path: string,
  userId?: string,
  duration?: number,
  status?: number
) {
  const data: Record<string, unknown> = {
    method,
    path,
  };
  if (userId) data.userId = userId;
  if (duration) data.duration = `${duration}ms`;
  if (status) data.status = status;

  const level: LogLevel = status && status >= 500 ? 'ERROR' : 
                         status && status >= 400 ? 'WARN' : 'INFO';
  
  log(level, `${method} ${path} ${status || ''}`.trim(), 'HTTP', data);
}

/**
 * Reset throttle (useful for testing)
 */
export function resetThrottle() {
  errorThrottle.clear();
}
