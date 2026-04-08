/**
 * Redis Cache Key Management
 * Dynamic prefix based on environment
 * Format: hvhc:{env}:{module}:{key}
 */

const APP_PREFIX = 'hvhc';

/**
 * Get current environment
 * Maps NODE_ENV to short prefix
 */
function getEnv(): string {
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production') return 'prod';
  if (env === 'test') return 'test';
  // Check for custom staging env
  if (process.env.ENVIRONMENT === 'staging') return 'stg';
  return 'dev';
}

/**
 * Build cache key with standard prefix
 */
function buildKey(...parts: string[]): string {
  return `${APP_PREFIX}:${getEnv()}:${parts.join(':')}`;
}

/**
 * Redis key generators organized by module
 */
export const RedisKeys = {
  // User cache
  user: {
    profile: (userId: string) => buildKey('user', userId, 'profile'),
    permissions: (userId: string) => buildKey('user', userId, 'perms'),
    session: (sessionId: string) => buildKey('user', 'session', sessionId),
    list: (page: number, filters: string) => buildKey('user', 'list', `${page}`, filters),
  },
  
  // Personnel module
  personnel: {
    profile: (userId: string) => buildKey('personnel', 'profile', userId),
    career: (userId: string) => buildKey('personnel', 'career', userId),
    party: (userId: string) => buildKey('personnel', 'party', userId),
    insurance: (userId: string) => buildKey('personnel', 'insurance', userId),
    family: (userId: string) => buildKey('personnel', 'family', userId),
    summary: (userId: string) => buildKey('personnel', 'summary', userId),
  },
  
  // Unit/Organization scope (for future multi-tenant)
  unit: {
    members: (unitId: string) => buildKey('unit', unitId, 'members'),
    stats: (unitId: string) => buildKey('unit', unitId, 'stats'),
    tree: () => buildKey('unit', 'tree'),
    list: () => buildKey('unit', 'list'),
  },
  
  // Dashboard cache
  dashboard: {
    admin: (userId: string) => buildKey('dashboard', 'admin', userId),
    command: (userId: string) => buildKey('dashboard', 'command', userId),
    faculty: (userId: string) => buildKey('dashboard', 'faculty', userId),
    student: (userId: string) => buildKey('dashboard', 'student', userId),
    overview: () => buildKey('dashboard', 'overview'),
    stats: (type: string) => buildKey('dashboard', 'stats', type),
  },
  
  // Rate limiting per API key
  rateLimit: {
    minute: (apiKeyId: string) => buildKey('ratelimit', apiKeyId, 'min', Math.floor(Date.now() / 60000).toString()),
    day: (apiKeyId: string) => buildKey('ratelimit', apiKeyId, 'day', new Date().toISOString().split('T')[0]),
    month: (apiKeyId: string) => buildKey('ratelimit', apiKeyId, 'month', new Date().toISOString().slice(0, 7)),
  },
  
  // AI/ML cache
  ai: {
    prediction: (modelId: string, inputHash: string) => buildKey('ai', 'pred', modelId, inputHash),
    insight: (userId: string, type: string) => buildKey('ai', 'insight', userId, type),
    quota: (userId: string) => buildKey('ai', 'quota', userId, new Date().toISOString().split('T')[0]),
  },
  
  // Research/Data cache
  research: {
    project: (projectId: string) => buildKey('research', 'project', projectId),
    publication: (publicationId: string) => buildKey('research', 'pub', publicationId),
    list: (filters: string) => buildKey('research', 'list', filters),
  },
  
  // External API
  externalApi: {
    keyInfo: (keyId: string) => buildKey('extapi', 'key', keyId),
    usage: (keyId: string) => buildKey('extapi', 'usage', keyId),
  },
  
  // Infrastructure
  infrastructure: {
    config: (configId: string) => buildKey('infra', 'config', configId),
    health: (configId: string) => buildKey('infra', 'health', configId),
    syncStatus: (configId: string) => buildKey('infra', 'sync', configId),
  },
  
  // Audit log (for recent entries)
  audit: {
    recent: (resourceType: string) => buildKey('audit', 'recent', resourceType),
    userActivity: (userId: string) => buildKey('audit', 'activity', userId),
  },
};

/**
 * TTL configurations (in seconds)
 */
export const RedisTTL = {
  // Short-lived
  rateLimit: 60,           // 1 minute
  session: 1800,           // 30 minutes
  
  // Medium-lived
  userProfile: 300,        // 5 minutes
  permissions: 600,        // 10 minutes
  dashboardStats: 300,     // 5 minutes
  
  // Long-lived
  personnelProfile: 1800,  // 30 minutes
  unitTree: 3600,          // 1 hour
  aiPrediction: 3600,      // 1 hour
  
  // Very long-lived
  staticData: 86400,       // 24 hours
};

/**
 * Helper to invalidate cache by pattern
 */
export function getCacheInvalidationPattern(module: string, id?: string): string {
  const env = getEnv();
  if (id) {
    return `${APP_PREFIX}:${env}:${module}:*${id}*`;
  }
  return `${APP_PREFIX}:${env}:${module}:*`;
}
