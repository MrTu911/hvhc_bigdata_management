import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import crypto from 'crypto';

function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// Rate limiting check
async function checkRateLimit(apiKey: any): Promise<{ allowed: boolean; remaining: number }> {
  const now = new Date();
  const minuteAgo = new Date(now.getTime() - 60 * 1000);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [minuteRequests, dailyRequests] = await Promise.all([
    prisma.externalApiLog.count({
      where: {
        apiKeyId: apiKey.id,
        createdAt: { gte: minuteAgo }
      }
    }),
    prisma.externalApiLog.count({
      where: {
        apiKeyId: apiKey.id,
        createdAt: { gte: today }
      }
    })
  ]);

  if (minuteRequests >= apiKey.rateLimit) {
    return { allowed: false, remaining: 0 };
  }
  if (dailyRequests >= apiKey.dailyLimit) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: apiKey.rateLimit - minuteRequests };
}

// Validate API key from header
async function validateApiKey(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid Authorization header' };
  }

  const token = authHeader.substring(7);
  const keyHash = hashApiKey(token);

  const apiKey = await prisma.externalApiKey.findUnique({
    where: { keyHash }
  });

  if (!apiKey) {
    return { valid: false, error: 'Invalid API key' };
  }

  if (apiKey.status !== 'ACTIVE') {
    return { valid: false, error: `API key is ${apiKey.status.toLowerCase()}` };
  }

  if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
    await prisma.externalApiKey.update({
      where: { id: apiKey.id },
      data: { status: 'EXPIRED' }
    });
    return { valid: false, error: 'API key has expired' };
  }

  // IP whitelist check
  if (apiKey.ipWhitelist.length > 0) {
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    if (!apiKey.ipWhitelist.includes(clientIp) && !apiKey.ipWhitelist.includes('*')) {
      return { valid: false, error: 'IP not whitelisted' };
    }
  }

  return { valid: true, apiKey };
}

// Log API request
async function logRequest(
  apiKeyId: string,
  request: NextRequest,
  endpoint: string,
  statusCode: number,
  responseTime: number,
  responseSize?: number,
  errorMessage?: string
) {
  try {
    await prisma.externalApiLog.create({
      data: {
        apiKeyId,
        endpoint,
        method: request.method,
        statusCode,
        responseTime,
        responseSize,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
        userAgent: request.headers.get('user-agent'),
        errorMessage,
      }
    });

    // Update total requests and last used
    await prisma.externalApiKey.update({
      where: { id: apiKeyId },
      data: {
        totalRequests: { increment: 1 },
        lastUsedAt: new Date()
      }
    });
  } catch (e) {
    console.error('Failed to log API request:', e);
  }
}

