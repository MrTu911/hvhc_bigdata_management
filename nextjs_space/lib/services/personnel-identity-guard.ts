/**
 * Guard hiển thị trường định danh nhạy cảm của hồ sơ cán bộ.
 *
 * Quy tắc bảo mật (security.md): CCCD và số chứng minh sĩ quan/QNCN (CMSQ) là PII
 * nhạy cảm — chỉ trả về cho chủ hồ sơ hoặc người có quyền VIEW_PERSONNEL_SENSITIVE.
 * Mã định danh quân nhân (militaryId) KHÔNG nằm trong nhóm này vì đã hiển thị công khai
 * ở danh sách cán bộ.
 */

export const SENSITIVE_IDENTITY_FIELDS = [
  'citizenId',
  'citizenIdIssueDate',
  'citizenIdIssuePlace',
  'citizenIdExpiryDate',
  'officerIdCard',
] as const;

export type SensitiveIdentityField = (typeof SENSITIVE_IDENTITY_FIELDS)[number];

/**
 * Trả về bản sao của hồ sơ với các trường định danh nhạy cảm bị set null
 * khi người xem không đủ quyền. Không mutate input.
 */
export function maskSensitiveIdentity<T extends Record<string, unknown>>(
  data: T,
  canViewSensitive: boolean,
): T {
  if (canViewSensitive) return data;

  const masked: Record<string, unknown> = { ...data };
  for (const field of SENSITIVE_IDENTITY_FIELDS) {
    if (field in masked) {
      masked[field] = null;
    }
  }
  return masked as T;
}
