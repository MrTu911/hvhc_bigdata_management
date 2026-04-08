/**
 * Zod Validation Schemas - Personnel Module
 * Single source of truth cho client + server validation
 */

import { z } from 'zod';

// ============ CAREER HISTORY ============

export const CareerEventTypes = [
  'ENLISTMENT',
  'PROMOTION',
  'APPOINTMENT',
  'TRANSFER',
  'TRAINING',
  'AWARD',
  'DISCIPLINE',
  'RETIREMENT',
  'DISCHARGE',
  'OTHER',
] as const;

export const careerHistorySchema = z.object({
  userId: z.string().min(1, 'Chọn cán bộ'),
  eventType: z.enum(CareerEventTypes, { required_error: 'Chọn loại sự kiện' }),
  eventDate: z.string().min(1, 'Nhập ngày sự kiện'),
  effectiveDate: z.string().optional().nullable(),
  
  // Position changes
  oldPosition: z.string().optional().nullable(),
  newPosition: z.string().optional().nullable(),
  oldRank: z.string().optional().nullable(),
  newRank: z.string().optional().nullable(),
  oldUnit: z.string().optional().nullable(),
  newUnit: z.string().optional().nullable(),
  
  // Training
  trainingName: z.string().optional().nullable(),
  trainingInstitution: z.string().optional().nullable(),
  trainingResult: z.string().optional().nullable(),
  certificateNumber: z.string().optional().nullable(),
  
  // Documentation
  decisionNumber: z.string().optional().nullable(),
  decisionDate: z.string().optional().nullable(),
  signerName: z.string().optional().nullable(),
  signerPosition: z.string().optional().nullable(),
  attachmentUrl: z.string().url().optional().nullable(),
  
  notes: z.string().optional().nullable(),
});

export const careerHistoryUpdateSchema = careerHistorySchema.partial().extend({
  id: z.string().min(1),
  version: z.number().optional(), // For optimistic locking
});

export type CareerHistoryInput = z.infer<typeof careerHistorySchema>;
export type CareerHistoryUpdateInput = z.infer<typeof careerHistoryUpdateSchema>;

// ============ PARTY MEMBER ============

export const PartyMemberStatuses = ['ACTIVE', 'TRANSFERRED', 'SUSPENDED', 'EXPELLED'] as const;

export const partyMemberSchema = z.object({
  userId: z.string().min(1, 'Chọn cán bộ'),
  partyCardNumber: z.string().optional().nullable(),
  joinDate: z.string().optional().nullable(),
  officialDate: z.string().optional().nullable(),
  partyCell: z.string().optional().nullable(),
  partyCommittee: z.string().optional().nullable(),
  recommender1: z.string().optional().nullable(),
  recommender2: z.string().optional().nullable(),
  status: z.enum(PartyMemberStatuses).default('ACTIVE'),
});

export const partyMemberUpdateSchema = partyMemberSchema.partial().extend({
  id: z.string().min(1),
  version: z.number().optional(),
});

export type PartyMemberInput = z.infer<typeof partyMemberSchema>;
export type PartyMemberUpdateInput = z.infer<typeof partyMemberUpdateSchema>;

// ============ INSURANCE ============

export const insuranceSchema = z.object({
  userId: z.string().min(1, 'Chọn cán bộ'),
  
  // BHXH
  insuranceNumber: z.string().optional().nullable(),
  insuranceStartDate: z.string().optional().nullable(),
  insuranceEndDate: z.string().optional().nullable(),
  
  // BHYT
  healthInsuranceNumber: z.string().optional().nullable(),
  healthInsuranceStartDate: z.string().optional().nullable(),
  healthInsuranceEndDate: z.string().optional().nullable(),
  healthInsuranceHospital: z.string().optional().nullable(),
  
  // Beneficiary
  beneficiaryName: z.string().optional().nullable(),
  beneficiaryRelation: z.string().optional().nullable(),
  beneficiaryPhone: z.string().optional().nullable(),
  
  notes: z.string().optional().nullable(),
});

export const insuranceUpdateSchema = insuranceSchema.partial().extend({
  id: z.string().min(1),
  version: z.number().optional(),
});

export type InsuranceInput = z.infer<typeof insuranceSchema>;
export type InsuranceUpdateInput = z.infer<typeof insuranceUpdateSchema>;

// ============ FAMILY RELATION ============

export const FamilyRelationTypes = [
  'FATHER',
  'MOTHER',
  'SPOUSE',
  'CHILD',
  'SIBLING',
  'FATHER_IN_LAW',
  'MOTHER_IN_LAW',
  'OTHER',
] as const;

export const familyRelationSchema = z.object({
  userId: z.string().min(1, 'Chọn cán bộ'),
  relation: z.enum(FamilyRelationTypes, { required_error: 'Chọn quan hệ' }),
  fullName: z.string().min(1, 'Nhập họ tên'),
  dateOfBirth: z.string().optional().nullable(),
  citizenId: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  workplace: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  isDeceased: z.boolean().default(false),
  deceasedDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const familyRelationUpdateSchema = familyRelationSchema.partial().extend({
  id: z.string().min(1),
  version: z.number().optional(),
});

export type FamilyRelationInput = z.infer<typeof familyRelationSchema>;
export type FamilyRelationUpdateInput = z.infer<typeof familyRelationUpdateSchema>;

// ============ LABELS (Vietnamese) ============

export const CareerEventTypeLabels: Record<string, string> = {
  ENLISTMENT: 'Nhập ngũ',
  PROMOTION: 'Thăng cấp',
  APPOINTMENT: 'Bổ nhiệm',
  TRANSFER: 'Điều chuyển',
  TRAINING: 'Đào tạo',
  AWARD: 'Khen thưởng',
  DISCIPLINE: 'Kỷ luật',
  RETIREMENT: 'Nghỉ hưu',
  DISCHARGE: 'Xuất ngũ',
  OTHER: 'Khác',
};

export const PartyMemberStatusLabels: Record<string, string> = {
  ACTIVE: 'Đang sinh hoạt',
  TRANSFERRED: 'Chuyển sinh hoạt',
  SUSPENDED: 'Tạm dừng',
  EXPELLED: 'Khai trừ',
};

export const FamilyRelationTypeLabels: Record<string, string> = {
  FATHER: 'Bố',
  MOTHER: 'Mẹ',
  SPOUSE: 'Vợ/Chồng',
  CHILD: 'Con',
  SIBLING: 'Anh/Chị/Em',
  FATHER_IN_LAW: 'Bố vợ/chồng',
  MOTHER_IN_LAW: 'Mẹ vợ/chồng',
  OTHER: 'Khác',
};