// Data handlers for different endpoints
const handlers: { [key: string]: (permission: string[], params: URLSearchParams) => Promise<any> } = {
  'students': async (permissions, params) => {
    if (!permissions.includes('read:students')) {
      throw new Error('Permission denied: read:students required');
    }
    const limit = parseInt(params.get('limit') || '50');
    const offset = parseInt(params.get('offset') || '0');
    
    const students = await prisma.hocVien.findMany({
      take: Math.min(limit, 100),
      skip: offset,
      select: {
        id: true,
        maHocVien: true,
        hoTen: true,
        lop: true,
        khoaHoc: true,
        nganh: true,
        trangThai: true,
        createdAt: true,
      }
    });
    const total = await prisma.hocVien.count();
    return { data: students, total, limit, offset };
  },

  'faculty': async (permissions, params) => {
    if (!permissions.includes('read:faculty')) {
      throw new Error('Permission denied: read:faculty required');
    }
    const limit = parseInt(params.get('limit') || '50');
    const offset = parseInt(params.get('offset') || '0');

    const faculty = await prisma.facultyProfile.findMany({
      take: Math.min(limit, 100),
      skip: offset,
      include: {
        user: {
          select: { id: true, name: true, email: true, rank: true, position: true }
        }
      }
    });
    const total = await prisma.facultyProfile.count();
    return { data: faculty, total, limit, offset };
  },

  'departments': async (permissions, params) => {
    if (!permissions.includes('read:departments')) {
      throw new Error('Permission denied: read:departments required');
    }
    const departments = await prisma.unit.findMany({
      include: {
        _count: { select: { users: true } }
      }
    });
    return { data: departments, total: departments.length };
  },

  'courses': async (permissions, params) => {
    if (!permissions.includes('read:courses')) {
      throw new Error('Permission denied: read:courses required');
    }
    const limit = parseInt(params.get('limit') || '50');
    const offset = parseInt(params.get('offset') || '0');

    const courses = await prisma.course.findMany({
      take: Math.min(limit, 100),
      skip: offset,
      select: {
        id: true,
        code: true,
        name: true,
        credits: true,
        semester: true,
        year: true,
        isActive: true,
      }
    });
    const total = await prisma.course.count();
    return { data: courses, total, limit, offset };
  },

  'statistics': async (permissions, params) => {
    if (!permissions.includes('read:statistics')) {
      throw new Error('Permission denied: read:statistics required');
    }
    const [userCount, studentCount, facultyCount, courseCount, departmentCount] = await Promise.all([
      prisma.user.count(),
      prisma.hocVien.count(),
      prisma.facultyProfile.count(),
      prisma.course.count(),
      prisma.unit.count(),
    ]);
    return {
      data: {
        users: userCount,
        students: studentCount,
        faculty: facultyCount,
        courses: courseCount,
        departments: departmentCount,
        timestamp: new Date().toISOString()
      }
    };
  },

  'research': async (permissions, params) => {
    if (!permissions.includes('read:research')) {
      throw new Error('Permission denied: read:research required');
    }
    const limit = parseInt(params.get('limit') || '50');
    const offset = parseInt(params.get('offset') || '0');

    const research = await prisma.scientificResearch.findMany({
      take: Math.min(limit, 100),
      skip: offset,
      select: {
        id: true,
        title: true,
        level: true,
        type: true,
        year: true,
        role: true,
        result: true,
      }
    });
    const total = await prisma.scientificResearch.count();
    return { data: research, total, limit, offset };
  },
};

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  const startTime = Date.now();
  const endpoint = '/' + params.path.join('/');
  const searchParams = new URL(request.url).searchParams;

  // Validate API key
  const validation = await validateApiKey(request);
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error, code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const apiKey = validation.apiKey!;

  // Check rate limit
  const rateLimit = await checkRateLimit(apiKey);
  if (!rateLimit.allowed) {
    await logRequest(apiKey.id, request, endpoint, 429, Date.now() - startTime, undefined, 'Rate limit exceeded');
    return NextResponse.json(
      { error: 'Rate limit exceeded', code: 'RATE_LIMIT' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': apiKey.rateLimit.toString(),
          'X-RateLimit-Remaining': '0',
          'Retry-After': '60'
        }
      }
    );
  }

  try {
    const resource = params.path[0];
    const handler = handlers[resource];

    if (!handler) {
      await logRequest(apiKey.id, request, endpoint, 404, Date.now() - startTime, undefined, 'Endpoint not found');
      return NextResponse.json(
        { error: 'Endpoint not found', code: 'NOT_FOUND', availableEndpoints: Object.keys(handlers) },
        { status: 404 }
      );
    }

    const result = await handler(apiKey.permissions, searchParams);
    const responseTime = Date.now() - startTime;
    const responseBody = JSON.stringify(result);

    await logRequest(apiKey.id, request, endpoint, 200, responseTime, responseBody.length);

    return NextResponse.json(result, {
      headers: {
        'X-RateLimit-Limit': apiKey.rateLimit.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-Response-Time': responseTime + 'ms'
      }
    });
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    const statusCode = error.message.includes('Permission denied') ? 403 : 500;
    await logRequest(apiKey.id, request, endpoint, statusCode, responseTime, undefined, error.message);

    return NextResponse.json(
      { error: error.message, code: statusCode === 403 ? 'FORBIDDEN' : 'SERVER_ERROR' },
      { status: statusCode }
    );
  }
}

// Health check endpoint
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}
