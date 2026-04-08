import "server-only";
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { compare } from 'bcryptjs';
import prisma from './db';
import { logSecurityEvent } from './audit';
import {
  verifyToken,
  checkAccountLock,
  recordFailedAttempt,
  resetFailedAttempts,
} from './services/auth/mfa.service';
import { createAuthSession } from './services/auth/auth-session.service';
import { buildBqpSsoProvider } from './auth/bqp-sso-provider';

/**
 * v8.3 Enhancement:
 * Load user's unitId và functionCodes từ UserPosition khi login
 * Cache trong JWT để giảm database queries
 */
async function loadUserPermissionData(userId: string): Promise<{
  unitId: string | null;
  functionCodes: string[];
  primaryPositionCode: string | null;
}> {
  try {
    // Query user positions với functions
    const userPositions = await prisma.userPosition.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } },
        ],
      },
      include: {
        position: {
          include: {
            functions: {
              where: { isActive: true },
              include: {
                function: true,
              },
            },
          },
        },
      },
      orderBy: [
        { isPrimary: 'desc' },
        { startDate: 'desc' },
      ],
    });

    if (userPositions.length === 0) {
      return { unitId: null, functionCodes: [], primaryPositionCode: null };
    }

    // Lấy primary position (hoặc position đầu tiên)
    const primaryPosition = userPositions.find(up => up.isPrimary) || userPositions[0];
    
    // Collect tất cả function codes (unique)
    const functionCodes = new Set<string>();
    for (const up of userPositions) {
      for (const pf of up.position.functions) {
        functionCodes.add(pf.function.code);
      }
    }

    return {
      unitId: primaryPosition.unitId,
      functionCodes: Array.from(functionCodes),
      primaryPositionCode: primaryPosition.position.code,
    };
  } catch (error) {
    console.error('[Auth] Error loading permission data:', error);
    return { unitId: null, functionCodes: [], primaryPositionCode: null };
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    // UC-07: BQP SSO — chỉ active khi env BQP_SSO_* đã được set
    ...buildBqpSsoProvider(),

    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        // Bước 2 của MFA: client gửi thêm otpCode
        otpCode: { label: 'OTP Code', type: 'text' },
        // IP/UserAgent từ client (optional, dùng để tạo AuthSession)
        ipAddress: { label: 'IP', type: 'text' },
        userAgent: { label: 'User Agent', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          await logSecurityEvent({
            eventType: 'LOGIN_FAILED',
            severity: 'LOW',
            details: { reason: 'Missing email or password', email: credentials?.email || 'not_provided' },
          });
          throw new Error('Email and password required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true, email: true, name: true, password: true,
            role: true, status: true, avatar: true, department: true,
            militaryId: true, rank: true,
            mfaEnabled: true, mfaSecret: true,
            failedLoginCount: true, lockedUntil: true,
          },
        });

        if (!user) {
          await logSecurityEvent({
            eventType: 'LOGIN_FAILED',
            severity: 'MEDIUM',
            details: { reason: 'User not found', email: credentials.email },
          });
          throw new Error('Invalid credentials');
        }

        // Kiểm tra lock (sai OTP nhiều lần)
        const lockStatus = await checkAccountLock(user.id);
        if (lockStatus.locked) {
          const retryAfterSec = lockStatus.lockedUntil
            ? Math.ceil((lockStatus.lockedUntil.getTime() - Date.now()) / 1000)
            : 900;
          await logSecurityEvent({
            userId: user.id,
            eventType: 'LOGIN_FAILED',
            severity: 'HIGH',
            details: { reason: 'Account locked', retryAfterSec },
          });
          throw new Error(`Tài khoản bị khóa. Vui lòng thử lại sau ${Math.ceil(retryAfterSec / 60)} phút.`);
        }

        if (user.status !== 'ACTIVE') {
          await logSecurityEvent({
            userId: user.id,
            eventType: 'LOGIN_FAILED',
            severity: 'MEDIUM',
            details: { reason: 'Account not active', status: user.status },
          });
          throw new Error('Account is not active');
        }

        const isPasswordValid = await compare(credentials.password, user.password);
        if (!isPasswordValid) {
          await logSecurityEvent({
            userId: user.id,
            eventType: 'LOGIN_FAILED',
            severity: 'HIGH',
            details: { reason: 'Invalid password', email: credentials.email },
          });
          throw new Error('Invalid credentials');
        }

        // UC-01: MFA check
        if (user.mfaEnabled && user.mfaSecret) {
          if (!credentials.otpCode) {
            // Password đúng nhưng chưa có OTP → báo client hiển thị OTP form
            // NextAuth convention: throw với mã đặc biệt
            throw new Error('MFA_REQUIRED');
          }

          const isOtpValid = await verifyToken(user.mfaSecret, credentials.otpCode);
          if (!isOtpValid) {
            const attempt = await recordFailedAttempt(user.id);
            await logSecurityEvent({
              userId: user.id,
              eventType: 'LOGIN_FAILED',
              severity: 'HIGH',
              details: {
                reason: 'Invalid OTP',
                failedCount: attempt.failedCount,
                locked: attempt.locked,
              },
            });
            if (attempt.locked) {
              throw new Error('Sai OTP quá 3 lần. Tài khoản bị khóa 15 phút.');
            }
            throw new Error('Mã OTP không đúng.');
          }
        }

        // Đăng nhập thành công — reset failed count
        await resetFailedAttempts(user.id);
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // Tạo AuthSession (UC-06)
        await createAuthSession({
          userId: user.id,
          ipAddress: credentials.ipAddress || undefined,
          userAgent: credentials.userAgent || undefined,
        });

        const permissionData = await loadUserPermissionData(user.id);

        await logSecurityEvent({
          userId: user.id,
          eventType: 'LOGIN_SUCCESS',
          severity: 'LOW',
          details: {
            email: user.email,
            role: user.role,
            mfaUsed: user.mfaEnabled,
            unitId: permissionData.unitId,
            positionCode: permissionData.primaryPositionCode,
            functionCount: permissionData.functionCodes.length,
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          avatar: user.avatar || undefined,
          department: user.department || undefined,
          militaryId: user.militaryId || undefined,
          rank: user.rank || undefined,
          unitId: permissionData.unitId,
          functionCodes: permissionData.functionCodes,
          primaryPositionCode: permissionData.primaryPositionCode,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.status = user.status;
        token.avatar = user.avatar;
        token.department = user.department;
        token.militaryId = user.militaryId;
        token.rank = user.rank;
        // v8.3: Store permission data in JWT
        token.unitId = user.unitId;
        token.functionCodes = user.functionCodes;
        token.primaryPositionCode = user.primaryPositionCode;
        token.permissionsLoadedAt = Date.now();
      }
      
      // v8.5: Luôn refresh permissions khi có trigger === 'update'
      // Đảm bảo JWT phản ánh thay đổi RBAC ngay lập tức
      if (token.id && trigger === 'update') {
        const permissionData = await loadUserPermissionData(token.id);
        token.unitId = permissionData.unitId;
        token.functionCodes = permissionData.functionCodes;
        token.primaryPositionCode = permissionData.primaryPositionCode;
        token.permissionsLoadedAt = Date.now();
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.role = token.role;
        session.user.status = token.status;
        session.user.avatar = token.avatar;
        session.user.department = token.department;
        session.user.militaryId = token.militaryId;
        session.user.rank = token.rank;
        // v8.3: Expose permission data in session
        session.user.unitId = token.unitId;
        session.user.functionCodes = token.functionCodes;
        session.user.primaryPositionCode = token.primaryPositionCode;
      }
      return session;
    },
  },
};
