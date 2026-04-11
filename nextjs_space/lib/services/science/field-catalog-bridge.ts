/**
 * Field Catalog Bridge – M20 ↔ M22 catalog integration
 *
 * `NckhProject.field` là Prisma enum NckhField (static, schema-level).
 * M22 ScienceCatalog type=FIELD lưu metadata phong phú hơn:
 *   - Vietnamese label
 *   - description
 *   - BQP category code
 *   - isActive (có thể disable một số lĩnh vực)
 *
 * Bridge này:
 *   1. Cung cấp mapping NckhField enum → catalog entry
 *   2. Trả về enriched field list cho frontend dropdowns (thay vì hardcode label)
 *   3. Validate rằng field value vẫn còn active trong catalog (warning, not block)
 *
 * Quy ước code trong ScienceCatalog:
 *   code = 'FIELD_' + NckhField enum value
 *   VD: FIELD_HOC_THUAT_QUAN_SU, FIELD_CNTT
 *
 * Fallback label (nếu catalog chưa có entry):
 *   Hardcoded map NckhField → Vietnamese label.
 */
import 'server-only'
import { getCache, setCache } from '@/lib/cache'
import prisma from '@/lib/db'

// ─── Enum values (mirrors Prisma NckhField enum) ──────────────────────────────

export const NCKH_FIELDS = [
  'HOC_THUAT_QUAN_SU',
  'HAU_CAN_KY_THUAT',
  'KHOA_HOC_XA_HOI',
  'KHOA_HOC_TU_NHIEN',
  'CNTT',
  'Y_DUOC',
  'KHAC',
] as const

export type NckhFieldValue = typeof NCKH_FIELDS[number]

// ─── Fallback labels (static, khi catalog chưa có entry) ─────────────────────

const FALLBACK_LABELS: Record<NckhFieldValue, string> = {
  HOC_THUAT_QUAN_SU: 'Học thuật Quân sự',
  HAU_CAN_KY_THUAT:  'Hậu cần – Kỹ thuật',
  KHOA_HOC_XA_HOI:   'Khoa học Xã hội',
  KHOA_HOC_TU_NHIEN: 'Khoa học Tự nhiên',
  CNTT:              'Công nghệ Thông tin',
  Y_DUOC:            'Y – Dược',
  KHAC:              'Khác',
}

// ─── Catalog entry shape ──────────────────────────────────────────────────────

export interface FieldCatalogEntry {
  enumValue:   NckhFieldValue
  catalogCode: string          // 'FIELD_' + enumValue
  label:       string          // Vietnamese label from catalog or fallback
  description: string | null
  isActive:    boolean
  catalogId:   string | null   // ScienceCatalog.id nếu đã có trong DB
}

const CACHE_TTL = 3600  // 1h — same as catalog service

// ─── Bridge ───────────────────────────────────────────────────────────────────

export const fieldCatalogBridge = {
  /**
   * Trả về danh sách tất cả NckhField với metadata từ M22 catalog.
   * Frontend dùng để render dropdown "Lĩnh vực nghiên cứu".
   *
   * Kết quả được cache 1h. Invalidate khi ScienceCatalog FIELD entries thay đổi.
   */
  async listFields(): Promise<FieldCatalogEntry[]> {
    const cacheKey = 'science:field-catalog-bridge:list'
    const cached = await getCache<FieldCatalogEntry[]>(cacheKey)
    if (cached) return cached

    // Lấy tất cả catalog entries type=FIELD từ M22
    const catalogEntries = await prisma.scienceCatalog.findMany({
      where: {
        type: 'FIELD',
        code: { startsWith: 'FIELD_' },
      },
      select: { id: true, code: true, name: true, description: true, isActive: true },
    })

    const catalogByCode = new Map(catalogEntries.map((e) => [e.code, e]))

    const result: FieldCatalogEntry[] = NCKH_FIELDS.map((enumValue) => {
      const catalogCode = `FIELD_${enumValue}`
      const entry = catalogByCode.get(catalogCode)
      return {
        enumValue,
        catalogCode,
        label:       entry?.name ?? FALLBACK_LABELS[enumValue],
        description: entry?.description ?? null,
        isActive:    entry?.isActive ?? true,   // Nếu chưa có catalog entry → active by default
        catalogId:   entry?.id ?? null,
      }
    })

    await setCache(cacheKey, result, CACHE_TTL)
    return result
  },

  /**
   * Lấy label cho một field value đơn lẻ.
   * Dùng trong M18 data resolver và API responses.
   */
  async getLabelForField(enumValue: NckhFieldValue | string): Promise<string> {
    const fields = await fieldCatalogBridge.listFields()
    const match = fields.find((f) => f.enumValue === enumValue)
    return match?.label ?? (FALLBACK_LABELS[enumValue as NckhFieldValue] ?? enumValue)
  },

  /**
   * Kiểm tra một field value có còn active trong catalog không.
   * Warning-only — không block create/update.
   */
  async isFieldActive(enumValue: NckhFieldValue): Promise<boolean> {
    const fields = await fieldCatalogBridge.listFields()
    const match = fields.find((f) => f.enumValue === enumValue)
    return match?.isActive ?? true
  },
}
