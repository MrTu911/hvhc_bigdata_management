import "server-only";

// Data Governance & Compliance Utilities

import { ClassificationLevel } from '@prisma/client';

// Data classification metadata
export const CLASSIFICATION_LEVELS = {
  PUBLIC: {
    level: ClassificationLevel.PUBLIC,
    name: 'Công khai',
    description: 'Dữ liệu có thể chia sẻ công khai',
    color: 'green',
    retention: 365 * 5, // 5 years
    encryption: false,
  },
  INTERNAL: {
    level: ClassificationLevel.INTERNAL,
    name: 'Nội bộ',
    description: 'Dữ liệu chỉ dành cho nội bộ học viện',
    color: 'blue',
    retention: 365 * 7, // 7 years
    encryption: true,
  },
  CONFIDENTIAL: {
    level: ClassificationLevel.CONFIDENTIAL,
    name: 'Mật',
    description: 'Dữ liệu mật, hạn chế truy cập',
    color: 'orange',
    retention: 365 * 10, // 10 years
    encryption: true,
  },
  SECRET: {
    level: ClassificationLevel.SECRET,
    name: 'Tối mật',
    description: 'Dữ liệu tối mật, yêu cầu cấp phép đặc biệt',
    color: 'red',
    retention: 365 * 15, // 15 years
    encryption: true,
  },
  TOP_SECRET: {
    level: ClassificationLevel.TOP_SECRET,
    name: 'Tuyệt mật',
    description: 'Dữ liệu tuyệt mật quốc gia',
    color: 'purple',
    retention: 365 * 30, // 30 years
    encryption: true,
  },
};

export function getClassificationInfo(level: ClassificationLevel) {
  return CLASSIFICATION_LEVELS[level] || CLASSIFICATION_LEVELS.INTERNAL;
}

// Data retention policy
export interface RetentionPolicy {
  id: string;
  name: string;
  description: string;
  classification: ClassificationLevel;
  retentionDays: number;
  autoArchive: boolean;
  autoDelete: boolean;
  complianceReasons: string[];
}

export const DEFAULT_RETENTION_POLICIES: RetentionPolicy[] = [
  {
    id: 'public-data',
    name: 'Dữ liệu công khai',
    description: 'Chính sách lưu trữ cho dữ liệu công khai',
    classification: ClassificationLevel.PUBLIC,
    retentionDays: 365 * 5,
    autoArchive: true,
    autoDelete: false,
    complianceReasons: ['Transparency', 'Public Record'],
  },
  {
    id: 'internal-data',
    name: 'Dữ liệu nội bộ',
    description: 'Chính sách lưu trữ cho dữ liệu nội bộ',
    classification: ClassificationLevel.INTERNAL,
    retentionDays: 365 * 7,
    autoArchive: true,
    autoDelete: false,
    complianceReasons: ['Operational Requirement', 'Audit Trail'],
  },
  {
    id: 'confidential-data',
    name: 'Dữ liệu mật',
    description: 'Chính sách lưu trữ cho dữ liệu mật',
    classification: ClassificationLevel.CONFIDENTIAL,
    retentionDays: 365 * 10,
    autoArchive: true,
    autoDelete: false,
    complianceReasons: ['National Security', 'Military Operations'],
  },
  {
    id: 'secret-data',
    name: 'Dữ liệu tối mật',
    description: 'Chính sách lưu trữ cho dữ liệu tối mật',
    classification: ClassificationLevel.SECRET,
    retentionDays: 365 * 15,
    autoArchive: true,
    autoDelete: false,
    complianceReasons: ['National Defense', 'Strategic Intelligence'],
  },
  {
    id: 'top-secret-data',
    name: 'Dữ liệu tuyệt mật',
    description: 'Chính sách lưu trữ cho dữ liệu tuyệt mật',
    classification: ClassificationLevel.TOP_SECRET,
    retentionDays: 365 * 30,
    autoArchive: false,
    autoDelete: false,
    complianceReasons: ['National Security (Top Secret)', 'Permanent Record'],
  },
];

// Data lineage tracking
export interface DataLineageNode {
  id: string;
  name: string;
  type: 'source' | 'process' | 'dataset' | 'model' | 'output';
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface DataLineageEdge {
  from: string;
  to: string;
  operation: string;
  timestamp: Date;
}

export interface DataLineage {
  nodes: DataLineageNode[];
  edges: DataLineageEdge[];
}

// Compliance check results
export interface ComplianceCheck {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export function performComplianceChecks(
  data: {
    classification: ClassificationLevel;
    age: number; // days
    hasEncryption: boolean;
    lastAccessed?: Date;
  }
): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];
  const classificationInfo = getClassificationInfo(data.classification);
  
  // Check encryption requirement
  if (classificationInfo.encryption && !data.hasEncryption) {
    checks.push({
      id: 'encryption-required',
      name: 'Yêu cầu mã hóa',
      status: 'failed',
      message: `Dữ liệu ${classificationInfo.name} phải được mã hóa`,
      severity: 'critical',
    });
  }
  
  // Check retention policy
  if (data.age > classificationInfo.retention) {
    checks.push({
      id: 'retention-exceeded',
      name: 'Vượt quá thời gian lưu trữ',
      status: 'warning',
      message: `Dữ liệu đã vượt quá thời gian lưu trữ ${classificationInfo.retention} ngày`,
      severity: 'medium',
    });
  }
  
  // Check access frequency
  if (data.lastAccessed) {
    const daysSinceAccess = Math.floor(
      (Date.now() - data.lastAccessed.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceAccess > 365) {
      checks.push({
        id: 'inactive-data',
        name: 'Dữ liệu không hoạt động',
        status: 'warning',
        message: `Dữ liệu chưa được truy cập trong ${daysSinceAccess} ngày`,
        severity: 'low',
      });
    }
  }
  
  // If no issues, return success check
  if (checks.length === 0) {
    checks.push({
      id: 'compliant',
      name: 'Tuân thủ',
      status: 'passed',
      message: 'Dữ liệu tuân thủ tất cả các chính sách',
      severity: 'low',
    });
  }
  
  return checks;
}

// Generate compliance report
export interface ComplianceReport {
  generatedAt: Date;
  totalDatasets: number;
  compliantCount: number;
  nonCompliantCount: number;
  warningCount: number;
  criticalIssues: number;
  byClassification: Record<string, number>;
  issues: ComplianceCheck[];
}
