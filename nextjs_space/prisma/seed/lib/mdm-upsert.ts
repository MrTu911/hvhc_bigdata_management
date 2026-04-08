/**
 * mdm-upsert.ts – Shared helper cho M19 Master Data seed operations.
 *
 * Cung cấp:
 *  - Version-aware upsert: bỏ qua category nếu đã ở đúng version
 *  - ChangeLog tự động ghi khi CREATE và UPDATE
 *  - Bảo vệ admin-edit: không ghi đè item mà admin đã chỉnh tay
 *  - MasterDataVersion stamp sau mỗi category
 *
 * Chạy: npx tsx --require dotenv/config prisma/seed/<tên file>.ts
 */
import { PrismaClient, MdCacheType, MdSourceType } from '@prisma/client'

const SEED_ACTOR = 'seed_script' // changedBy marker — dùng để phân biệt seed vs admin

// ─── Public types ─────────────────────────────────────────────────────────────

export type SeedMeta = {
  /** Version tag, e.g. '1.0' — so sánh với MasterDataVersion.version */
  version: string
  /** Tên ngắn của bundle, ghi vào MasterDataVersion.notes. Ví dụ: 'seed_master_data_2026' */
  bundleId?: string
  /**
   * false (mặc định): không ghi đè item đã được admin chỉnh tay.
   * true: ghi đè tất cả (dùng khi cần reset có chủ ý).
   */
  allowOverwrite?: boolean
  /**
   * true: bỏ qua toàn bộ category nếu MasterDataVersion đã ghi đúng version này.
   * false (mặc định): luôn chạy, chỉ cập nhật version stamp ở cuối.
   */
  skipIfVersionMatch?: boolean
}

export type CategoryInput = {
  code: string
  nameVi: string
  nameEn?: string
  groupTag: string
  cacheType: string   // 'STATIC' | 'SEMI' | 'DYNAMIC'
  sourceType: string  // 'LOCAL' | 'BQP' | 'NATIONAL' | 'ISO'
  description?: string
  sortOrder?: number
}

export type ItemInput = {
  code: string
  nameVi: string
  nameEn?: string
  shortName?: string
  parentCode?: string
  externalCode?: string
  sortOrder?: number
  metadata?: Record<string, unknown>
}

export type UpsertStats = {
  created: number
  updated: number
  skipped: number
}

// ─── Category upsert ─────────────────────────────────────────────────────────

/**
 * Upsert MasterCategory. Admin thường không chỉnh metadata category nên
 * không cần bảo vệ như items.
 */
export async function upsertCategory(
  prisma: PrismaClient,
  cat: CategoryInput,
): Promise<void> {
  await prisma.masterCategory.upsert({
    where: { code: cat.code },
    update: {
      nameVi: cat.nameVi,
      nameEn: cat.nameEn ?? null,
      groupTag: cat.groupTag,
      cacheType: cat.cacheType as MdCacheType,
      sourceType: cat.sourceType as MdSourceType,
      description: cat.description ?? null,
      ...(cat.sortOrder !== undefined ? { sortOrder: cat.sortOrder } : {}),
    },
    create: {
      code: cat.code,
      nameVi: cat.nameVi,
      nameEn: cat.nameEn ?? null,
      groupTag: cat.groupTag,
      cacheType: cat.cacheType as MdCacheType,
      sourceType: cat.sourceType as MdSourceType,
      description: cat.description ?? null,
      sortOrder: cat.sortOrder ?? 0,
    },
  })
}

// ─── Item upsert with ChangeLog ───────────────────────────────────────────────

/**
 * Upsert một MasterDataItem với logic bảo vệ admin-edit.
 *
 * - Item MỚI: tạo mới + ghi ChangeLog (CREATE, changedBy=seed_script).
 * - Item ĐÃ CÓ + allowOverwrite=false (mặc định):
 *     → Kiểm tra có ChangeLog nào từ human admin không.
 *     → Nếu có → skipped (không chạm vào).
 *     → Nếu không → cập nhật fields an toàn + ghi ChangeLog (UPDATE).
 * - Item ĐÃ CÓ + allowOverwrite=true: luôn ghi đè + ChangeLog (UPDATE).
 *
 * @returns 'created' | 'updated' | 'skipped'
 */
