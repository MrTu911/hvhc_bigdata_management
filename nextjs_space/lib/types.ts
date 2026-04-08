import "server-only";

import { UserRole, UserStatus, ServiceType, ServiceStatus, AlertSeverity, AlertStatus, LogLevel, LogCategory } from '@prisma/client';

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      status: string;
      avatar?: string;
      department?: string;
      militaryId?: string;
      rank?: string;
      // v8.3: Permission data from JWT
      unitId?: string | null;
      functionCodes?: string[];
      primaryPositionCode?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    status: string;
    avatar?: string;
    department?: string;
    militaryId?: string;
    rank?: string;
    // v8.3: Permission data
    unitId?: string | null;
    functionCodes?: string[];
    primaryPositionCode?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name: string;
    role: string;
    status: string;
    avatar?: string;
    department?: string;
    militaryId?: string;
    rank?: string;
    // v8.3: Permission data
    unitId?: string | null;
    functionCodes?: string[];
    primaryPositionCode?: string | null;
    permissionsLoadedAt?: number;
  }
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// User types
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  militaryId?: string;
  rank?: string;
  department?: string;
  unit?: string;
  avatar?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

// Service types
export interface ServiceHealth {
  id: string;
  name: string;
  type: ServiceType;
  status: ServiceStatus;
  uptime: number;
  lastChecked?: Date;
  url?: string;
  metrics?: {
    cpuUsage?: number;
    memoryUsage?: number;
    diskUsage?: number;
  };
}

export interface ServiceMetrics {
  serviceId: string;
  serviceName: string;
  cpuUsage: number[];
  memoryUsage: number[];
  diskUsage: number[];
  timestamps: string[];
}

// Alert types
export interface Alert {
  id: string;
  serviceId: string;
  serviceName: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  triggeredAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

// Log types
export interface SystemLogEntry {
  id: string;
  userId?: string;
  userName?: string;
  level: LogLevel;
  category: LogCategory;
  action: string;
  description: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// Dashboard types
export interface DashboardStats {
  services: {
    total: number;
    healthy: number;
    degraded: number;
    down: number;
  };
  users: {
    total: number;
    active: number;
    byRole: Record<UserRole, number>;
  };
  alerts: {
    active: number;
    critical: number;
    warning: number;
  };
  systemHealth: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
  };
}

// Airflow types
export interface AirflowDagInfo {
  dagId: string;
  dagName: string;
  status: string;
  isPaused: boolean;
  lastRunTime?: Date;
  nextRunTime?: Date;
  successCount: number;
  failedCount: number;
}

export interface DagRunInfo {
  runId: string;
  dagId: string;
  status: string;
  startDate: Date;
  endDate?: Date;
  duration?: number;
}
