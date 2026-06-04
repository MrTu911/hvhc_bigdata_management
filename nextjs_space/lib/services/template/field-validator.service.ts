/**
 * Field Validator Service — M18
 *
 * Kiểm tra các placeholder fields trong template có đủ dữ liệu từ entity không.
 * Tái sử dụng data-resolver-service để không duplicate resolve logic.
 */

import { prisma } from '@/lib/db';

export interface FieldValidationResult {
  valid: boolean;
  missingFields: string[];
  warnings: string[];
}

/**
 * Validate xem entity có đủ dữ liệu cho template không.
 * Trả về danh sách field bị thiếu (không nhất thiết block export).
 *
 * @param templateId - ID của ReportTemplate
 * @param entityId   - ID của entity nguồn
 * @param entityType - Tên model (VD: "User", "HocVien", "NckhProject")
 */
export async function validateExportFields(
  templateId: string,
  entityId: string,
  entityType: string
): Promise<FieldValidationResult> {
  const missingFields: string[] = [];
  const warnings: string[] = [];

  // Lấy template để kiểm tra fields được khai báo
  const template = await prisma.reportTemplate.findUnique({
    where: { id: templateId },
    select: { id: true, name: true, fieldMappings: true },
  });

  if (!template) {
    return { valid: false, missingFields: [], warnings: [`Template ${templateId} không tồn tại`] };
  }

  // fieldMappings là Json — parse danh sách field keys cần thiết
  const requiredFields = extractRequiredFieldKeys(template.fieldMappings);

  if (requiredFields.length === 0) {
    // Template không khai báo field mappings — không thể validate
    warnings.push('Template chưa khai báo field mappings — bỏ qua validation');
    return { valid: true, missingFields: [], warnings };
  }

  // Resolve entity data để kiểm tra từng field
  const entityData = await resolveEntitySample(entityType, entityId);

  for (const field of requiredFields) {
    const value = getNestedValue(entityData, field);
    if (value === null || value === undefined || value === '') {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    warnings.push(`${missingFields.length} field có thể thiếu dữ liệu khi export.`);
  }

  return {
    valid: missingFields.length === 0,
    missingFields,
    warnings,
  };
}

// ===== INTERNAL HELPERS =====

function extractRequiredFieldKeys(fieldMappings: unknown): string[] {
  if (!fieldMappings || typeof fieldMappings !== 'object') return [];
  if (Array.isArray(fieldMappings)) {
    return fieldMappings
      .filter((f): f is { key: string } => typeof f === 'object' && f !== null && 'key' in f)
      .map((f) => f.key);
  }
  return Object.keys(fieldMappings as Record<string, unknown>);
}

function getNestedValue(obj: Record<string, unknown> | null, path: string): unknown {
  if (!obj) return undefined;
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/** Lấy mẫu dữ liệu từ entity theo type — dùng dynamic select */
async function resolveEntitySample(
  entityType: string,
  entityId: string
): Promise<Record<string, unknown> | null> {
  // Mapping entityType → model name (camelCase Prisma accessor)
  const modelMap: Record<string, string> = {
    User:        'user',
    HocVien:     'hocVien',
    NckhProject: 'nckhProject',
    Personnel:   'personnel',
    FacultyProfile: 'facultyProfile',
  };

  const modelKey = modelMap[entityType];
  if (!modelKey) return null;

  try {
    const record = await (prisma as any)[modelKey].findUnique({
      where: { id: entityId },
    });
    return record as Record<string, unknown> | null;
  } catch {
    return null;
  }
}
