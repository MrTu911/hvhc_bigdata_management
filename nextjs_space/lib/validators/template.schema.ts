/**
 * Template Validators – M18
 * Zod schemas cho template CRUD input validation.
 */

import { z } from 'zod';

const ALLOWED_FORMATS = ['PDF', 'DOCX', 'XLSX', 'HTML'] as const;

export const createTemplateSchema = z.object({
  code: z
    .string()
    .min(3, 'Code tối thiểu 3 ký tự')
    .max(50, 'Code tối đa 50 ký tự')
    .regex(/^[A-Z0-9_-]+$/, 'Code chỉ gồm A-Z, 0-9, _, -'),
  name: z.string().min(2, 'Tên tối thiểu 2 ký tự').max(200, 'Tên tối đa 200 ký tự'),
  description: z.string().max(500).optional(),
  moduleSource: z.array(z.string()).min(1, 'Phải chọn ít nhất 1 module nguồn'),
  outputFormats: z
    .array(z.enum(ALLOWED_FORMATS))
    .min(1, 'Phải chọn ít nhất 1 định dạng output'),
  rbacCode: z.string().min(1, 'RBAC code bắt buộc'),
  dataMap: z.record(z.unknown()).optional(),
  category: z.string().optional(),
});

export const updateTemplateSchema = z
  .object({
    name: z.string().min(2).max(200).optional(),
    description: z.string().max(500).optional(),
    rbacCode: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
    dataMap: z.record(z.unknown()).optional(),
    category: z.string().optional(),
    moduleSource: z.array(z.string()).min(1).optional(),
    outputFormats: z.array(z.enum(ALLOWED_FORMATS)).min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Phải cung cấp ít nhất 1 field để cập nhật',
  });

export const listTemplateParamsSchema = z.object({
  module: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  format: z.enum(ALLOWED_FORMATS).optional(),
  category: z.string().optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type ListTemplateParams = z.infer<typeof listTemplateParamsSchema>;