export async function upsertItem(
  prisma: PrismaClient,
  categoryCode: string,
  item: ItemInput,
  meta: SeedMeta,
): Promise<'created' | 'updated' | 'skipped'> {
  const { allowOverwrite = false } = meta

  const existing = await prisma.masterDataItem.findUnique({
    where: { categoryCode_code: { categoryCode, code: item.code } },
    select: { id: true },
  })

  if (!existing) {
    // ── CREATE path ──────────────────────────────────────────────────────────
    const created = await prisma.masterDataItem.create({
      data: {
        categoryCode,
        code: item.code,
        nameVi: item.nameVi,
        nameEn: item.nameEn ?? null,
        shortName: item.shortName ?? null,
        parentCode: item.parentCode ?? null,
        externalCode: item.externalCode ?? null,
        sortOrder: item.sortOrder ?? 0,
        metadata: (item.metadata ?? undefined) as any,
      },
    })
    await prisma.masterDataChangeLog.create({
      data: {
        itemId: created.id,
        changeType: 'CREATE',
        changedBy: SEED_ACTOR,
        changeReason: `seed bundle "${meta.bundleId ?? 'unknown'}" v${meta.version}`,
        newValue: { code: item.code, nameVi: item.nameVi } as any,
      },
    })
    return 'created'
  }

  // ── Item đã tồn tại ──────────────────────────────────────────────────────
  if (!allowOverwrite) {
    // Kiểm tra xem admin đã chỉnh tay chưa
    const humanEdit = await prisma.masterDataChangeLog.findFirst({
      where: { itemId: existing.id, changedBy: { not: SEED_ACTOR } },
      select: { id: true },
    })
    if (humanEdit) {
      return 'skipped' // không overwrite nếu admin đã edit
    }
  }

  // ── UPDATE path ──────────────────────────────────────────────────────────
  await prisma.masterDataItem.update({
    where: { id: existing.id },
    data: {
      nameVi: item.nameVi,
      nameEn: item.nameEn ?? null,
      shortName: item.shortName ?? null,
      parentCode: item.parentCode ?? null,
      externalCode: item.externalCode ?? null,
      sortOrder: item.sortOrder ?? 0,
      ...(item.metadata !== undefined ? { metadata: item.metadata as any } : {}),
    },
  })
  await prisma.masterDataChangeLog.create({
    data: {
      itemId: existing.id,
      changeType: 'UPDATE',
      changedBy: SEED_ACTOR,
      changeReason: `seed bundle "${meta.bundleId ?? 'unknown'}" v${meta.version} refresh`,
    },
  })
  return 'updated'
}

// ─── Version stamp ────────────────────────────────────────────────────────────

/**
 * Ghi / cập nhật MasterDataVersion sau khi seed xong một category.
 * Dùng tableName = categoryCode để phân biệt với legacy catalogs.
 */
export async function markSeedVersion(
  prisma: PrismaClient,
  categoryCode: string,
  meta: SeedMeta,
  stats: UpsertStats,
): Promise<void> {
  const notes = JSON.stringify({
    bundleId: meta.bundleId ?? null,
    created: stats.created,
    updated: stats.updated,
    skipped: stats.skipped,
    appliedAt: new Date().toISOString(),
  })
  const existing = await prisma.masterDataVersion.findFirst({
    where: { tableName: categoryCode },
  })
  if (existing) {
    await prisma.masterDataVersion.update({
      where: { id: existing.id },
      data: {
        version: meta.version,
        lastUpdated: new Date(),
        updatedBy: SEED_ACTOR,
        recordCount: stats.created + stats.updated + stats.skipped,
        notes,
      },
    })
  } else {
    await prisma.masterDataVersion.create({
      data: {
        tableName: categoryCode,
        version: meta.version,
        lastUpdated: new Date(),
        updatedBy: SEED_ACTOR,
        recordCount: stats.created + stats.updated + stats.skipped,
        notes,
      },
    })
  }
}

// ─── Batch helper ─────────────────────────────────────────────────────────────

/**
 * Upsert toàn bộ một category (metadata + items) trong một lần gọi.
 *
 * Thứ tự: version-skip check → upsert category → loop items → mark version.
 */
export async function upsertCategoryWithItems(
  prisma: PrismaClient,
  cat: CategoryInput,
  items: ItemInput[],
  meta: SeedMeta,
): Promise<UpsertStats & { categoryCode: string }> {
  const { skipIfVersionMatch = false } = meta

  // ── Bỏ qua nếu đã ở đúng version ─────────────────────────────────────────
  if (skipIfVersionMatch && items.length > 0) {
    const versionRecord = await prisma.masterDataVersion.findFirst({
      where: { tableName: cat.code, version: meta.version },
    })
    if (versionRecord) {
      console.log(`  ⏭  ${cat.code}: v${meta.version} đã tồn tại, bỏ qua (${items.length} items)`)
      return { categoryCode: cat.code, created: 0, updated: 0, skipped: items.length }
    }
  }

  await upsertCategory(prisma, cat)

  const stats: UpsertStats = { created: 0, updated: 0, skipped: 0 }
  for (const item of items) {
    const result = await upsertItem(prisma, cat.code, item, meta)
    stats[result]++
  }

  if (items.length > 0) {
    await markSeedVersion(prisma, cat.code, meta, stats)
  }

  return { categoryCode: cat.code, ...stats }
}
